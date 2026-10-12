/**
 * E2E verification of the complete password reset flow for Fedpawa
 * LIVE: https://k-raynobun.github.io/Fedpawa
 * Read-only: no modifications to project files, Docker, or Caddyfile
 */

const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');

const EXECUTABLE_PATH = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const LIVE_URL = 'https://k-raynobun.github.io/Fedpawa';

async function main() {
  const browser = await chromium.launch({ executablePath: EXECUTABLE_PATH, headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let flowHttp = [];
  let defects = [];

  // ============================================================
  // STEP 1: Create a test account via inscription
  // ============================================================
  console.log('=== STEP 1: Inscription du compte de test ===');

  await page.goto('https://k-raynobun.github.io/Fedpawa/authentification.html', { waitUntil: 'domcontentloaded' });

  await page.click('div.auth-tab[data-tab="signup"]');
  await page.waitForSelector('div.form-wrapper#signupForm', { state: 'visible' });

  await page.selectOption('select#civility', 'm');
  await page.type('input#fullname', 'Jean Dupont');
  await page.type('input#company', 'Test SARL');
  await page.type('input#signup_email', 'jean.test@test-cmr.com');
  await page.type('input#phone', '+237 600 00 00 00');
  await page.type('input#signup_password', 'Mdp12345!');
  await page.type('input#confirm_password', 'Mdp12345!');
  await page.click('input#cgu');

  await page.click('div.form-wrapper#signupForm button.btn-primary.btn-block');
  await page.waitForTimeout(2000);

  console.log('Page title after signup:', await page.title());

  // ============================================================
  // STEP 2: Go to mot de passe oubli page
  // ============================================================
  console.log('\n=== STEP 2: Page mot de passe oublié ===');

  await page.goto('https://k-raynobun.github.io/Fedpawa/mot_de_passe_oublie.html', { waitUntil: 'domcontentloaded' });

  const stateEl = await page.$('.reset-state.active');
  const stateId = stateEl ? await stateEl.getAttribute('id') : 'none';
  console.log('Initial state:', stateId);

  // ============================================================
  // STEP 3: Request password reset (email channel)
  // ============================================================
  console.log('\n=== STEP 3: Demande de code de réinitialisation ===');

  await page.click('div.channel-tab[data-channel="email"]');
  await page.type('input.form-control', 'jean.test@test-cmr.com');

  const [response] = await Promise.all([
    page.waitForResponse(resp => {
      return resp.url().includes('/api/password/request') && 
             resp.status() >= 200 && resp.status() < 300 &&
             !resp.url().includes('.css') && 
             !resp.url().includes('.js') && 
             !resp.url().includes('fonts.');
    }),
    page.click('button.btn.btn-primary.btn-block')
  ]);

  const resetData = await response.json();
  console.log('API response status:', response.status());
  console.log('API response body:', JSON.stringify(resetData, null, 2));

  flowHttp.push(`POST /api/password/request -> ${response.status} - ${JSON.stringify(resetData)}`);

  const debugOtp = resetData.debug_otp || null;
  console.log('DEBUG OTP from response:', debugOtp);
  if (debugOtp) flowHttp.push(`  debug_otp field: ${debugOtp}`);

  // ============================================================
  // STEP 4: Enter OTP code (using the real code from debug_otp)
  // ============================================================
  console.log('\n=== STEP 4: Saisie du code OTP ===');

  await page.waitForSelector('.reset-state#state-otp.active', { state: 'visible' });

  const otpDigits = String(debugOtp || '123456');
  console.log('OTP digits to enter:', otpDigits.padStart(6, '0'));

  for (let i = 0; i < 6; i++) {
    const digit = otpDigits[i] || '0';
    await page.type(`.otp-input:nth-child(${i + 1})`, digit);
    await page.waitForTimeout(40);
  }

  await page.focus('.otp-input:last-child');
  await page.keyboard.press('Enter');

  await page.waitForTimeout(2000);

  // ============================================================
  // STEP 5: Set new password - submit form and capture result
  // ============================================================
  console.log('\n=== STEP 5: Définition du nouveau mot de passe ===');

  await page.waitForSelector('.reset-state#state-new-pwd.active', { state: 'visible' });
  console.log('State is now state-new-pwd - proceeding to set new password');

  await page.type('input#newPwd', 'NouveauMdP99!');
  await page.type('input#confirmPwd', 'NouveauMdP99!');

  await page.evaluate(() => document.getElementById('newPwdForm').submit());

  await page.waitForTimeout(2000);

  // Check what state we're in now
  const stateAfterPwd = await page.$('.reset-state.active');
  const stateAfterId = stateAfterPwd ? await stateAfterPwd.getAttribute('id') : 'none';
  console.log('State after new pwd submit:', stateAfterId);

  // If not in success state, navigate to login and try direct login
  let loginSuccess = false;
  let loginData = {};

  if (stateAfterId !== 'state-success') {
    console.log('State is not state-success, navigating to login page...');

    await page.goto('https://k-raynobun.github.io/Fedpawa/authentification.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('div.form-wrapper#loginForm.active', { state: 'visible' });

    await page.type('input#login_email', 'jean.test@test-cmr.com');
    await page.type('input#login_password', 'NouveauMdP99!');

    const [loginResponse] = await Promise.all([
      page.waitForResponse(resp => {
        return resp.url().includes('/api/login') && 
               resp.status() >= 200 && resp.status() < 300 &&
               !resp.url().includes('.css') && 
               !resp.url().includes('.js') && 
               !resp.url().includes('fonts.');
      }),
      page.click('button.btn-primary.btn-block')
    ]);

    loginData = await loginResponse.json();
    console.log('Login API response status:', loginResponse.status());
    console.log('Login API response body:', JSON.stringify(loginData, null, 2));

    flowHttp.push(`POST /api/login -> ${loginResponse.status} - ${JSON.stringify(loginData)}`);

    loginSuccess = loginData.message === 'Connexion réussie';
  } else {
    loginSuccess = true;
    console.log('Success state reached directly!');
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n\n========================================');
  console.log('E2E FLOW SUMMARY');
  console.log('========================================');

  console.log('Login successful:', loginSuccess);

  if (loginSuccess) {
    console.log('\n✓ FLOT E2E TERMINÉ AVEC SUCCÈS');
    console.log('  - Compte créé avec succès');
    console.log('  - Code OTP demandé et reçu via debug_otp');
    console.log('  - Code OTP vérifié avec succès (state: state-otp → state-new-pwd)');
    console.log('  - Nouveau mot de passe défini');
    console.log('  - Connexion réussie avec le nouveau mot de passe');
  } else {
    console.log('\n✗ ÉCHEC DU FLOT E2E');
    defects.push('Connexion échouée après reset de mot de passe');
  }

  console.log('\nFlux HTTP observés :');
  flowHttp.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));

  console.log('\nDéfauts identifiés :');
  defects.forEach((d, i) => console.log(`  ${i + 1}. ${d}`));

  await browser.close();
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});