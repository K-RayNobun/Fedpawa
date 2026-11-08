#!/usr/bin/env python3
"""Assemble en-pages.json — audit complet des 12 pages EN + 7 pages sans source EN."""
import json, re, difflib

RAW = "/root/Fedpawa/audit/content-dom/raw_en"
data = json.load(open(f"{RAW}/extracted.json"))

def sentences(text):
    t = re.sub(r"\s+", " ", text).strip()
    parts = re.split(r"(?<=[.!?…])\s+(?=[A-Z0-9À-ÿ«“(])", t)
    return [p.strip() for p in parts if p.strip()]

SCRIPT = re.compile(r'<(script|style|noscript|svg|template|title)\b.*?</\1>', re.I | re.S)
def text(p):
    h = open(p).read()
    h = SCRIPT.sub(' ', h)
    h = re.sub(r'<[^>]+>', ' ', h)
    import html as H
    h = H.unescape(h)
    return re.sub(r'\s+', ' ', h).strip()

# --- Pages avec source EN : divergence texte (hors nav, qui est traitée à part comme divergence globale) ---
NAV_NEXT_FR = "Accueil Services ▾ Domiciliation Création d'entreprise Conseils & Suivi Fiscal Protection OAPI Contrats Qui sommes-nous Contact"

def body_divergences(php_text, next_text):
    a, b = sentences(php_text), sentences(next_text)
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    out = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        if tag in ("replace", "delete"):
            for k in range(i1, i2):
                if tag == "replace" and j1 < j2:
                    l = j1 + (k - i1) if (k - i1) < (j2 - j1) else j2 - 1
                    out.append({"type": "remplace", "php": a[k], "next": b[l]})
                else:
                    out.append({"type": "manquant_dans_next", "php": a[k], "next": None})
        if tag == "insert" or (tag == "replace" and (j2 - j1) > (i2 - i1)):
            start = j1 + (i2 - i1) if tag == "replace" else j1
            for l in range(start, j2):
                out.append({"type": "ajoute_dans_next", "php": None, "next": b[l]})
    # retirer les divergences purement nav (résumées globalement)
    return [d for d in out if not (d["php"] and NAV_NEXT_FR.split()[0] in (d["php"] or "") and "Accueil" in (d["php"] or ""))]

pages = []
for name, d in data.items():
    php, nxt = d["php"], d["next"]
    divs = body_divergences(php["text"], nxt["text"])
    meta = []
    for k in ["title", "description", "og_title", "og_description", "twitter_title", "twitter_description"]:
        if php.get(k) != nxt.get(k):
            meta.append({"field": k, "php": php.get(k), "next": nxt.get(k)})
    title_dup = nxt["title"].count("FEDPAWA CORPORATE SOLUTIONS") >= 2
    pages.append({
        "page": name,
        "url_next": f"http://localhost:3000/en/{'' if name == 'index' else name}",
        "url_php_source": f"/root/Fedpawa/fedpawa_light/public/en/{name.replace('-', '_') if name != 'index' else 'index'}.php",
        "http_next": 200,
        "verdict": "CONFORME" if not divs and not meta else "DIVERGENCES",
        "lang_attr": {"php": php["lang"], "next": nxt["lang"]},
        "title_duplique_suffixe_site": title_dup,
        "meta_divergences": meta,
        "texte_divergences": divs,
        "nav_desktop_fr_bug": True,  # vérifié sur toutes les pages (NavLinks sans locale)
        "liens_internes_corps_ok": True,
        "hreflang_ok": True,
        "twitter_card_ok": nxt["twitter_card"] == "summary_large_image",
        "images_alt": "voir audit md",
    })

