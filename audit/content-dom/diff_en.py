#!/usr/bin/env python3
"""Comparaison mot à mot v2 : gère correctement replace/delete/insert."""
import json, difflib, re, os

RAW = "/root/Fedpawa/audit/content-dom/raw_en"
with open(os.path.join(RAW, "extracted.json")) as f:
    data = json.load(f)

def sentences(text):
    t = re.sub(r"\s+", " ", text).strip()
    parts = re.split(r"(?<=[.!?…])\s+(?=[A-Z0-9À-ÿ«“(])", t)
    return [p.strip() for p in parts if p.strip()]

def diff_page(php, nxt):
    a, b = sentences(php["text"]), sentences(nxt["text"])
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    missing, added, replaced = [], [], []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        if tag in ("replace", "delete"):
            # si delete seul (j1==j2) ou replace: pairer si possible
            for k in range(i1, i2):
                # chercher une phrase next "proche" pour l'appariement
                if tag == "replace" and j1 < j2:
                    l = j1 + (k - i1) if (k - i1) < (j2 - j1) else j2 - 1
                    replaced.append({"php": a[k], "next": b[l]})
                else:
                    missing.append(a[k])
        if tag in ("replace", "insert"):
            for l in range(j1, j2):
                if tag == "insert":
                    added.append(b[l])
                elif tag == "replace" and (l - j1) >= (i2 - i1):
                    added.append(b[l])
    return missing, added, replaced

def meta_diff(php, nxt):
    out = []
    keys = ["title", "description", "og_title", "og_description", "og_locale",
            "og_locale_alt", "twitter_card", "twitter_title", "twitter_description",
            "twitter_image", "lang"]
    for k in keys:
        pv, nv = php.get(k), nxt.get(k)
        # normaliser les entités pour og/twitter (les & vs &)
        if pv != nv:
            out.append({"field": k, "php": pv, "next": nv})
    return out

def norm_entities(s):
    return s.replace("&", "&") if s else s

report = {}
for name, d in data.items():
    php, nxt = d["php"], d["next"]
    missing, added, replaced = diff_page(php, nxt)
    # filtrer les faux "replaced" (identiques après normalisation)
    real_replaced = [r for r in replaced if norm_entities(r["php"]) != norm_entities(r["next"])]
    fake_replaced = len(replaced) - len(real_replaced)
    report[name] = {
        "meta_diff": meta_diff(php, nxt),
        "missing_in_next": missing,
        "added_in_next": added,
        "replaced": real_replaced,
        "counts": {"php_sentences": len(sentences(php["text"])),
                   "next_sentences": len(sentences(nxt["text"])),
                   "missing": len(missing), "added": len(added),
                   "replaced": len(real_replaced)},
    }
    c = report[name]["counts"]
    print(f"== {name}: -{c['missing']} +{c['added']} ~{c['replaced']} (identiquesaprès normalisation: {fake_replaced})")
    for r in real_replaced:
        print(f"   ~ PHP : {r['php'][:150]}")
        print(f"     NEXT: {r['next'][:150]}")
    for m in missing:
        print(f"   - PHP seulement : {m[:150]}")
    for a_ in added:
        print(f"   + Next seulement : {a_[:150]}")

with open(os.path.join(RAW, "diff_report.json"), "w") as f:
    json.dump(report, f, ensure_ascii=False, indent=2)
print("DIFF-V2 OK")
