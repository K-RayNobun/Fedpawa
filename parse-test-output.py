#!/usr/bin/env python3
"""Parse la sortie d'une suite E2E Fedpawa -> résumé lisible sur une ligne."""
import sys, json, re

raw = sys.stdin.read()
m = re.search(r'\{[\s\S]*\}', raw)
try:
    d = json.loads(m.group(0)) if m else {}
    if 'cases' in d:
        print(f"{d['total']-d['failed']}/{d['total']}")
    elif 'failCount' in d:
        print("OK" if d['failCount'] == 0 else f"KO {d['failCount']} échecs")
    elif 'pass' in d:
        print("OK" if d['pass'] else "KO")
    else:
        print('?')
except Exception:
    m2 = re.search(r'Total:\s*(\d+)\s*\|\s*Passed:\s*(\d+)\s*\|\s*Failed:\s*(\d+)', raw)
    print(f"{m2.group(2)}/{m2.group(1)}" if m2 else '?')
