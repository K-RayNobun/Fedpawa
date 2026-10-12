// Lane #4 — E2E contrôle d'accès (rôles) sur le conteneur de test
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:18081';
const out = { cases: [] };
const check = (name, pass, info = '') => out.cases.push({ name, pass, info });

(async () => {
  // attendre que window.apiUrl soit disponible (scripts en bas de page)
  async function waitApi(page, timeout = 8000) {
    await page.waitForFunction(() => typeof window.apiUrl === 'function', { timeout });
  }

  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  // ================= 1. NON-CONNECTÉ =================
  const anon = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await anon.goto(BASE + '/index.php', { waitUntil: 'load' });
  await waitApi(anon);
  check('ANON index: accessible', !anon.url().includes('authentification'), anon.url());
  await anon.goto(BASE + '/espace_client.html', { waitUntil: 'domcontentloaded' });
  await anon.waitForTimeout(2500);
  check('ANON espace_client -> login', anon.url().includes('authentification'), anon.url());
  await anon.goto(BASE + '/admin_dashboard.html', { waitUntil: 'domcontentloaded' });
  await anon.waitForTimeout(2500);
  check('ANON admin_dashboard -> login', anon.url().includes('authentification'), anon.url());
  // API: routes protégées refusées
  const meAnon = await anon.evaluate(async () => (await (await fetch(apiUrl('/api/me'), { credentials: 'include' })).json()));
  check('ANON /api/me: authenticated=false', meAnon.authenticated === false, JSON.stringify(meAnon));
  const dashAnon = await anon.evaluate(async () => (await fetch(apiUrl('/api/dashboard'), { credentials: 'include' })).status);
  check('ANON /api/dashboard: 401', dashAnon === 401, 'status=' + dashAnon);
  const admAnon = await anon.evaluate(async () => (await fetch(apiUrl('/api/admin/overview'), { credentials: 'include' })).status);
  check('ANON /api/admin/overview: 401', admAnon === 401, 'status=' + admAnon);

  // ================= 2. CLIENT =================
  const client = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const email = 'lane4-' + Date.now() + '@test-fedpawa.cm';
  await client.goto(BASE + '/index.php', { waitUntil: 'load' });
  await waitApi(client);
  const reg = await client.evaluate(async (email) => (await fetch(apiUrl('/api/register'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nom: 'Client L4', entreprise: 'L4Co', email, telephone: '+237600000045', mot_de_passe: 'TestPass123' }) })).status, email);
  check('CLIENT register: 200', reg === 200, 'status=' + reg);
  const login = await client.evaluate(async (email) => (await fetch(apiUrl('/api/login'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, mot_de_passe: 'TestPass123' }) })).status, email);
  check('CLIENT login: 200', login === 200, 'status=' + login);
  const meC = await client.evaluate(async () => (await (await fetch(apiUrl('/api/me'), { credentials: 'include' })).json()));
  check('CLIENT /api/me: role=client', meC.authenticated === true && meC.role === 'client', JSON.stringify(meC));

  await client.goto(BASE + '/espace_client.html', { waitUntil: 'domcontentloaded' });
  await client.waitForTimeout(2000);
  check('CLIENT espace_client: accessible', !client.url().includes('authentification'), client.url());
  await client.goto(BASE + '/admin_dashboard.html', { waitUntil: 'domcontentloaded' });
  await client.waitForTimeout(2500);
  check('CLIENT admin_dashboard -> espace_client', client.url().includes('espace_client'), client.url());
  const admC = await client.evaluate(async () => (await fetch(apiUrl('/api/admin/overview'), { credentials: 'include' })).status);
  check('CLIENT /api/admin/overview: 403', admC === 403, 'status=' + admC);
  const dashC = await client.evaluate(async () => (await fetch(apiUrl('/api/dashboard'), { credentials: 'include' })).status);
  check('CLIENT /api/dashboard: 200', dashC === 200, 'status=' + dashC);

  // ================= 3. ADMIN =================
  const admin = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await admin.goto(BASE + '/index.php', { waitUntil: 'load' });
  await waitApi(admin);
  const lgnA = await admin.evaluate(async () => (await fetch(apiUrl('/api/login'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin-test@fedpawa.cm', mot_de_passe: 'AdminPass123!' }) })).status);
  check('ADMIN login: 200', lgnA === 200, 'status=' + lgnA);
  const meA = await admin.evaluate(async () => (await (await fetch(apiUrl('/api/me'), { credentials: 'include' })).json()));
  check('ADMIN /api/me: role=admin', meA.role === 'admin', JSON.stringify(meA));

  await admin.goto(BASE + '/admin_dashboard.html', { waitUntil: 'domcontentloaded' });
  await admin.waitForTimeout(2000);
  check('ADMIN admin_dashboard: accessible', !admin.url().includes('authentification') && !admin.url().includes('espace_client'), admin.url());
  await admin.goto(BASE + '/espace_client.html', { waitUntil: 'domcontentloaded' });
  await admin.waitForTimeout(2500);
  check('ADMIN espace_client -> admin_dashboard', admin.url().includes('admin_dashboard'), admin.url());
  const admA = await admin.evaluate(async () => (await fetch(apiUrl('/api/admin/overview'), { credentials: 'include' })).status);
  check('ADMIN /api/admin/overview: 200', admA === 200, 'status=' + admA);
  const dashA = await admin.evaluate(async () => (await fetch(apiUrl('/api/dashboard'), { credentials: 'include' })).status);
  check('ADMIN /api/dashboard: 403 (espace client interdit)', dashA === 403, 'status=' + dashA);

  // ================= 4. GUEST page =================
  await admin.goto(BASE + '/authentification.html', { waitUntil: 'domcontentloaded' });
  await admin.waitForTimeout(2500);
  check('ADMIN authentification -> admin_dashboard (page guest)', admin.url().includes('admin_dashboard'), admin.url());
  await client.goto(BASE + '/authentification.html', { waitUntil: 'domcontentloaded' });
  await client.waitForTimeout(2500);
  check('CLIENT authentification -> espace_client (page guest)', client.url().includes('espace_client'), client.url());

  const failed = out.cases.filter(c => !c.pass);
  console.log(JSON.stringify({ cases: out.cases, total: out.cases.length, failed: failed.length }, null, 1));
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message); process.exit(2); });
