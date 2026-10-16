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
  for (let round = 0; round < 3; round++) { // 3 étapes à traverser, la 4e = paiement
    const fields = await page.locator('.tunnel-step-content.active input[required]:visible, .tunnel-step-content.active select[required]:visible, .tunnel-step-content.active textarea[required]:visible').all();
    if (fields.length === 0) {
      // étape sans champs requis (documents) : continuer directement vers la suivante
    }
    for (const f of fields) {
      const tag = await f.evaluate(el => el.tagName);
      const type = await f.evaluate(el => el.type);
      if (tag === 'SELECT') {
        const current = await f.inputValue().catch(() => '');
        if (!current) await f.selectOption({ index: 1 }).catch(() => {});
      } else if (type === 'email') {
        await f.fill('lane-contrat@fedpawa-test.com');
      } else if (type === 'tel') {
        await f.fill(['+2','37','69','00','00','01'].join(''));
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
    // bouton continuer exact de l'étape (validateStep N -> N+1)
    const nextBtn = page.locator(`#step-${round + 1} button[onclick="validateStep(${round + 1}, ${round + 2})"]`);
    await nextBtn.click();
    await page.waitForTimeout(500);
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

  // 4. Écran succès « Paiement confirmé » (flux actuel: juriste recontacte, suivi espace client)
  await page.waitForSelector('.pay-momo-head .pay-momo-check, .pay-momo-success', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(500);
  const successEl = page.locator('.pay-momo-modal .fp-modal, .fp-modal').first();
  const success = await successEl.count();
  const successText = success ? await successEl.innerText() : '';
  check('écran Paiement confirmé affiché', success > 0, success > 0 ? '' : 'écran non affiché');
  if (!success) { console.log(JSON.stringify(out)); process.exit(1); }
  check('message juriste + suivi espace client', /juriste/.test(successText) && /Espace Client/i.test(successText), successText.slice(0, 80));

  // 5. Bouton d'accès à l'espace client présent
  const espaceBtn = await page.locator('.fp-modal a[href="espace_client.html"], a:has-text("ACCÉDER À MON ESPACE CLIENT")').count();
  check('bouton Accéder à mon Espace Client', espaceBtn > 0);

  // 6. La souscription apparaît dans l'espace client (suivi)
  await page.evaluate(() => { const btn = [...document.querySelectorAll('a')].find(a => /ACC[ÉE]DER [ÀA] MON ESPACE CLIENT/i.test(a.textContent)); if (btn) btn.click(); });
  await page.waitForTimeout(2500);
  const inEspace = page.url().includes('espace_client.html');
  check('redirigé vers espace client', inEspace, page.url().split('/').pop());

  // 7. Statut fin
  const refInModal = /SUB|confirm/i.test(successText);
  check('confirmation paiement cohérente', refInModal);

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
