#!/bin/bash
# L023 — Go-live Campay: bascule prod sur www.campay.net avec le token de ~/.hermes/.env
# Usage: ./campay-go-live.sh   (à exécuter uniquement sur feu vert utilisateur)
set -e
if ! grep -qE "^CAMPAY_TOKEN=.+" ~/.hermes/.env; then
  echo "ABORT: CAMPAY_TOKEN absent de ~/.hermes/.env"; exit 1
fi
CAMPAY_TOKEN=$(grep -E "^CAMPAY_TOKEN=" ~/.hermes/.env | cut -d= -f2)
[ -z "$CAMPAY_TOKEN" ] && { echo "ABORT: token vide"; exit 1; }
docker stop fedpawa-api && docker rm fedpawa-api
docker run -d --name fedpawa-api --restart unless-stopped \
  -p 127.0.0.1:18080:8080 \
  -v /root/fedpawa-data/storage:/app/storage \
  -e CAMPAY_ENABLED=1 \
  -e CAMPAY_MODE=live \
  -e CAMPAY_TOKEN="$CAMPAY_TOKEN" \
  -e CAMPAY_ORANGE=237691704802 \
  -e CAMPAY_MTN=237650863195 \
  fedpawa-api:latest
sleep 2
echo "prod: HTTP $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:18080/api/csrf-token)"
echo "mode Campay: $(docker exec fedpawa-api printenv CAMPAY_MODE) / enabled=$(docker exec fedpawa-api printenv CAMPAY_ENABLED)"
