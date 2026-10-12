// E2E menu Settings/Profil: opacité, positionnement sous le bouton, accordéons, fermeture
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

  await page.goto(BASE + '/index.php', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // ==== ÉTAT NON-CONNECTÉ : bouton settings ====
  const btnExists = await page.evaluate(() => !!document.getElementById('navSettingsBtn'));
  check('bouton paramètres présent (non-connecté)', btnExists);
  if (!btnExists) { finish(); return; }

  await page.click('#navSettingsBtn');
  await page.waitForTimeout(400);
  const menuState = await page.evaluate(() => {
    const menu = document.querySelector('.settings-menu.open');
    if (!menu) return { open: false };
    const cs = getComputedStyle(menu);
    const btn = document.getElementById('navSettingsBtn');
    const mr = menu.getBoundingClientRect(), br = btn.getBoundingClientRect();
    return {
      open: true,
      bg: cs.backgroundColor,
      bgOpaque: cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent' && !/rgba\([^)]+, 0\)$/.test(cs.backgroundColor),
      below: mr.top >= br.bottom - 2,
      rightAligned: Math.abs(mr.right - br.right) <= 24,
      inViewport: mr.left >= 0 && mr.right <= window.innerWidth,
      noOverlap: mr.top >= br.bottom
    };
  });
  check('menu ouvert', menuState.open);
  check('fond OPAQUE (variable thème valide)', menuState.bgOpaque, 'bg=' + menuState.bg);
  check('positionné SOUS le bouton (pas de chevauchement header)', menuState.below && menuState.noOverlap, JSON.stringify({ menuTop: menuState.mrTop || 'ok', btnBottom: 'ok' }));
  check('aligné à droite du bouton', menuState.rightAligned);
  check('entièrement dans le viewport', menuState.inViewport);

  // ombre visible + bordure
  const shadow = await page.evaluate(() => { const m = document.querySelector('.settings-menu.open'); return m ? getComputedStyle(m).boxShadow !== 'none' : false; });
  check('ombre portée visible', shadow);

  // z-index au-dessus du contenu
  const onTop = await page.evaluate(() => {
    const m = document.querySelector('.settings-menu.open');
    if (!m) return false;
    const r = m.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + 10, r.top + 10);
    return m === el || m.contains(el);
  });
  check('menu au-dessus du contenu (z-index)', onTop);

  // ==== Accordéon Thème ====
  await page.click('.settings-accordion-trigger'); // Thème
  await page.waitForTimeout(300);
  const themeOpen = await page.evaluate(() => { const b = document.querySelector('.settings-accordion-body'); return b && b.style.display !== 'none'; });
  check('accordéon Thème se déplie', themeOpen);

  const modeBefore = await page.evaluate(() => document.documentElement.getAttribute('data-mode'));
  await page.click('.settings-submenu-btn[data-mode="light"]');
  await page.waitForTimeout(400);
  const modeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-mode'));
  check('clic Jour → mode clair appliqué', modeAfter === 'light', modeBefore + ' → ' + modeAfter);

  // ==== Fermeture: Échap puis clic extérieur ====
  await page.click('#navSettingsBtn');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  check('Échap ferme le menu', await page.evaluate(() => !document.querySelector('.settings-menu.open')));

  await page.click('#navSettingsBtn');
  await page.waitForTimeout(300);
  await page.evaluate(() => document.body.click());
  await page.waitForTimeout(250);
  check('clic extérieur ferme le menu', await page.evaluate(() => !document.querySelector('.settings-menu.open')));

  // pas de débordement
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('pas de débordement horizontal', ov <= 1, 'overflow=' + ov + 'px');

  check('0 erreur console', errors.length === 0, errors.slice(0, 2).join(' | '));

  finish();
  async function finish() {
    const failed = out.cases.filter(c => !c.pass);
    console.log(JSON.stringify({ cases: out.cases, total: out.cases.length, failed: failed.length }, null, 1));
    await browser.close();
    process.exit(failed.length ? 1 : 0);
  }
})().catch(e => { console.error('FATAL', e.message); process.exit(2); });
