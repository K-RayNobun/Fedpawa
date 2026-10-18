// L012 — E2E réel: onglet Contrats -> bouton « Modifier le contrat » -> OTP
// (mauvais code refusé, bon code lu depuis error_log [OTP-ADMIN-DEV]) ->
// éditeur TinyMCE avec le contenu contract_templates.content -> édition ->
// Enregistrer -> vérif base (contract_templates + contract_history + audit_log)
// -> POST update sans unlock -> 403. Captures: /root/Fedpawa/audit/l012_*.png
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
import { execSync } from 'node:child_process';
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = 'http://127.0.0.1:18081';
const ADMIN_EMAIL = 'audit-e2e@fedpawa.com';
const ADMIN_PASS = 'AuditE2E-Admin-2026';
const SHOT = (n) => `/root/Fedpawa/audit/${n}`;
const out = { cases: [] };
const check = (name, pass, info = '') => { out.cases.push({ name, pass, info }); console.log((pass ? 'PASS' : 'FAIL'), name, '|', info); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const dbQuery = (sql) => {
  const b64 = Buffer.from(sql).toString('base64');
  const cmd = `docker exec fedpawa-api-test php -r "$db=new PDO('sqlite:/app/storage/fedpawa.sqlite'); foreach($db->query(base64_decode('${b64}')) as $r) echo json_encode($r), PHP_EOL;"`.replace(/\$/g, '\\$');
  return execSync(cmd, { encoding: 'utf8' }).trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
};

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message.slice(0, 200)));

  // ---- Login admin : dans une page jetable (survit à toute navigation) ----
  const loginPage = await (await browser.newContext({ viewport: { width: 800, height: 600 } })).newPage();
  const loginData = await loginPage.goto(BASE + '/', { waitUntil: 'domcontentloaded' }).then(() =>
    loginPage.evaluate(async ([email, pass]) => {
      const t = await fetch('/api/csrf-token').then(r => r.json());
      return fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t.csrf_token },
        credentials: 'include',
        body: JSON.stringify({ email, mot_de_passe: pass })
      }).then(r => r.json());
    }, [ADMIN_EMAIL, ADMIN_PASS])
  ).catch(e => ({ error: e.message.slice(0, 80) }));
  console.log('login:', JSON.stringify(loginData));
  await loginPage.context().close();
  // Le cookie de session vit dans le navigateur (file:// contextes partagent les cookies par origin en playwright? NON)
  // -> on refait le login dans LE contexte principal, sur la page du site.
  const loginData2 = await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' }).then(() =>
    page.evaluate(async ([email, pass]) => {
      const t = await fetch('/api/csrf-token').then(r => r.json());
      return fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t.csrf_token },
        credentials: 'include',
        body: JSON.stringify({ email, mot_de_passe: pass })
      }).then(r => r.json());
    }, [ADMIN_EMAIL, ADMIN_PASS])
  ).catch(e => ({ error: e.message.slice(0, 80) }));
  console.log('login principal:', JSON.stringify(loginData2));

  await page.goto(BASE + '/admin_dashboard.html', { waitUntil: 'load' });
  await sleep(1500);

  // ---- 1. Onglet Contrats: bouton visible et stylé ----
  const contratsTab = page.locator('.db-nav-item[data-tab="contrats"]');
  await contratsTab.click();
  await sleep(400);
  const btn = page.locator('#btn-edit-template');
  const btnVisible = await btn.isVisible().catch(() => false);
  const btnLabel = btnVisible ? (await btn.innerText()).trim() : '';
  const btnBg = btnVisible ? await btn.evaluate(el => getComputedStyle(el).backgroundColor) : '';
  const btnColor = btnVisible ? await btn.evaluate(el => getComputedStyle(el).color) : '';
  check('1. bouton Modifier le contrat visible et stylé', btnVisible && /modifier le contrat/i.test(btnLabel) && btnBg !== 'rgba(0, 0, 0, 0)' && btnColor !== 'rgb(0, 0, 0)',
    `label="${btnLabel}" bg=${btnBg} color=${btnColor}`);
  await page.locator('#tab-contrats').scrollIntoViewIfNeeded().catch(() => {});
  await page.screenshot({ path: SHOT('l012_bouton.png') });

  // ---- 2. Clic -> OTP généré + loggué + modal avec email masqué ----
  await btn.click();
  await sleep(2500); // laisse le temps à l'appel API + modal
  const otpModal = page.locator('#fp-otp-modal');
  const otpModalVisible = await otpModal.isVisible().catch(() => false);
  const otpModalText = otpModalVisible ? (await otpModal.innerText()).replace(/\s+/g, ' ') : '';
  const maskedShown = otpModalText.includes('a***@fedpawa.com');
  check('2. modal OTP affichée avec email masqué', otpModalVisible && maskedShown, otpModalText.slice(0, 140));
  const logOtp = execSync('docker logs fedpawa-api-test 2>&1 | grep "OTP-ADMIN-DEV" | tail -1', { encoding: 'utf8' }).trim();
  const otpCode = (logOtp.match(/:\s*(\d{6})\s*$/) || [])[1] || '';
  check('2b. OTP généré + loggué (fallback [OTP-ADMIN-DEV])', otpCode.length === 6, logOtp.slice(-70));
  await page.screenshot({ path: SHOT('l012_otp_modal.png') });

  // ---- 3. Mauvais OTP -> erreur affichée, pas d'édition ----
  await page.locator('#l012-otp-input').fill('000000');
  await page.locator('#l012-otp-submit').click();
  await sleep(1500);
  const errText = await page.locator('#l012-otp-error').innerText().catch(() => '');
  const otpStillOpen = await otpModal.isVisible().catch(() => false);
  const editorPremature = await page.locator('#fp-template-modal').isVisible().catch(() => false);
  check('3. mauvais OTP refusé (erreur affichée, éditeur non ouvert)', otpStillOpen && errText.length > 0 && !editorPremature, `err="${errText}"`);
  await page.screenshot({ path: SHOT('l012_otp_wrong.png') });

  // ---- 4. Bon OTP (lu depuis error_log) -> éditeur TinyMCE avec le contenu ----
  await page.locator('#l012-otp-input').fill(otpCode);
  await page.locator('#l012-otp-submit').click();
  await sleep(4000); // fermeture OTP + GET template + tinymce.init
  const editorModal = page.locator('#fp-template-modal');
  const editorVisible = await editorModal.isVisible().catch(() => false);
  const tinymceLoaded = await page.evaluate(() => !!(window.tinymce && tinymce.get('l012-template-content')));
  let editorHasContent = false;
  let bodySnippet = '';
  if (editorVisible && tinymceLoaded) {
    // Attendre que TinyMCE ait réellement injecté le contenu dans son iframe
    for (let i = 0; i < 20 && !editorHasContent; i++) {
      bodySnippet = await page.frameLocator('#l012-template-content_ifr').locator('body').innerText().catch(() => '');
      editorHasContent = bodySnippet.trim().length > 50;
      if (!editorHasContent) await sleep(400);
    }
  }
  check('4. éditeur TinyMCE ouvert avec le contenu du template', editorVisible && tinymceLoaded && editorHasContent,
    `visible=${editorVisible} tinymce=${tinymceLoaded} len=${bodySnippet.length} debut="${bodySnippet.slice(0, 60).replace(/\n/g, ' ')}"`);
  await page.screenshot({ path: SHOT('l012_editor.png') });

  // ---- 5. Édition d'un mot -> Enregistrer -> toast + base (template + history + audit) ----
  const histBefore = dbQuery("SELECT COUNT(*) AS n FROM contract_history")[0].n;
  // Taper un marqueur unique à la fin du contenu de l'éditeur
  const MARK = 'L012E2E-' + Date.now();
  await page.evaluate((mark) => {
    const ed = window.tinymce.get('l012-template-content');
    ed.setContent(ed.getContent() + ' <p id="l012mark">MARQUEUR ' + mark + '</p>');
    ed.save?.();
  }, MARK).catch(e => console.log('setContent err', e.message));
  await sleep(500);
  await page.locator('#l012-editor-save').click();
  await sleep(2500);
  const toastVisible = await page.locator('.fp-toast-success').first().isVisible().catch(() => false);
  const toastText = toastVisible ? (await page.locator('.fp-toast').first().innerText()).replace(/\s+/g, ' ') : '';
  const tplRows = dbQuery("SELECT content FROM contract_templates WHERE name='contract'");
  const contentNow = tplRows.length ? tplRows[0].content : '';
  const savedInDb = contentNow.includes(MARK);
  const histRows = dbQuery("SELECT old_content FROM contract_history ORDER BY id DESC LIMIT 1");
  const histOk = histRows.length && (histRows[0].old_content || '').length > 50 && !(histRows[0].old_content || '').includes(MARK) && histRows[0].old_content.length;
  const histCountAfter = dbQuery("SELECT COUNT(*) AS n FROM contract_history")[0].n;
  const auditRows = dbQuery("SELECT action FROM audit_log WHERE action='UPDATE_CONTRACT_TEMPLATE' ORDER BY id DESC LIMIT 1");
  check('5a. toast succès affiché', toastVisible, toastText.slice(0, 80));
  check('5b. modification sauvée en base (contract_templates.content)', savedInDb, `mark=${MARK} trouvé=${savedInDb}`);
  check('5c. contract_history nouvelle ligne avec ANCIEN contenu', histCountAfter === histBefore + 1 && !!histOk,
    `before=${histBefore} after=${histCountAfter} old_len=${(histRows[0] && histRows[0].old_content || '').length}`);
  check('5d. audit_log UPDATE_CONTRACT_TEMPLATE', auditRows.length === 1, auditRows.length ? 'action loguée' : 'absent');
  await page.screenshot({ path: SHOT('l012_saved.png') });

  // ---- 6. POST update SANS unlock -> 403 (preuve sécurité, session propre via fetch) ----
  const forbidden = await page.evaluate(async (mark) => {
    const t = await fetch('/api/csrf-token', { credentials: 'include' }).then(r => r.json());
    const res = await fetch('/api/admin/template/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t.csrf_token },
      credentials: 'include',
      body: JSON.stringify({ content: 'NOUVEAU SANS OTP ' + mark + ' ' + 'y'.repeat(60) })
    });
    let body = {};
    try { body = await res.json(); } catch (e) {}
    return { status: res.status, error: body.error || '' };
  }, MARK);
  check('6. update SANS unlock -> 403 OTP requis', forbidden.status === 403 && /otp/i.test(forbidden.error), JSON.stringify(forbidden));

  // ---- 7. Pas d'erreur JS fatale sur le flux ----
  check('7. aucune erreur JS non interceptée', jsErrors.length === 0, jsErrors.join(' | ').slice(0, 200) || 'aucune');

  console.log('\nRESUME: ' + out.cases.filter(c => c.pass).length + '/' + out.cases.length + ' PASS');
  await browser.close();
  process.exit(out.cases.every(c => c.pass) ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
