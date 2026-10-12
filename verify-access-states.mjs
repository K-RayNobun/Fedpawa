// E2E Lane #4 — Contrôle d'accès par état de session (anonyme / client / admin)
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.argv[2] || 'http://127.0.0.1:18081';
const out = { cases: [] };
const check = (name, cond, info) => out.cases.push({ name, pass: !!cond, info: info || '' });

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  // ===== ANONYME =====
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    // formulaire domiciliation -> auth avec next
    await page.goto(BASE + '/souscription_domiciliation.php?pack=national-business', { waitUntil: 'load' });
    await page.waitForTimeout(2200);
    const url1 = page.url();
    check('anonyme > formulaire domiciliation -> auth', url1.includes('authentification.html') && url1.includes('next=souscription_domiciliation'), url1.split('/').pop());
    // tunnel -> auth avec next
    await page.goto(BASE + '/tunnel_souscription.php?service=contrats&pack=standard', { waitUntil: 'load' });
    await page.waitForTimeout(2200);
    const url2 = page.url();
    check('anonyme > tunnel -> auth', url2.includes('authentification.html') && url2.includes('next=tunnel_souscription'), url2.split('/').pop());
    // espace client -> auth
    await page.goto(BASE + '/espace_client.html', { waitUntil: 'load' });
    await page.waitForTimeout(2200);
    check('anonyme > espace client -> auth', page.url().includes('authentification.html'), page.url().split('/').pop());
    // admin dashboard -> auth
    await page.goto(BASE + '/admin_dashboard.html', { waitUntil: 'load' });
    await page.waitForTimeout(2200);
    check('anonyme > admin -> auth', page.url().includes('authentification.html'), page.url().split('/').pop());
    // page publique -> reste
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    check('anonyme > accueil public -> reste', !page.url().includes('authentification'), page.url().split('/').pop());
    await ctx.close();
  }

  // ===== LOGIN avec next =====
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(BASE + '/authentification.html?next=tunnel_souscription.php%3Fservice%3Dcontrats%26pack%3Dstandard', { waitUntil: 'load' });
    await page.waitForTimeout(900);
    await page.fill('#login_email', 'curl-test@fedpawa.com');
    await page.fill('#login_password', 'Test1234!');
    await page.click('#loginForm button[type="submit"]');
    await page.waitForTimeout(3200);
    check('login avec next -> retour au formulaire', page.url().includes('tunnel_souscription.php?service=contrats'), page.url().split('/').pop());

    // ===== CLIENT connecté =====
    await page.goto(BASE + '/admin_dashboard.html', { waitUntil: 'load' });
    await page.waitForTimeout(2200);
    check('client > admin dashboard -> redirigé espace client', page.url().includes('espace_client.html'), page.url().split('/').pop());
    await page.goto(BASE + '/souscription_domiciliation.php?pack=national-business', { waitUntil: 'load' });
    await page.waitForTimeout(1800);
    check('client > formulaire -> reste', page.url().includes('souscription_domiciliation'), page.url().split('/').pop());
    await page.goto(BASE + '/authentification.html', { waitUntil: 'load' });
    await page.waitForTimeout(2200);
    check('client > page auth -> redirigé espace client', page.url().includes('espace_client.html'), page.url().split('/').pop());
    await ctx.close();
  }

  // ===== ADMIN connecté =====
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(BASE + '/authentification.html', { waitUntil: 'load' });
    await page.waitForTimeout(900);
    await page.fill('#login_email', 'admin-e2e@fedpawa.com');
    await page.fill('#login_password', 'Admin1234!');
    await page.click('#loginForm button[type="submit"]');
    await page.waitForTimeout(3200);
    check('admin login -> admin dashboard', page.url().includes('admin_dashboard.html'), page.url().split('/').pop());
    await page.goto(BASE + '/espace_client.html', { waitUntil: 'load' });
    await page.waitForTimeout(2200);
    check('admin > espace client -> redirigé dashboard', page.url().includes('admin_dashboard.html'), page.url().split('/').pop());
    await page.goto(BASE + '/tunnel_souscription.php?service=oapi&pack=protect_brand', { waitUntil: 'load' });
    await page.waitForTimeout(1800);
    check('admin > tunnel -> reste', page.url().includes('tunnel_souscription'), page.url().split('/').pop());
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    check('admin > accueil public -> reste', !page.url().includes('authentification'), page.url().split('/').pop());
    await ctx.close();
  }

  await browser.close();
  const failed = out.cases.filter(c => !c.pass);
  out.total = out.cases.length;
  out.failed = failed.length;
  console.log(JSON.stringify(out));
  if (failed.length) process.exit(1);
  process.exit(0);
})().catch(e => { console.error('FATAL', e.message); process.exit(2); });
