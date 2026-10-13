#!/bin/bash
# Fedpawa — lance la suite de tests E2E en arrière-plan contre le conteneur de test (18081)
# Usage: ./run-tests-bg.sh [suites...]   (défaut: toutes)
mkdir -p /root/Fedpawa/test-reports
TS=$(date +%Y%m%d-%H%M%S)
OUT=/root/Fedpawa/test-reports/rapport-$TS
BASE=http://127.0.0.1:18081
cd /root/Fedpawa

SUITES=("$@")
[ ${#SUITES[@]} -eq 0 ] && SUITES=(lane3-services payment-flow tunnel-v3 contract-flow audit-cross audit-flux2 domiciliation-stepper domiciliation-mobile etape4-packs plan-sync smart)

echo "=== Rapport E2E $TS — base $BASE ===" > "$OUT.txt"
TOTAL_PASS=0; TOTAL_FAIL=0
FAILED_SUITES=()
for t in "${SUITES[@]}"; do
  if [ -f "verify-$t.mjs" ]; then
    out=$(node "verify-$t.mjs" "$BASE" 2>&1); rc=$?
    summary=$(printf '%s' "$out" | python3 /root/Fedpawa/parse-test-output.py)
    echo "$t: $summary (exit=$rc)" >> "$OUT.txt"
    printf '%s' "$out" > "$OUT-$t.log"
    if [ "$rc" != "0" ]; then TOTAL_FAIL=$((TOTAL_FAIL+1)); FAILED_SUITES+=("$t"); else TOTAL_PASS=$((TOTAL_PASS+1)); fi
  fi
done
echo "=== $TOTAL_PASS suites OK, $TOTAL_FAIL en échec: ${FAILED_SUITES[*]:-aucune} ===" >> "$OUT.txt"
cat "$OUT.txt"
