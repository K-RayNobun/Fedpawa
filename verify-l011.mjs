// L011 — E2E complet : header dynamique (admin + client), styles KYC, visionneuse
// documents (existant -> admin_document.html + download 200 ; absent -> modal sans
// lien), document-info 403 non-admin, title admin_dashboard corrigé, approve/reject
// KYC avec restauration DB. Captures : /root/Fedpawa/audit/l011_*.png
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = 'http://127.0.0.1:18081';
const ADMIN_EMAIL = 'audit-e2e@fedpawa.com';
const ADMIN_PASS = 'AuditE2E-Admin-2026';
const SHOT = (n) => `/root/Fedpawa/audit/${n}`;
const out = { cases: [] };
const check = (name, pass, info = '') => { out.cases.push({ name, pass, info }); console.log((pass ? 'PASS' : 'FAIL'), name, '|', info); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const dbExec = (sql) => {
  const b64 = Buffer.from(sql).toString('base64');
  const cmd = `docker exec fedpawa-api-test php -r "$db=new PDO('sqlite:/app/storage/fedpawa.sqlite'); $db->exec(base64_decode('${b64}'));"`.replace(/\$/g, '\\$');
  return execSync(cmd, { encoding: 'utf8' });
};
const dbQuery = (sql) => {
  const b64 = Buffer.from(sql).toString('base64');
  const cmd = `docker exec fedpawa-api-test php -r "$db=new PDO('sqlite:/app/storage/fedpawa.sqlite'); foreach($db->query(base64_decode('${b64}')) as $r) echo json_encode($r), PHP_EOL;"`.replace(/\$/g, '\\$');
  return execSync(cmd, { encoding: 'utf8' }).trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
};
const apiLogin = (page, url, body) => page.evaluate(async ([u, b]) => {
  const t = await fetch('/api/csrf-token').then(r => r.json());
  return fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t.csrf_token }, credentials: 'include', body: JSON.stringify(b) }).then(r => r.json().then(d => ({ status: r.status, d })));
}, [url, body]);

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const jsErrors = [];

// ============ A. HEADER ADMIN + 0. TITLE ============
{
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  page.on('pageerror', e => jsErrors.push('admin:' + e.message.slice(0, 120)));
  const login = await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' }).then(() => apiLogin(page, '/api/admin/login', { email: ADMIN_EMAIL, mot_de_passe: ADMIN_PASS }));
  check('login admin', login && login.status === 200, JSON.stringify(login && login.d).slice(0, 90));

  await page.goto(BASE + '/index.php', { waitUntil: 'load' });
  await sleep(1800); // /api/me + render nav
  const cta = page.locator('#navActions a.nav-login');
  const ctaTxt = (await cta.innerText().catch(() => '')).trim().toLowerCase(); // CSS text-transform: uppercase
  const ctaHref = await cta.getAttribute('href').catch(() => '');
  check('A1 header admin: CTA « Dashboard » (pas Espace Client)', ctaTxt === 'dashboard' && /admin_dashboard\.html$/.test(ctaHref), `txt="${ctaTxt}" href="${ctaHref}"`);
  await page.screenshot({ path: SHOT('l011_header_admin.png') });

  // Menu profil adapté (pas « Mon Espace »)
  await page.locator('#navProfileBtn').click();
  await sleep(400);
  const menuTxt = await page.locator('.profile-menu').innerText().catch(() => '');
  check('A2 menu profil admin: « Dashboard Admin », pas « Mon Espace »', /Dashboard Admin/.test(menuTxt) && !/Mon Espace/.test(menuTxt), menuTxt.replace(/\s+/g, ' ').slice(0, 120));
  await page.keyboard.press('Escape');
  await sleep(250);

  // 0. Title admin_dashboard.html
  await page.goto(BASE + '/admin_dashboard.html', { waitUntil: 'load' });
  await sleep(1200);
  const title = await page.title();
  check('0 title admin_dashboard.html = « Dashboard Admin | … »', /^Dashboard Admin \|/.test(title), title);
  const dashCta = (await page.locator('#navActions a.nav-login').innerText().catch(() => '')).trim().toLowerCase();
  check('A3 header admin sur admin_dashboard: CTA « Dashboard »', dashCta === 'dashboard', `txt="${dashCta}"`);
  await page.context().close();
}

