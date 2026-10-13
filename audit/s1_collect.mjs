// AUDIT S1 — Faces 1 (front-end), 3 (a11y), 5 (SEO/perf) — données brutes
// Usage: node s1_collect.mjs
const PW = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');
const CHROME = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = 'http://127.0.0.1:18081';
const fs = await import('fs');

const browser = await PW.chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

function lum(r, g, b) {
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function parseC(c) { const m = c.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s]+([\d.]+))?\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; }

async function auditPage(url, name) {
  const out = { name, url };
  // ===== DESKTOP =====
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const console_msgs = [], failed_reqs = [];
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) console_msgs.push(m.type() + ': ' + m.text().slice(0, 300)); });
  page.on('response', r => { if (r.status() >= 400) failed_reqs.push(r.status() + ' ' + r.url().slice(0, 200)); });
  page.on('pageerror', e => console_msgs.push('pageerror: ' + String(e).slice(0, 300)));
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(e => console_msgs.push('goto: ' + String(e).slice(0, 200)));
  await page.waitForTimeout(1200);
  out.console = console_msgs;
  out.failed_requests = failed_reqs;

  out.seo = await page.evaluate(() => {
    const g = s => document.querySelector(s);
    const meta = n => (g(`meta[name="${n}"]`) || {}).content || null;
    const og = p => (g(`meta[property="${p}"]`) || {}).content || null;
    return {
      title: document.title, title_len: document.title.length,
      description: meta('description'), desc_len: (meta('description') || '').length,
      canonical: (g('link[rel="canonical"]') || {}).href || null,
      hreflang: Array.from(document.querySelectorAll('link[rel="hreflang"]')).map(l => l.hreflang + ' -> ' + l.href),
      og: { title: og('og:title'), desc: og('og:description'), image: og('og:image'), url: og('og:url') },
      lang: document.documentElement.getAttribute('lang'),
      robots: meta('robots'),
      h1: Array.from(document.querySelectorAll('h1')).map(h => h.innerText.trim().slice(0, 120)),
      headings: Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => h.tagName + ':' + h.innerText.trim().slice(0, 80)),
      imgs_no_alt: Array.from(document.querySelectorAll('img')).filter(i => !i.hasAttribute('alt')).map(i => (i.src || '').split('/').pop()),
      imgs_empty_alt: Array.from(document.querySelectorAll('img[alt=""]')).map(i => (i.src || '').split('/').pop()),
    };
  });

  out.perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const res = performance.getEntriesByType('resource');
    const paint = performance.getEntriesByType('paint');
    const byType = {};
    let total = 0, count = 0;
    for (const r of res) {
      count++; total += (r.transferSize || 0);
      const ext = (r.name.split('?')[0].split('.').pop() || 'other').toLowerCase();
      byType[ext] = (byType[ext] || 0) + (r.transferSize || 0);
    }
    return {
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
      loadEvent: Math.round(nav.loadEventEnd || 0),
      transferKB: Math.round(nav.transferSize / 1024),
      resources: count, resourcesKB: Math.round(total / 1024), byTypeKB: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, Math.round(v / 1024)])),
      firstPaint: paint.map(p => p.name + '=' + Math.round(p.startTime)).join(', '),
    };
  });

  out.broken_imgs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('img')).filter(i => i.complete && i.naturalWidth === 0).map(i => i.src.split('/').pop()));

  // contrast sampling (light mode)
  out.contrast_light = await page.evaluate(() => {
    function lum(r, g, b) { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); }
    function parseC(c) { const m = c.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s]+([\d.]+))?\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; }
    function bgOf(el) {
      let e = el;
      while (e && e !== document.documentElement) {
        const c = parseC(getComputedStyle(e).backgroundColor);
        if (c && c[3] > 0.85) return c;
        e = e.parentElement;
      }
      return [255, 255, 255, 1];
    }
    const sels = ['h1', 'h2', 'h3', 'p', 'a', 'span', 'button', 'li', '.subtitle', '.section-kicker', '.price'];
    const seen = new Set(); const results = [];
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || r.top > 3000) continue;
        const txt = (el.innerText || '').trim();
        if (!txt || txt.length < 3) continue;
        const key = sel + '|' + txt.slice(0, 40);
        if (seen.has(key)) continue; seen.add(key);
        const st = getComputedStyle(el);
        const fg = parseC(st.color); const bg = bgOf(el);
        if (!fg) continue;
        const L1 = lum(fg[0], fg[1], fg[2]), L2 = lum(bg[0], bg[1], bg[2]);
        const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const px = parseFloat(st.fontSize);
        const large = px >= 24 || (px >= 18.66 && (st.fontWeight >= 700));
        results.push({ sel, text: txt.slice(0, 50), ratio: +ratio.toFixed(2), need: large ? 3 : 4.5, px, fg: st.color, bg: `rgb(${bg[0]},${bg[1]},${bg[2]})` });
        if (results.length > 80) break;
      }
      if (results.length > 80) break;
    }
    return results;
  });

  // CTA + links (desktop)
  out.links = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]')).map(a => ({ href: a.href, text: (a.innerText || '').trim().slice(0, 50) })));
  out.ctas = await page.evaluate(() => Array.from(document.querySelectorAll('a.btn, button.btn, .btn')).map(b => ({ text: (b.innerText || '').trim().slice(0, 50), href: b.href || b.getAttribute('href') || '(button)' })));
  out.text_dump = await page.evaluate(() => document.body.innerText);

  await ctx.close();

  // ===== MOBILE 375 =====
  const ctxM = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const pm = await ctxM.newPage();
  const mmsgs = [];
  pm.on('pageerror', e => mmsgs.push(String(e).slice(0, 200)));
  await pm.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(e => mmsgs.push('goto: ' + e));
  await pm.waitForTimeout(800);
  out.mobile = await pm.evaluate(() => {
    const doc = document.documentElement;
    const overW = doc.scrollWidth;
    const overflows = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width > 5 && (r.right > 377 || r.left < -2) && overflows.length < 15) {
        const st = getComputedStyle(el);
        if (st.position === 'fixed' || st.display === 'none') continue;
        overflows.push({ tag: el.tagName, cls: (el.className + '').slice(0, 60), right: Math.round(r.right), w: Math.round(r.width) });
      }
    }
    // tap targets
    const small = [];
    for (const el of document.querySelectorAll('a, button')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24) && small.length < 20) {
        small.push({ tag: el.tagName, text: (el.innerText || el.getAttribute('aria-label') || '').slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) });
      }
    }
    // tiny fonts
    const tiny = [];
    for (const el of document.querySelectorAll('body *')) {
      const st = getComputedStyle(el);
      const fs = parseFloat(st.fontSize);
      if ((el.innerText || '').trim() && fs < 12 && tiny.length < 15) tiny.push({ tag: el.tagName, cls: (el.className + '').slice(0, 40), fs, text: el.innerText.trim().slice(0, 30) });
    }
    return { scrollWidth: overW, viewport: 375, overflow_count: overflows.length, overflows, small_targets: small, tiny_fonts: tiny, errors: [] };
  });
  out.mobile.errors = mmsgs;

  // dark mode re-sample
  try {
    await pm.evaluate(() => { const b = document.querySelector('#modeToggle'); if (b) b.click(); });
    await pm.waitForTimeout(600);
    out.contrast_dark_sample = await pm.evaluate(() => {
      function lum(r, g, b) { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); }
      function parseC(c) { const m = c.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s]+([\d.]+))?\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; }
      function bgOf(el) { let e = el; while (e && e !== document.documentElement) { const c = parseC(getComputedStyle(e).backgroundColor); if (c && c[3] > 0.85) return c; e = e.parentElement; } return [255, 255, 255, 1]; }
      const els = Array.from(document.querySelectorAll('h1, h2, p, a, .price, span')).filter(e => {
        const r = e.getBoundingClientRect(); const t = (e.innerText || '').trim();
        return t.length > 5 && r.width > 0 && r.height > 0;
      }).slice(0, 40);
      const out = [];
      for (const el of els) {
        const st = getComputedStyle(el);
        const fg = parseC(st.color); if (!fg) continue;
        const bg = bgOf(el);
        const L1 = lum(fg[0], fg[1], fg[2]), L2 = lum(bg[0], bg[1], bg[2]);
        out.push({ text: el.innerText.trim().slice(0, 40), ratio: +(((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05))).toFixed(2), fg: st.color, bg: `rgb(${bg[0]},${bg[1]},${bg[2]})` });
        if (out.length >= 25) break;
      }
      return out;
    });
  } catch (e) { out.contrast_dark_sample = 'ERREUR: ' + String(e).slice(0, 150); }
  await ctxM.close();
  return out;
}

const fr = await auditPage(BASE + '/', 'FR');
const en = await auditPage(BASE + '/en/index.php', 'EN');
fs.writeFileSync('/root/Fedpawa/audit/s1_raw.json', JSON.stringify({ fr, en }, null, 1));
console.log('OK FR: console=' + (fr.console || []).length, 'failed=' + (fr.failed_requests || []).length, '| EN: console=' + (en.console || []).length, 'failed=' + (en.failed_requests || []).length);
await browser.close();
