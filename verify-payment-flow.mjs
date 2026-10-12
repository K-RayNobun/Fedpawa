// Lane #2 — E2E flux paiement: garde connexion -> Mobile Money -> API -> succès
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:18081';
const out = { cases: [], net: [] };
const check = (name, pass, info = '') => out.cases.push({ name, pass, info });

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  // ============ 1. TUNNEL GÉNÉRIQUE — anonyme ============
  const anon = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  anon.on('response', r => { if (r.url().includes('/api/')) out.net.push(r.status() + ' ' + r.url().replace(BASE, '')); });
  const errs = [];
  anon.on('pageerror', e => errs.push(e.message.slice(0, 100)));
  anon.on('console', m => { const loc = (m.location() && m.location().url) || ''; if (m.type() === 'error' && !loc.includes('favicon') && !/\b(401|400|500|403)\b/.test(m.text())) errs.push(m.text().slice(0, 100)); });

  await anon.goto(BASE + '/tunnel_souscription.php?service=contrats&pack=complexe', { waitUntil: 'load' });
  await anon.waitForTimeout(1000);
  // étape 2 (skip step1), remplir le minimum, aller à l'étape 5
  await anon.evaluate(() => {
    document.getElementById('emailInput')?.remove; // n/a
    window.goToStep(5);
  });
  await anon.waitForTimeout(400);

  // A. mode de paiement unique: Mobile Money
  check('A1 seule méthode affichée: Mobile Money', await anon.evaluate(() => {
    const t = document.getElementById('step-5').innerText;
    return t.includes('Mobile Money') && !t.includes('Virement Bancaire') && !t.includes('Carte Bancaire');
  }));
  check('A2 radios payment supprimées', await anon.evaluate(() => document.querySelectorAll('input[name="payment"]').length === 0));

  // B. clic Payer (anonyme) -> modal connexion
  await anon.evaluate(() => window.goToStep(5));
  await anon.waitForTimeout(300);
  await anon.click('#finalPayBtn');
  await anon.waitForTimeout(800);
  const loginModalState = await anon.evaluate(() => {
    const t = document.querySelector('.fp-modal-title');
    const form = document.querySelector('.pay-login-form');
    return { shown: !!t && t.innerText.includes('Connexion'), hasForm: !!form };
  });
  check('B1 anonyme: modal de connexion (pas la page paiement)', loginModalState.shown && loginModalState.hasForm, JSON.stringify(loginModalState));

  // C. login depuis la modal -> écran Mobile Money apparaît
  const email = 'pay-' + Date.now() + '@test-fedpawa.cm';
  // créer le compte d'abord via API depuis la page (config chargée)
  await anon.evaluate(async (email) => {
    await fetch(apiUrl('/api/register'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nom: 'Pay Test', entreprise: 'PayCo', email, telephone: '+237600000077', mot_de_passe: 'PayPass123' }) });
  }, email);
  await anon.fill('#payLoginEmail', email);
  await anon.fill('#payLoginPwd', 'PayPass123');
  await anon.click('.pay-login-submit');
  await anon.waitForTimeout(1500);
  const momoState = await anon.evaluate(() => {
    const t = document.querySelector('.fp-modal-title');
    const amount = document.getElementById('payMomoAmount');
    const desc = document.getElementById('payMomoDesc');
    return { title: t ? t.innerText : null, amount: amount ? amount.innerText : null, hasPhone: !!document.getElementById('payMomoPhone'), hasOps: document.querySelectorAll('input[name="payOp"]').length, desc: desc ? desc.innerText.slice(0, 60) : null };
  });
  check('C1 après login: écran Paiement Mobile Money', momoState.title === 'Paiement Mobile Money', JSON.stringify(momoState));
  check('C2 montant 153 000 FCFA (150 000 + 2%)', (momoState.amount || '').replace(/[\u00A0\u202F]/g, ' ').trim() === '153 000 FCFA', momoState.amount);
  check('C3 champs numéro + 2 opérateurs', momoState.hasPhone && momoState.hasOps === 2, 'ops=' + momoState.hasOps);
  check('C4 libellé prestation présent', momoState.desc && momoState.desc.includes('Rédaction de Contrats'), momoState.desc);

  // D. soumission -> API souscription -> écran succès avec référence
  await anon.fill('#payMomoPhone', '+237 699 12 34 56');
  await anon.click('.pay-op-pill input[value="orange"]');
  await anon.click('#payMomoSubmit');
  await anon.waitForTimeout(2500);
  const successState = await anon.evaluate(() => {
    const el = document.querySelector('.pay-momo-success');
    return { shown: !!el, ref: el ? (el.innerText.match(/SUB_\d+/) || [null])[0] : null, text: el ? el.innerText.slice(0, 120) : null, hasEspaceBtn: el ? !!el.querySelector('a[href="espace_client.html"]') : false };
  });
  const souscCalls = out.net.filter(l => l.includes('/api/souscription'));
  check('D1 requête /api/souscription partie (200)', souscCalls.some(l => l.startsWith('200')), souscCalls.join(' | ').slice(0, 120));
  check('D2 écran succès + référence SUB_*', successState.shown && !!successState.ref, JSON.stringify(successState).slice(0, 140));
  check('D3 bouton Espace Client', successState.hasEspaceBtn);

  // E. CSRF bien envoyé (si 403 -> raté) — déjà couvert par D1.

  // ============ 2. DOMICILIATION — anonyme -> login -> MM ============
  const dom = await (await browser.newContext({ viewport: { width: 375, height: 667 } })).newPage();
  dom.on('response', r => { if (r.url().includes('/api/souscription')) out.net.push('DOM ' + r.status()); });
  await dom.goto(BASE + '/souscription_domiciliation.php?pack=national-business', { waitUntil: 'load' });
  await dom.waitForTimeout(900);
  // remplir toutes les étapes jusqu'au submit
  await dom.evaluate(() => {
    document.getElementById('denomination').value = 'PAYMOB SARL';
    document.getElementById('forme_juridique').value = 'SARL / SARLU';
    document.getElementById('rccm').value = 'RCCM/X';
    document.getElementById('niu').value = 'M1';
    document.getElementById('secteur').value = 'Commerce et distribution';
    document.getElementById('description').value = 'Test paiement mobile.';
    window.domNext();
  });
  await dom.waitForTimeout(400);
  await dom.evaluate(() => {
    document.getElementById('civilite').value = 'Monsieur';
    document.getElementById('nom_complet').value = 'Pay Mob';
    document.getElementById('fonction').value = 'Gérant / Co-gérant';
    document.getElementById('nationalite').value = 'Camerounaise';
    document.getElementById('type_piece').value = 'Carte Nationale d\'Identité (CNI)';
    document.getElementById('num_piece').value = '1';
    window.domNext();
  });
  await dom.waitForTimeout(400);
  const email2 = 'paydom-' + Date.now() + '@test-fedpawa.cm';
  await dom.evaluate((email2) => {
    document.getElementById('email').value = email2;
    document.getElementById('telephone').value = '+237 600 111 222';
    document.getElementById('adresse').value = 'Logpom';
    document.getElementById('ville').value = 'Douala';
    document.getElementById('pays').value = 'Cameroun';
  }, email2);
  await dom.click('.tunnel-step-content.active button:has-text("Continuer")');
  await dom.waitForTimeout(500);
  // étape 4: pack déjà présélectionné -> continuer
  await dom.click('.tunnel-step-content.active button:has-text("Continuer")');
  await dom.waitForTimeout(500);
  // étape 5: cocher les 3 validations + submit
  await dom.evaluate(() => {
    document.getElementById('chk-cgv').checked = true;
    document.getElementById('chk-cadre').checked = true;
    document.getElementById('chk-exactitude').checked = true;
    // dropzones requises: simuler via DataTransfer impossible en evaluate sans fichier -> on passe par validate() qui échouera... on teste le flux login modal d'abord
  });
  await dom.evaluate(() => { document.getElementById('domiciliationForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
  await dom.waitForTimeout(900);
  // erreurs dropzones attendues -> on bypass en marquant les dropzones (test: vérifier la modal de connexion apparaît APRES upload simulé)
  // Pour l'E2E, on injecte des fichiers factices via File API
  await dom.setInputFiles('#dz-identite input', { name: 'cni.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
  await dom.setInputFiles('#dz-statuts input', { name: 'statuts.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
  await dom.evaluate(() => { document.getElementById('domiciliationForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
  await dom.waitForTimeout(1000);
  const domState = await dom.evaluate(() => {
    const t = document.querySelector('.fp-modal-title');
    return { loginModal: t ? t.innerText.includes('Connexion') : false };
  });
  check('E1 domiciliation anonyme: modal connexion au submit', domState.loginModal, JSON.stringify(domState));

  // login puis paiement
  await dom.evaluate(async (email2) => {
    await fetch(apiUrl('/api/register'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nom: 'Pay Dom', entreprise: 'PayDomCo', email: email2, telephone: '+237600000078', mot_de_passe: 'PayPass123' }) });
  }, email2);
  await dom.fill('#payLoginEmail', email2);
  await dom.fill('#payLoginPwd', 'PayPass123');
  await dom.click('.pay-login-submit');
  await dom.waitForTimeout(1500);
  const domMomo = await dom.evaluate(() => {
    const t = document.querySelector('.fp-modal-title');
    const amount = document.getElementById('payMomoAmount');
    return { title: t ? t.innerText : null, amount: amount ? amount.innerText : null };
  });
  check('E2 domiciliation: écran MM après login', domMomo.title === 'Paiement Mobile Money', JSON.stringify(domMomo));
  check('E3 montant 45 000 (business mensuel)', (domMomo.amount || '').replace(/[\u00A0\u202F]/g, ' ').trim() === '45 000 FCFA', domMomo.amount);

  // écran MM responsive sur mobile (pas de débordement modal)
  const mmFit = await dom.evaluate(() => {
    const modal = document.querySelector('.pay-momo-modal .fp-modal');
    if (!modal) return { ok: false };
    const r = modal.getBoundingClientRect();
    return { ok: r.width <= window.innerWidth && r.height <= window.innerHeight + 2, w: Math.round(r.width), vw: window.innerWidth, h: Math.round(r.height), vh: window.innerHeight };
  });
  check('E4 modal paiement s\'adapte à l\'écran mobile', mmFit.ok, JSON.stringify(mmFit));

  // soumission domiciliation
  await dom.fill('#payMomoPhone', '+237 699 88 77 66');
  await dom.click('.pay-op-pill input[value="mtn"]');
  await dom.click('#payMomoSubmit');
  await dom.waitForTimeout(2500);
  const domSuccess = await dom.evaluate(() => !!document.querySelector('.pay-momo-success'));
  const domNet = out.net.filter(l => l.startsWith('DOM'));
  check('E5 domiciliation: souscription 200 + succès', domSuccess && domNet.some(l => l.includes('200')), domNet.join(','));

  check('F1 0 erreur console', errs.length === 0, errs.slice(0, 2).join(' | '));

  const failed = out.cases.filter(c => !c.pass);
  console.log(JSON.stringify({ cases: out.cases, total: out.cases.length, failed: failed.length }, null, 1));
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message); process.exit(2); });