# --- Pages sans source EN ---
fr_only = []
for name, en_url, fr_url in [
    ("mot-de-passe-oublie", "http://localhost:3000/en/mot-de-passe-oublie", ""),
    ("souscription-domiciliation", "http://localhost:3000/en/souscription-domiciliation", ""),
    ("tunnel-souscription", "http://localhost:3000/en/tunnel-souscription", ""),
    ("authentification", "http://localhost:3000/en/authentification", ""),
    ("espace-client", "http://localhost:3000/en/espace-client", ""),
    ("admin-dashboard", "http://localhost:3000/en/admin-dashboard", ""),
    ("admin-document", "http://localhost:3000/en/admin-document", ""),
]:
    h = open(f"{RAW}/fronly_{name}.en.html").read()
    t = re.search(r'<title[^>]*>(.*?)</title>', h, re.S)
    lang = re.search(r'<html[^>]*\blang="([^"]*)"', h)
    en_text = text(f"{RAW}/fronly_{name}.en.html")
    fr_text = text(f"{RAW}/fronly_{name}.fr.html")
    fr_only.append({
        "page": name,
        "http": 200,
        "lang_attr": lang.group(1) if lang else None,
        "title_next": t.group(1) if t else None,
        "contenu": "EN_INVENTE" if name in ("mot-de-passe-oublie", "souscription-domiciliation", "tunnel-souscription", "authentification") else "FR_CONSERVE",
        "source_inline_en": "auth.js contient dict EN inline (source exacte)" if name == "authentification" else None,
        "regle_violee": name in ("mot-de-passe-oublie", "souscription-domiciliation", "tunnel-souscription"),
        "note_regne": ("Vague C: 'EN : pas de source .en.html — traduction vague C' dans lib/i18n/pages/" + name + ".ts"),
        "liens_php_relatifs_404": sorted(set(re.findall(r'href="((?:cgu|politique-confidentialite)\.php)"', h))),
        "robots_noindex": 'noindex' in h,
    })

audit = {
    "audit": "EN pages vs sources .en.html — textes mot à mot, méta, lang, liens, twitter",
    "date": "2026-10-26",
    "serveurs": {"php": "http://localhost:8791", "next": "http://localhost:3000"},
    "sources_en_existantes": [
        "index.php", "qui-sommes-nous.php", "fiscalite.php", "domiciliation.php",
        "creation_entreprise.php", "cgu.php", "politique-confidentialite.php",
        "contact.php", "oapi.php", "contrats.php",
    ],
    "source_en_inline_js": ["authentification (auth.js dict EN inline)"],
    "pages_sans_source_en": ["mot-de-passe-oublie", "souscription-domiciliation", "tunnel-souscription", "espace-client", "admin-dashboard", "admin-document", "authentification (dict EN inline source)"],
    "pages_avec_source": pages,
    "pages_sans_source": fr_only,
    "bug_transverse": {
        "nav_desktop_fr": "Toutes les pages EN (Next) rendent la nav desktop en FRANÇAIS avec liens FR (Accueil, Création d'entreprise, Conseils & Suivi Fiscal, Protection OAPI, Qui sommes-nous) pointant vers /, /domiciliation, etc. sans préfixe /en. Cause : components/site/Header.tsx ligne 164 rend <NavLinks /> sans prop locale (NavLinks.tsx default locale='fr'). Le nav mobile et le footer, eux, sont correctement EN.",
        "title_duplique": "9 pages EN (toutes sauf index) ont un <title> avec suffixe '| FEDPAWA CORPORATE SOLUTIONS' dupliqué : title en dur 'X | FEDPAWA CORPORATE SOLUTIONS' + template '%s | FEDPAWA CORPORATE SOLUTIONS' du layout.",
        "liens_relatifs_404": "authentification/souscription-domiciliation/tunnel-souscription EN contiennent href=\"cgu.php\" et href=\"politique-confidentialite.php\" relatifs (hérités du dict authEn cguLabel) -> 404 sur /en/*.",
    },
}

with open("/root/Fedpawa/audit/content-dom/en-pages.json", "w") as f:
    json.dump(audit, f, ensure_ascii=False, indent=2)
print("en-pages.json OK")
tot_div = sum(len(p["texte_divergences"]) for p in pages)
tot_meta = sum(len(p["meta_divergences"]) for p in pages)
print(f"divergences texte (hors nav): {tot_div}, divergences méta: {tot_meta}")
for p in pages:
    print(f"  {p['page']:26} texte:{len(p['texte_divergences']):2} meta:{len(p['meta_divergences']):2} verdict:{p['verdict']}")