// ============ B. HEADER CLIENT ============
{
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  page.on('pageerror', e => jsErrors.push('client:' + e.message.slice(0, 120)));
  const email = `l011-${Date.now()}@test-fedpawa.cm`;
  const reg = await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' }).then(() => apiLogin(page, '/api/register', { email, mot_de_passe: 'L011test!2026', nom: 'L011 Header Client', entreprise: 'L011 SARL', telephone: '+237 6 99 11 22 33' }));
  check('register client test', reg && reg.status === 200, JSON.stringify(reg && reg.d).slice(0, 90));
  // /api/register ne connecte PAS : login réel avec le compte créé
  const lin = await apiLogin(page, '/api/login', { email, mot_de_passe: 'L011test!2026' });
  check('login client test', lin && lin.status === 200, JSON.stringify(lin && lin.d).slice(0, 90));
  out._client = { email };
  await page.goto(BASE + '/index.php', { waitUntil: 'load' });
  await sleep(1800);
  const cta = page.locator('#navActions a.nav-login');
  const ctaTxt = (await cta.innerText().catch(() => '')).trim().toLowerCase();
  const ctaHref = await cta.getAttribute('href').catch(() => '');
  check('B1 header client: CTA « Espace Client » inchangé', ctaTxt === 'espace client' && /espace_client\.html$/.test(ctaHref), `txt="${ctaTxt}" href="${ctaHref}"`);
  await page.screenshot({ path: SHOT('l011_header_client.png') });
  await page.locator('#navProfileBtn').click();
  await sleep(400);
  const menuTxt = await page.locator('.profile-menu').innerText().catch(() => '');
  check('B2 menu profil client: « Mon Espace » conservé', /Mon Espace/.test(menuTxt) && !/Dashboard Admin/.test(menuTxt), menuTxt.replace(/\s+/g, ' ').slice(0, 120));
  await page.context().close();
}

// ============ C. KYC STYLES (before/after) + doc absent ============
const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await adminCtx.addInitScript(() => { localStorage.setItem('fedpawa-mode', 'light'); localStorage.setItem('fedpawa-theme', 'navy'); }); // couleurs déterministes (le site défaut dark sinon)
const page = await adminCtx.newPage();
page.on('pageerror', e => jsErrors.push('kyc:' + e.message.slice(0, 120)));
{
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await apiLogin(page, '/api/admin/login', { email: ADMIN_EMAIL, mot_de_passe: ADMIN_PASS });

  // C0. Capture AVANT (page temporaire reproduisant l'ancien rendu)
  await page.goto(BASE + '/_l011_before_tmp.html', { waitUntil: 'load' });
  await sleep(700);
  const beforeBtns = page.locator('.kyc-actions .btn');
  const beforeCount = await beforeBtns.count();
  const beforeBg = await beforeBtns.last().evaluate(el => getComputedStyle(el).backgroundColor);
  const beforeBd = await beforeBtns.first().evaluate(el => getComputedStyle(el).borderColor);
  await page.screenshot({ path: SHOT('l011_kyc_before.png') });
  check('C0 avant: boutons invalides (bg transparent, bordure ≠ rouge danger)', beforeCount === 2 && beforeBg === 'rgba(0, 0, 0, 0)' && beforeBd !== 'rgb(192, 57, 43)', `count=${beforeCount} bg=${beforeBg} border=${beforeBd}`);

  // C1. Capture APRÈS : onglet KYC réel
  await page.goto(BASE + '/admin_dashboard.html', { waitUntil: 'load' });
  await sleep(2200);
  await page.locator('.db-nav-item[data-tab="kyc"]').click();
  await sleep(900);
  const appr = page.locator('#tab-kyc .kyc-actions .btn-approve').first();
  const rej = page.locator('#tab-kyc .kyc-actions .btn-reject').first();
  const apprVisible = await appr.isVisible().catch(() => false);
  check('C1 onglet KYC peuplé avec boutons', apprVisible, 'dossiers en_cours attendus (kyc id 7)');
  const afterBg = await appr.evaluate(el => getComputedStyle(el).backgroundColor);
  const afterCol = await appr.evaluate(el => getComputedStyle(el).color);
  const rejBd = await rej.evaluate(el => getComputedStyle(el).borderColor);
  const rejCol = await rej.evaluate(el => getComputedStyle(el).color);
  const okA = afterBg === 'rgb(30, 125, 79)' && afterCol === 'rgb(255, 255, 255)';
  const okR = rejBd === 'rgb(192, 57, 43)' && rejCol === 'rgb(192, 57, 43)';
  check('C2 boutons stylés proprement (classes, plus de transparent)', okA && okR, `approve bg=${afterBg}/${afterCol} reject border=${rejBd}/${rejCol}`);
  const inlineLeft = await page.evaluate(() => Array.from(document.querySelectorAll('#tab-kyc .kyc-actions .btn')).filter(b => b.getAttribute('style')).length);
  check('C3 aucun inline style restant sur les CTA KYC', inlineLeft === 0, `inline=${inlineLeft}`);
  await page.locator('#tab-kyc .kyc-review-card').first().scrollIntoViewIfNeeded().catch(() => {});
  await page.screenshot({ path: SHOT('l011_kyc.png') });
}

