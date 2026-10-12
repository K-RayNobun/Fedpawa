// E2E Header desktop — boutons paramètres/profil, états connecté/non-connecté, tunnel, qui-sommes-nous
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = 'http://127.0.0.1:8099';

const results = [];
const t = (name, pass, info = '') => { results.push({ name, pass, info }); console.log((pass ? 'PASS' : 'FAIL') + ': ' + name + (info ? ' — ' + info : '')); };

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404|500|401/.test(m.text())) errors.push(m.text().slice(0, 120)); });

  // ===== (a) NON-CONNECTÉ =====
  await page.goto(BASE + '/creation_entreprise.php', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const st = await page.evaluate(() => {
    const vis = el => !!el && el.offsetWidth > 0 && el.offsetHeight > 0;
    return {
      settingsBtn: vis(document.querySelector('.nav-settings-btn')),
      profileBtn: vis(document.querySelector('.nav-profile-btn')),
      loginLink: vis(document.querySelector('.nav-login')),
      espaceClientBtn: vis(document.querySelector('.nav-espace-client')),
      themeToggleOld: vis(document.querySelector('.nav-actions .mode-toggle')),
      langToggleOld: vis(document.querySelector('.nav-actions .lang-toggle'))
    };
  });
  t('(a) non-connecté: bouton paramètres visible', st.settingsBtn, JSON.stringify(st));
  t('(a) non-connecté: PAS de bouton profil', !st.profileBtn);
  t('(a) non-connecté: lien Se connecter visible', st.loginLink);
  t('(a) non-connecté: PAS de bouton Espace Client', !st.espaceClientBtn);
  t('(a) non-connecté: anciens toggles retirés de la barre', !st.themeToggleOld && !st.langToggleOld);

  // Menu paramètres
  await page.click('.nav-settings-btn');
  await page.waitForTimeout(400);
  const menuOpen = await page.evaluate(() => { const m = document.querySelector('.settings-menu, .nav-settings-menu'); return m ? getComputedStyle(m).display !== 'none' && m.offsetWidth > 0 : false; });
  t('(a) clic paramètres -> menu visible', menuOpen);
  if (menuOpen) {
    const menuText = await page.evaluate(() => document.querySelector('.settings-menu, .nav-settings-menu').innerText);
    t('(a) menu: Thème présent', /Thème|Theme/i.test(menuText));
    t('(a) menu: Langue présente', /Langue|Language/i.test(menuText));
    // Sous-menu thème : chercher Jour/Nuit (peut nécessiter un clic)
    const themeAcc = await page.$('.settings-menu .settings-accordion-trigger');
    t('(a) accordéon Thème présent', !!themeAcc);
    if (themeAcc) { await themeAcc.click(); await page.waitForTimeout(300); }
    const themeOpts = await page.evaluate(() => { const m = document.querySelector('.settings-menu'); return m ? (m.innerText.includes('Jour') && m.innerText.includes('Nuit')) : false; });
    t('(a) sous-menu Thème: Jour/Nuit', themeOpts);
    // Cliquer Jour
    const jourOpt = await page.$('.settings-menu [data-mode="light"], .settings-menu .theme-option[data-mode], .nav-settings-menu [data-mode="light"]');
    if (jourOpt) { await jourOpt.click(); await page.waitForTimeout(300); }
    const modeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-mode') || document.documentElement.getAttribute('data-theme'));
    t('(a) clic Jour -> mode clair appliqué', modeAfter === 'light' || modeAfter === 'bordeaux', 'mode=' + modeAfter);
    // Langue : rouvrir le menu puis déplier l'accordéon Langue
    await page.click('.nav-settings-btn');
    await page.waitForTimeout(300);
    const langAccs = await page.$$('.settings-menu .settings-accordion-trigger');
    t('(a) 2 accordéons (Thème, Langue)', langAccs.length === 2, 'compté=' + langAccs.length);
    if (langAccs.length >= 2) { await langAccs[1].click(); await page.waitForTimeout(300); }
    const langOpts = await page.evaluate(() => { const m = document.querySelector('.settings-menu'); return m ? (m.innerText.includes('Français') && m.innerText.includes('English')) : false; });
    t('(a) sous-menu Langue: FR/EN', langOpts);
    // Échap
    const isOpenBefore = await page.evaluate(() => document.querySelector('.settings-menu').classList.contains('open'));
    if (!isOpenBefore) { await page.click('.nav-settings-btn'); }
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const closedByEsc = await page.evaluate(() => { const m = document.querySelector('.settings-menu, .nav-settings-menu'); return m ? !m.classList.contains('open') : true; });
    t('(a) Échap ferme le menu', closedByEsc);
  }

  // ===== (b) CONNECTÉ =====
  const email = `hdr_${Date.now()}@test-fedpawa.cm`;
  const pw = 'TestPass123';
  const reg = await page.evaluate(async ({ email, pw }) => {
    const r1 = await fetch(apiUrl('/api/register'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nom: 'Hdr Test', entreprise: 'HdrCo', email, telephone: '+237600000010', mot_de_passe: pw }) });
    const r2 = await fetch(apiUrl('/api/login'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, mot_de_passe: pw }) });
    return { reg: r1.status, login: r2.status };
  }, { email, pw });
  t('(b) register+login API', reg.reg === 200 && reg.login === 200, `reg=${reg.reg} login=${reg.login}`);
  await page.goto(BASE + '/creation_entreprise.php', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const st2 = await page.evaluate(() => {
    const vis = el => !!el && el.offsetWidth > 0 && el.offsetHeight > 0;
    return { settingsBtn: vis(document.querySelector('.nav-settings-btn')), profileBtn: vis(document.querySelector('.nav-profile-btn')), loginLink: vis(document.querySelector('.nav-login')), espaceClient: vis(document.querySelector('.nav-espace-client')) };
  });
  t('(b) connecté: bouton Espace Client visible', st2.espaceClient, JSON.stringify(st2));
  t('(b) connecté: bouton profil visible', st2.profileBtn);
  t('(b) connecté: PAS de bouton paramètres', !st2.settingsBtn);
  const noAuthLink = await page.evaluate(() => ![...document.querySelectorAll('#navActions a')].some(a => a.href.includes('authentification')));
  t('(b) connecté: aucun lien vers authentification', noAuthLink);
  if (st2.profileBtn) {
    await page.click('.nav-profile-btn');
    await page.waitForTimeout(400);
    const pm = await page.evaluate(() => { const m = document.querySelector('.profile-menu, .nav-profile-menu'); return m ? { visible: m.offsetWidth > 0, text: m.innerText.replace(/\s+/g, ' ').slice(0, 200) } : null; });
    t('(b) menu profil ouvert', pm && pm.visible, pm ? pm.text : 'introuvable');
    if (pm && pm.visible) {
      t('(b) menu: Mon Espace', pm.text.includes('Mon Espace'));
      t('(b) menu: Se déconnecter', /déconnecter|Déconnecter/.test(pm.text));
      t('(b) menu: Thème', /Thème|Theme/i.test(pm.text));
      t('(b) menu: Langue', /Langue|Language/i.test(pm.text));
      const logoutBtn = await page.$('.profile-logout-btn');
      if (logoutBtn) {
        await logoutBtn.click();
        await page.waitForTimeout(4000);
        const st3 = await page.evaluate(() => {
          const vis = el => !!el && el.offsetWidth > 0 && el.offsetHeight > 0;
          return { loginBack: vis(document.querySelector('.nav-login')), profileGone: !vis(document.querySelector('.nav-profile-btn')) };
        });
        t('(b) déconnexion -> variante non-connectée', st3.loginBack && st3.profileGone, JSON.stringify(st3));
      } else { t('(b) bouton déconnexion cliquable', false, 'sélecteur introuvable'); }
    }
  }

  // ===== (c) tunnel: une seule barre =====
  await page.goto(BASE + '/tunnel_souscription.php', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const headers = await page.evaluate(() => document.querySelectorAll('header').length);
  t('(c) tunnel: 1 seul <header>', headers === 1, 'compté=' + headers);

  // ===== (d) qui-sommes-nous: placeholders + lightbox =====
  await page.goto(BASE + '/qui-sommes-nous.php', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  // déclencher le lazy-loading: scroller toute la page
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); }
  });
  await page.waitForTimeout(2500);
  const gal = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('.gallery img, .photo-gallery img, img[src*="photo_"]')];
    return { count: imgs.length, allSvg: imgs.length > 0 && imgs.every(i => i.src.endsWith('.svg')), broken: imgs.filter(i => i.naturalWidth === 0).length };
  });
  t('(d) qui-sommes-nous: placeholders SVG', gal.count > 0 && gal.allSvg && gal.broken === 0, `${gal.count} img, ${gal.broken} cassées`);
  const firstImg = await page.$('.gallery-item');
  if (firstImg) {
    await page.evaluate(() => document.querySelector('.gallery-item img').click());
    await page.waitForTimeout(700);
    const lb = await page.evaluate(() => { const l = document.querySelector('.lightbox, .lightbox-overlay, [class*="lightbox"]'); return l ? getComputedStyle(l).display !== 'none' && l.offsetWidth > 0 : false; });
    t('(d) lightbox OK sur placeholder', lb);
  }

  t('(f) 0 erreur console', errors.length === 0, errors.slice(0, 3).join(' || '));

  const failed = results.filter(r => !r.pass).length;
  console.log(`\n=== BILAN: ${results.length - failed}/${results.length} PASS ===`);
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message); process.exit(2); });
