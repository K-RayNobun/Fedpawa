
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
import { ensureLogin } from '/root/Fedpawa/test-lib.mjs';
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = 'http://127.0.0.1:18081';
const out = [];
const check = (n, p, i = '') => { out.push([n, p, i]); console.log((p ? 'PASS' : 'FAIL'), n, '|', i); };

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const client = await (await b.newContext()).newPage();
  await client.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  if (!(await ensureLogin(client))) process.exit(2);

  // 1. upload KYC: créer un PDF binaire minimal via Buffer
  const kycRes = await client.evaluate(async () => {
    const fd = new FormData();
    const blob = new Blob(['%PDF-1.4 test audit kyc'], { type: 'application/pdf' });
    fd.append('piece_identite', blob, 'identite.pdf');
    fd.append('justificatif_domicile', blob, 'justificatif.pdf');
    const csrf = await (await fetch('/api/csrf-token', { credentials: 'include' })).json();
    const res = await fetch('/api/kyc/submit', { method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': csrf.csrf_token }, body: fd });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  });
  check('client -> KYC soumis', kycRes.status === 200 && !kycRes.body.error, JSON.stringify(kycRes).slice(0, 80));

  // 2. admin: voir le KYC en attente + approuver
  const admin = await (await b.newContext()).newPage();
  await admin.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await admin.addScriptTag({ url: BASE + '/assets/js/api.js' });
  await admin.evaluate(() => window.Api.post('/api/admin/login', { email: 'audit-e2e@fedpawa.com', mot_de_passe: 'AuditE2E-Admin-2026' }));
  const lists = await admin.evaluate(() => fetch('/api/admin/lists', { credentials: 'include' }).then(r => r.json()));
  const pending = (lists.kyc || []).filter(k => k.statuts === 'en_cours' || k.statuts === 'en_attente');
  check('admin voit KYC en attente', pending.length >= 1, pending.length + ' dossier(s)');
  if (pending.length) {
    const kid = pending[pending.length - 1].id;
    const appr = await admin.evaluate((id) => window.Api.post('/api/admin/kyc/approve', { id }).then(r => r.json()), kid);
    check('admin -> KYC approuvé', !appr.error, JSON.stringify(appr).slice(0, 60));
    // 3. client: statut KYC mis à jour
    const dash = await client.evaluate(() => fetch('/api/dashboard', { credentials: 'include' }).then(r => r.json()));
    check('client voit KYC validé', dash.kyc && dash.kyc.statuts === 'approuvé', 'statuts=' + (dash.kyc ? dash.kyc.statuts : 'null'));
  }

  // 4. courrier: admin envoie un scan au client (multi-page)
  const cour = await admin.evaluate(async (cid) => {
    const fd = new FormData();
    const blob = new Blob(['%PDF-1.4 scan courrier audit'], { type: 'application/pdf' });
    fd.append('documents[]', blob, 'scan1.pdf');
    fd.append('client_id', String(cid));
    const csrf = await (await fetch('/api/csrf-token', { credentials: 'include' })).json();
    const res = await fetch('/api/courrier/upload', { method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': csrf.csrf_token }, body: fd });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  }, 50);
  check('admin -> courrier envoyé au client', cour.status === 200 && !cour.body.error, JSON.stringify(cour).slice(0, 80));

  // 5. client voit le courrier
  const courriers = await client.evaluate(() => fetch('/api/courriers', { credentials: 'include' }).then(r => r.json()));
  const n = (courriers.data || []).length;
  check('client voit le courrier reçu', n >= 1, n + ' courrier(s)');

  console.log(JSON.stringify(out.map(o => ({ name: o[0], pass: o[1], info: o[2] }))));
  await b.close();
  process.exit(out.some(o => !o[1]) ? 1 : 0);
})();
