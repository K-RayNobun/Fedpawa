// AUDIT S3 — Qui-sommes-nous + Contact, FR+EN — faces 1/2/3/5 + clavier (a11y)
import { chromium } from '/root/lofi-cities/tools/node_modules/playwright-core/index.mjs';
import fs from 'fs';

const BASE = 'http://127.0.0.1:18081';
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

const PAGES = [
  ['qui-sommes-nous', '/qui-sommes-nous.php', '/en/qui-sommes-nous.php'],
  ['contact', '/contact.php', '/en/contact.php'],
];

async function audit(url, name) {
  const out = { name, url };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const console_msgs = [], failed_reqs = [];
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) console_msgs.push(m.type() + ': ' + m.text().slice(0, 200)); });
  page.on('response', r => { if (r.status() >= 400) failed_reqs.push(r.status() + ' ' + r.url().replace(BASE, '')); });
  page.on('pageerror', e => console_msgs.push('pageerror: ' + String(e).slice(0, 200)));
  await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 45000 }).catch(e => console_msgs.push('goto: ' + String(e).slice(0, 150)));
  await page.waitForTimeout(900);
  out.console = console_msgs; out.failed = failed_reqs;

  out.seo = await page.evaluate(() => {
    const g = s => document.querySelector(s);
    const meta = n => (g(`meta[name="${n}"]`) || {}).content || null;
    return {
      title: document.title, title_len: document.title.length,
      desc_len: (meta('description') || '').length,
      h1_count: document.querySelectorAll('h1').length,
      h1: Array.from(document.querySelectorAll('h1')).map(h => h.innerText.trim().slice(0, 80)),
      imgs_no_alt: Array.from(document.querySelectorAll('img')).filter(i => !i.hasAttribute('alt')).length,
      lang: document.documentElement.getAttribute('lang'),
    };
  });

  out.broken_imgs = await page.evaluate(() => Array.from(document.querySelectorAll('img')).filter(i => i.complete && i.naturalWidth === 0 && (i.getAttribute('src') || '')).map(i => (i.src || '').split('/').pop()));

  out.links = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]'))
    .map(a => ({ href: a.href, text: (a.innerText || '').trim().slice(0, 40) }))
    .filter(l => l.href.includes('127.0.0.1:18081') || l.href.startsWith('mailto') || l.href.startsWith('tel')));

  out.text = await page.evaluate(() => document.body.innerText);

  // ===== clavier: Tab focus visible =====
  const kb = await page.evaluate(async () => {
    const results = [];
    const focusables = Array.from(document.querySelectorAll('a[href], button, input, select, textarea')).slice(0, 40);
    let invisibleFocus = 0, noOutline = 0, tabbed = [];
    for (let i = 0; i < Math.min(25, focusables.length); i++) {
      const el = focusables[i];
      el.focus();
      const st = getComputedStyle(el);
      const hasVisibleOutline = st.outlineStyle !== 'none' || st.boxShadow !== 'none' || st.borderColor !== st.color;
      const r = el.getBoundingClientRect();
      if (!document.activeElement === el) continue;
      if (!hasVisibleOutline) {
        noOutline++;
        if (tabbed.length < 5) tabbed.push({ tag: el.tagName, text: (el.innerText || el.getAttribute('placeholder') || '').slice(0, 25), outline: st.outlineStyle, boxShadow: st.boxShadow.slice(0, 30) });
      }
    }
    return { tested: Math.min(25, focusables.length), noVisibleFocus: noOutline, samples: tabbed };
  });
  out.keyboard = kb;

  // formulaire contact: labels et required
  out.form = await page.evaluate(() => {
    const forms = Array.from(document.querySelectorAll('form'));
    return forms.map(f => {
      const inputs = Array.from(f.querySelectorAll('input, select, textarea'));
      return {
        action: f.action || f.getAttribute('action') || null,
        method: f.method || f.getAttribute('method') || null,
        fields: inputs.map(i => ({
          name: i.name, type: i.type || i.tagName.toLowerCase(),
          hasLabel: !!(i.labels && i.labels.length) || !!i.getAttribute('aria-label') || !!document.querySelector(`label[for="${i.id}"]`),
          required: i.required, pattern: i.getAttribute('pattern'),
        })),
      };
    });
  });

  // contraste rapide
  out.contrast = await page.evaluate(() => {
    function lum(r, g, b) { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); }
    function parseC(c) { const m = c.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s]+([\d.]+))?\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; }
    function bgOf(el) { let e = el; while (e && e !== document.documentElement) { const c = parseC(getComputedStyle(e).backgroundColor); if (c && c[3] > 0.85) return c; e = e.parentElement; } return [255, 255, 255, 1]; }
    const out = [];
    for (const el of document.querySelectorAll('h2, h3, p, a, span, li')) {
      const r = el.getBoundingClientRect(); if (!r.width || r.top > 3500) continue;
      const txt = (el.innerText || '').trim(); if (txt.length < 3) continue;
      const st = getComputedStyle(el);
      const fg = parseC(st.color); if (!fg) continue;
      const bg = bgOf(el);
      const L1 = lum(fg[0], fg[1], fg[2]), L2 = lum(bg[0], bg[1], bg[2]);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const px = parseFloat(st.fontSize);
      const large = px >= 24 || (px >= 18.66 && st.fontWeight >= 700);
      out.push({ sel: el.tagName, text: txt.slice(0, 40), ratio: +ratio.toFixed(2), need: large ? 3 : 4.5, fg: st.color, bg: `rgb(${bg.slice(0, 3)})` });
      if (out.length > 60) break;
    }
    return out;
  });

  await ctx.close();

  // mobile
  const ctxM = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const pm = await ctxM.newPage();
  await pm.goto(BASE + url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await pm.waitForTimeout(700);
  out.mobile = await pm.evaluate(() => {
    const doc = document.documentElement;
    const overflows = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width > 5 && r.right > 377 && overflows.length < 12) {
        const st = getComputedStyle(el);
        if (st.position === 'fixed' || st.display === 'none') continue;
        overflows.push({ tag: el.tagName, cls: (el.className + '').slice(0, 50), right: Math.round(r.right) });
      }
    }
    return { scrollWidth: doc.scrollWidth, overflows };
  });
  await ctxM.close();
  return out;
}

