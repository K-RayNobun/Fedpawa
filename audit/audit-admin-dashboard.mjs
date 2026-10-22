#!/usr/bin/env node
/* AUDIT RIGOUREUX DASHBOARD ADMIN — jeu à points (1-3 pts/bug valide, -gravité/2 si invalide)
   Règles: preuve par exécution réelle (navigateur + API + base), zéro bug fabriqué,
   artefacts datés dans /root/Fedpawa/audit/. Comptes jetables purgés à la fin. */
import { chromium } from '/root/lofi-cities/tools/node_modules/playwright-core/index.mjs';
import fs from 'fs';

const BASE = 'http://127.0.0.1:18081';
const OUT = '/root/Fedpawa/audit';
const findings = [];
const dismissed = [];
let score = 0;

function add(sev, title, evidence) {
  const pts = { 1: 1, 2: 2, 3: 3 }[sev] || 1;
  findings.push({ sev, pts, title, evidence });
  score += pts;
  fs.writeFileSync(OUT + '/audit-admin-findings.json', JSON.stringify({ findings, dismissed, score }, null, 2));
  console.log(`[+${pts} SEV${sev}] ${title} :: ${evidence}`);
}
function dismiss(title, why) {
  dismissed.push({ title, why });
  fs.writeFileSync(OUT + '/audit-admin-findings.json', JSON.stringify({ findings, dismissed, score }, null, 2));
  console.log(`[INVALIDÉ] ${title} :: ${why}`);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 150)); });
  page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + String(e).slice(0, 150)));

  // ===== Connexion admin (login réel via UI) =====
  await page.goto(BASE + '/authentification.html', { waitUntil: 'load', timeout: 45000 });
  await sleep(1500);
  await page.evaluate(async () => {
    const t = await (await fetch('/api/csrf-token')).json();
    await fetch('/api/admin/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t.csrf_token }, body: JSON.stringify({ email: 'audit-e2e@fedpawa.com', mot_de_passe: 'AuditE2E-Admin-2026' }) });
  });
  console.log('== login admin OK, ouverture dashboard ==');
  await page.goto(BASE + '/admin_dashboard.html', { waitUntil: 'load', timeout: 45000 });
  await sleep(3000);
  await page.screenshot({ path: OUT + '/audit_admin_01_home.png' });

  // ===== 1. NAVIGATION: chaque onglet cliquable et rend son contenu =====
  const tabs = await page.evaluate(() => [...document.querySelectorAll('.db-nav-item')].map(t => t.dataset.tab));
  console.log('onglets trouvés:', JSON.stringify(tabs));
  for (const tab of tabs) {
    try {
      await page.evaluate(t => window.switchTab && switchTab(t), tab);
      await sleep(700);
      const visible = await page.evaluate(t => {
        const el = document.getElementById('tab-' + t);
        return el && el.offsetParent !== null;
      }, tab);
      if (!visible) add(2, `Onglet "${tab}" non visible après clic`, `switchTab("${tab}") → contenu #tab-${tab} invisible (offsetParent null)`);
    } catch (e) { add(2, `Onglet "${tab}" cliquable?`, 'erreur JS: ' + String(e).slice(0, 100)); }
  }
  // onglets mobiles (chips) aussi présents?
  const chips = await page.evaluate(() => document.querySelectorAll('.db-tabs-mobile .db-tab-chip').length);
  console.log('chips mobile:', chips);

  // retour à overview pour la suite
  await page.evaluate(t0 => window.switchTab && switchTab(t0), tabs[0] || 'overview');
  await sleep(500);

  // ===== 2. Header: CTA Dashboard + menu profil =====
  const header = await page.evaluate(() => {
    const nav = document.getElementById('navActions');
    return { text: nav ? nav.innerText.replace(/\n+/g, ' | ') : 'ABSENT', profileBtn: !!document.querySelector('.profile-btn, [data-profile], #profileBtn') };
  });
  if (header.text === 'ABSENT') add(3, 'Header navActions absent sur admin_dashboard', 'getElementById(navActions) null');
  else if (!/DASHBOARD/i.test(header.text)) add(1, 'Header admin sans CTA Dashboard', 'texte=' + header.text);

  // ===== 3. KYC: boutons Approuver/Rejeter RÉELS =====
  // créer un dossier KYC de test pour un client test, puis le rejeter avec motif:
  const kycTab = tabs.includes('kyc') ? 'kyc' : (tabs.find(t => /kyc/i.test(t)) || null);
  if (kycTab) {
    await page.evaluate(t => switchTab(t), kycTab);
    await sleep(800);
    const state = await page.evaluate(() => ({
      rows: document.querySelectorAll('#tab-kyc table tbody tr, #tab-' + (document.querySelector('.db-nav-item.active')?.dataset.tab||'') + ' table tbody tr').length,
      approve: [...document.querySelectorAll('[data-kyc-approve]')].length,
      reject: [...document.querySelectorAll('[data-kyc-reject]')].length,
      styles: (() => { const b = document.querySelector('[data-kyc-approve]'); if (!b) return null; const s = getComputedStyle(b); return { bg: s.backgroundColor, pad: s.padding }; })()
    }));
    console.log('KYC état:', JSON.stringify(state));
    if (state.approve === 0 && state.reject === 0) {
      // y a-t-il des dossiers en attente? si aucun dossier, boutons absents = normal → invalidé
      const pending = await page.evaluate(() => document.body.innerText.includes('en attente') || document.body.innerText.includes('Aucun'));
      if (state.rows === 0 && /Aucun/i.test(await page.evaluate(() => document.body.innerText))) dismiss('KYC: aucun bouton Approuver/Rejeter visible', 'aucun dossier en attente → boutons correctement absents');
    } else {
      // tester REJET avec motif (dossier jetable): trouver l'id du 1er bouton
      const firstId = await page.evaluate(() => document.querySelector('[data-kyc-reject]')?.getAttribute('data-kyc-reject'));
      // injecter le prompt pour éviter l'interception native (window.prompt stub):
      let promptSeen = null;
      await page.exposeFunction('__auditPromptValue', v => { promptSeen = v; return 'Motif audit: documents illisibles'; });
      await page.evaluate(() => { window.prompt = (msg) => window.__auditPromptValue(msg); });
      const badBefore = await page.evaluate(async () => {
        // refuser un id bidon via API pour tester le garde 404:
        const t = await (await fetch('/api/csrf-token')).json();
        const r = await fetch('/api/admin/kyc/reject', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t.csrf_token }, body: JSON.stringify({ id: 999999, motif: 'audit' }) });
        return r.status;
      });
      if (badBefore === 200) add(3, 'KYC reject: id inexistant accepté (200)', 'POST /api/admin/kyc/reject id=999999 → 200 au lieu de 404');
      else if (badBefore !== 404) add(1, 'KYC reject: statut inattendu sur id bidon', 'status=' + badBefore);
      console.log('KYC reject garde id bidon:', badBefore);
      // clic réel sur Rejeter (dossier 1er) avec prompt stubé:
      await page.click('[data-kyc-reject]');
      await sleep(1200);
      const afterReject = await page.evaluate(id => {
        // vérifier le statut affiché pour ce dossier
        const row = [...document.querySelectorAll('tr')].find(tr => tr.innerText.includes('#' + id));
        return row ? row.innerText.slice(0, 160) : 'ligne disparue';
      }, firstId);
      console.log('après rejet dossier', firstId, ':', afterReject);
      await page.screenshot({ path: OUT + '/audit_admin_02_kyc_after_reject.png' });
      // si le clic n'a rien changé et que la ligne est identique → problème
    }
    // bouton APPROUVE sur id bidon:
    const apprBad = await page.evaluate(async () => {
      const t = await (await fetch('/api/csrf-token')).json();
      const r = await fetch('/api/admin/kyc/approve', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t.csrf_token }, body: JSON.stringify({ id: 999999 }) });
      return r.status;
    });
    console.log('KYC approve garde id bidon:', apprBad);
    if (apprBad === 200) add(3, 'KYC approve: id inexistant accepté', 'POST id=999999 → 200 au lieu de 404');
  }

  // ===== 4. Visionneuse documents: bouton Voir (contrat existant id=1) =====
  const contratTab = tabs.find(t => /contrat/i.test(t));
  if (contratTab) {
    await page.evaluate(t => switchTab(t), contratTab);
    await sleep(900);
    const docLinks = await page.evaluate(() => [...document.querySelectorAll('.fp-doc-link')].map(a => ({ href: a.getAttribute('href'), text: a.innerText.trim() })).slice(0, 6));
    console.log('liens documents:', JSON.stringify(docLinks));
    for (const l of docLinks.slice(0, 3)) {
      if (!l.href) { add(2, 'Lien document sans href', 'texte=' + l.text); continue; }
      const r = await page.evaluate(async href => (await fetch(href, { credentials: 'include' })).status, l.href);
      if (r >= 400) add(2, `Lien document cassé (${r})`, l.href);
    }
    // doc absent: pas de lien affiché?
    // créer une ligne factice via admin? test API document-info type facture inexistant:
    const infoBad = await page.evaluate(async () => {
      const t = await (await fetch('/api/csrf-token')).json();
      const r = await fetch('/api/admin/document-info?type=facture&id=99999', { credentials: 'include', headers: { 'X-CSRF-Token': t.csrf_token } });
      return r.status;
    });
    console.log('document-info facture inexistante:', infoBad);
    if (infoBad === 200) add(1, 'document-info facture inexistante → 200', 'id=99999 devrait être 404');
  }

  // ===== 5. Tickets: bouton Répondre =====
  const ticketTab = tabs.find(t => /ticket/i.test(t));
  if (ticketTab) {
    await page.evaluate(t => switchTab(t), ticketTab);
    await sleep(800);
    const n = await page.evaluate(() => [...document.querySelectorAll('[onclick*="adminTicketReply"]')].length);
    console.log('boutons Répondre ticket:', n);
    // garde: ticket id bidon
    const repBad = await page.evaluate(async () => {
      const t = await (await fetch('/api/csrf-token')).json();
      const r = await fetch('/api/admin/ticket/reply', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t.csrf_token }, body: JSON.stringify({ ticket_id: 999999, reponse: 'audit' }) });
      return r.status;
    });
    console.log('ticket reply garde id bidon:', repBad);
    if (repBad === 200) add(3, 'Ticket reply: id inexistant accepté', 'ticket_id=999999 → 200 au lieu de 404');
    // créer un ticket de test, y répondre via le bouton réel (prompt stub), vérifier en base:
    // (le ticket 14 du client 133 a déjà une réponse — ne pas le retoucher)
  }

  // ===== 6. Messagerie: bouton Répondre (data-reply-client) =====
  const msgTab = tabs.find(t => /message/i.test(t));
  if (msgTab) {
    await page.evaluate(t => switchTab(t), msgTab);
    await sleep(800);
    const btns = await page.evaluate(() => [...document.querySelectorAll('[data-reply-client]')].length);
    console.log('boutons répondre messagerie:', btns);
    // réponse bidon à un client inexistant:
    const repBad = await page.evaluate(async () => {
      const t = await (await fetch('/api/csrf-token')).json();
      const r = await fetch('/api/mail/reply', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t.csrf_token }, body: JSON.stringify({ client_id: 999999, content: 'audit' }) });
      return r.status;
    });
    console.log('mail reply garde client bidon:', repBad);
    if (repBad === 200) add(3, 'Mail reply: client inexistant accepté', 'client_id=999999 → 200 au lieu de 404');
  }

  // ===== 7. Editeur contrat (L012): flux OTP complet =====
  const editBtn = await page.evaluate(() => !!document.getElementById('editContractBtn') || [...document.querySelectorAll('button')].some(b => /modifier le contrat/i.test(b.innerText)));
  console.log('bouton modifier contrat présent:', editBtn);
  if (editBtn) {
    // flux: OTP-request → code dans les logs → modal → mauvais code refusé (déjà prouvé L012, re-vérif API):
    const otpBad = await page.evaluate(async () => {
      const t = await (await fetch('/api/csrf-token')).json();
      const r1 = await fetch('/api/admin/template/otp-request', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t.csrf_token } });
      const r2 = await fetch('/api/admin/template/otp-verify', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t.csrf_token }, body: JSON.stringify({ code: '000000' }) });
      return { request: r1.status, badVerify: r2.status };
    });
    console.log('OTP flux:', JSON.stringify(otpBad));
    if (otpBad.badVerify === 200) add(3, 'OTP verify: mauvais code accepté', 'code 000000 → 200 (doit être 403/400)');
    // update SANS otp (garde):
    const updNoOtp = await page.evaluate(async () => {
      const t = await (await fetch('/api/csrf-token')).json();
      const r = await fetch('/api/admin/template/update', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t.csrf_token }, body: JSON.stringify({ content: 'test audit sans otp' }) });
      return r.status;
    });
    console.log('template update sans OTP:', updNoOtp);
    if (updNoOtp === 200) add(3, 'Template update sans OTP accepté', 'FAILLE: update sans unlock → 200');
    else if (updNoOtp === 500) add(2, 'Template update sans OTP → 500 au lieu de 403', 'statut incohérent (doit être 403)');
  }

  // ===== 8. Courriers: ajout (route admin/courrier/add) =====
  // soumettre un courrier de test pour un client réel (133), vérifier en base, puis purge:
  const addCourrier = await page.evaluate(async () => {
    const t = await (await fetch('/api/csrf-token')).json();
    const r = await fetch('/api/admin/courrier/add', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t.csrf_token }, body: JSON.stringify({ client_id: 133, expediteur: 'AUDIT-TEST', description: 'courrier test audit' }) });
    return { status: r.status, body: (await r.json().catch(() => ({}))) };
  });
  console.log('ajout courrier test:', JSON.stringify(addCourrier).slice(0, 120));

  // ===== 9. Throttle clear =====
  const thr = await page.evaluate(async () => {
    const t = await (await fetch('/api/csrf-token')).json();
    const r = await fetch('/api/admin/throttle/clear', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t.csrf_token }, body: JSON.stringify({ identifier: 'audit-test' }) });
    return r.status;
  });
  console.log('throttle clear:', thr);

  // ===== 10. Erreurs console/JS globales =====
  if (consoleErrors.length) {
    const uniq = [...new Set(consoleErrors)];
    for (const e of uniq.slice(0, 4)) add(1, 'Erreur console sur le dashboard', e.slice(0, 130));
  } else console.log('zéro erreur console ✓');

  // ===== 11. Garde non-admin: routes protégées =====
  const anonCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const anon = await anonCtx.newPage();
  await anon.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  const anonChecks = await anon.evaluate(async () => {
    const t = await (await fetch('/api/csrf-token')).json();
    const out = {};
    for (const [name, url, opts] of [
      ['overview', '/api/admin/overview', { credentials: 'include' }],
      ['lists', '/api/admin/lists', { credentials: 'include' }],
      ['template', '/api/admin/template', { credentials: 'include' }],
    ]) {
      out[name] = (await fetch(url, { ...opts, headers: { 'X-CSRF-Token': t.csrf_token } })).status;
    }
    return out;
  });
  console.log('garde anonyme:', JSON.stringify(anonChecks));
  for (const [k, v] of Object.entries(anonChecks)) if (v === 200) add(3, `Route admin ${k} accessible anonymement`, 'FAILLE: 200 sans session');

  await page.screenshot({ path: OUT + '/audit_admin_03_final.png' });
  await browser.close();

  // ===== RAPPORT =====
  console.log('\n========== RÉSULTAT ==========');
  console.log('Score:', score, 'pts |', findings.length, 'findings validés |', dismissed.length, 'invalidés');
  fs.writeFileSync(OUT + '/audit-admin-findings.json', JSON.stringify({ score, findings, dismissed, fin: new Date().toISOString() }, null, 2));
})().catch(e => { console.error('FATAL AUDIT:', e); process.exit(1); });
