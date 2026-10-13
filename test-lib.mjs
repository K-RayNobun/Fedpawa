// Fedpawa — helper de test partagé (Lane infra)
// Fournit: BASE depuis argv, norm(), et ensureLogin(page) qui connecte le compte
// de test E2E (curl-test@fedpawa.com) si la session n'est pas active.
export const BASE = process.argv[2] || 'http://127.0.0.1:18081';
export const TEST_EMAIL = 'curl-test@fedpawa.com';
export const TEST_PASS = 'Test1234!';
export const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
export const PW = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');

export const norm = (s) => (s || '').replace(/[\u00A0\u202F,]/g, ' ').trim();

export async function ensureLogin(page) {
  // s'assurer d'être sur une page du site (origin correcte pour les fetch relatifs)
  if (!page.url().startsWith(BASE)) {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  }
  const me = await page.evaluate(() => fetch('/api/me', { credentials: 'include' }).then(r => r.ok ? r.json() : { authenticated: false })).catch(() => ({ authenticated: false }));
  if (me && me.authenticated) return true;
  // CSRF obligatoire depuis la fusion audited_features: passer par window.Api (api.js)
  await page.addScriptTag({ url: BASE + '/assets/js/api.js' });
  await page.evaluate(([email, pass]) => window.Api.post('/api/login', { email, mot_de_passe: pass })
    .then(r => r.json()), [TEST_EMAIL, TEST_PASS]);
  const after = await page.evaluate(() => fetch('/api/me', { credentials: 'include' }).then(r => r.json()).catch(() => ({ authenticated: false })));
  return !!(after && after.authenticated);
}
