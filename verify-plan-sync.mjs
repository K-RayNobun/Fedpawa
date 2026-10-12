const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:8097';
const norm = s => s.replace(/[\u00A0\u202F,]/g, ' ');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const out = {};

  // contrats standard -> l'utilisateur passe le select complexité sur "audit" (sur devis)
  await page.goto(BASE + '/tunnel_souscription.php?service=contrats&pack=standard', { waitUntil: 'domcontentloaded' });
  out.total_initial = norm(await page.evaluate(() => document.getElementById('summaryTotal').innerText)); // 51 000
  await page.evaluate(() => {
    const form = document.getElementById('form-contrats');
    const sel = form.querySelector('select[data-plan-select]');
    sel.value = 'audit';
    sel.dispatchEvent(new Event('change'));
  });
  out.total_apres_audit = norm(await page.evaluate(() => document.getElementById('summaryTotal').innerText)); // Sur devis
  out.btn_apres = await page.evaluate(() => document.getElementById('finalPayBtn').innerText);

  // retour sur complexe -> 153 000
  await page.evaluate(() => {
    const sel = document.querySelector('#form-contrats select[data-plan-select]');
    sel.value = 'complexe';
    sel.dispatchEvent(new Event('change'));
  });
  out.total_apres_complexe = norm(await page.evaluate(() => document.getElementById('summaryTotal').innerText));

  // fiscalite : select régime -> reel = sur devis
  await page.goto(BASE + '/tunnel_souscription.php?service=fiscalite&pack=simplifie', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const sel = document.querySelector('#form-fiscalite select[data-plan-select]');
    sel.value = 'reel';
    sel.dispatchEvent(new Event('change'));
  });
  out.fiscalite_reel_total = norm(await page.evaluate(() => document.getElementById('summaryTotal').innerText));

  // oapi : type d'actif -> brevets = sur devis
  await page.goto(BASE + '/tunnel_souscription.php?service=oapi&pack=protect_brand', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const sel = document.querySelector('#form-oapi select[data-plan-select]');
    sel.value = 'brevets';
    sel.dispatchEvent(new Event('change'));
  });
  out.oapi_brevets_total = norm(await page.evaluate(() => document.getElementById('summaryTotal').innerText));

  const pass = out.total_initial === '51 000 FCFA'
    && out.total_apres_audit === 'Sur devis'
    && out.btn_apres.includes('devis')
    && out.total_apres_complexe === '153 000 FCFA'
    && out.fiscalite_reel_total === 'Sur devis'
    && out.oapi_brevets_total === 'Sur devis';
  console.log(JSON.stringify({ pass, ...out }, null, 2));
  await browser.close();
  process.exit(pass ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
