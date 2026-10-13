const BASE = process.argv[2] || 'http://127.0.0.1:18081';

const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
import { ensureLogin } from '/root/Fedpawa/test-lib.mjs';
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const res = [];
  const check = (n, c, i) => res.push((c ? 'PASS ' : 'FAIL ') + n + (i ? ' [' + i + ']' : ''));

  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.evaluate(() => fetch('/api/login', { credentials: 'include', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'curl-test@fedpawa.com', mot_de_passe: 'Test1234!' }) }));

  // 1. sans service -> redirection
  const ok = await ensureLogin(page);
  if (!ok) { console.log('FATAL login test impossible'); process.exit(2); }
  await page.goto(BASE + '/tunnel_souscription.php', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  check('sans service -> accueil#services', page.url().includes('index.php') && page.url().includes('#services'), page.url().split('/').pop());

  // 2. avec service
  await page.goto(BASE + '/tunnel_souscription.php?service=contrats&pack=standard', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const st = await page.evaluate(() => ({
    steps: document.querySelectorAll('.progress-step').length,
    active: document.querySelector('.tunnel-step-content.active')?.id,
    title: document.querySelector('.tunnel-step-content.active h2')?.textContent,
    firstLabel: document.querySelector('.progress-step .progress-label')?.textContent
  }));
  check('stepper 4 étapes', st.steps === 4, 'steps=' + st.steps);
  check('étape 1 = formulaire projet', st.active === 'step-1' && /1\. Vos informations/.test(st.title || ''), st.active + '|' + st.title);

  // 3. Continuer sans remplir -> bloqué
  await page.evaluate(() => { validateStep(1, 2); });
  await page.waitForTimeout(500);
  const stayed = await page.evaluate(() => ({
    active: document.querySelector('.tunnel-step-content.active')?.id,
    hint: document.getElementById('step-validation-hint')?.style.display,
    msg: document.getElementById('step-validation-hint')?.textContent?.slice(0, 60)
  }));
  check('vide -> bloqué étape 1 + message', stayed.active === 'step-1' && stayed.hint === 'block', JSON.stringify(stayed));

  // 4. remplir puis continuer
  await page.evaluate(() => {
    document.querySelectorAll('#step-1 input, #step-1 select, #step-1 textarea').forEach(el => {
      if (!el.offsetParent) { el.required = false; return; }
      if (!el.required) return;
      if (el.tagName === 'SELECT') { el.value = el.options[1] && !el.options[0].disabled ? el.options[0].value : (el.options[1] ? el.options[1].value : el.options[0].value); return; }
      if (el.type === 'email') { el.value = 'x@y.cm'; return; }
      if (el.type === 'tel') { el.value = '+' + '237' + '6' + '0'.repeat(9); return; }
      if (el.type === 'number') { el.value = '3'; return; }
      if (el.type === 'checkbox') { el.checked = true; return; }
      el.value = 'Test';
    });
  });
  await page.evaluate(() => { validateStep(1, 2); });
  await page.waitForTimeout(500);
  const now = await page.evaluate(() => document.querySelector('.tunnel-step-content.active')?.id);
  check('rempli -> étape 2', now === 'step-2', now);

  // 5. étape 2 -> 3 (options: bouton Continuer vers documents)
  await page.evaluate(() => { validateStep(2, 3); });
  await page.waitForTimeout(500);
  const now2 = await page.evaluate(() => document.querySelector('.tunnel-step-content.active')?.id);
  check('étape 2 -> 3', now2 === 'step-3', now2);

  const failed = res.filter(r => r.startsWith('FAIL'));
  console.log(JSON.stringify({ cases: res.map(r => ({ name: r.replace(/^(PASS|FAIL) /, ''), pass: r.startsWith('PASS'), info: r.replace(/^(PASS|FAIL) [^[]+/, '') })), total: res.length, failed: failed.length }));
  process.exit(failed.length ? 1 : 0);
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(2); });
