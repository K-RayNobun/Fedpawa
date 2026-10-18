// E2E L014 — pages légales FR/EN, liens cases à cocher, footer, sitemap
import { chromium } from '/root/tmp/camofox-browser/node_modules/playwright-core/index.mjs';
import fs from 'fs';

const BASE = 'http://127.0.0.1:18081';
const SHOT = '/root/Fedpawa/audit/';
const results = { checks: [], failed: [] };
const check = (name, ok, detail) => {
  results.checks.push({ name, ok, detail });
  if (!ok) results.failed.push(name + ' :: ' + detail);
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? ' | ' + detail : ''));
};

(async () => {
  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // ---- 1. Les 4 pages répondent 200 et rendent du contenu thémé ----
  const pages = [
    ['/politique-confidentialite.php', 'l014_policy.png', 'Politique de Confidentialité'],
    ['/cgu.php', 'l014_cgu.png', 'CGU'],
    ['/en/politique-confidentialite.php', 'l014_policy_en.png', 'Privacy Policy'],
    ['/en/cgu.php', 'l014_cgu_en.png', 'Terms'],
  ];
  for (const [path, shot, expect] of pages) {
    const resp = await page.goto(BASE + path, { waitUntil: 'networkidle' });
    const ok200 = resp.status() === 200;
    const title = await page.title();
    const heroVisible = await page.locator('.page-hero h1').first().isVisible().catch(() => false);
    const footerVisible = await page.locator('footer.site-footer').isVisible().catch(() => false);
    const themed = await page.evaluate(() => !!document.querySelector('link[rel=stylesheet]'));
    check(`page ${path} = 200`, ok200, `status=${resp.status()} title="${title.slice(0, 60)}"`);
    check(`page ${path} hero+footer+css`, heroVisible && footerVisible && themed, `hero=${heroVisible} footer=${footerVisible}`);
    await page.screenshot({ path: SHOT + shot, fullPage: false });
  }

  // ---- 2. authentification.html : label #cgu avec 2 liens cliquables ----
  await page.goto(BASE + '/authentification.html', { waitUntil: 'networkidle' });
  // Ouvrir l'onglet Inscription (le formulaire signup est caché par défaut)
  await page.locator('.auth-tab[data-tab="signup"], .switch-link[data-target="signup"]').first().click();
  await page.waitForTimeout(400);
  const cguLabel = page.locator('label[for="cgu"]');
  await cguLabel.scrollIntoViewIfNeeded();
  const labelHtml = await cguLabel.innerHTML();
  const cguLink = cguLabel.locator('a[href="cgu.php"]');
  const polLink = cguLabel.locator('a[href="politique-confidentialite.php"]');
  check('auth label #cgu contient lien cgu.php', await cguLink.count() === 1);
  check('auth label #cgu contient lien politique', await polLink.count() === 1);
  const targets = await cguLabel.locator('a').evaluateAll(els => els.map(a => ({ href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel') })));
  check('auth liens target=_blank rel=noopener', targets.length === 2 && targets.every(t => t.target === '_blank' && t.rel === 'noopener'), JSON.stringify(targets));
  // clic réel sur le lien CGU -> ouverture nouvel onglet (écoute branchée AVANT le clic)
  let popupUrl = null;
  page.context().on('page', pg => {
    pg.on('framenavigated', f => { if (f === pg.mainFrame() && f.url().includes('/cgu.php')) popupUrl = f.url(); });
  });
  await cguLink.click();
  for (let i = 0; i < 12 && !popupUrl; i++) await page.waitForTimeout(500);
  check('clic lien CGU ouvre nouvel onglet vers cgu.php', !!popupUrl, popupUrl || 'aucun popup navigué vers cgu.php');
  // label FR par défaut (avant switch EN)
  check('auth label FR contient "politique de confidentialité"', labelHtml.includes('politique de confidentialit'));

  // ---- 3. auth.js cgu_label FR/EN avec liens (switch langue réel) ----
  const v3 = await page.evaluate(() => [...document.querySelectorAll('script[src]')].map(s => s.getAttribute('src')).filter(s => s.includes('auth.js')));
  check('auth.js chargé en v3', v3.length === 1 && v3[0].includes('v=3'), v3.join(','));
  await page.evaluate(() => window.setLanguage('en'));
  const enHtml = await cguLabel.innerHTML();
  check('auth label EN (switch) contient Privacy Policy + lien politique', enHtml.includes('Privacy Policy') && enHtml.includes('politique-confidentialite.php'), enHtml.slice(0, 120));
  await page.evaluate(() => window.setLanguage('fr'));
  const frHtml2 = await cguLabel.innerHTML();
  check('auth label FR (re-switch) contient liens', frHtml2.includes('cgu.php') && frHtml2.includes('politique-confidentialite.php'));

  // ---- 4. souscription_domiciliation.php : case chk-cgv avec liens ----
  // (pages data-auth="user" : auth-guard redirige l'anonyme vers login -> vérif DOM
  //  par fetch + analyse du HTML servi, la page publique finale étant déjà couverte E2E)
  const subResp = await page.request.get(BASE + '/souscription_domiciliation.php');
  const subBody = await subResp.text();
  check('sub-dom 200', subResp.status() === 200, `status=${subResp.status()}`);
  check('sub-dom chk-cgv: lien CGV', /id="chk-cgv"[^<]*<\/?\s*span[^>]*>.*?href="cgu\.php"[^>]*target="_blank"/s.test(subBody) || (subBody.includes('id="chk-cgv"') && subBody.includes('href="cgu.php"') && subBody.includes('target="_blank"') && subBody.includes('href="politique-confidentialite.php"')), '');
  const subMatch = subBody.match(/<label[^>]*>[^<]*<input[^>]*id="chk-cgv"[\s\S]{0,800}?<\/label>/);
  const subLabel = subMatch ? subMatch[0] : '';
  check('sub-dom chk-cgv: lien politique', subLabel.includes('href="politique-confidentialite.php"') && subLabel.includes('target="_blank"') && subLabel.includes('rel="noopener"'), '');
  const subLinks = (subLabel.match(/href="(cgu|politique-confidentialite)\.php"/g) || []).length;
  check('sub-dom chk-cgv: 2 liens cliquables', subLinks === 2, `count=${subLinks}`);

  // ---- 5. tunnel_souscription.php : case CGV avec liens ----
  const tunResp = await page.request.get(BASE + '/tunnel_souscription.php');
  const tunBody = await tunResp.text();
  check('tunnel 200', tunResp.status() === 200, `status=${tunResp.status()}`);
  const tunMatch = tunBody.match(/J'accepte les <a[\s\S]{0,400}?<\/label>/);
  const tunLabel = tunMatch ? 'J\'accepte les <a' + tunMatch[0].slice("J'accepte les <a".length) : '';
  check('tunnel case trouvée', tunLabel !== '', '');
  check('tunnel case: lien CGV', tunLabel.includes('href="cgu.php"') && tunLabel.includes('target="_blank"') && tunLabel.includes('rel="noopener"'), '');
  check('tunnel case: lien politique', tunLabel.includes('href="politique-confidentialite.php"'), '');
  const tunLinks = (tunLabel.match(/href="(cgu|politique-confidentialite)\.php"/g) || []).length;
  check('tunnel case: 2 liens cliquables', tunLinks === 2, `count=${tunLinks}`);

  // ---- 6. Footer liens sur toutes les pages ----
  for (const path of ['/', '/contrats.php', '/en/contrats.php', '/politique-confidentialite.php', '/cgu.php', '/en/politique-confidentialite.php', '/en/cgu.php']) {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    const footLinks = await page.locator('footer.site-footer').locator('a[href*="cgu.php"], a[href*="politique-confidentialite.php"]').count();
    check(`footer liens sur ${path}`, footLinks >= 2, `count=${footLinks}`);
  }
  // page auth (statique, footer propre .auth-footer-info)
  await page.goto(BASE + '/authentification.html', { waitUntil: 'domcontentloaded' });
  const authFootLinks = await page.locator('.auth-footer-info').locator('a[href*="cgu.php"], a[href*="politique-confidentialite.php"]').count();
  check('footer liens sur /authentification.html', authFootLinks >= 2, `count=${authFootLinks}`);
  // footer EN libellé anglais
  await page.goto(BASE + '/en/cgu.php', { waitUntil: 'domcontentloaded' });
  const footEn = await page.locator('footer.site-footer').innerText();
  check('footer EN libellés anglais', footEn.includes('Privacy Policy') && footEn.includes('Terms'), '');

  // ---- 7. sitemap ----
  const smResp = await page.request.get(BASE + '/sitemap.xml');
  const smBody = await smResp.text();
  const smOk = smResp.status() === 200 &&
    ['politique-confidentialite.php', 'cgu.php', 'en/politique-confidentialite.php', 'en/cgu.php'].every(p => smBody.includes(p));
  check('sitemap.xml 200 + 4 nouvelles urls', smOk, `status=${smResp.status()}`);

  // ---- 8. Cross-links entre les 2 pages (FR + EN) ----
  await page.goto(BASE + '/politique-confidentialite.php', { waitUntil: 'domcontentloaded' });
  const polToCgu = await page.locator('main a[href="cgu.php"], section a[href="cgu.php"]').count();
  check('politique -> lien vers cgu', polToCgu >= 1, `count=${polToCgu}`);
  await page.goto(BASE + '/cgu.php', { waitUntil: 'domcontentloaded' });
  const cguToPol = await page.locator('main a[href="politique-confidentialite.php"], section a[href="politique-confidentialite.php"]').count();
  check('cgu -> lien vers politique', cguToPol >= 1, `count=${cguToPol}`);

  await browser.close();
  fs.writeFileSync('/root/Fedpawa/audit/l014_e2e_results.json', JSON.stringify(results, null, 2));
  console.log('\n=== TOTAL: ' + results.checks.length + ' checks, ' + results.failed.length + ' echecs ===');
  if (results.failed.length) { console.log(results.failed.join('\n')); process.exit(1); }
})().catch(e => { console.error('CRASH:', e.message); fs.writeFileSync('/root/Fedpawa/audit/l014_e2e_results.json', JSON.stringify({ crash: e.message, ...results }, null, 2)); process.exit(2); });
