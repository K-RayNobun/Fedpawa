// L017 — E2E lisibilité mobile pages juridiques (Politique + CGU, FR/EN)
// AVANT = pages.css d'origine (interception route depuis git HEAD), APRÈS = live ?v=4.
// Mesures mobile 375×720 (padding li ≥10px, line-height ≥1.6, scrollWidth ≤376),
// zéro changement desktop 1440 (getComputedStyle li AVANT/APRÈS identiques,
// sans fond ni bordure), non-fuite sur /contrats.php (hors scope).
// Artefacts : /root/Fedpawa/audit/l017_*.png + l017_e2e_results.json
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = 'http://127.0.0.1:18081';
const SHOT = (n) => `/root/Fedpawa/audit/${n}`;
const PAGES = [
  { key: 'privacy-fr', url: '/politique-confidentialite.php' },
  { key: 'cgu-fr', url: '/cgu.php' },
  { key: 'privacy-en', url: '/en/politique-confidentialite.php' },
  { key: 'cgu-en', url: '/en/cgu.php' },
];
const out = { cases: [], before: {}, after: {}, desktop: {} };
const check = (name, pass, info = '') => { out.cases.push({ name, pass, info }); console.log((pass ? 'PASS' : 'FAIL'), name, '|', info); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const INIT = () => { localStorage.setItem('fedpawa-mode', 'light'); localStorage.setItem('fedpawa-theme', 'navy'); };

// CSS d'origine (HEAD) pour l'état AVANT
let OLD_CSS = '';
try { OLD_CSS = execSync('git -C /root/Fedpawa show HEAD:fedpawa_light/public/assets/css/pages.css', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }); } catch (e) { console.error('WARN git show:', e.message.slice(0, 120)); }
check('CSS d\'origine récupéré depuis git HEAD (état AVANT)', OLD_CSS.includes('.solution-list li') && !OLD_CSS.includes('.legal-page'), `${OLD_CSS.length} octets, .legal-page absent: ${!OLD_CSS.includes('.legal-page')}`);

const MEASURE = () => {
  const li = document.querySelector('.legal-page .solution-list li') || document.querySelector('.solutions-grid .solution-list li');
  const cs = li ? getComputedStyle(li) : null;
  return {
    legalSections: document.querySelectorAll('.legal-page').length,
    liCount: document.querySelectorAll('.solution-list li').length,
    liFound: !!li,
    display: cs && cs.display,
    paddingTop: cs && parseFloat(cs.paddingTop),
    paddingBottom: cs && parseFloat(cs.paddingBottom),
    bg: cs && cs.backgroundColor,
    borderLeftWidth: cs && cs.borderLeftWidth,
    borderLeftColor: cs && cs.borderLeftColor,
    borderRadius: cs && cs.borderRadius,
    fontSize: cs && cs.fontSize,
    lineHeightRatio: cs && cs.lineHeight !== 'normal' ? +(parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)).toFixed(3) : cs && cs.lineHeight,
    beforeContent: cs ? getComputedStyle(li, '::before').content : null,
    scrollWidth: document.scrollingElement.scrollWidth,
    cssHref: (document.querySelector('link[href*="pages.css"]') || { getAttribute: () => null }).getAttribute('href'),
  };
};

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const jsErrors = [];

// ============ A. MOBILE 375×720 — AVANT (CSS d'origine intercepté) ============
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 720 } });
  await ctx.addInitScript(INIT);
  if (OLD_CSS) await ctx.route('**/pages.css*', r => r.fulfill({ body: OLD_CSS, contentType: 'text/css' }));
  const page = await ctx.newPage();
  page.on('pageerror', e => jsErrors.push('avant:' + e.message.slice(0, 120)));
  for (const p of PAGES) {
    await page.goto(BASE + p.url, { waitUntil: 'load' });
    await sleep(400);
    const m = await page.evaluate(MEASURE);
    out.before[p.key] = m;
    check(`AVANT ${p.key}: li SANS tuile (flex, fond transparent, bordure 0, puce ✓)`,
      m.liFound && m.display === 'flex' && m.bg === 'rgba(0, 0, 0, 0)' && m.borderLeftWidth === '0px' && m.beforeContent === '"✓"',
      `display=${m.display} bg=${m.bg} blw=${m.borderLeftWidth} ::before=${m.beforeContent}`);
    await page.screenshot({ path: SHOT(`l017_${p.key}_mobile_avant.png`), fullPage: true });
  }
  await ctx.close();
}

