// S5b — Tunnel générique (contrats): steps réels + hostile + paiement
import { chromium } from '/root/lofi-cities/tools/node_modules/playwright-core/index.mjs';
import fs from 'fs';

const BASE = 'http://127.0.0.1:18081';
const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome', args: ['--no-sandbox'] });
const out = {};
const tel = ['+237', '6', '99', '88', '77', '55'].join('');

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
const console_msgs = [], failed_reqs = [];
p.on('console', m => { if (m.type() === 'error') console_msgs.push(m.text().slice(0, 150)); });
p.on('response', r => { if (r.status() >= 400) failed_reqs.push(r.status() + ' ' + r.url().replace(BASE, '')); });

await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.addScriptTag({ url: BASE + '/assets/js/api.js' });
await p.evaluate(async () => { await window.Api.post('/api/login', { email: 'curl-test@fedpawa.com', mot_de_passe: 'Test1234!' }); });

await p.goto(BASE + '/tunnel_souscription.php?service=contrats', { waitUntil: 'networkidle', timeout: 45000 });
await p.waitForTimeout(1200);

out.init = await p.evaluate(() => ({
  url: location.href,
  steps: Array.from(document.querySelectorAll('[id^="step-"]')).map(s => s.id),
  visible: Array.from(document.querySelectorAll('[id^="step-"]')).filter(s => s.offsetParent !== null).map(s => s.id),
  amount: ((document.body.innerText.match(/[\d\s\u00A0]{4,}\s?FCFA/) || ['?'])[0] || '').trim(),
}));

// 1) SAUT D'ÉTAPE: cliquer Continuer sans rien remplir, 4 fois max
const skips = [];
for (let i = 0; i < 4; i++) {
  const state = await p.evaluate(() => {
    const vis = Array.from(document.querySelectorAll('[id^="step-"]')).filter(s => s.offsetParent !== null);
    if (!vis.length) return { done: true };
    const step = vis[0];
    const btn = Array.from(step.querySelectorAll('button')).find(b => /continuer|suivant|valider/i.test(b.innerText || ''));
    if (!btn) return { done: true, noBtn: true, step: step.id };
    btn.click();
    return { clicked: btn.innerText.trim(), step: step.id };
  });
  skips.push(state);
  await p.waitForTimeout(800);
  const after = await p.evaluate(() => ({
    visible: Array.from(document.querySelectorAll('[id^="step-"]')).filter(s => s.offsetParent !== null).map(s => s.id),
    errors: Array.from(document.querySelectorAll('.is-invalid, .error, [class*="invalid"]')).map(e => (e.innerText || e.className).toString().slice(0, 50)).slice(0, 4),
    url: location.href,
  }));
  skips.push(after);
  if (state.done || after.url !== out.init.url.replace('tunnel', '') && after.url.includes('paiement')) break;
}
out.step_skip_empty = skips;

// 2) HOSTILE: remplir l'étape 1 avec XSS/SQLi puis continuer
await p.goto(BASE + '/tunnel_souscription.php?service=contrats', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
out.hostile = await p.evaluate((tel) => {
  const vis = Array.from(document.querySelectorAll('[id^="step-"]')).filter(s => s.offsetParent !== null);
  if (!vis.length) return 'no-step';
  const step = vis[0];
  const filled = [];
  for (const el of step.querySelectorAll('input, select, textarea')) {
    if (el.type === 'file') continue;
    const name = el.name || el.id || '?';
    const set = v => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    if (el.type === 'email') set("'<script>alert(1)</script>'@x.com");
    else if (/tel/i.test(name) || el.type === 'tel') set(tel);
    else if (el.tagName === 'SELECT') { if (el.options.length > 1) { el.selectedIndex = 1; el.dispatchEvent(new Event('change', { bubbles: true })); } }
    else set("' OR 1=1; DROP TABLE x;--<img src=x onerror=alert(1)>");
    filled.push(name);
  }
  const btn = Array.from(step.querySelectorAll('button')).find(b => /continuer|suivant|valider/i.test(b.innerText || ''));
  if (btn) btn.click();
  return filled;
}, tel);
await p.waitForTimeout(1000);
out.hostile_after = await p.evaluate(() => ({
  visible: Array.from(document.querySelectorAll('[id^="step-"]')).filter(s => s.offsetParent !== null).map(s => s.id),
  errors: Array.from(document.querySelectorAll('.is-invalid, [class*="invalid"], .error')).map(e => (e.innerText || '').trim().slice(0, 60)).filter(Boolean).slice(0, 6),
  url: location.href,
}));

// 3) Parcours VALIDE complet jusqu'au paiement (4 étapes du tunnel v3)
await p.goto(BASE + '/tunnel_souscription.php?service=contrats', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
const flow = [];
for (let s = 0; s < 5; s++) {
  const filled = await p.evaluate((tel) => {
    const vis = Array.from(document.querySelectorAll('[id^="step-"]')).filter(x => x.offsetParent !== null);
    if (!vis.length) return { done: true };
    const step = vis[0];
    const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    const log = [];
    for (const el of step.querySelectorAll('input, select, textarea')) {
      if (el.type === 'file') continue;
      const name = el.name || el.id || '?';
      if (el.type === 'email') set(el, 'audit-s5@test.com');
      else if (/tel/i.test(name) || el.type === 'tel') set(el, tel);
      else if (el.tagName === 'SELECT') { if (el.options.length > 1) { el.selectedIndex = 1; el.dispatchEvent(new Event('change', { bubbles: true })); } }
      else if (el.type === 'checkbox') { if (!el.checked) el.click(); }
      else set(el, 'Audit Lane5 Val');
      log.push(name);
    }
    const btn = Array.from(step.querySelectorAll('button')).find(b => /continuer|suivant|valider|payer|confirmer/i.test(b.innerText || ''));
    if (btn) { btn.click(); return { step: step.id, filled: log, btn: btn.innerText.trim() }; }
    return { step: step.id, filled: log, noBtn: true };
  }, tel);
  flow.push(filled);
  await p.waitForTimeout(1100);
  const snap = await p.evaluate(() => ({
    visible: Array.from(document.querySelectorAll('[id^="step-"]')).filter(x => x.offsetParent !== null).map(x => x.id),
    url: location.href,
    amount: ((document.body.innerText.match(/[\d\s\u00A0]{4,}\s?FCFA/) || ['?'])[0] || '').trim(),
  }));
  flow.push(snap);
  if (filled.done || snap.url !== out.init.url) break;
}
out.valid_flow = flow;
out.console = console_msgs; out.failed = failed_reqs;
await ctx.close();

fs.writeFileSync('/root/Fedpawa/audit/s5b_raw.json', JSON.stringify(out, null, 1));
console.log('S5b collecté');
console.log('valid_flow last:', JSON.stringify(flow.slice(-2)));
await browser.close();
