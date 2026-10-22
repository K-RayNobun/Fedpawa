/* AUDIT ADMIN PHASE 2 — approfondissement éléments actionnables. Preuves par exécution réelle. */
const { chromium } = require('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
const fs = require('fs');
const { execSync } = require('child_process');

const BASE = 'http://127.0.0.1:18081';
const OUT = '/root/Fedpawa/audit';
const findings = [];
let score = 0;

function add(sev, title, evidence) {
  const pts = { 1: 1, 2: 2, 3: 3 }[sev] || 1;
  findings.push({ sev, pts, title, evidence });
  score += pts;
  save();
  console.log(`[+${pts} SEV${sev}] ${title} :: ${evidence}`);
}
function save() {
  fs.writeFileSync(OUT + '/audit-admin-phase2.json', JSON.stringify({ score, findings, fin: new Date().toISOString() }, null, 2));
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const netCalls = [];
  page.on('request', r => { if (r.url().includes('/api/')) netCalls.push(r.method() + ' ' + r.url().replace(BASE, '')); });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 120)));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });

  // ===== LOGIN ADMIN =====
  await page.goto(BASE + '/authentification.html', { waitUntil: 'load', timeout: 45000 });
  await sleep(1500);
  const loginStatus = await page.evaluate(async () => {
    const t = await (await fetch('/api/csrf-token')).json();
    const r = await fetch('/api/admin/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t.csrf_token }, body: JSON.stringify({ email: 'audit-e2e@fedpawa.com', mot_de_passe: 'AuditE2E-Admin-2026' }) });
    return r.status;
  });
  console.log('login admin:', loginStatus);
  if (loginStatus !== 200) { console.log('FATAL: login échoué'); process.exit(1); }
  await page.goto(BASE + '/admin_dashboard.html', { waitUntil: 'load', timeout: 45000 });
  await sleep(3000);

  // ===== 1. TOGGLES STATS: persistants ou décoratifs? =====
  await page.evaluate(() => switchTab('stats'));
  await sleep(1000);
  netCalls.length = 0;
  const toggles = await page.evaluate(() => [...document.querySelectorAll('#tab-stats .status-toggle')]);
  console.log('toggles stats:', toggles.length);
  if (toggles.length) {
    // cliquer le toggle "Mode Maintenance" (le + risqué côté utilisateur) et observer le réseau:
    const before = await page.evaluate(() => document.querySelectorAll('#tab-stats .status-toggle.active').length);
    await page.evaluate(() => { const els = [...document.querySelectorAll('#tab-stats .status-toggle')]; els[3] && els[3].click(); });
    await sleep(1200);
    const after = await page.evaluate(() => document.querySelectorAll('#tab-stats .status-toggle.active').length);
    const apiCallsDuringClick = netCalls.filter(u => /setting|config|maintenance|toggle/i.test(u));
    console.log('toggle maintenance: active avant=', before, 'après=', after, '| appels API:', JSON.stringify(apiCallsDuringClick));
    if (apiCallsDuringClick.length === 0) add(2, 'Toggles « Configuration Système » purement décoratifs', `Mode Maintenance cliqué → ${after === before ? 'état visuel inchangé ou basculé visuellement' : 'bascule visuelle'} mais ZÉRO appel API (aucune persistance serveur). L'admin croit couper le tunnel de souscription.`);
    // vérifier serveur: le tunnel est-il vraiment bloqué?
    const tunnelStatus = await page.evaluate(async () => (await fetch('/souscription_domiciliation.php', { redirect: 'manual' })).status);
    console.log('tunnel accessible après toggle maintenance:', tunnelStatus);
    if (tunnelStatus === 200 && apiCallsDuringClick.length === 0) console.log('(confirme: tunnel toujours ouvert = toggle sans effet réel)');
    // restaurer l'état visuel:
    await page.evaluate(() => { const els = [...document.querySelectorAll('#tab-stats .status-toggle')]; els[3] && els[3].click(); });
  }

  // ===== 2. LIGNES CLIENTS/ABONNEMENTS/PAIEMENTS: actions réelles par ligne =====
  for (const tab of ['clients', 'abonnements', 'paiements']) {
    await page.evaluate(t => switchTab(t), tab);
    await sleep(900);
    const actions = await page.evaluate(t => {
      const tr = document.querySelector('#tab-' + t + ' tbody tr');
      return tr ? [...tr.querySelectorAll('button, a')].map(el => ({ tag: el.tagName, txt: (el.innerText || '').trim().slice(0, 20), onclick: (el.getAttribute('onclick') || '').slice(0, 60), href: el.getAttribute('href') })).filter(x => x.txt || x.onclick || (x.href && x.href !== '#')) : [];
    }, tab);
    console.log(tab + ' actions/ligne:', JSON.stringify(actions));
    // si des actions existent, en tester la première (clic réel + effet observable):
    if (actions.length) {
      const first = actions[0];
      if (/voir|consulter/i.test(first.txt || '')) {
        const popup = await Promise.all([
          page.waitForEvent('popup', { timeout: 6000 }).catch(() => null),
          page.evaluate(t => { const tr = document.querySelector('#tab-' + t + ' tbody tr'); const el = tr.querySelector('button, a'); el && el.click(); }, tab)
        ]).then(rs => rs[0]);
        await sleep(800);
        const modalText = await page.evaluate(() => { const m = document.querySelector('.fp-modal.show, .fp-modal[style*="flex"], [class*=modal]'); return m && m.offsetParent !== null ? m.innerText.slice(0, 150).replace(/\n+/g, ' | ') : null; });
        console.log('clic action', tab, '→ popup:', popup ? popup.url().slice(0, 70) : 'non', '| modal:', modalText || 'aucun');
        if (!popup && !modalText) add(1, `Bouton « ${first.txt} » (${tab}) sans effet visible`, 'clic réel → ni popup ni modal ni navigation');
      }
    }
  }

  // ===== 3. KYC EN ATTENTE: boutons Approuver/Rejeter apparaissent-ils? fonctionnent-ils? =====
  // créer un dossier KYC en_attente pour le client test 133, puis vérifier le rendu + clic:
  execSync(`python3 -c "
import sqlite3
db = sqlite3.connect('/root/fedpawa-data/storage/fedpawa.sqlite')
db.execute(\\"INSERT INTO kyc (client_id, type, statut, date_soumission) SELECT 133, 'test-audit', 'en_attente', datetime('now') WHERE NOT EXISTS (SELECT 1 FROM kyc WHERE type='test-audit')\\")
db.commit()
print(db.execute(\\"SELECT id FROM kyc WHERE type='test-audit'\\").fetchone()[0])
"`);
  await page.evaluate(() => switchTab('kyc'));
  await sleep(1200);
  const kycBtns = await page.evaluate(() => {
    const pend = [...document.querySelectorAll('#tab-kyc tbody tr')].filter(tr => /en attente|en_cours/i.test(tr.innerText));
    if (!pend.length) return { pendingRows: 0 };
    const tr = pend[0];
    return { pendingRows: pend.length, boutons: [...tr.querySelectorAll('button, a')].map(b => ({ txt: (b.innerText || '').trim().slice(0, 25), onclick: (b.getAttribute('onclick') || '').slice(0, 80) })) };
  });
  console.log('KYC en attente:', JSON.stringify(kycBtns));
  if (kycBtns.pendingRows === 0) add(2, 'Dossier KYC en_attente non listé dans « En attente »', 'ligne insérée statut=en_attente invisible après refresh onglet KYC');
  else if (!kycBtns.boutons || !kycBtns.boutons.length) add(3, 'Dossier KYC en attente SANS boutons Approuver/Rejeter', 'ligne en_attente affichée mais aucune action disponible → dossier ingérable');
  else {
    // cliquer APPROUVER (le dossier test est jetable):
    const apprBtn = kycBtns.boutons.find(b => /approuv/i.test(b.txt));
    if (apprBtn) {
      await page.evaluate(() => { const pend = [...document.querySelectorAll('#tab-kyc tbody tr')].filter(tr => /en attente|en_cours/i.test(tr.innerText)); const b = [...pend[0].querySelectorAll('button, a')].find(b => /approuv/i.test(b.innerText)); b && b.click(); });
      await sleep(1500);
      const stillPending = await page.evaluate(() => [...document.querySelectorAll('#tab-kyc tbody tr')].filter(tr => /en attente/i.test(tr.innerText)).length);
      const dbStatut = execSync(`python3 -c "import sqlite3; db=sqlite3.connect('/root/fedpawa-data/storage/fedpawa.sqlite'); print(db.execute(\\"SELECT statut FROM kyc WHERE type='test-audit'\\").fetchone()[0])"`).toString().trim();
      console.log('après clic Approuver: lignes en_attente restantes=', stillPending, '| statut base=', dbStatut);
      if (dbStatut !== 'approuvé') add(3, 'Bouton Approuver KYC sans effet en base', `clic réel → statut base reste « ${dbStatut} » (attendu: approuvé)`);
      else console.log('approuver KYC fonctionne ✓');
    }
  }
  // purge du dossier test:
  execSync(`python3 -c "import sqlite3; db=sqlite3.connect('/root/fedpawa-data/storage/fedpawa.sqlite'); db.execute(\\"DELETE FROM kyc WHERE type='test-audit'\\"); db.commit()"`);
  console.log('purge KYC test ✓');

  // ===== 4. TICKETS: bouton Répondre (flux réel admin) =====
  await page.evaluate(() => switchTab('tickets'));
  await sleep(1000);
  await page.exposeFunction('__auditPrompt', () => 'Réponse audit phase 2');
  await page.evaluate(() => { window.prompt = () => window.__auditPrompt(); });
  const ticketBtns = await page.evaluate(() => [...document.querySelectorAll('#tab-tickets button')].filter(b => /r\\u00e9pond/i.test(b.innerText)).length);
  console.log('boutons Répondre tickets:', ticketBtns);
  if (ticketBtns > 0) {
    const ticketId = await page.evaluate(() => { const b = [...document.querySelectorAll('#tab-tickets button')].find(b => /r\\u00e9pond/i.test(b.innerText)); const m = (b.getAttribute('onclick') || '').match(/\\d+/); return m ? m[0] : null; });
    if (ticketId) {
      await page.evaluate(() => { const b = [...document.querySelectorAll('#tab-tickets button')].find(b => /r\\u00e9pond/i.test(b.innerText)); b.click(); });
      await sleep(1800);
      const dbCheck = execSync(`python3 -c "import sqlite3; db=sqlite3.connect('/root/fedpawa-data/storage/fedpawa.sqlite'); r=db.execute(\\"SELECT reponse FROM tickets WHERE id=${ticketId}\\").fetchone(); print((r[0] or 'NULL')[:40])"`).toString().trim();
      console.log('ticket', ticketId, 'réponse en base:', dbCheck);
      if (dbCheck === 'NULL') add(2, 'Bouton Répondre ticket sans persistance', `clic + prompt réel → colonne reponse toujours NULL (ticket ${ticketId})`);
    }
  }

  // ===== 5. MESSAGERIE: bouton répondre =====
  await page.evaluate(() => switchTab('messages'));
  await sleep(1000);
  const msgBtns = await page.evaluate(() => document.querySelectorAll('#tab-messages [data-reply-client]').length);
  console.log('boutons répondre messagerie:', msgBtns);

  // ===== 6. ÉDITEUR CONTRAT: flux OTP complet via UI =====
  await page.evaluate(() => switchTab('contrats'));
  await sleep(800);
  const editBtn = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => /modifier le contrat|\\u00e9diter/i.test(b.innerText)); return b ? b.innerText.trim().slice(0, 40) : null; });
  console.log('bouton éditeur contrat:', editBtn);
  if (editBtn) {
    netCalls.length = 0;
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => /modifier le contrat|\\u00e9diter/i.test(b.innerText)); b.click(); });
    await sleep(2000);
    const modal = await page.evaluate(() => { const m = document.querySelector('.fp-modal.show, [class*=otp]'); return m && m.offsetParent !== null ? m.innerText.slice(0, 100) : 'AUCUN'; });
    console.log('modal OTP après clic éditeur:', modal.slice(0, 90));
    // l'OTP envoyé par email: code dans la table otp ou logs?
    const otpDb = execSync(`python3 -c "import sqlite3; db=sqlite3.connect('/root/fedpawa-data/storage/fedpawa.sqlite'); t=db.execute(\\"SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%otp%'\\").fetchall(); print(t)"`).toString().trim();
    console.log('tables OTP:', otpDb);
  }

  // ===== 7. DÉCONNEXION ADMIN =====
  const deco = await page.evaluate(() => document.body.innerText.match(/d\\u00e9connexion|se d\\u00e9connecter/i) ? 'PRÉSENT' : 'ABSENT');
  console.log('déconnexion admin:', deco);
  if (deco === 'ABSENT') add(2, 'Aucun bouton de déconnexion sur le dashboard admin', 'parcours complet du DOM: aucun lien/bouton « Se déconnecter » — l\'admin ne peut pas quitter sa session depuis le dashboard (navigation locale uniquement)');

  // ===== 8. Erreurs console globales =====
  const uniq = [...new Set(errs)];
  console.log('erreurs console:', uniq.length ? JSON.stringify(uniq.slice(0, 5)) : 'zéro ✓');
  if (uniq.length) for (const e of uniq.slice(0, 3)) add(1, 'Erreur console dashboard admin', e.slice(0, 130));

  await browser.close();
  save();
  console.log('\\n===== PHASE 2 TERMINÉE =====');
  console.log('Score phase 2:', score, 'pts |', findings.length, 'findings');
  findings.forEach(f => console.log(`  SEV${f.sev} (+${f.pts}) ${f.title}`));
})().catch(e => { console.error('FATAL PHASE 2:', e); fs.writeFileSync(OUT + '/audit-admin-phase2.json', JSON.stringify({ fatal: String(e), score, findings }, null, 2)); process.exit(1); });
