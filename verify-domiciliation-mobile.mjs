
// Test mobile: en-tete compact au lieu du stepper complet
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
import { ensureLogin } from '/root/Fedpawa/test-lib.mjs';
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:18081';
const out = { cases: [] };
const check = (name, pass, info = '') => out.cases.push({ name, pass, info });
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  // ===== MOBILE 375px =====
  const m = await (await browser.newContext({ viewport: { width: 375, height: 667 } })).newPage();
  await ensureLogin(m);
  await m.goto(BASE + '/souscription_domiciliation.php?pack=national-business', { waitUntil: 'load' });
  await m.waitForTimeout(900);
  let r = await m.evaluate(() => ({
    fullStepperHidden: getComputedStyle(document.querySelector('#domStepper .progress-container')).display === 'none',
    mobileHeaderShown: getComputedStyle(document.querySelector('.dom-step-mobile')).display !== 'none',
    count: document.getElementById('domStepCount').textContent,
    title: document.getElementById('domStepTitle').textContent,
    fillWidth: document.getElementById('domStepFill').style.width,
    headerHeight: Math.round(document.querySelector('#domStepper').getBoundingClientRect().height)
  }));
  check('M1 mobile: stepper complet masqué', r.fullStepperHidden);
  check('M2 mobile: en-tête compact affiché', r.mobileHeaderShown, JSON.stringify(r));
  check('M3 compte "Étape 1/5" + titre "Entreprise"', r.count === 'Étape 1/5' && r.title === 'Entreprise', r.count + ' | ' + r.title);
  check('M4 en-tête compact (<= 90px de haut)', r.headerHeight <= 90, 'hauteur=' + r.headerHeight);

  // avancer jusqu'à étape 4 -> titre se met à jour
  await m.evaluate(() => {
    document.getElementById('denomination').value = 'MOBILE SARL';
    document.getElementById('forme_juridique').value = 'SARL / SARLU';
    document.getElementById('rccm').value = 'RCCM/DL/2024/B/1';
    document.getElementById('niu').value = 'M1';
    document.getElementById('secteur').value = 'Commerce et distribution';
    document.getElementById('description').value = 'x';
    document.querySelector('input[name="statut_structure"][value="existante"]').checked = true;
    window.domNext();
  });
  await m.waitForTimeout(400);
  await m.evaluate(() => {
    document.getElementById('civilite').value = 'Monsieur';
    document.getElementById('nom_complet').value = 'Mob Test';
    document.getElementById('fonction').value = 'Gérant / Co-gérant';
    document.getElementById('nationalite').value = 'Camerounaise';
    document.getElementById('type_piece').value = 'Carte Nationale d\'Identité (CNI)';
    document.getElementById('num_piece').value = '1';
    window.domNext();
  });
  await m.waitForTimeout(400);
  await m.evaluate(() => {
    document.getElementById('email').value = 'm@t.cm';
    document.getElementById('telephone').value = '+237 600 000 000';
    document.getElementById('adresse').value = 'a';
    document.getElementById('ville').value = 'Douala';
    document.getElementById('pays').value = 'Cameroun';
    window.domNext();
  });
  await m.waitForTimeout(500);
  r = await m.evaluate(() => ({
    count: document.getElementById('domStepCount').textContent,
    title: document.getElementById('domStepTitle').textContent,
    fill: document.getElementById('domStepFill').style.width
  }));
  check('M5 étape 4: "Étape 4/5" + "Formule" + barre 75%', r.count === 'Étape 4/5' && r.title === 'Formule' && r.fill === '75%', JSON.stringify(r));

  const ov = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('M6 pas de débordement 375px', ov <= 1, 'overflow=' + ov + 'px');

  // ===== 320px =====
  await m.setViewportSize({ width: 320, height: 568 });
  await m.waitForTimeout(400);
  r = await m.evaluate(() => ({
    hidden: getComputedStyle(document.querySelector('#domStepper .progress-container')).display === 'none',
    shown: getComputedStyle(document.querySelector('.dom-step-mobile')).display !== 'none',
    ov: document.documentElement.scrollWidth - document.documentElement.clientWidth
  }));
  check('M7 320px: en-tête compact, pas de débordement', r.hidden && r.shown && r.ov <= 1, JSON.stringify(r));

  // ===== DESKTOP: rien ne change =====
  const d = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await ensureLogin(d);
  await d.goto(BASE + '/souscription_domiciliation.php', { waitUntil: 'load' });
  await d.waitForTimeout(900);
  r = await d.evaluate(() => ({
    stepperShown: getComputedStyle(document.querySelector('#domStepper .progress-container')).display !== 'none',
    mobileHidden: getComputedStyle(document.querySelector('.dom-step-mobile')).display === 'none',
    dots: document.querySelectorAll('.progress-step[data-step]').length
  }));
  check('D1 desktop: stepper complet affiché (5 points)', r.stepperShown && r.mobileHidden && r.dots === 5, JSON.stringify(r));

  const failed = out.cases.filter(c => !c.pass);
  console.log(JSON.stringify({ cases: out.cases, total: out.cases.length, failed: failed.length }, null, 1));
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message); process.exit(2); });
