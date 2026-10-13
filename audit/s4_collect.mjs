// AUDIT S4 — Auth & Espaces: authentification, mdp oublie, espace_client, admin_dashboard
// Faces 1/3/4/5 + flux réels connecté (client + admin)
import { chromium } from '/root/lofi-cities/tools/node_modules/playwright-core/index.mjs';
import fs from 'fs';

const BASE = 'http://127.0.0.1:18081';
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const out = { anon: {}, client: {}, admin: {}, security: {} };

async function collectPage(page, url, label) {
  const r = { label, url };
  const console_msgs = [], failed_reqs = [];
  const handlers = [];
  handlers.push(page.on('console', m => { if (['error', 'warning'].includes(m.type())) console_msgs.push(m.type() + ': ' + m.text().slice(0, 180)); }));
  handlers.push(page.on('response', res => { if (res.status() >= 400) failed_reqs.push(res.status() + ' ' + res.url().replace(BASE, '')); }));
  handlers.push(page.on('pageerror', e => console_msgs.push('pageerror: ' + String(e).slice(0, 180))));
  await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 45000 }).catch(e => console_msgs.push('goto: ' + String(e).slice(0, 150)));
  await page.waitForTimeout(1000);
  r.console = console_msgs; r.failed = failed_reqs;
  r.seo = await page.evaluate(() => ({
    title: document.title, title_len: document.title.length,
    h1_count: document.querySelectorAll('h1').length,
    lang: document.documentElement.getAttribute('lang'),
    theme: document.documentElement.getAttribute('data-theme'),
    imgs_no_alt: Array.from(document.querySelectorAll('img')).filter(i => !i.hasAttribute('alt')).length,
  }));
  r.broken_imgs = await page.evaluate(() => Array.from(document.querySelectorAll('img')).filter(i => i.complete && i.naturalWidth === 0 && (i.getAttribute('src') || '')).map(i => (i.src || '').split('/').pop()));
  r.text_head = await page.evaluate(() => document.body.innerText.trim().slice(0, 250));
  // formulaires
  r.forms = await page.evaluate(() => Array.from(document.querySelectorAll('form')).map(f => ({
    action: f.getAttribute('action'), method: f.getAttribute('method'),
    fields: Array.from(f.querySelectorAll('input,select,textarea')).map(i => ({ name: i.name, type: i.type || i.tagName, hasLabel: !!(i.labels && i.labels.length) || !!i.getAttribute('aria-label') || !!document.querySelector(`label[for="${i.id}"]`) })),
    hasOnsubmitAlert: (f.getAttribute('onsubmit') || '').includes('alert'),
  })));
  // contrastes (mode par défaut de la page = sombre pour ces pages)
  r.contrast = await page.evaluate(() => {
    function lum(r, g, b) { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); }
    function parseC(c) { const m = c.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s]+([\d.]+))?\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; }
    function bgOf(el) { let e = el; while (e && e !== document.documentElement) { const c = parseC(getComputedStyle(e).backgroundColor); if (c && c[3] > 0.85) return c; e = e.parentElement; } return [255, 255, 255, 1]; }
    const results = [];
    for (const el of document.querySelectorAll('h1,h2,h3,p,a,button,span,label,input')) {
      const rect = el.getBoundingClientRect(); if (!rect.width || rect.top > 3000) continue;
      const txt = (el.innerText || el.value || '').trim(); if (txt.length < 2) continue;
      const st = getComputedStyle(el);
      const fg = parseC(st.color); if (!fg) continue;
      const bg = bgOf(el);
      const L1 = lum(fg[0], fg[1], fg[2]), L2 = lum(bg[0], bg[1], bg[2]);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const px = parseFloat(st.fontSize);
      const large = px >= 24 || (px >= 18.66 && st.fontWeight >= 700);
      results.push({ sel: el.tagName, text: txt.slice(0, 35), ratio: +ratio.toFixed(2), need: large ? 3 : 4.5, fg: st.color, bg: `rgb(${bg.slice(0, 3)})` });
      if (results.length > 50) break;
    }
    return results;
  });
  // mobile
  return r;
}