// ============ D. DOC EXISTANT (contrat id 3 -> contrat_47.pdf) ============
{
  await page.locator('.db-nav-item[data-tab="contrats"]').click();
  await sleep(700);
  const link = page.locator('#tab-contrats .fp-doc-link[data-doc-id="3"]');
  check('D1 lien « Consulter PDF » présent pour contrat id 3 (doc_exists)', await link.isVisible().catch(() => false), 'data-doc-type=contrat');
  const [newPage] = await Promise.all([adminCtx.waitForEvent('page'), link.click()]);
  await newPage.waitForLoadState('load');
  await sleep(1500);
  const vUrl = newPage.url();
  const vTitle = await newPage.locator('#docTitle').innerText().catch(() => '');
  const vClient = await newPage.locator('#docClient').innerText().catch(() => '');
  const vSize = await newPage.locator('#docSize').innerText().catch(() => '');
  const vDl = await newPage.locator('#docDownload').getAttribute('href').catch(() => '');
  check('D2 admin_document.html ouvert avec infos', /admin_document\.html\?type=contrat&id=3/.test(vUrl) && /Contrat/.test(vTitle) && vClient.length > 0 && vDl.includes('/api/document?type=contrat&id=3'), `title="${vTitle}" client="${vClient}" size="${vSize}" dl="${vDl}"`);
  await newPage.screenshot({ path: SHOT('l011_doc_visionneuse.png') });

  // D3. Téléchargement réel -> 200 + PDF
  const dlResp = await newPage.evaluate(async () => {
    const r = await fetch(document.getElementById('docDownload').getAttribute('href'), { credentials: 'include' });
    const buf = await r.arrayBuffer();
    return { status: r.status, ct: r.headers.get('content-type'), bytes: buf.byteLength, head: Array.from(new Uint8Array(buf.slice(0, 4))).map(b => String.fromCharCode(b)).join('') };
  });
  check('D3 download_url -> 200 application/pdf (%PDF)', dlResp.status === 200 && /pdf/.test(dlResp.ct) && dlResp.head === '%PDF', JSON.stringify(dlResp));
  await newPage.close();
}

