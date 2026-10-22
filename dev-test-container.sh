#!/bin/bash
# Fedpawa — relance le conteneur de test bind-mounté (éditions live, zéro rebuild)
# Usage: ./dev-test-container.sh [image]   (défaut: fedpawa-api-lane2:test)
IMAGE="${1:-fedpawa-api-lane2:test}"
docker rm -f fedpawa-api-test >/dev/null 2>&1
docker run -d --name fedpawa-api-test \
  -p 127.0.0.1:18081:8080 \
  -v /root/Fedpawa/fedpawa_light/public:/app/public \
  -v /root/Fedpawa/fedpawa_light/templates:/app/templates \
  -v /root/Fedpawa/fedpawa_light/src:/app/src \
  -v /root/fedpawa-data/storage:/app/storage \
  -e CAMPAY_ENABLED="${CAMPAY_ENABLED:-0}" \
  -e CAMPAY_MODE="${CAMPAY_MODE:-demo}" \
  -e CAMPAY_ORANGE=237691704802 \
  -e CAMPAY_MTN=237650863195 \
  ${CAMPAY_ENV_FLAGS:-} \
  "$IMAGE" >/dev/null
sleep 2
code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18081/api/csrf-token)
echo "conteneur test: HTTP $code sur http://127.0.0.1:18081 (bind-mount live)"
