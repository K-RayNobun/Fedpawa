// Lane #2 — E2E flux paiement: garde connexion -> Mobile Money -> API -> succès
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
import { ensureLogin } from '/root/Fedpawa/test-lib.mjs';
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

  // B0. la garde d'accès redirige l'anonyme vers l'authentification avec ?next=
  await anon.goto(BASE + '/tunnel_souscription.php?service=contrats&pack=complexe', { waitUntil: 'load' });
  await anon.waitForTimeout(2200);
  check('B0 anonyme: redirigé vers auth avec next', anon.url().includes('authentification.html') && anon.url().includes('next=tunnel_souscription'), anon.url().split('/').pop());

  // login via le formulaire d'auth -> retour au tunnel
  const email = 'pay-' + Date.now() + '@test-fedpawa.cm';
  await anon.evaluate(async (email) => {
    await window.Api.post('/api/register', { nom: 'Pay Test', entreprise: 'PayCo', email, telephone: '+237699000077', mot_de_passe: 'PayPass123' });
  }, email);
  await anon.fill('#login_email', email);
  await anon.fill('#login_password', 'PayPass123');
  await anon.click('#loginForm button[type="submit"]');
  await anon.waitForTimeout(2500);
  check('B1 login depuis auth: retour au tunnel', anon.url().includes('tunnel_souscription.php?service=contrats'), anon.url().split('/').pop());

  // étape 2 (skip step1), remplir le minimum, aller à l'étape 5
  await anon.evaluate(() => {
    document.getElementById('emailInput')?.remove; // n/a
    window.goToStep(4);
  });
  await anon.waitForTimeout(400);

  // A. mode de paiement unique: Mobile Money
  check('A1 seule méthode affichée: Mobile Money', await anon.evaluate(() => {
    const t = document.getElementById('step-4').innerText;
    return t.includes('Mobile Money') && !t.includes('Virement Bancaire') && !t.includes('Carte Bancaire');
  }));
  check('A2 radios payment supprimées', await anon.evaluate(() => document.querySelectorAll('input[name="payment"]').length === 0));

  // B. clic Payer (anonyme) -> modal connexion
  await anon.evaluate(() => window.goToStep(4));
  await anon.waitForTimeout(300);
  await anon.click('#finalPayBtn');
  await anon.waitForTimeout(800);

  // (l'ancien login par modal est remplacé par la garde: login sur la page auth)
  // lire l'état de l'écran Mobile Money (étape 5 du tunnel, connecté)
  const momoState = await anon.evaluate(() => {
    const body = document.body.innerText;
    return {
      amount: body.match(/([\d\u00A0\u202F,]+)\s*FCFA/)?.[1] || '',
      hasPhone: !!document.querySelector('.pay-momo-modal input[type="tel"]'),
      hasOps: document.querySelectorAll('.pay-momo-modal input[name="payOp"]').length,
      desc: body.slice(0, 3000)
    };
  });
  check('C2 montant 153 000 FCFA (150 000 + 2%)', (momoState.amount || '').replace(/[\u00A0\u202F,]/g, ' ').trim().startsWith('153 000'), 'amount=' + momoState.amount);
  check('C3 champs numéro + 2 opérateurs', momoState.hasPhone && momoState.hasOps === 2, 'ops=' + momoState.hasOps);
  check('C4 libellé prestation présent', momoState.desc && momoState.desc.includes('Contrats & Rédaction Juridique') || momoState.desc.includes('Contrats & Rédaction Juridique') || momoState.desc.includes('Rédaction de Contrats'), momoState.desc);

  // D. soumission -> API souscription -> écran succès avec référence
  await anon.fill('#payMomoPhone', '+237 699 12 34 56');
  await anon.click('.pay-op-pill input[value="orange"]');
  await anon.click('#payMomoSubmit');
  await anon.waitForTimeout(2500);
  const successState = await anon.evaluate(() => {
    // Lane contrat: « Vérifier Mon Paiement » s'affiche après la soumission (paiement en attente)
    const verify = document.getElementById('btnVerifyPay');
    const done = document.querySelector('.pay-momo-success');
    const el = done || (verify ? verify.closest('.fp-modal') || verify : null);
    const ref = (document.body.innerText.match(/SUB[-_]\d+/) || [null])[0];
    return { shown: !!(verify || done), ref, text: verify ? 'Écran Vérifier Mon Paiement' : (done ? done.innerText.slice(0, 120) : null), hasEspaceBtn: !!(done && done.querySelector('a[href="espace_client.html"]')) };
  });
  const souscCalls = out.net.filter(l => l.includes('/api/souscription'));
  check('D1 requête /api/souscription partie (200)', souscCalls.some(l => l.startsWith('200')), souscCalls.join(' | ').slice(0, 120));
  check('D2 écran succès + référence SUB_*', successState.shown && !!successState.ref, JSON.stringify(successState).slice(0, 140));
  check('D3 écran vérification paiement (flux contrat)', successState.shown && successState.text === 'Écran Vérifier Mon Paiement');

  // E. CSRF bien envoyé (si 403 -> raté) — déjà couvert par D1.

  // ============ 2. DOMICILIATION — anonyme -> login -> MM ============
  const dom = await (await browser.newContext({ viewport: { width: 375, height: 667 } })).newPage();
  dom.on('response', r => { if (r.url().includes('/api/souscription')) out.net.push('DOM ' + r.status()); });
  // E0. anonyme -> redirigé vers auth par la garde
  await dom.goto(BASE + '/souscription_domiciliation.php?pack=national-business', { waitUntil: 'load' });
  await dom.waitForTimeout(2200);
  check('E0 domiciliation anonyme: redirigé vers auth avec next', dom.url().includes('authentification.html') && dom.url().includes('next=souscription_domiciliation'), dom.url().split('/').pop());

  // E1. login -> retour au formulaire
  const email2 = 'dompay-' + Date.now() + '@test-fedpawa.cm';
  await dom.evaluate(async (email2) => {
    await window.Api.post('/api/register', { nom: 'Pay Dom', entreprise: 'PayDomCo', email: email2, telephone: '+237699000078', mot_de_passe: 'PayPass123' });
  }, email2);
  await dom.fill('#login_email', email2);
  await dom.fill('#login_password', 'PayPass123');
  await dom.click('#loginForm button[type="submit"]');
  await dom.waitForTimeout(2800);
  check('E1 domiciliation: login -> retour au formulaire', dom.url().includes('souscription_domiciliation.php'), dom.url().split('/').pop());

  // remplir toutes les étapes (identique au test stepper qui passe 17/17)
  const domFill = async () => {
    // étape 1
    await dom.evaluate(() => {
      document.querySelector('input[name="statut_structure"][value="existante"]').checked = true;
      document.getElementById('denomination').value = 'PAYMOB SARL';
      document.getElementById('forme_juridique').value = 'SARL / SARLU';
      document.getElementById('rccm').value = 'RCCM/DL/2024/B/777';
      document.getElementById('niu').value = 'M777888999';
      document.getElementById('secteur').value = 'Technologie, Numérique & E-commerce';
      document.getElementById('description').value = 'Tests automatisés E2E.';
    });
    await dom.click('.tunnel-step-content.active button:has-text("Continuer")');
    await dom.waitForTimeout(500);
    // étape 2
    await dom.evaluate(() => {
      document.getElementById('civilite').value = 'Monsieur';
      document.getElementById('nom_complet').value = 'Jean Pay';
      document.getElementById('fonction').value = 'Gérant / Co-gérant';
      document.getElementById('nationalite').value = 'Camerounaise';
      document.getElementById('type_piece').value = "Carte Nationale d'Identité (CNI)";
      document.getElementById('num_piece').value = 'CNI999777';
    });
    await dom.click('.tunnel-step-content.active button:has-text("Continuer")');
    await dom.waitForTimeout(500);
    // étape 3
    await dom.evaluate(() => {
      document.getElementById('email').value = 'paymob@test.cm';
      document.getElementById('telephone').value = '+237 600 000 002';
      document.getElementById('adresse').value = 'Logpom, Douala';
      document.getElementById('ville').value = 'Douala';
      document.getElementById('pays').value = 'Cameroun';
    });
    await dom.click('.tunnel-step-content.active button:has-text("Continuer")');
    await dom.waitForTimeout(500);
    // étape 4: pack déjà présélectionné (national-business via URL)
    await dom.click('.tunnel-step-content.active button:has-text("Continuer")');
    await dom.waitForTimeout(500);
    // étape 5: cases obligatoires
    await dom.evaluate(() => {
      document.querySelectorAll('.tunnel-step-content.active input[type="checkbox"]').forEach(c => { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
    });
    // dropzones factices
    await dom.setInputFiles('#dz-identite input', { name: 'cni.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
    await dom.setInputFiles('#dz-statuts input', { name: 'statuts.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
  };
  await domFill();

// E2: cliquer le bouton final (VALIDER) de l'étape 5 -> écran Mobile Money
  const finalBtn = await dom.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).filter(x => x.offsetParent).find(x => /VALIDER|GÉNÉRER/i.test(x.textContent));
    if (b) { b.click(); return b.textContent.trim().slice(0, 40); }
    return null;
  });
  await dom.waitForTimeout(1500);
const mmState = await dom.evaluate(() => {
    const t = document.querySelector('.pay-momo-modal');
    return { mm: !!t && getComputedStyle(t).display !== 'none' && document.body.innerText.includes('Mobile Money') };
  });
  check('E2 domiciliation: écran Mobile Money au submit', mmState.mm, JSON.stringify(mmState));
  // E3: montant business mensuel 45 000
  const amt = await dom.evaluate(() => (document.body.innerText.match(/([\d\u00A0\u202F,]+)\s*FCFA/) || [''])[0].replace(/[\u00A0\u202F,]/g, ' ').trim().startsWith('45 000'));
  check('E3 domiciliation: montant 45 000 visible', amt);
  // E4: la modal tient dans l'écran mobile
  const fits = await dom.evaluate(() => {
    const m2 = document.querySelector('.pay-momo-modal');
    if (!m2) return false;
    const r = m2.getBoundingClientRect();
    return r.width <= window.innerWidth + 1 && r.height <= window.innerHeight + 1;
  });
  check('E4 domiciliation: modal paiement tient sur mobile', fits);
  // E5: submit du paiement -> API souscription 200
  await dom.evaluate(() => {
    const f = document.getElementById('payMomoForm');
    if (f) {
      const phone = f.querySelector('input[type="tel"]');
      if (phone) phone.value = '+237690000007';
      const op = f.querySelector('input[name="payOp"]');
      if (op) op.checked = true;
      f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  });
  await dom.waitForTimeout(3000);
  check('E5 domiciliation: souscription envoyée', out.net.some(x => x.startsWith('DOM 2')), JSON.stringify(out.net.slice(0, 4)));

  check('F1 0 erreur console', errs.length === 0, errs.slice(0, 2).join(' | '));

  const failed = out.cases.filter(c => !c.pass);
  console.log(JSON.stringify({ cases: out.cases, total: out.cases.length, failed: failed.length }, null, 1));
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message); process.exit(2); });
