
// E2E étape 4 redessinée: dropdown pack dynamique + panneau détail + select pays 195
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
  page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
  page.on('console', m => { const loc = (m.location() && m.location().url) || ''; if (m.type() === 'error' && !loc.includes('favicon') && !/\b(401|400|500)\b/.test(m.text())) errors.push(m.text().slice(0, 120)); });

  await ensureLogin(page);
    await page.goto(BASE + '/souscription_domiciliation.php', { waitUntil: 'load' });
  await page.waitForTimeout(900);

  // ==== A. Cartes gamme sans prix en texte (étape 4 via navigation directe) ====
  await page.evaluate(() => window.goToStep(4));
  await page.waitForTimeout(400);
  const gammeTxt = await page.evaluate(() => document.getElementById('gamme-nationale').innerText + document.getElementById('gamme-internationale').innerText);
  check('A1 cartes gamme: aucun prix en texte', !/\d\s*(F|FCFA|\$)/.test(gammeTxt.replace(/25\s*000/g, '').replace(/\d/g, '')) || !/(FCFA|USD|\$)/.test(gammeTxt), gammeTxt.slice(0, 100));
  check('A2 pas de prix 25 000/45 000/70 000 dans les cartes', !/(25\s?000|45\s?000|70\s?000|88\s?\$|180\s?\$|290\s?\$)/.test(gammeTxt));

  // ==== B. Dropdown pack + panneau dynamique ====
  const state0 = await page.evaluate(() => ({ pack: document.getElementById('pack').value, detail: document.getElementById('packDetail').style.display }));
  check('B1 pack vide par défaut, panneau caché', state0.pack === '' && state0.detail === 'none', JSON.stringify(state0));
  const optionsNat = await page.evaluate(() => {
    const og = document.querySelector('#pack optgroup[data-gamme="nationale"]');
    return Array.from(og.querySelectorAll('option')).map(o => o.textContent);
  });
  check('B2 options nationales sans prix dans le libellé', optionsNat.join('|').includes('ESSENTIAL') && !optionsNat.join('|').includes('FCFA'), optionsNat.join(' | '));

  // choisir Pack BUSINESS -> panneau apparaît avec les bonnes features
  await page.selectOption('#pack', 'national-business');
  await page.waitForTimeout(400);
  const d1 = await page.evaluate(() => ({
    shown: document.getElementById('packDetail').style.display === 'block',
    name: document.getElementById('pdName').textContent,
    price: document.getElementById('pdPrice').textContent,
    badge: document.getElementById('pdBadge').textContent,
    nFeat: document.querySelectorAll('#pdFeatures li').length,
    has10h: document.getElementById('pdFeatures').innerText.includes('10 heures')
  }));
  check('B3 panneau BUSINESS: nom + prix + badge', d1.shown && d1.name === 'Pack BUSINESS' && d1.price.includes('45') && d1.badge === 'Nationale', JSON.stringify(d1));
  check('B4 features BUSINESS (10 heures bureau)', d1.nFeat === 7 && d1.has10h, 'n=' + d1.nFeat);

  // changer de pack -> le panneau change
  await page.selectOption('#pack', 'international-premium');
  await page.waitForTimeout(400);
  const d2 = await page.evaluate(() => ({
    name: document.getElementById('pdName').textContent,
    usd: document.getElementById('pdUsd').textContent,
    price: document.getElementById('pdPrice').textContent,
    badge: document.getElementById('pdBadge').textContent,
    nFeat: document.querySelectorAll('#pdFeatures li').length
  }));
  check('B5 switch PREMIUM EXECUTIVE: nom + USD + badge Prestige', d2.name === 'PREMIUM EXECUTIVE' && d2.usd.includes('290') && d2.badge === 'Prestige', JSON.stringify(d2));
  check('B6 12 features Premium Executive', d2.nFeat === 12, 'n=' + d2.nFeat);
  check('B7 prix 175 000 dans le panneau', d2.price.includes('175'), d2.price);

  // ==== C. Select pays ====
  const pays = await page.evaluate(() => ({
    tag: document.getElementById('pays').tagName,
    n: document.querySelectorAll('#pays option').length,
    sel: document.getElementById('pays').value,
    hasVenezuela: !!document.querySelector('#pays option[value="Venezuela"]'),
    hasZimbabwe: !!document.querySelector('#pays option[value="Zimbabwe"]'),
    first: document.querySelectorAll('#pays option')[1].value
  }));
  check('C1 pays = <select>', pays.tag === 'SELECT');
  check('C2 ~195 pays', pays.n >= 190, 'n=' + pays.n);
  check('C3 Cameroun sélectionné par défaut, en tête', pays.sel === 'Cameroun' && pays.first === 'Cameroun', pays.sel + '/' + pays.first);
  check('C4 couverture A->Z (Venezuela, Zimbabwe)', pays.hasVenezuela && pays.hasZimbabwe);
  // tri alphabétique (après le Cameroun en tête)
  const sortedOk = await page.evaluate(() => {
    const arr = Array.from(document.querySelectorAll('#pays option')).slice(2).map(o => o.value);
    const sorted = [...arr].sort((a, b) => a.localeCompare(b, 'fr'));
    return arr.length === sorted.length && arr.every((v, i) => v === sorted[i]);
  });
  check('C5 liste triée alphabétiquement', sortedOk);

  // ==== D. Régression ?pack= toujours fonctionnel ====
  await page.goto(BASE + '/souscription_domiciliation.php?pack=national-business', { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.evaluate(() => window.goToStep(4));
  await page.waitForTimeout(400);
  const r0 = await page.evaluate(() => ({
    pack: document.getElementById('pack').value,
    detail: document.getElementById('packDetail').style.display,
    sum: document.getElementById('sum-monthly').textContent,
    total: document.getElementById('summaryTotal').textContent
  }));
  check('D1 ?pack= national-business: présélection + panneau + récap', r0.pack === 'national-business' && r0.detail === 'block' && r0.sum.includes('45') && r0.total.includes('45'), JSON.stringify(r0));

  // ==== E. Mobile pas de débordement ====
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(400);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('E1 mobile 375px pas de débordement', ov <= 1, 'overflow=' + ov + 'px');

  check('F1 0 erreur console', errors.length === 0, errors.slice(0, 2).join(' | '));

  const failed = out.cases.filter(c => !c.pass);
  console.log(JSON.stringify({ cases: out.cases, total: out.cases.length, failed: failed.length }, null, 1));
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message); process.exit(2); });
