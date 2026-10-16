// Lane #3 — E2E domiciliation multi-étapes + stepper
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
import { ensureLogin } from '/root/Fedpawa/test-lib.mjs';
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:18081';
const out = { cases: [] };
const check = (name, pass, info = '') => out.cases.push({ name, pass, info });

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0, 120)));
  page.on('console', m => { const loc = (m.location() && m.location().url) || ''; if (m.type() === 'error' && !loc.includes('favicon') && !/\b(401|400|500)\b/.test(m.text())) errors.push(m.text().slice(0, 120)); });

  await ensureLogin(page);
    await page.goto(BASE + '/souscription_domiciliation.php?pack=national-business', { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  // ==== A. Structure ====
  check('A1 stepper présent (6 points)', await page.evaluate(() => document.querySelectorAll('.progress-step[data-step]').length === 6));
  check('A2 6 contenus d\'étape', await page.evaluate(() => document.querySelectorAll('.tunnel-step-content[data-step]').length === 6));
  check('A3 étape 1 active au chargement', await page.evaluate(() => {
    const c = document.querySelector('.tunnel-step-content[data-step="1"]');
    return c && c.classList.contains('active');
  }));
  check('A4 étapes 2-5 masquées', await page.evaluate(() => Array.from(document.querySelectorAll('.tunnel-step-content[data-step]')).filter(el => Number(el.dataset.step) > 1 && el.classList.contains('active')).length === 0));
  // ?pack= présélectionne national-business toujours (pas cassé par le stepper)
  check('A5 ?pack= national-business présélectionné', await page.evaluate(() => document.getElementById('pack').value === 'national-business'));

  // ==== B. Navigation + validation par étape ====
  // B1: Continuer sans remplir -> reste sur étape 1 (dénomination manquante)
  await page.click('.tunnel-step-content.active button:has-text("Continuer")');
  await page.waitForTimeout(600);
  check('B1 étape vide -> reste étape 1 + message', await page.evaluate(() => document.querySelector('.tunnel-step-content[data-step="1"]').classList.contains('active') && document.getElementById('form-errors').style.display === 'block'));

  // B2: remplir étape 1 -> passe à 2
  await page.evaluate(() => {
    document.querySelector('input[name="statut_structure"][value="existante"]').checked = true;
    document.getElementById('denomination').value = 'TEST STEPPER SARL';
    document.getElementById('forme_juridique').value = 'SARL / SARLU';
    document.getElementById('rccm').value = 'RCCM/DL/2024/B/999';
    document.getElementById('niu').value = 'M999888777';
    document.getElementById('secteur').value = 'Technologie, Numérique & E-commerce';
    document.getElementById('description').value = 'Tests automatisés E2E.';
  });
  await page.click('.tunnel-step-content.active button:has-text("Continuer")');
  await page.waitForTimeout(600);
  check('B2 étape 1 valide -> étape 2 active', await page.evaluate(() => document.querySelector('.tunnel-step-content[data-step="2"]').classList.contains('active')));
  check('B2b stepper: point 1 complété', await page.evaluate(() => document.querySelector('.progress-step[data-step="1"]').classList.contains('completed')));

  // B3: étape 2 -> 3
  await page.evaluate(() => {
    document.getElementById('civilite').value = 'Monsieur';
    document.getElementById('nom_complet').value = 'Jean Test';
    document.getElementById('fonction').value = 'Gérant / Co-gérant';
    document.getElementById('nationalite').value = 'Camerounaise';
    document.getElementById('type_piece').value = 'Carte Nationale d\'Identité (CNI)';
    document.getElementById('num_piece').value = 'CNI123456';
  });
  await page.click('.tunnel-step-content.active button:has-text("Continuer")');
  await page.waitForTimeout(600);
  check('B3 étape 2 valide -> étape 3', await page.evaluate(() => document.querySelector('.tunnel-step-content[data-step="3"]').classList.contains('active')));

  // B4: étape 3 -> 4 (retour arrière aussi testé)
  await page.evaluate(() => {
    document.getElementById('email').value = 'stepper@test.cm';
    document.getElementById('telephone').value = '+237 600 000 001';
    document.getElementById('adresse').value = 'Logpom, Douala';
    document.getElementById('ville').value = 'Douala';
    document.getElementById('pays').value = 'Cameroun';
  });
  await page.click('.tunnel-step-content.active button:has-text("Continuer")');
  await page.waitForTimeout(600);
  check('B4 étape 3 valide -> étape 4', await page.evaluate(() => document.querySelector('.tunnel-step-content[data-step="4"]').classList.contains('active')));
  // retour
  await page.click('.tunnel-step-content.active button:has-text("Retour")');
  await page.waitForTimeout(500);
  check('B4b Retour -> étape 3', await page.evaluate(() => document.querySelector('.tunnel-step-content[data-step="3"]').classList.contains('active')));
  await page.click('.tunnel-step-content.active button:has-text("Continuer")');
  await page.waitForTimeout(500);

  // B5: étape 4 -> 5 (pack déjà présélectionné)
  await page.click('.tunnel-step-content.active button:has-text("Continuer")');
  await page.waitForTimeout(600);
  check('B5 étape 4 (pack ok) -> étape 5', await page.evaluate(() => document.querySelector('.tunnel-step-content[data-step="5"]').classList.contains('active')));

  // B6: soumission sans fichiers ni cases -> erreurs ciblées (pas de succès)
  const dialogs = [];
  page.on('dialog', async d => { dialogs.push(d.message().slice(0, 60)); await d.accept(); });
  await page.evaluate(() => { document.getElementById('domiciliationForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
  await page.waitForTimeout(700);
  const st = await page.evaluate(() => ({
    errorsShown: document.getElementById('form-errors').style.display === 'block',
    successShown: document.getElementById('form-success').style.display === 'block',
    errText: document.getElementById('form-errors').innerText.slice(0, 150)
  }));
  check('B6 soumission incomplète -> erreurs (identité/statuts/validations)', st.errorsShown && !st.successShown, st.errText);

  // clic sur point 1 du stepper (déjà complété) -> retour direct
  await page.click('.progress-step[data-step="1"]');
  await page.waitForTimeout(400);
  check('B7 clic stepper point 1 -> retour étape 1', await page.evaluate(() => document.querySelector('.tunnel-step-content[data-step="1"]').classList.contains('active')));

  // ==== C. Responsive ====
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(400);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('C1 mobile 375px: pas de débordement', ov <= 1, 'overflow=' + ov + 'px');
  await page.setViewportSize({ width: 320, height: 568 });
  await page.waitForTimeout(400);
  const ov2 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('C2 mobile 320px: pas de débordement', ov2 <= 1, 'overflow=' + ov2 + 'px');

  check('D1 0 erreur console', errors.length === 0, errors.slice(0, 2).join(' | '));

  const failed = out.cases.filter(c => !c.pass);
  console.log(JSON.stringify({ cases: out.cases, total: out.cases.length, failed: failed.length }, null, 1));
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message); process.exit(2); });
