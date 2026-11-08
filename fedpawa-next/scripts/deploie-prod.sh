#!/usr/bin/env bash
# ==========================================================
# FEDPAWA — deploie-prod.sh (worker A) — PRÉPARÉ, NON EXÉCUTÉ
# Déploiement PROD de fedpawa-next : rebuild image + recréation
# du conteneur 127.0.0.1:3000, avec rollback documenté.
# L'orchestrateur exécute ce script après vérification
# indépendante (brief A, étape 4 : NE PAS exécuter soi-même).
#
# Interrupteur d'interruption < 60 s : l'image est rebuildée
# AVANT d'arrêter l'ancien conteneur ; le swap ne dure que
# le temps d'un `docker rm -f` + `docker run` (~2-5 s).
# ==========================================================
set -euo pipefail

IMAGE_OLD="fedpawa-next:prod"
IMAGE_NEW="fedpawa-next:prod"
TAG_ROLLBACK="fedpawa-next:prod-pre-deploy-$(date -u +%Y%m%dT%H%M%SZ)"
CONTAINER="fedpawa-next"
PORT="127.0.0.1:3000:3000"
SRC="/root/fedpawa-next"
API_URL="https://www.fedpawa.com"

echo "== 1/6 Sauvegarde de l'image prod actuelle (rollback) =="
docker tag "$IMAGE_OLD" "$TAG_ROLLBACK"
echo "Image de rollback taguée : $TAG_ROLLBACK"

echo "== 2/6 Rebuild de l'image prod (AVANT tout arrêt) =="
docker build \
  --build-arg NEXT_PUBLIC_API_URL="$API_URL" \
  -t "$IMAGE_NEW" \
  "$SRC"

echo "== 3/6 Vérification de santé de la NOUVELLE image (conteneur jetable) =="
TEST_CID="$(docker create --name "${CONTAINER}-healthcheck" -p 127.0.0.1:3999:3000 "$IMAGE_NEW")"
docker start "$TEST_CID"
for i in $(seq 1 20); do
  code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3999/ || true)"
  if [ "$code" = "200" ]; then echo "healthcheck OK (HTTP $code) après ${i} essai(s)"; break; fi
  sleep 1
done
code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3999/espace-client/parametres || true)"
echo "GET /espace-client/parametres (nouvelle image) -> $code"
curl -s -o /dev/null -w 'GET /verification-email (nouvelle image) -> %{http_code}\n' 'http://127.0.0.1:3999/verification-email?token=healthcheck'
curl -s -o /dev/null -w 'GET /manifest.webmanifest -> %{http_code}\n' http://127.0.0.1:3999/manifest.webmanifest
curl -s -o /dev/null -w 'GET /sw.js -> %{http_code}\n' http://127.0.0.1:3999/sw.js
docker rm -f "$TEST_CID" >/dev/null
echo "Conteneur de healthcheck supprimé."

echo "== 4/6 Swap du conteneur prod (interruption < 60 s) =="
docker rm -f "$CONTAINER"
docker run -d --name "$CONTAINER" --restart unless-stopped -p "$PORT" "$IMAGE_NEW"

echo "== 5/6 Vérifications post-deploy (voir CHECKLIST-DEPLOI-PROD.md) =="
sleep 3
docker ps --format '{{.Names}} {{.Image}} {{.Status}} {{.Ports}}' | grep "$CONTAINER" || true
for p in / /espace-client /espace-client/parametres /verification-email /manifest.webmanifest /sw.js /icons/icon-192x192.png /icons/icon-512x512.png /offline.html; do
  curl -s -o /dev/null -w "GET $p -> %{http_code}\n" "https://app.fedpawa.com$p"
done

echo "== 6/6 Terminé. Rollback si régression : voir CHECKLIST-DEPLOI-PROD.md § Rollback =="
echo "Image de rollback disponible : $TAG_ROLLBACK"
