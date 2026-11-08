#!/usr/bin/env python3
"""Extraction comparable depuis HTML : méta + texte visible normalisé (mot à mot)."""
import json, os, re, sys, html as htmlmod

RAW = "/root/Fedpawa/audit/content-dom/raw_en"

def get_meta(soup_html, name=None, prop=None, key=None):
    """Extrait meta par name/property/charset."""
    out = []
    if name:
        pat = rf'<meta\s+[^>]*name=["\']({re.escape(name)})["\'][^>]*>'
    elif prop:
        pat = rf'<meta\s+[^>]*property=["\']({re.escape(prop)})["\'][^>]*>'
    else:
        return out
    for m in re.finditer(pat, soup_html, re.I):
        tag = m.group(0)
        c = re.search(r'content=["\'](.*?)["\']', tag, re.I | re.S)
        out.append(c.group(1) if c else "")
    return out

def get_first(soup_html, name=None, prop=None):
    r = get_meta(soup_html, name=name, prop=prop)
    return r[0] if r else None

def html_lang(soup_html):
    m = re.search(r'<html[^>]*\blang=["\']([^"\']*)["\']', soup_html, re.I)
    return m.group(1) if m else None

def title_tag(soup_html):
    m = re.search(r'<title[^>]*>(.*?)</title>', soup_html, re.I | re.S)
    return htmlmod.unescape(m.group(1).strip()) if m else None

def hreflangs(soup_html):
    return re.findall(r'<link\s+[^>]*rel=["\']alternate["\'][^>]*>', soup_html, re.I)

def canonical(soup_html):
    m = re.search(r'<link\s+[^>]*rel=["\']canonical["\'][^>]*>', soup_html, re.I)
    return m.group(0) if m else None

SCRIPT_STYLE = re.compile(r'<(script|style|noscript|svg|template|title)\b.*?</\1>', re.I | re.S)

def visible_text(soup_html):
    """Texte visible normalisé : sans script/style/svg, sans tags, espaces normalisés."""
    h = SCRIPT_STYLE.sub(" ", soup_html)
    h = re.sub(r'<[^>]+>', " ", h)
    h = htmlmod.unescape(h)
    h = h.replace("\u00a0", " ")
    h = re.sub(r"\s+", " ", h).strip()
    return h

def internal_links(soup_html):
    """Tous les href des <a>, bruts."""
    return re.findall(r'<a\b[^>]*href=["\'](.*?)["\']', soup_html, re.I)

def img_alts(soup_html):
    """Tuples (src, alt) des <img>."""
    out = []
    for m in re.finditer(r'<img\b[^>]*>', soup_html, re.I):
        tag = m.group(0)
        src = re.search(r'src=["\'](.*?)["\']', tag, re.I)
        alt = re.search(r'alt=["\'](.*?)["\']', tag, re.I)
        out.append((src.group(1) if src else "", alt.group(1) if alt else None))
    return out

def extract(path):
    with open(path) as f:
        raw = f.read()
    return {
        "file": os.path.basename(path),
        "lang": html_lang(raw),
        "title": title_tag(raw),
        "description": get_first(raw, name="description"),
        "og_title": get_first(raw, prop="og:title"),
        "og_description": get_first(raw, prop="og:description"),
        "og_locale": get_first(raw, prop="og:locale"),
        "og_locale_alt": get_first(raw, prop="og:locale:alternate"),
        "twitter_card": get_first(raw, name="twitter:card"),
        "twitter_title": get_first(raw, name="twitter:title"),
        "twitter_description": get_first(raw, name="twitter:description"),
        "twitter_image": get_first(raw, name="twitter:image"),
        "hreflang_links": hreflangs(raw),
        "canonical": canonical(raw),
        "text": visible_text(raw),
        "links": internal_links(raw),
        "images": img_alts(raw),
        "raw_bytes": len(raw),
    }

def main():
    pages = sys.argv[1:] or ["index", "qui-sommes-nous", "fiscalite", "domiciliation",
                             "creation-entreprise", "cgu", "politique-confidentialite",
                             "contact", "oapi", "contrats"]
    result = {}
    for name in pages:
        php = extract(os.path.join(RAW, f"{name}.php.html"))
        nxt = extract(os.path.join(RAW, f"{name}.next.html"))
        result[name] = {"php": php, "next": nxt}
        print(f"{name}: php lang={php['lang']!r} title={php['title']!r}")
        print(f"{' '*len(name)}  next lang={nxt['lang']!r} title={nxt['title']!r}")
        print(f"{' '*len(name)}  php text {len(php['text'])}c | next text {len(nxt['text'])}c")
    with open(os.path.join(RAW, "extracted.json"), "w") as f:
        json.dump(result, f, ensure_ascii=False)
    print("EXTRACTED OK")

if __name__ == "__main__":
    main()
