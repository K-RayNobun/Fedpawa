// E2E: souscription_domiciliation.php n'a plus qu'UNE barre de navigation (site-header), page fonctionnelle
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:8099';
const out = { cases: [] };
const check = (name, pass, info = '') => out.cases.push({ name, pass, info });

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0, 100)));
  page.on('console', m => { const loc = (m.location() && m.location().url) || ''; if (m.type() === 'error' && !loc.includes('favicon') && !/\b(401|400|500)\b/.test(m.text())) errors.push(m.text().slice(0, 100)); });

  await page.goto(BASE + '/souscription_domiciliation.php?pack=national-business', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  // 1. une seule <header> visible (site-header), pas de tunnel-header
  const headers = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('header'));
    return all.map(h => ({ cls: h.className, visible: h.offsetParent !== null }));
  });
  check('exactement 1 <header> visible (site-header)', headers.filter(h => h.visible).length === 1, JSON.stringify(headers));
  check('aucun .tunnel-header', await page.evaluate(() => !document.querySelector('.tunnel-header')));

  // 2. la page reste fonctionnelle: formulaire + sections présents
  check('formulaire domiciliation présent', await page.evaluate(() => !!document.getElementById('domiciliationForm')));
  check('6 sections du formulaire', await page.evaluate(() => document.querySelectorAll('.form-section').length === 6), await page.evaluate(() => document.querySelectorAll('.form-section').length));
  check('sidebar récap présente', await page.evaluate(() => !!document.querySelector('.order-summary')));

  // 3. le header standard a bien ses éléments (burger, nav)
  check('nav principale du site rendue', await page.evaluate(() => !!document.querySelector('.site-header nav, header nav, .nav-links, nav a')));
  check('logo/header visible en haut', await page.evaluate(() => { const h = document.querySelector('header'); if (!h) return false; const r = h.getBoundingClientRect(); return r.top >= -2 && r.height > 30; }));

  // 4. pas de débordement (mobile)
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(400);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('mobile 375px: pas de débordement', ov <= 1, 'overflow=' + ov + 'px');

  check('0 erreur console', errors.length === 0, errors.slice(0, 2).join(' | '));

  const failed = out.cases.filter(c => !c.pass);
  console.log(JSON.stringify({ cases: out.cases, total: out.cases.length, failed: failed.length }, null, 1));
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message); process.exit(2); });
