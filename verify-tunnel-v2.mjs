// E2E tunnel v2 : responsive mobile + facture étape 5 + HT/TTC subtil + skip step1
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
import { ensureLogin } from '/root/Fedpawa/test-lib.mjs';
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:8099';
const out = { cases: [] };
const check = (name, pass, info = '') => out.cases.push({ name, pass, info });
const norm = s => (s || '').replace(/[\u00A0\u202F,]/g, ' ').trim();

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0, 120)));
  page.on('console', m => { const loc = (m.location() && m.location().url) || ''; if (m.type() === 'error' && !loc.includes('favicon') && !/\b(401|400|500)\b/.test(m.text())) errors.push('console: ' + m.text().slice(0, 120)); });

  // ========== A. SKIP STEP 1 ==========
  // A1. Avec ?service= : arrive directement étape 2, carte présélectionnée
  await ensureLogin(page);
    await page.goto(BASE + '/tunnel_souscription.php?service=contrats&pack=complexe', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  check('A1 ?service= -> direct étape 2', await page.evaluate(() => document.getElementById('step-2').classList.contains('active')));
  check('A2 carte contrats présélectionnée', await page.evaluate(() => document.querySelector('[data-service="contrats"]').classList.contains('selected')));
  const sum1 = await page.evaluate(() => document.getElementById('summaryItems').innerText);
  check('A3 libellé "Prix Total Hors Taxe" dans le récap', sum1.includes('Prix Total Hors Taxe'));
  check('A4 pas de ligne "Frais de traitement (2%)" visible', !sum1.includes('Frais de traitement'));
  const tot1 = norm(await page.evaluate(() => document.getElementById('summaryTotal').innerText));
  check('A5 total inclut les 2% (150 000 -> 153 000)', tot1 === '153 000 FCFA', tot1);

  // A6. Sans paramètre : étape 1 affichée
  await page.goto(BASE + '/tunnel_souscription.php', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  check('A6 sans ?service= : étape 1 affichée', await page.evaluate(() => document.getElementById('step-1').classList.contains('active')));

  // ========== B. FACTURE ==========
  // B1. Sidebar invisible aux étapes 1-4
  for (const step of [1, 2, 3, 4]) {
    await page.evaluate(s => window.goToStep(s), step);
    await page.waitForTimeout(250);
    const visible = await page.evaluate(() => {
      const el = document.querySelector('.order-summary');
      if (!el) return false;
      return el.offsetParent !== null && getComputedStyle(el).display !== 'none';
    });
    check(`B1 facture invisible à l'étape ${step}`, !visible);
  }
  // B2. Visible à l'étape 5
  await page.evaluate(() => window.goToStep(5));
  await page.waitForTimeout(300);
  const vis5 = await page.evaluate(() => {
    const el = document.querySelector('.order-summary');
    return el && el.offsetParent !== null && getComputedStyle(el).display !== 'none';
  });
  check('B2 facture visible à l\'étape 5', vis5);
  const label = norm(await page.evaluate(() => document.querySelector('.summary-total span').innerText));
  check('B3 libellé "Total à régler"', label === 'Total à régler', label);

  // ========== C. RESPONSIVE MOBILE ==========
  // C1. Desktop d'abord (aucun débordement)
  const deskOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('C1 desktop : pas de débordement horizontal', deskOverflow <= 1, 'overflow=' + deskOverflow + 'px');

  // C2. Mobile 375px : pas de débordement
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(BASE + '/tunnel_souscription.php', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const m1 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('C2 mobile 375px étape 1 : pas de débordement', m1 <= 1, 'overflow=' + m1 + 'px');

  // C3. chaque étape en mobile : pas de débordement
  for (const step of [2, 3, 4, 5]) {
    await page.evaluate(s => window.goToStep(s), step);
    await page.waitForTimeout(300);
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`C3 mobile étape ${step} : pas de débordement`, ov <= 1, 'overflow=' + ov + 'px');
  }

  // C4. petits écrans 320px
  await page.setViewportSize({ width: 320, height: 568 });
  await page.evaluate(() => window.goToStep(1));
  await page.waitForTimeout(300);
  const m2 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('C4 mobile 320px : pas de débordement', m2 <= 1, 'overflow=' + m2 + 'px');

  // C5. vitesse: éléments plus larges que la page ?
  const wide = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [];
    document.querySelectorAll('.tunnel-layout-v2 *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) bad.push((el.className || el.tagName) + ' w=' + Math.round(r.width));
    });
    return bad.slice(0, 5);
  });
  check('C5 aucun élément plus large que le viewport (320px)', wide.length === 0, JSON.stringify(wide));

  check('C6 0 erreur console', errors.length === 0, errors.slice(0, 2).join(' | '));

  const failed = out.cases.filter(c => !c.pass);
  console.log(JSON.stringify({ cases: out.cases, total: out.cases.length, failed: failed.length }, null, 1));
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message); process.exit(2); });