// ========== 1) ANONYME ==========
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  out.anon.auth = await collectPage(p, '/authentification.html', 'auth-anonyme');
  out.anon.mdp = await collectPage(p, '/mot_de_passe_oublie.html', 'mdp-anonyme');
  // form login: soumission vide -> réponse?
  const res = await p.evaluate(async () => {
    try {
      await import('/assets/js/api.js').catch(() => {});
      const r = await fetch('/api/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      return { status: r.status, body: (await r.text()).slice(0, 150) };
    } catch (e) { return { error: String(e).slice(0, 120) }; }
  });
  out.security.login_sans_csrf = res;
  await ctx.close();
}

// ========== 2) CLIENT connecté ==========
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await p.addScriptTag({ url: BASE + '/assets/js/api.js' });
  const login = await p.evaluate(async () => {
    const r = await window.Api.post('/api/login', { email: 'curl-test@fedpawa.com', mot_de_passe: 'Test1234!' });
    return { status: r.status, body: (await r.text()).slice(0, 120) };
  });
  out.client.login = login;
  if (login.status === 200) {
    out.client.espace = await collectPage(p, '/espace_client.html', 'espace-client');
    // données affichées (fuites?)
    out.client.espace_text = await p.evaluate(() => document.body.innerText.slice(0, 600));
    // API protégées en tant que client
    out.client.admin_api = await p.evaluate(async () => {
      const r = await fetch('/api/admin/lists', { credentials: 'include' });
      return { status: r.status, body: (await r.text()).slice(0, 80) };
    });
  }
  await ctx.close();
}

// ========== 3) ADMIN connecté ==========
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await p.addScriptTag({ url: BASE + '/assets/js/api.js' });
  const login = await p.evaluate(async () => {
    const r = await window.Api.post('/api/login', { email: 'admin-e2e@fedpawa.com', mot_de_passe: 'Admin1234!' });
    return { status: r.status, body: (await r.text()).slice(0, 120) };
  });
  out.admin.login = login;
  if (login.status === 200) {
    out.admin.dashboard = await collectPage(p, '/admin_dashboard.html', 'admin-dashboard');
    out.admin.dash_text = await p.evaluate(() => document.body.innerText.slice(0, 600));
    // admin -> espace client (doit être refusé/redirigé)
    await p.goto(BASE + '/espace_client.html', { waitUntil: 'networkidle' }).catch(() => {});
    await p.waitForTimeout(900);
    out.admin.espace_client_access = { final_url: p.url().replace(BASE, ''), redirected: p.url().includes('admin_dashboard') };
  }
  await ctx.close();
}

// ========== 4) Sécurité spécifique auth ==========
{
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await p.addScriptTag({ url: BASE + '/assets/js/api.js' });
  // a) login invalide x3 (pas de brute force: 3 essais max)
  const attempts = [];
  for (let i = 0; i < 3; i++) {
    const r = await p.evaluate(async () => {
      const res = await window.Api.post('/api/login', { email: 'faux' + Math.random() + '@x.com', mot_de_passe: 'Mauvais123!' });
      return res.status;
    });
    attempts.push(r);
  }
  out.security.invalid_login_x3 = attempts;
  // b) reset password: email inexistant (réponse = enumération possible?)
  const reset = await p.evaluate(async () => {
    const res = await window.Api.post('/api/mot-de-passe/oublie', { email: 'nexiste' + Math.random() + '@x.com' });
    return { status: res.status, body: (await res.text()).slice(0, 150) };
  });
  out.security.reset_inconnu = reset;
  // c) CSRF: POST sans token (déjà testé login_sans_csrf) + register sans token
  const reg_ncsrf = await p.evaluate(async () => {
    const res = await fetch('/api/register', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nom: 'X', email: 'csrfless@test.com', mot_de_passe: 'Test1234!' }) });
    return { status: res.status, body: (await res.text()).slice(0, 120) };
  });
  out.security.register_sans_csrf = reg_ncsrf;
  await ctx.close();
}

fs.writeFileSync('/root/Fedpawa/audit/s4_raw.json', JSON.stringify(out, null, 1));
console.log('S4 collecté — client login:', out.client.login?.status, 'admin login:', out.admin.login?.status);
await browser.close();
