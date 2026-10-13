// Lane contrat - E2E: tunnel -> paiement MoMo -> "Verifier Mon Paiement" -> contrat -> signature -> PDF
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
import { ensureLogin } from '/root/Fedpawa/test-lib.mjs';
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:18081';
const out = { cases: [] };
const check = (name, pass, info = '') => { out.cases.push({ name, pass, info }); console.log((pass ? 'PASS' : 'FAIL'), name, '|', info); };

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message.slice(0, 100)));

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  if (!(await ensureLogin(page))) { console.log('FATAL login'); process.exit(2); }

  // 1. Tunnel jusqu'a l'etape paiement
  await page.goto(BASE + '/tunnel_souscription.php?service=contrats&pack=standard', { waitUntil: 'load' });
  const activeForm = () => page.locator('.tunnel-step-content.active form, form[id^="form-"]').first();

  // etape 1: remplir tous les champs requis visibles
  for (let round = 0; round < 4; round++) {
    const fields = await page.locator('.tunnel-step-content.active input[required]:visible, .tunnel-step-content.active select[required]:visible, .tunnel-step-content.active textarea[required]:visible').all();
    if (fields.length === 0) break;
    for (const f of fields) {
      const tag = await f.evaluate(el => el.tagName);
      const type = await f.evaluate(el => el.type);
      if (tag === 'SELECT') {
        await f.selectOption({ index: 1 }).catch(() => {});
      } else if (type === 'email') {
        await f.fill('lane-contrat@fedpawa-test.com');
      } else if (type === 'tel') {
        await f.fill('+237690000001');
      } else if (type === 'checkbox' || type === 'radio') {
        await f.check().catch(() => {});
      } else if (type === 'number') {
        await f.fill('10');
      } else {
        await f.fill('Test Lane Contrat');
      }
    }
    // case à cocher consentement si présente
    const cbs = await page.locator('.tunnel-step-content.active input[type="checkbox"][required]:visible').all();
    for (const c of cbs) await c.check().catch(() => {});
    // bouton continuer de l'étape active
    const nextBtn = page.locator('.tunnel-step-content.active .btn-primary:not([id^="final"])').first();
    const label = await nextBtn.textContent().catch(() => '');
    await nextBtn.click();
    await page.waitForTimeout(400);
  }

  // 2. Bouton final paiement
  const payBtn = page.locator('#finalPayBtn');
  const hasPay = await payBtn.count();
  if (hasPay) { await payBtn.click(); await page.waitForTimeout(600); }

  // 3. Modal MoMo visible?
  const momoVisible = await page.locator('.pay-momo-modal #payMomoForm').count();
  check('modal MoMo ouverte', momoVisible > 0, momoVisible > 0 ? '' : 'modal absente');
  if (!momoVisible) { console.log(JSON.stringify(out)); process.exit(1); }

  await page.fill('#payMomoPhone', '+237690000001');
  await page.check('.pay-momo-operators input[value="orange"]');
  await page.click('#payMomoSubmit');
  await page.waitForTimeout(1500);

  // 4. Écran « Vérifier Mon Paiement » ?
  const verifyBtn = await page.locator('#btnVerifyPay').count();
  check('écran Vérifier Mon Paiement', verifyBtn > 0, verifyBtn > 0 ? '' : 'écran non affiché');
  if (!verifyBtn) { console.log(JSON.stringify(out)); process.exit(1); }

  // 5. Cliquer vérifier -> paiement reçu -> écran contrat
  await page.click('#btnVerifyPay');
  await page.waitForTimeout(1200);
  const signForm = await page.locator('#contractSignForm').count();
  check('contrat personnalisé affiché', signForm > 0, signForm > 0 ? '' : 'contrat non affiché');
  if (!signForm) { console.log(JSON.stringify(out)); process.exit(1); }

  const docText = await page.locator('.contract-doc').textContent().catch(() => '');
  check('contrat contient montant + référence', /FCFA/.test(docText) && /(SUB|DEMO)/.test(docText), docText.slice(0, 60));

  // 6. OTP pré-rempli (mode démo) et signature
  const otpVal = await page.inputValue('#contractOtp').catch(() => '');
  check('OTP pré-rempli (mode démo)', /^\d{6}$/.test(otpVal), otpVal ? '' : 'vide');
  await page.click('#contractSignForm button[type="submit"]');
  await page.waitForTimeout(1500);

  // 7. Contrat signé + lien PDF
  const success = await page.locator('.pay-momo-success').count();
  check('contrat signé', success > 0, success > 0 ? '' : 'échec signature');
  const pdfLink = await page.locator('a[href*="/api/document?type=contrat"]').count();
  check('lien PDF contrat présent', pdfLink > 0);

  // 8. Le PDF répond 200
  const href = await page.locator('a[href*="/api/document?type=contrat"]').first().getAttribute('href').catch(() => null);
  if (href) {
    const st = await page.evaluate(u => fetch(u, { credentials: 'include' }).then(r => r.status), href);
    check('PDF accessible (HTTP 200)', st === 200, 'HTTP ' + st);
  }

  check('aucune erreur JS bloquante', jsErrors.length === 0, jsErrors.slice(0, 2).join(' / '));
  console.log(JSON.stringify(out));
  await browser.close();
  process.exit(out.cases.some(c => !c.pass) ? 1 : 0);
})();