// ============ E. DOC ABSENT (ligne factice) -> modal, pas de lien ============
{
  dbExec("INSERT INTO contrats (client_id, type, fichier, date_signature) VALUES (50, 'test_l011', 'documents/contrat_INEXISTANT_L011.pdf', '2026-10-18 20:00:00')");
  const fakeId = dbQuery("SELECT id FROM contrats WHERE fichier = 'documents/contrat_INEXISTANT_L011.pdf'")[0].id;
  out._fakeId = fakeId;
  await page.locator('.db-nav-item[data-tab="contrats"]').click();
  await sleep(600);
  await page.locator('.db-nav-item[data-tab="contrats"]').click(); // re-render si déjà actif
  await page.reload({ waitUntil: 'load' });
  await sleep(2200);
  await page.locator('.db-nav-item[data-tab="contrats"]').click();
  await sleep(700);
  const fakeLink = await page.locator(`#tab-contrats tbody tr:has-text("CT-${String(fakeId).padStart(3, '0')}") .fp-doc-link`).count();
  const fakeRowDash = await page.locator(`#tab-contrats tbody tr:has-text("CT-${String(fakeId).padStart(3, '0')}")`).innerText().catch(() => '');
  check('E1 ligne factice: AUCUN lien « Consulter » (état réel)', fakeLink === 0 && /—/.test(fakeRowDash), `liens=${fakeLink} row="${fakeRowDash.replace(/\s+/g, ' ').slice(0, 100)}"`);
  await page.locator('.db-nav-item[data-tab="contrats"]').scrollIntoViewIfNeeded().catch(() => {});
  await page.screenshot({ path: SHOT('l011_doc_absent_ligne.png') });

  // E2. document-info sur la ligne factice -> exists:false
  const info = await page.evaluate(async (id) => {
    const r = await fetch('/api/admin/document-info?type=contrat&id=' + id, { credentials: 'include' });
    return { status: r.status, d: await r.json() };
  }, fakeId);
  check('E2 document-info ligne factice: exists:false (200, pas 404)', info.status === 200 && info.d.exists === false, JSON.stringify(info.d).slice(0, 120));

  // E3. Simulation d'un clic sur un lien devenu obsolète (race) -> modal FedpawaUI
  await page.evaluate((fakeId) => {
    window.__fakeId = String(fakeId);
    const a = document.createElement('a');
    a.className = 'fp-doc-link';
    a.dataset.docType = 'contrat';
    a.dataset.docId = String(fakeId);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
  }, fakeId);
  await sleep(1200);
  const modalTxt = await page.locator('.fp-modal').innerText().catch(() => '');
  const modalOpen = await page.locator('.fp-modal-overlay').isVisible().catch(() => false);
  check('E3 clic doc absent -> modal « non disponible »', modalOpen && /non disponible/i.test(modalTxt), modalTxt.replace(/\s+/g, ' ').slice(0, 140));
  await page.screenshot({ path: SHOT('l011_modal_absent.png') });
  if (modalOpen) { await page.locator('.fp-modal-btn-primary, .fp-modal-x').first().click(); await sleep(400); }

  // Purge ligne factice
  dbExec(`DELETE FROM contrats WHERE id = ${fakeId}`);
  const gone = dbQuery(`SELECT COUNT(*) c FROM contrats WHERE id = ${fakeId}`)[0].c;
  check('E4 ligne factice supprimée (purge)', String(gone) === '0', `count=${gone}`);
}

// ============ F. document-info 403 non-admin + /api/document 200 ============
{
  // F1 : client (non-admin)
  const cctx = await browser.newContext({ viewport: { width: 900, height: 700 } });
  const cpage = await cctx.newPage();
  await cpage.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  const reg = await apiLogin(cpage, '/api/register', { email: `l011b-${Date.now()}@test-fedpawa.cm`, mot_de_passe: 'L011test!2026', nom: 'L011 Non Admin', entreprise: 'L011 SARL 2', telephone: '+237 6 99 44 55 66' });
  const anon = await cpage.evaluate(async () => {
    const r = await fetch('/api/admin/document-info?type=contrat&id=3', { credentials: 'include' });
    return { status: r.status };
  });
  check('F1 document-info sans session admin -> 403', anon.status === 403, `status=${anon.status} (register=${reg && reg.status})`);
  // F1bis : le MÊME client connecté ne doit pas non plus accéder
  const cli = await cpage.evaluate(async () => {
    const r = await fetch('/api/admin/document-info?type=contrat&id=3', { credentials: 'include' });
    return { status: r.status };
  });
  check('F1bis document-info client connecté -> 403', cli.status === 403, `status=${cli.status}`);
  await cctx.close();

  // F2 : /api/document admin cookie -> 200 PDF
  const doc = await page.evaluate(async () => {
    const r = await fetch('/api/document?type=contrat&id=3', { credentials: 'include' });
    const buf = await r.arrayBuffer();
    return { status: r.status, ct: r.headers.get('content-type'), head: Array.from(new Uint8Array(buf.slice(0, 4))).map(b => String.fromCharCode(b)).join('') };
  });
  check('F2 /api/document?type=contrat&id=3 (admin) -> 200 PDF', doc.status === 200 && /pdf/.test(doc.ct) && doc.head === '%PDF', JSON.stringify(doc));
}

