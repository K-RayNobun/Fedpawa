// AUDIT S2 — Services: 5 pages FR + 5 EN — faces 1, 3, 5 (+ liens pour face 2)
import { chromium } from '/root/lofi-cities/tools/node_modules/playwright-core/index.mjs';
import fs from 'fs';

const BASE = 'http://127.0.0.1:18081';
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

const PAGES = [
  ['domiciliation', '/domiciliation.php', '/en/domiciliation.php'],
  ['creation', '/creation_entreprise.php', '/en/creation_entreprise.php'],
  ['fiscalite', '/fiscalite.php', '/en/fiscalite.php'],
  ['oapi', '/oapi.php', '/en/oapi.php'],
  ['contrats', '/contrats.php', '/en/contrats.php'],
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
      lang: document.documentElement.getAttribute('lang'),
      h1: Array.from(document.querySelectorAll('h1')).map(h => h.innerText.trim().slice(0, 100)),
      h1_count: document.querySelectorAll('h1').length,
      imgs_no_alt: Array.from(document.querySelectorAll('img')).filter(i => !i.hasAttribute('alt')).length,
    };
  });

  out.perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const res = performance.getEntriesByType('resource');
    let total = 0; for (const r of res) total += (r.transferSize || 0);
    return { dcl: Math.round(nav.domContentLoadedEventEnd || 0), htmlKB: Math.round(nav.transferSize / 1024), resCount: res.length, resKB: Math.round(total / 1024) };
  });

  out.broken_imgs = await page.evaluate(() => Array.from(document.querySelectorAll('img')).filter(i => i.complete && i.naturalWidth === 0).map(i => (i.src || '').split('/').pop()));

  // liens internes (pour face 2: cohérence langue)
  out.links = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]'))
    .map(a => ({ href: a.href, text: (a.innerText || '').trim().slice(0, 40) }))
    .filter(l => l.href.includes('127.0.0.1:18081') || l.href.startsWith('mailto')));

  // prix visibles
  out.prices = await page.evaluate(() => {
    const t = document.body.innerText;
    return t.match(/[\d][\d\s\u00A0.]{2,10}(?:\s?FCFA)/g) || [];
  });

  // contrastes: échantillon ciblé (titres, prix, boutons, kicker)
  out.contrast = await page.evaluate(() => {
    function lum(r, g, b) { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); }
    function parseC(c) { const m = c.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s]+([\d.]+))?\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; }
    function bgOf(el) { let e = el; while (e && e !== document.documentElement) { const c = parseC(getComputedStyle(e).backgroundColor); if (c && c[3] > 0.85) return c; e = e.parentElement; } return [255, 255, 255, 1]; }
    const out = [];
    const sels = ['.price', 'h1', 'h2', 'h3', '.btn-primary', '.section-kicker', '.pricing-card .card-header h3', 'button', '.gallery-caption', '.feature-item p'];
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect(); if (!r.width || r.top > 4000) continue;
        const txt = (el.innerText || '').trim(); if (txt.length < 3) continue;
        const st = getComputedStyle(el);
        const fg = parseC(st.color); if (!fg) continue;
        const bg = bgOf(el);
        const L1 = lum(fg[0], fg[1], fg[2]), L2 = lum(bg[0], bg[1], bg[2]);
        const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const px = parseFloat(st.fontSize);
        const large = px >= 24 || (px >= 18.66 && st.fontWeight >= 700);
        out.push({ sel, text: txt.slice(0, 40), ratio: +ratio.toFixed(2), need: large ? 3 : 4.5, fg: st.color, bg: `rgb(${bg.slice(0, 3)})` });
        if (out.length > 60) break;
      }
      if (out.length > 60) break;
    }
    return out;
  });

  out.text = await page.evaluate(() => document.body.innerText);
  await ctx.close();

  // mobile overflow
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
  console.log(name + ' ok — FR failed:', all[name].fr.failed.length, '| EN failed:', all[name].en.failed.length);
}
fs.writeFileSync('/root/Fedpawa/audit/s2_raw.json', JSON.stringify(all, null, 1));
console.log('S2 collecté');
await browser.close();
