#!/usr/bin/env python3
"""Collecte des pages EN depuis PHP (:8791) et Next (:3000) pour audit mot à mot."""
import json, os, re, sys, urllib.request, urllib.error

OUT = "/root/Fedpawa/audit/content-dom/raw_en"
os.makedirs(OUT, exist_ok=True)

# Pages avec source EN PHP -> comparaison mot à mot
WITH_SOURCE = [
    ("index",                 "http://localhost:8791/en/index.php",                  "http://localhost:3000/en"),
    ("qui-sommes-nous",       "http://localhost:8791/en/qui-sommes-nous.php",       "http://localhost:3000/en/qui-sommes-nous"),
    ("fiscalite",             "http://localhost:8791/en/fiscalite.php",             "http://localhost:3000/en/fiscalite"),
    ("domiciliation",         "http://localhost:8791/en/domiciliation.php",         "http://localhost:3000/en/domiciliation"),
    ("creation-entreprise",   "http://localhost:8791/en/creation_entreprise.php",    "http://localhost:3000/en/creation-entreprise"),
    ("cgu",                   "http://localhost:8791/en/cgu.php",                   "http://localhost:3000/en/cgu"),
    ("politique-confidentialite", "http://localhost:8791/en/politique-confidentialite.php", "http://localhost:3000/en/politique-confidentialite"),
    ("contact",               "http://localhost:8791/en/contact.php",               "http://localhost:3000/en/contact"),
    ("oapi",                  "http://localhost:8791/en/oapi.php",                  "http://localhost:3000/en/oapi"),
    ("contrats",              "http://localhost:8791/en/contrats.php",              "http://localhost:3000/en/contrats"),
]

# Pages SANS source EN : le Next doit servir le contenu FR conservé
# (nom, url Next /en/..., url Next FR correspondante)
FR_ONLY = [
    ("authentification",        "http://localhost:3000/en/authentification",        "http://localhost:3000/authentification"),
    ("mot-de-passe-oublie",     "http://localhost:3000/en/mot-de-passe-oublie",     "http://localhost:3000/mot-de-passe-oublie"),
    ("espace-client",           "http://localhost:3000/en/espace-client",           "http://localhost:3000/espace-client"),
    ("souscription-domiciliation", "http://localhost:3000/en/souscription-domiciliation", "http://localhost:3000/souscription-domiciliation"),
    ("tunnel-souscription",      "http://localhost:3000/en/tunnel-souscription",     "http://localhost:3000/tunnel-souscription"),
    ("admin-dashboard",         "http://localhost:3000/en/admin-dashboard",          "http://localhost:3000/admin-dashboard"),
    ("admin-document",          "http://localhost:3000/en/admin-document",           "http://localhost:3000/admin-document"),
]

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (audit-en)"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace"), r.geturl()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace"), url
    except Exception as e:
        return -1, str(e), url

manifest = {"pages": [], "fr_only": []}

for name, php_url, next_url in WITH_SOURCE:
    for side, url in (("php", php_url), ("next", next_url)):
        st, html, final = fetch(url)
        path = os.path.join(OUT, f"{name}.{side}.html")
        with open(path, "w") as f:
            f.write(html)
        manifest["pages"].append({"page": name, "side": side, "status": st, "url": url, "final_url": final, "bytes": len(html)})
        print(f"{name}.{side}: HTTP {st} ({len(html)} bytes)")

for name, en_url, fr_url in FR_ONLY:
    for side, url in (("en", en_url), ("fr", fr_url)):
        st, html, final = fetch(url)
        path = os.path.join(OUT, f"fronly_{name}.{side}.html")
        with open(path, "w") as f:
            f.write(html)
        manifest["fr_only"].append({"page": name, "side": side, "status": st, "url": url, "final_url": final, "bytes": len(html)})
        print(f"fronly_{name}.{side}: HTTP {st} ({len(html)} bytes)")

with open(os.path.join(OUT, "manifest.json"), "w") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)
print("DONE")