// ============ B. MOBILE 375×720 — APRÈS (live, pages.css?v=4) ============
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 720 } });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  page.on('pageerror', e => jsErrors.push('apres:' + e.message.slice(0, 120)));
  const cssResp = await page.request.get(BASE + '/assets/css/pages.css?v=4');
  const cssText = await cssResp.text();
  check('CSS live contient le bloc @media (max-width: 640px) .legal-page',
    cssResp.status() === 200 && cssText.includes('@media (max-width: 640px)') && cssText.includes('.legal-page .solution-list li'),
    `status=${cssResp.status()} ${cssText.length} octets`);
  for (const p of PAGES) {
    await page.goto(`${BASE}${p.url}?l017=${Date.now()}`, { waitUntil: 'load' });
    await sleep(400);
    const m = await page.evaluate(MEASURE);
    out.after[p.key] = m;
    check(`APRÈS ${p.key}: pages.css?v=4 référencé + 2 sections .legal-page`,
      /pages\.css\?v=4$/.test(m.cssHref || '') && m.legalSections === 2, `href=${m.cssHref} sections=${m.legalSections}`);
    check(`APRÈS ${p.key}: li en tuile (block, padding≥10px, fond≠transparent, bordure gauche 3px, radius 8px)`,
      m.liFound && m.display === 'block' && m.paddingTop >= 10 && m.paddingBottom >= 10 && m.bg !== 'rgba(0, 0, 0, 0)' && m.borderLeftWidth === '3px' && m.borderRadius === '8px',
      `display=${m.display} pad=${m.paddingTop}/${m.paddingBottom} bg=${m.bg} blw=${m.borderLeftWidth}(${m.borderLeftColor}) radius=${m.borderRadius}`);
    check(`APRÈS ${p.key}: line-height ≥1.6 et puce ✓ retirée`,
      typeof m.lineHeightRatio === 'number' && m.lineHeightRatio >= 1.6 && m.beforeContent === 'none',
      `lh=${m.lineHeightRatio} ::before=${m.beforeContent} fs=${m.fontSize}`);
    check(`APRÈS ${p.key}: aucun overflow horizontal (scrollWidth ≤376)`,
      m.scrollWidth <= 376, `scrollWidth=${m.scrollWidth}`);
    await page.screenshot({ path: SHOT(`l017_${p.key}_mobile_apres.png`), fullPage: true });
  }
  await ctx.close();
}

// ============ C. DESKTOP 1440×900 — AVANT/APRÈS identiques ============
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(INIT);
  if (OLD_CSS) await ctx.route('**/pages.css*', r => r.fulfill({ body: OLD_CSS, contentType: 'text/css' }));
  const page = await ctx.newPage();
  page.on('pageerror', e => jsErrors.push('desktop-avant:' + e.message.slice(0, 120)));
  for (const p of PAGES) {
    await page.goto(BASE + p.url, { waitUntil: 'load' });
    await sleep(300);
    const m = await page.evaluate(MEASURE);
    out.desktop[p.key + '_avant'] = m;
    await page.screenshot({ path: SHOT(`l017_${p.key}_desktop_avant.png`), fullPage: true });
  }
  await ctx.close();

  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx2.addInitScript(INIT);
  const page2 = await ctx2.newPage();
  page2.on('pageerror', e => jsErrors.push('desktop-apres:' + e.message.slice(0, 120)));
  for (const p of PAGES) {
    await page2.goto(`${BASE}${p.url}?l017=${Date.now()}`, { waitUntil: 'load' });
    await sleep(300);
    const m = await page2.evaluate(MEASURE);
    out.desktop[p.key + '_apres'] = m;
    const b = out.desktop[p.key + '_avant'];
    const same = ['display', 'bg', 'borderLeftWidth', 'borderRadius', 'fontSize', 'lineHeightRatio', 'scrollWidth']
      .every(k => JSON.stringify(m[k]) === JSON.stringify(b[k]));
    check(`DESKTOP ${p.key}: getComputedStyle li identique AVANT/APRÈS (sans fond ni bordure)`,
      m.liFound && m.bg === 'rgba(0, 0, 0, 0)' && m.borderLeftWidth === '0px' && m.display === 'flex' && m.beforeContent === '"✓"' && same,
      `bg=${m.bg} blw=${m.borderLeftWidth} radius=${m.borderRadius} display=${m.display} fs=${m.fontSize} lh=${m.lineHeightRatio} sw=${m.scrollWidth}`);
    await page2.screenshot({ path: SHOT(`l017_${p.key}_desktop_apres.png`), fullPage: true });
  }
  await ctx2.close();
}

// ============ D. NON-FUITE : /contrats.php (solution-list hors scope) en mobile ============
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 720 } });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  page.on('pageerror', e => jsErrors.push('contrats:' + e.message.slice(0, 120)));
  await page.goto(`${BASE}/contrats.php?l017=${Date.now()}`, { waitUntil: 'load' });
  await sleep(400);
  const m = await page.evaluate(MEASURE);
  out.contrats = m;
  check('NON-FUITE /contrats.php mobile: 0 section .legal-page, li inchangés (flex, ✓, fond transparent)',
    m.legalSections === 0 && m.liFound && m.display === 'flex' && m.bg === 'rgba(0, 0, 0, 0)' && m.beforeContent === '"✓"',
    `legal=${m.legalSections} display=${m.display} bg=${m.bg} ::before=${m.beforeContent}`);
  await ctx.close();
}

check('Zéro erreur JS sur toutes les phases', jsErrors.length === 0, jsErrors.join(' | ').slice(0, 200));

await browser.close();
fs.writeFileSync('/root/Fedpawa/audit/l017_e2e_results.json', JSON.stringify(out, null, 2));
const failed = out.cases.filter(c => !c.pass);
console.log(`\n==== ${out.cases.length - failed.length}/${out.cases.length} PASS ====`);
if (failed.length) { console.log('ÉCHECS:'); failed.forEach(f => console.log(' -', f.name, '|', f.info)); process.exit(1); }
