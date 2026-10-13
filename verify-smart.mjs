// E2E détection smart — signaux subtils du tunnel Fedpawa
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
import { ensureLogin } from '/root/Fedpawa/test-lib.mjs';
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:8097';
const norm = s => s.replace(/[\u00A0\u202F,]/g, ' ');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await ensureLogin(page);
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') { const loc = (m.location() && m.location().url) || ''; if (!loc.includes('favicon') && !/\b401\b/.test(m.text())) errors.push('console: ' + m.text() + ' @ ' + loc); } });

  const results = {};
  const fail = [];
  async function openTunnel(url) {
    await page.goto(BASE + url, { waitUntil: 'domcontentloaded' });
    const isDedicated = url.includes('souscription_domiciliation');
    await page.waitForTimeout(isDedicated ? 1200 : 300);
    if (!isDedicated) { try { await page.evaluate(() => goToStep(1)); } catch (e) {} }
  }

  async function check(name, fn) {
    const r = await fn();
    results[name] = r;
    if (r.pass !== true) fail.push(name);
  }

  // 1. FORT SIGNAL domiciliation : optin RCCM/NIU -> modal
  await check('dom-optin-modal', async () => {
    await openTunnel('/souscription_domiciliation.php?pack=national-business');
    await page.check('#opt-no-immat');
    const visible = await page.evaluate(() => document.getElementById('smart-modal-overlay').style.display);
    const text = await page.evaluate(() => document.getElementById('smart-modal-text').innerText);
    return { pass: visible === 'flex' && text.includes('RCCM'), visible, text: text.slice(0, 60) };
  });

  // 1b. bouton Oui -> redirige vers creation_entreprise.php
  await check('dom-modal-yes-redirects', async () => {
    await openTunnel('/souscription_domiciliation.php?pack=national-business');
    await page.check('#opt-no-immat');
    await Promise.all([page.waitForNavigation(), page.click('#smart-modal-yes')]);
    const url = page.url();
    return { pass: url.includes('creation_entreprise.php'), url: url.split('/').pop() };
  });

  // 1c. bouton Non -> modal fermé, tunnel intact
  await check('dom-modal-no-dismiss', async () => {
    await openTunnel('/souscription_domiciliation.php?pack=national-business');
    await page.check('#opt-no-immat');
    await page.click('#smart-modal-no');
    const display = await page.evaluate(() => document.getElementById('smart-modal-overlay').style.display);
    const total = norm(await page.evaluate(() => document.getElementById('summaryTotal').innerText));
    return { pass: display === 'none' && total === '45 000 FCFA', display, total }; // panier dédié = HT
  });

  // 2. FORT SIGNAL fiscalité : optin NIU -> modal (message NIU)
  await check('fiscal-optin-modal', async () => {
    await openTunnel('/tunnel_souscription.php?service=fiscalite&pack=simplifie');
    await page.check('#opt-no-niu-fiscal');
    const visible = await page.evaluate(() => document.getElementById('smart-modal-overlay').style.display);
    const text = await page.evaluate(() => document.getElementById('smart-modal-text').innerText);
    return { pass: visible === 'flex' && text.includes('NIU'), visible, text: text.slice(0, 60) };
  });

  // 3. FAIBLE SIGNAL contrats : Statuts & pactes -> bannière Création
  await check('contrats-soft-banner', async () => {
    await openTunnel('/tunnel_souscription.php?service=contrats&pack=standard');
    await page.selectOption('#contrat-type', 'statuts');
    const shown = await page.evaluate(() => document.getElementById('smart-banner').style.display);
    const link = await page.evaluate(() => document.getElementById('smart-banner-link').getAttribute('href'));
    return { pass: shown === 'block' && link === 'creation_entreprise.php', shown, link };
  });

  // 3b. FAIBLE SIGNAL contrats : Bail -> bannière Domiciliation
  await check('contrats-soft-bail-banner', async () => {
    await openTunnel('/tunnel_souscription.php?service=contrats&pack=standard');
    await page.selectOption('#contrat-type', 'bail');
    const shown = await page.evaluate(() => document.getElementById('smart-banner').style.display);
    const link = await page.evaluate(() => document.getElementById('smart-banner-link').getAttribute('href'));
    const text = await page.evaluate(() => document.getElementById('smart-banner-text').innerText);
    return { pass: shown === 'block' && link === 'domiciliation.php' && text.includes('25 000'), shown, link };
  });

  // 3c. option normale -> pas de bannière
  await check('contrats-no-banner', async () => {
    await openTunnel('/tunnel_souscription.php?service=contrats&pack=standard');
    await page.selectOption('#contrat-type', 'commercial');
    const shown = await page.evaluate(() => document.getElementById('smart-banner').style.display);
    return { pass: shown === 'none', shown };
  });

  // 4. FAIBLE SIGNAL fiscalité : régime Nouveau -> bannière Création
  await check('fiscal-soft-nouveau-banner', async () => {
    await openTunnel('/tunnel_souscription.php?service=fiscalite&pack=simplifie');
    const sel = await page.$('#regime-fiscal');
    await sel.selectOption({ index: 2 }); // Nouveau/Non attribué
    const shown = await page.evaluate(() => document.getElementById('smart-banner').style.display);
    const link = await page.evaluate(() => document.getElementById('smart-banner-link').getAttribute('href'));
    return { pass: shown === 'block' && link === 'creation_entreprise.php', shown, link };
  });

  // 5. FORT SIGNAL option Assistance création (étape 3) -> modal
  await check('opt-assistance-modal', async () => {
    await openTunnel('/tunnel_souscription.php?service=contrats&pack=standard');
    await page.evaluate(() => { goToStep(2); });
    await page.click('#opt-assistance-creation');
    const visible = await page.evaluate(() => document.getElementById('smart-modal-overlay').style.display);
    const text = await page.evaluate(() => document.getElementById('smart-modal-text').innerText);
    return { pass: visible === 'flex' && text.includes('100 000'), visible, text: text.slice(0, 60) };
  });

  // 6. clic overlay ferme le modal
  await check('overlay-click-dismiss', async () => {
    await openTunnel('/tunnel_souscription.php?service=fiscalite&pack=simplifie');
    await page.check('#opt-no-niu-fiscal');
    await page.mouse.click(5, 5); // coin = overlay, hors modal
    const display = await page.evaluate(() => document.getElementById('smart-modal-overlay').style.display);
    return { pass: display === 'none', display };
  });

  // 7. banner ✕ masque la bannière
  await check('banner-close-x', async () => {
    await openTunnel('/tunnel_souscription.php?service=contrats&pack=standard');
    await page.selectOption('#contrat-type', 'statuts');
    await page.evaluate(() => { document.querySelector('#smart-banner button').click(); });
    const shown = await page.evaluate(() => document.getElementById('smart-banner').style.display);
    return { pass: shown === 'none', shown };
  });

  // 8. désactiver l'optin fiscal -> pas de modal au 2e check (pas de re-trigger intempestif)
  await check('optin-no-spam', async () => {
    await openTunnel('/tunnel_souscription.php?service=fiscalite&pack=simplifie');
    await page.evaluate(() => {
      const cb = document.getElementById('opt-no-niu-fiscal');
      cb.checked = true; cb.dispatchEvent(new Event('change'));
      cb.checked = false; cb.dispatchEvent(new Event('change'));
    });
    const display = await page.evaluate(() => document.getElementById('smart-modal-overlay').style.display);
    return { pass: display === 'none', display };
  });

  console.log(JSON.stringify({ results, errors, pass: fail.length === 0 && errors.length === 0, failed: fail }, null, 2));
  await browser.close();
  process.exit(fail.length === 0 && errors.length === 0 ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
