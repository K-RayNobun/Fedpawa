// AUDIT S1 — Face 4: accès + entrées hostiles (non destructif)
import { chromium } from '/root/lofi-cities/tools/node_modules/playwright-core/index.mjs';
import { execSync } from 'child_process';

const BASE = 'http://127.0.0.1:18081';
const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext();
const page = await ctx.newPage();
const out = { access: [], hostile: [], headers: {} };

// ===== 1) Contrôle d'accès anonyme =====
const protectedPages = ['/espace_client.html', '/admin_dashboard.html', '/tunnel_souscription.php', '/souscription_domiciliation.php', '/cron.php'];
for (const p of protectedPages) {
  try {
    await page.goto('about:blank');
    await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(900);
    const url = page.url();
    const redirected = url.includes('authentification');
    out.access.push({ page: p, final: url.replace(BASE, ''), redirected_to_auth: redirected, ok: redirected || p === '/' });
  } catch (e) {
    out.access.push({ page: p, error: String(e).slice(0, 120) });
  }
}

// /api/admin/lists anonyme
const r1 = await page.evaluate(() => fetch('/api/admin/lists', { credentials: 'include' }).then(r => r.status + ' ' + r.statusText).catch(e => 'ERR'));
out.access.push({ page: '/api/admin/lists', response: r1, ok: r1.startsWith('401') || r1.startsWith('403') });

// ===== 2) Entrées hostiles sur /api/login et /api/register =====
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await page.addScriptTag({ url: BASE + '/assets/js/api.js' });
await page.waitForTimeout(300);

const hostilePayloads = [
  { name: 'XSS login', data: { email: '<script>alert(1)</script>@x.com', mot_de_passe: '<img src=x onerror=alert(1)>' } },
  { name: 'SQLi login', data: { email: "' OR 1=1--", mot_de_passe: "' OR 1=1--" } },
  { name: '10k chars', data: { email: 'a'.repeat(10000) + '@x.com', mot_de_passe: 'x' } },
  { name: 'types faux', data: { email: 12345, mot_de_passe: { nested: true } } },
  { name: 'champs manquants', data: {} },
  { name: 'XSS register', data: { nom: '<script>alert(1)</script>', email: `xqz${Date.now()}@test.com`, mot_de_passe: 'Test1234!', telephone: '<svg onload=alert(1)>' } },
  { name: 'SQLi register', data: { nom: "' OR '1'='1", email: `xqz2${Date.now()}@test.com`, mot_de_passe: 'Test1234!', telephone: "'; DROP TABLE users;--" } },
];

for (const p of hostilePayloads) {
  const isRegister = p.name.includes('register');
  const res = await page.evaluate(async ({ d, reg }) => {
    try {
      const r = await window.Api.post(reg ? '/api/register' : '/api/login', d);
      const t = await r.text();
      return { status: r.status, body: t.slice(0, 250) };
    } catch (e) { return { status: 'THROW', body: String(e).slice(0, 200) }; }
  }, { d: p.data, reg: isRegister });
  const clean = res.status >= 400 && res.status < 500 && !res.body.includes('Stack trace') && !res.body.includes('Fatal') && !res.body.includes('<script');
  out.hostile.push({ test: p.name, status: res.status, excerpt: res.body.slice(0, 180), clean_rejection: clean, leaked_internals: /stack|trace|fatal|Warning|Notice/i.test(res.body) });
}

// ===== 3) Headers via curl (local + prod) =====
try {
  const local = execSync(`curl -sI ${BASE}/ | grep -iE 'x-frame|x-content|content-security|strict-transport|referrer|xss|cookie' || echo '(aucun)'`).toString();
  const prod = execSync(`curl -sI https://api.fedpawa.com/ | grep -iE 'x-frame|x-content|content-security|strict-transport|referrer|xss|cookie' || echo '(aucun)'`).toString();
  out.headers.local = local;
  out.headers.prod = prod;
} catch (e) { out.headers = { error: String(e).slice(0, 150) }; }

// cookie flags
try {
  const cookieH = execSync(`curl -sI -X POST ${BASE}/api/login | grep -i set-cookie || echo '(pas de cookie)'`).toString();
  out.headers.setcookie = cookieH.slice(0, 300);
} catch (e) {}

await browser.close();
console.log(JSON.stringify(out, null, 1));
