// Lane audit - E2E crois\u00e9 client <-> admin sur donn\u00e9es r\u00e9elles uniquement
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
import { ensureLogin } from '/root/Fedpawa/test-lib.mjs';
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:18081';
const out = { cases: [] };
const check = (name, pass, info = '') => { out.cases.push({ name, pass, info }); console.log((pass ? 'PASS' : 'FAIL'), name, '|', info); };

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctxC = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const client = await ctxC.newPage();
  const ctxA = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const admin = await ctxA.newPage();
  const jsErrC = [], jsErrA = [];
  client.on('pageerror', e => jsErrC.push(e.message.slice(0, 80)));
  admin.on('pageerror', e => jsErrA.push(e.message.slice(0, 80)));

  // ===== 1. Connexion client =====
  await client.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  if (!(await ensureLogin(client))) { console.log('FATAL login client'); process.exit(2); }

  // ===== 2. Espace client: aucune donnée démo =====
  await client.goto(BASE + '/espace_client.html', { waitUntil: 'load' });
  await client.waitForTimeout(900);
  const bodyText = await client.evaluate(() => document.body.innerText);
  check('espace client sans données démo', !/Jean Dupont|FAC-2026|Alpha SARL|Marie Curie/.test(bodyText), '');
  await client.waitForTimeout(400);
  const welcome = await client.locator('.db-welcome h1').first().innerText().catch(() => '');
  check('welcome personnalisé (nom réel)', /Bonjour/.test(welcome) && !/^Bonjour$/.test(welcome.trim()), JSON.stringify(welcome).slice(0, 50));

  // ===== 3. Client: envoi mail interne =====
  
  // via Api (CSRF)
  const mailRes = await client.evaluate(() => window.Api.post('/api/mail/send', { content: 'Audit E2E: message client vers admin ' + Date.now() }).then(r => r.json()).catch(e => ({ error: String(e) })));
  check('client -> mail interne envoyé', !mailRes.error, JSON.stringify(mailRes).slice(0, 60));

  // ===== 4. Client: ticket support =====
  const supRes = await client.evaluate(() => window.Api.post('/api/support', { sujet: 'Audit ' + Date.now(), message: 'Vérification du flux support en production.' }).then(r => r.json()).catch(e => ({ error: String(e) })));
  check('client -> ticket support créé', !supRes.error, JSON.stringify(supRes).slice(0, 60));

  // ===== 5. Admin: connexion via le portail admin (/api/admin/login) =====
  await admin.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await admin.addScriptTag({ url: BASE + '/assets/js/api.js' });
  const loginAdm = await admin.evaluate(() => window.Api.post('/api/admin/login', { email: 'audit-e2e@fedpawa.com', mot_de_passe: 'AuditE2E-Admin-2026' }).then(r => r.json()).catch(e => ({ error: String(e) })));
  check('login portail admin', !loginAdm.error, JSON.stringify(loginAdm).slice(0, 60));

  // ===== 6. Admin dashboard: données réelles =====
  await admin.goto(BASE + '/admin_dashboard.html', { waitUntil: 'load' });
  await admin.waitForTimeout(1200);
  const adminText = await admin.evaluate(() => document.body.innerText);
  check('admin sans données démo', !/Jean Dupont|Alpha SARL|Marie Curie|CL-001|PAY-8842|7,5M/.test(adminText), '');
  // attendre que le JS admin peuplent les onglets dynamiques
  for (let i = 0; i < 20 && !(await admin.locator('#tab-tickets table tbody tr').count()); i++) await admin.waitForTimeout(300);
  const kpiClients = await admin.locator('.kpi-value').first().innerText().catch(() => '');
  check('KPI clients réel (nombre)', /^\d+$/.test(kpiClients.trim()), kpiClients.trim());

  // le message client arrive côté admin
  const hasMsg = await admin.evaluate(() => document.querySelector('#tab-messages') ? document.getElementById('tab-messages').innerText : '');
  check('admin voit le message client', /Audit E2E: message client/.test(hasMsg), hasMsg.slice(0, 50));

  // le ticket arrive côté admin
  const hasTicket = await admin.evaluate(() => document.getElementById('tab-tickets') ? document.getElementById('tab-tickets').innerText : '');
  check('admin voit le ticket support', /Audit \d+/.test(hasTicket), hasTicket.slice(0, 50));

  // ===== 7. Admin répond au client (id réel du client connecté) =====
  const dash = await client.evaluate(() => fetch('/api/dashboard', { credentials: 'include' }).then(r => r.json()).catch(() => ({})));
  const realClientId = dash && dash.client ? dash.client.id : null;
  check('id client réel récupéré', !!realClientId, 'client_id=' + realClientId);
  const replyRes = await admin.evaluate((cid) => window.Api.post('/api/mail/reply', { client_id: cid, content: 'Audit E2E: réponse admin ' + Date.now() }).then(r => r.json()).catch(e => ({ error: String(e) })), realClientId);
  check('admin -> réponse envoyée', !replyRes.error, JSON.stringify(replyRes).slice(0, 60));

  // ===== 8. Client voit la réponse dans son fil =====
  const thread = await client.evaluate(() => fetch('/api/mail/thread', { credentials: 'include' }).then(r => r.json()).catch(() => ({})));
  const th = JSON.stringify(thread);
  check('client voit la réponse admin', /Audit E2E: réponse admin/.test(th), th.slice(0, 60));

  check('aucune erreur JS côté client', jsErrC.length === 0, jsErrC.slice(0, 2).join(' / '));
  check('aucune erreur JS côté admin', jsErrA.length === 0, jsErrA.slice(0, 2).join(' / '));

  console.log(JSON.stringify(out));
  await browser.close();
  process.exit(out.cases.some(c => !c.pass) ? 1 : 0);
})();
