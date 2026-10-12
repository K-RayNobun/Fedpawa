// E2E tunnel dynamique Fedpawa — service + pack pré-remplis
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
import { ensureLogin } from '/root/Fedpawa/test-lib.mjs';
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';

const BASE = process.argv[2] || 'http://127.0.0.1:8097';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await ensureLogin(page);
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') { const loc = (m.location() && m.location().url) || ''; if (!loc.includes('favicon') && !/\b401\b/.test(m.text())) errors.push('console: ' + m.text() + ' @ ' + loc); } });

  const norm = s => s.replace(/[\u00A0\u202F,]/g, ' ');
  const results = {};
  const fail = [];

  async function check(name, url, assertions) {
    await page.goto(BASE + url, { waitUntil: 'domcontentloaded' });
    const r = await assertions();
    results[name] = r;
    if (r.pass !== true) fail.push(name + ' -> ' + JSON.stringify(r));
  }

  // 1. OAPI protect_brand : pré-sélection + prix 200 000
  await check('oapi-protect-brand', '/tunnel_souscription.php?service=oapi&pack=protect_brand', async () => {
    const cardSelected = await page.evaluate(() => document.querySelector('[data-service="oapi"]').classList.contains('selected'));
    const summary = await page.evaluate(() => document.getElementById('summaryItems').innerText);
    const total = await page.evaluate(() => document.getElementById('summaryTotal').innerText);
    const formVisible = await page.evaluate(() => document.getElementById('form-oapi').style.display);
    const pass = cardSelected && summary.includes('Forfait Protect Brand & Tech') && norm(total) === '204 000 FCFA' && formVisible === 'block';
    return { pass, cardSelected, total, formVisible, hasLabel: summary.includes('Protect Brand') };
  });

  // 2. Contrats complexe : 150 000 -> 153 000 avec frais
  await check('contrats-complexe', '/tunnel_souscription.php?service=contrats&pack=complexe', async () => {
    const summary = await page.evaluate(() => document.getElementById('summaryItems').innerText);
    const total = await page.evaluate(() => document.getElementById('summaryTotal').innerText);
    const formVisible = await page.evaluate(() => document.getElementById('form-contrats').style.display);
    const pass = summary.includes('Acte Complexe') && norm(total) === '153 000 FCFA' && formVisible === 'block';
    return { pass, total, hasLabel: summary.includes('Complexe') };
  });

  // 3. Fiscalité simplifié : 35 000/mois -> 35 700
  await check('fiscalite-simplifie', '/tunnel_souscription.php?service=fiscalite&pack=simplifie', async () => {
    const total = await page.evaluate(() => document.getElementById('summaryTotal').innerText);
    const summary = await page.evaluate(() => document.getElementById('summaryItems').innerText);
    const pass = norm(total) === '35 700 FCFA' && summary.includes('/ mois');
    return { pass, total };
  });

  // 4. Domiciliation national-business : route désormais vers le formulaire dédié (souscription_domiciliation.php)
  await check('domiciliation-national-business', '/souscription_domiciliation.php?pack=national-business', async () => {
    const total = await page.evaluate(() => document.getElementById('summaryTotal')?.innerText || document.querySelector('.tunnel-total, .invoice-total, #invoiceTotal')?.innerText || '');
    const selVal = await page.evaluate(() => document.getElementById('pack')?.value || '');
    const pass = norm(total) === '45 000 FCFA' && selVal === 'national-business'; // panier dédié affiche le HT; les frais 2% apparaissent à la facture finale
    return { pass, info: 'total=' + norm(total) + ' select=' + selVal };
  });

  // 5. Sur devis (OAPI brevets) : pas de total chiffré
  await check('oapi-brevets-devis', '/tunnel_souscription.php?service=oapi&pack=brevets', async () => {
    const total = await page.evaluate(() => document.getElementById('summaryTotal').innerText);
    const btn = await page.evaluate(() => document.getElementById('finalPayBtn').innerText);
    const pass = total === 'Sur devis' && btn.includes('devis');
    return { pass, total, btn };
  });

  // 6. Sans paramètre : rien de présélectionné
  await check('no-params', '/tunnel_souscription.php', async () => {
    const n = await page.evaluate(() => document.querySelectorAll('.service-card.selected').length);
    const total = await page.evaluate(() => document.getElementById('summaryTotal').innerText);
    const pass = n === 0 && total === '0 FCFA';
    return { pass, selectedCount: n, total };
  });

  // 7. Changement manuel de pack (domiciliation) : le select du formulaire dédié met à jour le total
  await check('manual-pack-change', '/souscription_domiciliation.php?pack=national-essential', async () => {
    const before = norm(await page.evaluate(() => document.getElementById('summaryTotal')?.innerText || ''));
    await page.evaluate(() => {
      const sel = document.getElementById('pack');
      if (sel) { sel.value = 'national-business'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    await page.waitForTimeout(600);
    const after = norm(await page.evaluate(() => document.getElementById('summaryTotal')?.innerText || ''));
    const pass = before !== after && after === '45 000 FCFA'; // le panier dédié suit le select pack (HT)
    return { pass, info: 'avant=' + before + ' apres=' + after };
  });

  // 8. Carte Recouvrement présente + clic fonctionne
  await check('recouvrement-card', '/tunnel_souscription.php', async () => {
    await page.click('[data-service="recouvrement"]');
    const formVisible = await page.evaluate(() => document.getElementById('form-recouvrement').style.display);
    const total = await page.evaluate(() => document.getElementById('summaryTotal').innerText);
    const pass = formVisible === 'block' && total === 'Sur devis';
    return { pass, formVisible, total };
  });

  console.log(JSON.stringify({ results, errors, failCount: fail.length, fail }, null, 2));
  await browser.close();
  process.exit(fail.length === 0 && errors.length === 0 ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