const all = {};
for (const [name, fr, en] of PAGES) {
  all[name] = { fr: await audit(fr, name + '-FR'), en: await audit(en, name + '-EN') };
  console.log(name, 'ok — FR failed:', all[name].fr.failed.length, 'EN failed:', all[name].en.failed.length);
}

// ===== TEST SUBMISSION formulaire contact (worst-case, face 4) =====
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(BASE + '/contact.php', { waitUntil: 'networkidle' });
const formInfo = await page.evaluate(() => {
  const f = document.querySelector('form');
  return f ? { action: f.action, method: f.method, id: f.id, fields: Array.from(f.querySelectorAll('input,textarea,select')).map(i => i.name || i.id) } : null;
});
all['contact_form'] = { info: formInfo };
// soumission vide
if (formInfo) {
  try {
    await page.fill('input[name="nom"], #nom', '').catch(() => {});
    const submitBtn = page.locator('form button[type="submit"], form input[type="submit"], .btn-submit, form .btn').first();
    const before = await page.evaluate(() => ({ url: location.href, html_len: document.body.innerHTML.length }));
    await submitBtn.click({ timeout: 3000 }).catch(e => all['contact_form'].click_error = String(e).slice(0, 150));
    await page.waitForTimeout(1500);
    const after = await page.evaluate(() => ({ url: location.href, body: document.body.innerText.slice(0, 400) }));
    all['contact_form'].empty_submission = { before_url: before.url, after };
  } catch (e) { all['contact_form'].submit_test_error = String(e).slice(0, 150); }
}
await ctx.close();

fs.writeFileSync('/root/Fedpawa/audit/s3_raw.json', JSON.stringify(all, null, 1));
console.log('S3 collecté');
await browser.close();
