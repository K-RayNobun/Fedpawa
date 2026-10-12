// Sticky préservation : la sidebar facture (étape 5, desktop) et la top-bar restent sticky malgré overflow-x: clip
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:8099';
const out = { cases: [] };
const check = (name, pass, info = '') => out.cases.push({ name, pass, info });

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Page longue (création entreprise) : la top-bar doit rester visible en scrollant
  await page.goto(BASE + '/creation_entreprise.php', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(400);
  const topbar = await page.evaluate(() => {
    const el = document.querySelector('.top-bar') || document.querySelector('header');
    if (!el) return { exists: false };
    const r = el.getBoundingClientRect();
    return { exists: true, top: Math.round(r.top), position: getComputedStyle(el).position, sticky: getComputedStyle(el).position === 'sticky' || getComputedStyle(el).position === 'fixed' };
  });
  check('top-bar sticky au scroll (top <= 0)', topbar.exists && topbar.top <= 0, JSON.stringify(topbar));

  // 2. Sidebar facture sticky à l'étape 5 (desktop)
  await page.goto(BASE + '/tunnel_souscription.php?service=contrats&pack=complexe', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await page.evaluate(() => window.goToStep(5));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(400);
  const side = await page.evaluate(() => {
    const el = document.querySelector('.order-summary');
    if (!el) return { exists: false };
    const r = el.getBoundingClientRect();
    return { exists: true, top: Math.round(r.top), pos: getComputedStyle(el).position };
  });
  check('sidebar facture sticky (étape 5, top <= 100)', side.exists && side.top <= 100 && side.pos === 'sticky', JSON.stringify(side));

  const failed = out.cases.filter(c => !c.pass);
  console.log(JSON.stringify({ cases: out.cases, failed: failed.length }, null, 1));
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message); process.exit(2); });
