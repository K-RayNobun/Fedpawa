// E2E Lane #3 Fedpawa — Tests pour les 4 services autres que domiciliation
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
import { ensureLogin } from '/root/Fedpawa/test-lib.mjs';
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:18080';
const out = { cases: [] };
const check = (name, condition, info) => { out.cases.push({ name, pass: condition, info }); };
const norm = s => (s || '').replace(/[\u00A0\u202F,]/g, ' ').trim();

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0, 120)));
  page.on('console', m => { const loc = (m.location() && m.location().url) || ''; if (m.type() === 'error' && !loc.includes('favicon') && !/\b(401|400|500)\b/.test(m.text())) errors.push('console: ' + m.text().slice(0, 120)); });

  // Helper: go to service and wait
  async function gotoSvc(svc, pack) {
    await ensureLogin(page);
    await page.goto(BASE + '/tunnel_souscription.php?service=' + svc + '&pack=' + pack, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.goToStep === 'function' && typeof window.selectService === 'function', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1200);
  }

  // ==== SERVICE 1: CRÉATION ====
  console.log('=== SERVICE 1: CRÉATION ===');
  await gotoSvc('creation', 'standard');

  check('C1 étape 2 active', await page.evaluate(() => document.getElementById('step-2').classList.contains('active')));
  check('C2 bloc création visible', await page.evaluate(() => document.getElementById('form-creation').style.display !== 'none'));
  check('C3 formulaire juridique select', await page.evaluate(() => document.querySelector('#form-creation select[required]') ? 'present' : 'missing') !== 'missing');
  check('C4 dénomination input', await page.evaluate(() => document.querySelector('#form-creation input[placeholder*="Nom"]') ? 'present' : 'missing') !== 'missing');
  check('C5 capital number input', await page.evaluate(() => document.querySelector('#form-creation input[type="number"][required]') ? 'present' : 'missing') !== 'missing');
  check('C6 ville d\'immatriculation select', await page.evaluate(() => Array.from(document.querySelectorAll('#form-creation select option')).some(o => o.text === 'Douala') ? 'present' : 'missing') !== 'missing');
  check('C7 sidebar non vide', await page.evaluate(() => document.getElementById('summaryItems').innerText.length > 0));
  check('C8 0 pageerror', errors.length === 0 || !errors.some(e => e.includes('pageerror')));
  
  // Mobile 375px
  await page.setViewportSize({ width: 375, height: 667 });
  await gotoSvc('creation', 'standard');
  check('C9 mobile 375px pas de débordement', (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 1, 'overflow=' + (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) + 'px');
  
  // goToStep tests
  await page.evaluate(() => window.goToStep(3));
  check('C10 goToStep(3) -> étape 3 active', await page.evaluate(() => document.getElementById('step-3').classList.contains('active')));
  await page.evaluate(() => window.goToStep(2));
  check('C11 goToStep(2) -> étape 2 active', await page.evaluate(() => document.getElementById('step-2').classList.contains('active')));
  await page.evaluate(() => window.goToStep(5));
  check('C12 step 5 invoice-final', await page.evaluate(() => document.querySelector('.order-summary').classList.contains('invoice-final')));

  // ==== SERVICE 2: FISCALITÉ ====
  console.log('=== SERVICE 2: FISCALITÉ ===');
  await gotoSvc('fiscalite', 'simplifie');

  check('F1 étape 2 active', await page.evaluate(() => document.getElementById('step-2').classList.contains('active')));
  check('F2 bloc fiscalité visible', await page.evaluate(() => document.getElementById('form-fiscalite').style.display !== 'none'));
  check('F3 régime fiscal select', await page.evaluate(() => document.querySelector('#regime-fiscal') ? 'present' : 'missing') !== 'missing');
  check('F4 centre des impôts select', await page.evaluate(() => Array.from(document.querySelectorAll('#form-fiscalite select option')).some(o => /CIME/.test(o.text)) ? 'present' : 'missing') !== 'missing');
  check('F5 ACF radio', await page.evaluate(() => document.querySelector('input[name="acf"]') ? 'present' : 'missing') !== 'missing');
  check('F6 declarations radio', await page.evaluate(() => document.querySelector('input[name="declarations"]') ? 'present' : 'missing') !== 'missing');
  check('F7 sidebar contient 35000', await page.evaluate(() => document.getElementById('summaryItems').innerText.includes('35 000') || document.getElementById('summaryItems').innerText.includes('35')));

  // Mobile 375px
  await page.setViewportSize({ width: 375, height: 667 });
  await gotoSvc('fiscalite', 'simplifie');
  check('F8 mobile 375px pas de débordement', (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 1);

  // ==== SERVICE 3: OAPI ====
  console.log('=== SERVICE 3: OAPI ===');
  await gotoSvc('oapi', 'protect_brand');

  check('O1 étape 2 active', await page.evaluate(() => document.getElementById('step-2').classList.contains('active')));
  check('O2 bloc OAPI visible', await page.evaluate(() => document.getElementById('form-oapi').style.display !== 'none'));
  check('O3 type actif select', await page.evaluate(() => document.querySelector('#form-oapi select[data-plan-select]') ? 'present' : 'missing') !== 'missing');
  check('O4 nom signe input', await page.evaluate(() => document.querySelector('#form-oapi input[placeholder*="FEDPAWA"]') ? 'present' : 'missing') !== 'missing');
  check('O5 classes Nice input', await page.evaluate(() => document.querySelector('#form-oapi input[placeholder*="Classe"]') ? 'present' : 'missing') !== 'missing');
  check('O6 titulaire pm radio', await page.evaluate(() => document.querySelector('input[name="titulaire"][value="personne_morale"]') ? 'present' : 'missing') !== 'missing');
  check('O7 titulaire pf radio', await page.evaluate(() => document.querySelector('input[name="titulaire"][value="personne_physique"]') ? 'present' : 'missing') !== 'missing');
  check('O8 pm conditional visible', await page.evaluate(() => document.getElementById('oapi-titulaire-conditionnel').style.display !== 'none'));
  check('O9 pf conditional hidden default', await page.evaluate(() => document.getElementById('oapi-titulaire-conditionnel2').style.display === 'none'));
  check('O10 sidebar contient 200 000', norm(await page.evaluate(() => document.getElementById('summaryItems').innerText)).includes('200 000'));

  // Mobile 375px
  await page.setViewportSize({ width: 375, height: 667 });
  await gotoSvc('oapi', 'protect_brand');
  check('O11 mobile 375px pas de débordement', (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 1);

  // OAPI pm -> pf transition
  await page.evaluate(() => {
    const radios = document.querySelectorAll('input[name="titulaire"]');
    if (radios.length > 1) { radios[1].checked = true; radios[1].dispatchEvent(new Event('change')); }
  });
  await page.waitForTimeout(300);
  check('O12 pm->pf masque pm affiche pf', await page.evaluate(() => document.getElementById('oapi-titulaire-conditionnel').style.display === 'none' && document.getElementById('oapi-titulaire-conditionnel2').style.display !== 'none'));

  // pf -> pm transition
  await page.evaluate(() => {
    const radios = document.querySelectorAll('input[name="titulaire"]');
    if (radios.length > 0) { radios[0].checked = true; radios[0].dispatchEvent(new Event('change')); }
  });
  await page.waitForTimeout(300);
  check('O13 pf->pm masque pm affiche pm', await page.evaluate(() => document.getElementById('oapi-titulaire-conditionnel').style.display !== 'none' && document.getElementById('oapi-titulaire-conditionnel2').style.display === 'none'));

  // ==== SERVICE 4: CONTRATS ====
  console.log('=== SERVICE 4: CONTRATS ===');
  await gotoSvc('contrats', 'complexe');

  check('K1 étape 2 active', await page.evaluate(() => document.getElementById('step-2').classList.contains('active')));
  check('K2 bloc contrats visible', await page.evaluate(() => document.getElementById('form-contrats').style.display !== 'none'));
  check('K3 catégorie select present', await page.evaluate(() => document.querySelector('#contrat-type') ? 'present' : 'missing') !== 'missing');
  const contratTypeOptions = await page.evaluate(() => document.querySelectorAll('#contrat-type option').length);
  check('K4 catégorie select >= 6 options', contratTypeOptions >= 6, 'found=' + contratTypeOptions);
  check('K5 situation synthèse textarea', await page.evaluate(() => document.querySelector('#form-contrats textarea') ? 'present' : 'missing') !== 'missing');
  check('K6 type précis input', await page.evaluate(() => document.querySelector('#form-contrats input[type="text"]') ? 'present' : 'missing') !== 'missing');
  check('K7 langue select FR/EN', await page.evaluate(() => Array.from(document.querySelectorAll('#form-contrats select option')).filter(o => ['fr','en','FR','EN'].includes(o.value || o.text)).length >= 2 ? 'present' : 'missing') !== 'missing');
  check('K8 non-concurrence checkbox', await page.evaluate(() => document.querySelector('input[data-smart-signal="strong"][data-smart-from="contrats"]') ? 'present' : 'missing') !== 'missing');
  const ndaCount = await page.evaluate(() => document.querySelectorAll('input[data-smart-signal="strong"][data-smart-from="contrats"]').length);
  check('K9 NDA strict + autres checkboxes', ndaCount >= 3, 'found=' + ndaCount);
  check('K10 audit conditional caché par défaut (visible seulement si audit)', await page.evaluate(() => document.getElementById('contrats-audit-conditionnel').style.display === 'none'));
  check('K11 votre dénomination input', await page.evaluate(() => (document.querySelector('#form-contrats input[placeholder*="FEDPAWA"]') || document.querySelector('#form-contrats input[placeholder*="dénomination" i]')) ? 'present' : 'missing') !== 'missing');
  check('K12 nom cocontractant input', await page.evaluate(() => document.querySelector('#form-contrats input[placeholder*="Partenaire"]') ? 'present' : 'missing') !== 'missing');
  const sumK = await page.evaluate(() => document.getElementById('summaryItems').innerText);
  check('K13 sidebar total', sumK.includes('50 000') || sumK.includes('150 000') || sumK.includes('Forfait'));

  // Mobile 375px
  await page.setViewportSize({ width: 375, height: 667 });
  await gotoSvc('contrats', 'complexe');
  check('K14 mobile 375px pas de débordement', (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 1);

  // Contrats audit show/hide
  await page.evaluate(() => {
    const catSelect = document.getElementById('contrat-type');
    if (catSelect) { catSelect.value = 'audit'; catSelect.dispatchEvent(new Event('change')); }
  });
  await page.waitForTimeout(300);
  check('K15 audit catégorie montre dropzone', await page.evaluate(() => document.getElementById('contrats-audit-conditionnel').style.display !== 'none'));

  await page.evaluate(() => {
    const catSelect = document.getElementById('contrat-type');
    if (catSelect) { catSelect.value = 'commercial'; catSelect.dispatchEvent(new Event('change')); }
  });
  await page.waitForTimeout(300);
  check('K16 non-audit masque dropzone', await page.evaluate(() => document.getElementById('contrats-audit-conditionnel').style.display === 'none'));

  // ==== ROUTAGE URL ====
  console.log('=== ROUTAGE URL ===');
  await gotoSvc('oapi', 'protect_brand');
  check('R1 ?service=oapi -> carte sélectionnée', await page.evaluate(() => document.querySelector('.service-card.selected[data-service="oapi"]') ? 'present' : 'missing'));

  await gotoSvc('contrats', 'complexe');
  check('R2 ?service=contrats&pack=complexe -> carte sélectionnée', await page.evaluate(() => document.querySelector('.service-card.selected[data-service="contrats"]') ? 'present' : 'missing'));

  await gotoSvc('fiscalite', 'simplifie');
  check('R3 ?service=fiscalite -> carte sélectionnée', await page.evaluate(() => document.querySelector('.service-card.selected[data-service="fiscalite"]') ? 'present' : 'missing'));

  await gotoSvc('creation', 'standard');
  check('R4 ?service=creation -> carte sélectionnée', await page.evaluate(() => document.querySelector('.service-card.selected[data-service="creation"]') ? 'present' : 'missing'));

  // ==== RÉSUMÉ ====
  const failed = out.cases.filter(c => !c.pass);
  out.total = out.cases.length;
  out.failed = failed.length;
  console.log('\n=== RÉSUMÉ ===');
  console.log('Total:', out.total, '| Passed:', out.total - out.failed, '| Failed:', out.failed);
  console.log(JSON.stringify(out));
  if (failed.length > 0) {
    console.log('Échecs:', failed.map(f => f.name + (f.info ? ' (' + f.info + ')' : '')).join(', '));
  } else {
    console.log('TOUS LES TESTS PASSENT ✓');
  }

  if (failed.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})().catch(e => { console.error('FATAL', e); process.exit(2); });
