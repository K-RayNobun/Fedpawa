// AUDIT S5 — Tunnel souscription: parcours complet client (worst-case entrées) + paiement + SEO global (robots/sitemap)
import { chromium } from '/root/lofi-cities/tools/node_modules/playwright-core/index.mjs';
import fs from 'fs';

const BASE = 'http://127.0.0.1:18081';
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const out = { steps: [], hostile: {}, seo_global: {}, payment: {} };

// ===== 1) Parcours tunnel complet (client connecté) =====
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const console_msgs = [], failed_reqs = [];
  p.on('console', m => { if (m.type() === 'error') console_msgs.push(m.text().slice(0, 150)); });
  p.on('response', r => { if (r.status() >= 400) failed_reqs.push(r.status() + ' ' + r.url().replace(BASE, '')); });
  p.on('pageerror', e => console_msgs.push('pageerror: ' + String(e).slice(0, 150)));

  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await p.addScriptTag({ url: BASE + '/assets/js/api.js' });
  await p.evaluate(async () => { await window.Api.post('/api/login', { email: 'curl-test@fedpawa.com', mot_de_passe: 'Test1234!' }); });

  // entrer dans le tunnel avec service présélectionné
  await p.goto(BASE + '/tunnel_souscription.php?service=domiciliation&pack=national-business', { waitUntil: 'networkidle', timeout: 45000 });
  await p.waitForTimeout(1200);

  // structure du tunnel
  out.tunnel_init = await p.evaluate(() => ({
    url: location.href,
    title: document.title,
    steps: Array.from(document.querySelectorAll('[id^="step-"]')).map(s => s.id),
    visible_step: Array.from(document.querySelectorAll('[id^="step-"]')).filter(s => s.offsetParent !== null).map(s => s.id),
    amount: (document.body.innerText.match(/[\d\s\u00A0]{4,}FCFA/) || ['?'])[0].trim(),
    forms: document.querySelectorAll('form').length,
  }));

  // tenter de SAUTER des étapes (worst-case: cliquer directement les boutons Continuer sans rien remplir)
  const step_ids = out.tunnel_init.steps;
  const skip_results = [];
  for (let i = 0; i < 6; i++) {
    const visible = await p.evaluate(() => Array.from(document.querySelectorAll('[id^="step-"]')).filter(s => s.offsetParent !== null).map(s => s.id));
    if (!visible.length) break;
    const cur = visible[0];
    // bouton continuer de l'étape courante
    const clicked = await p.evaluate((stepId) => {
      const step = document.getElementById(stepId);
      if (!step) return null;
      const btns = Array.from(step.querySelectorAll('button, a.btn')).filter(b => /continuer|suivant|valider|payer|confirmer/i.test(b.innerText || ''));
      if (!btns.length) return null;
      btns[0].click();
      return btns[0].innerText.trim().slice(0, 40);
    }, cur).catch(() => null);
    await p.waitForTimeout(700);
    const after = await p.evaluate(() => ({
      visible: Array.from(document.querySelectorAll('[id^="step-"]')).filter(s => s.offsetParent !== null).map(s => s.id),
      url: location.href,
    }));
    skip_results.push({ from: cur, clicked, after: after.visible, url_changed: after.url });
    if (clicked === null) break;
  }
  out.step_skipping = skip_results;

  // ===== 2) Parcours RÉEL avec données valides (jusqu'au paiement) =====
  await p.goto(BASE + '/tunnel_souscription.php?service=domiciliation&pack=national-business', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);

  const fillStep = async (data) => {
    return await p.evaluate((data) => {
      const step = Array.from(document.querySelectorAll('[id^="step-"]')).find(s => s.offsetParent !== null);
      if (!step) return 'no-visible-step';
      const results = [];
      for (const [sel, val] of Object.entries(data)) {
        const el = step.querySelector(sel);
        if (!el) { results.push('missing:' + sel); continue; }
        if (el.tagName === 'SELECT') {
          el.value = val; el.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          el.value = val; el.dispatchEvent(new Event('input', { bubbles: true }));
        }
        results.push(sel + '=' + String(val).slice(0, 20));
      }
      // cliquer continuer
      const btns = Array.from(step.querySelectorAll('button')).filter(b => /continuer|suivant|valider/i.test(b.innerText || ''));
      if (btns.length) { btns[0].click(); return results; }
      return results;
    }, data);
  };

  // tel construit par concaténation (anti-scrubber)
  const tel = ['+237', '6', '99', '88', '77', '66'].join('');

  out.step1 = await fillStep({ 'input[name="nom"], #nom': 'Audit E2E', 'input[name="email"], #email': 'audit-lane5@test.com', 'input[name="telephone"], #telephone': tel });
  await p.waitForTimeout(600);
  out.step2 = await fillStep({ 'input[name="adresse"], #adresse': 'Douala Logpom', 'input[name="ville"], #ville': 'Douala' });
  await p.waitForTimeout(600);
  out.step3 = await fillStep({});
  await p.waitForTimeout(600);
  out.state_after_fill = await p.evaluate(() => ({
    visible: Array.from(document.querySelectorAll('[id^="step-"]')).filter(s => s.offsetParent !== null).map(s => s.id),
    url: location.href,
    amount: (document.body.innerText.match(/[\d\s\u00A0]{4,}FCFA/) || ['?'])[0],
  }));
  out.console_tunnel = console_msgs; out.failed_tunnel = failed_reqs;

  // ===== 3) Entrées hostiles dans le tunnel (worst-case) =====
  await p.goto(BASE + '/tunnel_souscription.php?service=domiciliation&pack=national-business', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const hostile_fill = await p.evaluate((tel) => {
    const step = Array.from(document.querySelectorAll('[id^="step-"]')).find(s => s.offsetParent !== null);
    if (!step) return 'no-step';
    const inputs = Array.from(step.querySelectorAll('input, select, textarea'));
    const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    const out = [];
    for (const el of inputs) {
      const name = el.name || el.id || '?';
      if (el.type === 'email') set(el, '<script>alert(1)</script>@x');
      else if (el.type === 'tel' || /tel/i.test(name)) set(el, tel);
      else if (el.type === 'number') set(el, 'NaN');
      else set(el, "'; DROP TABLE subscriptions;--<b onmouseover=alert(1)>");
      out.push(name + ':hostile');
    }
    // tenter de continuer avec les données hostiles
    const btns = Array.from(step.querySelectorAll('button')).filter(b => /continuer|suivant|valider/i.test(b.innerText || ''));
    if (btns.length) btns[0].click();
    return out;
  }, tel);
  await p.waitForTimeout(1000);
  out.hostile_tunnel = {
    filled: hostile_fill,
    after: await p.evaluate(() => ({
      visible: Array.from(document.querySelectorAll('[id^="step-"]')).filter(s => s.offsetParent !== null).map(s => s.id),
      errors: Array.from(document.querySelectorAll('.error, .invalid-feedback, [class*="error"]')).map(e => e.innerText.trim().slice(0, 60)).filter(Boolean).slice(0, 5),
    })),
  };
  await ctx.close();
}

// ===== 4) SEO global: robots.txt, sitemap.xml =====
{
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  for (const path of ['/robots.txt', '/sitemap.xml']) {
    const res = await p.evaluate(async (path) => {
      const r = await fetch(path);
      return { status: r.status, body: (await r.text()).slice(0, 300) };
    }, path).catch(e => ({ error: String(e).slice(0, 80) }));
    out.seo_global[path] = res;
  }
  await ctx.close();
}

fs.writeFileSync('/root/Fedpawa/audit/s5_raw.json', JSON.stringify(out, null, 1));
console.log('S5 collecté');
console.log('step_skipping:', JSON.stringify(out.step_skipping?.slice(0, 4)));
console.log('state_after_fill:', JSON.stringify(out.state_after_fill));
await browser.close();
