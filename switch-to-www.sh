#!/bin/bash
# Fedpawa — bascule du site vers www.fedpawa.com
# Prérequis: DNS www + apex créés dans Cloudflare (A → 206.72.195.234, proxifié)
set -e
echo "1) Reload Caddy (www + apex + api→www redirect)..."
systemctl reload caddy || (caddy validate --config /etc/caddy/Caddyfile && systemctl restart caddy)
sleep 2
echo "2) URLs internes → www.fedpawa.com (sitemap, robots, canonical)..."
cd /root/Fedpawa/fedpawa_light/public
sed -i 's#https://api.fedpawa.com#https://www.fedpawa.com#g' sitemap.xml robots.txt
sed -i 's#https://api.fedpawa.com#https://www.fedpawa.com#g' /root/Fedpawa/fedpawa_light/templates/partials/site-header.php
echo "3) Commit + rebuild image + redéploiement prod..."
cd /root/Fedpawa
git add -A && git commit -q -m "Bascule site vers www.fedpawa.com (sitemap/robots/canonical + Caddy)" --no-verify || true
docker build -f Dockerfile.api -t fedpawa-api:latest . 2>&1 | tail -1
docker stop fedpawa-api && docker rm fedpawa-api
docker run -d --name fedpawa-api -p 127.0.0.1:18080:8080 -v /root/fedpawa-data/storage:/app/storage -e CAMPAY_ENABLED=0 --restart unless-stopped fedpawa-api:latest
sleep 3
echo "4) Vérifications:"
curl -s -o /dev/null -w "https://www.fedpawa.com/ → %{http_code}\n" https://www.fedpawa.com/ --max-time 15
curl -s -o /dev/null -w "https://fedpawa.com/ → %{http_code} (301 attendu)\n" https://fedpawa.com/ --max-time 15
curl -s -o /dev/null -w "https://api.fedpawa.com/ → %{http_code} (301 attendu)\n" https://api.fedpawa.com/ --max-time 15
curl -s -o /dev/null -w "https://api.fedpawa.com/api/csrf-token → %{http_code} (200 attendu)\n" https://api.fedpawa.com/api/csrf-token --max-time 15
echo "Terminé."