// ============ G. KYC approve/reject fonctionnels (avec restauration) ============
{
  await page.locator('.db-nav-item[data-tab="kyc"]').click();
  await sleep(800);
  const kyc7 = dbQuery("SELECT statuts FROM kyc WHERE id = 7")[0];
  check('G0 kyc id 7 en_cours avant test', kyc7 && /en_cours/.test(kyc7.statuts), kyc7 && kyc7.statuts);

  // Approve via l'UI (confirm natif -> accepter)
  page.once('dialog', d => d.accept());
  await page.locator('#tab-kyc .kyc-actions .btn-approve').first().click();
  await sleep(2500);
  const s1 = dbQuery("SELECT statuts FROM kyc WHERE id = 7")[0].statuts;
  check('G1 bouton Approuver fonctionnel (statuts -> approuvé)', /approuv/.test(s1), `statuts=${s1}`);

  // Repasser en_cours pour tester Rejeter
  dbExec("UPDATE kyc SET statuts = 'en_cours' WHERE id = 7");
  await page.reload({ waitUntil: 'load' });
  await sleep(2200);
  await page.locator('.db-nav-item[data-tab="kyc"]').click();
  await sleep(800);
  page.once('dialog', d => d.accept('Test L011 — motif rejet'));
  await page.locator('#tab-kyc .kyc-actions .btn-reject').first().click();
  await sleep(2500);
  const s2 = dbQuery("SELECT statuts FROM kyc WHERE id = 7")[0].statuts;
  check('G2 bouton Rejeter fonctionnel (statuts -> rejeté)', /rejet/.test(s2), `statuts=${s2}`);

  // Restauration état initial
  dbExec("UPDATE kyc SET statuts = 'en_cours' WHERE id = 7");
  const s3 = dbQuery("SELECT statuts FROM kyc WHERE id = 7")[0].statuts;
  check('G3 état KYC 7 restauré (en_cours)', /en_cours/.test(s3), `statuts=${s3}`);
}

// Purges finales
{
  const cl = out._client ? out._client.email : null;
  if (cl) {
    const ids = dbQuery(`SELECT id FROM clients WHERE email = '${cl}'`).map(r => r.id);
    for (const id of ids) dbExec(`DELETE FROM clients WHERE id = ${id}`);
  }
  const ids2 = dbQuery(`SELECT id FROM clients WHERE email LIKE 'l011%' OR email LIKE 'l011b%'`).map(r => r.id);
  for (const id of ids2) dbExec(`DELETE FROM clients WHERE id = ${id}`);
  check('purge clients test l011', String(dbQuery(`SELECT COUNT(*) c FROM clients WHERE email LIKE 'l011%'`)[0].c) === '0', 'clients jetables supprimés');
}

check('Zéro erreur JS page', jsErrors.length === 0, jsErrors.join(' | ').slice(0, 200));

await browser.close();
fs.writeFileSync('/root/Fedpawa/audit/l011_e2e_results.json', JSON.stringify(out, null, 2));
const failed = out.cases.filter(c => !c.pass);
console.log(`\n==== ${out.cases.length - failed.length}/${out.cases.length} PASS ====`);
if (failed.length) { console.log('ÉCHECS:'); failed.forEach(f => console.log(' -', f.name, '|', f.info)); process.exit(1); }
