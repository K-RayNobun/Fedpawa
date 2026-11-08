# CHECKLIST-DEPLOI-PROD — fedpawa-next (worker A, 2026-10-31)

Script associé : `scripts/deploie-prod.sh` (préparé, **non exécuté** — l'orchestrateur le lance après vérification indépendante).

## Pré-requis (à vérifier avant)
- [ ] Build local OK : `NEXT_PUBLIC_API_URL=https://app.fedpawa.com npx tsc -p tsconfig.json --noEmit` → exit 0 (fait le 2026-10-31).
- [ ] `npm run build` OK, route `/espace-client/parametres` présente dans le build (fait le 2026-10-31).
- [ ] Image test `fedpawa-next:test` rebuildée et conteneur `fedpawa-next-test` (127.0.0.1:3001) vérifié : `/espace-client/parametres` 200, `/verification-email` 200, `/en/verification-email` 200, `/manifest.webmanifest` 200, `/sw.js` 200 (fait le 2026-10-31, vague A2 vérification e-mail).
- [ ] Aucun changement dans `next.config.ts` actif hors e2e : le proxy `/api/v1` n'est actif que si `E2E_PROXY_API=1` au build — **non défini** dans `deploie-prod.sh` → aucun rewrite en prod.
- [ ] Git : l'orchestrateur commit les modifications (worker : aucun commit).

## Post-deploy (à cocher par l'orchestrateur)
- [ ] `docker ps` : `fedpawa-next` UP sur `127.0.0.1:3000->3000`, image `fedpawa-next:prod` rebuildée.
- [ ] HTTPS prod : `GET https://app.fedpawa.com/` → 200 ; `/espace-client/parametres` → 200 ; `/verification-email` → 200 (page publique, noindex) ; `/en/verification-email` → 200 ; `/manifest.webmanifest` → 200 `application/manifest+json` ; `/sw.js` → 200 ; icônes 192/512 → 200 `image/png` ; `/offline.html` → 200.
- [ ] API prod inchangée : `GET https://app.fedpawa.com/api/v1/push/vapid` → 200 (clé présente, valeur non loguée).
- [ ] Navigateur (Chrome) : `Page.getInstallabilityErrors` → `[]` ; SW actif ; `beforeinstallprompt` se déclenche (preuve 2026-10-31 sur l'ancienne image : `preuves-A/01-installabilite-prod.json` — à re-jouer sur la nouvelle).
- [ ] Espace client connecté : entrée « Paramètres » visible dans la sidebar et la barre mobile ; page `/espace-client/parametres` rend interrupteur maître + 8 types.
- [ ] Si `GET /api/v1/notifications/preferences` renvoie encore 404 en prod (backend B non déployé côté API prod) : la page affiche le message discret + réessai, **ne plante pas** (comportement prévu et testé côté test).
- [ ] Vague A2 (vérification e-mail) : la bannière/modal n'apparaissent que si `/api/v1/auth/me` renvoie `email_verified:false` ; si l'API prod ne renvoie pas encore le champ, dégradation gracieuse (aucune bannière/modal, gating serveur seul) — comportement prévu. Aucun build-arg nouveau requis (`NEXT_PUBLIC_API_URL=https://app.fedpawa.com` inchangé).
- [ ] Interruption mesurée < 60 s (le script rebuild avant de stopper ; le swap `rm -f` + `run` est de l'ordre de quelques secondes).

## Rollback (si régression constatée)
1. `docker rm -f fedpawa-next`
2. `docker run -d --name fedpawa-next --restart unless-stopped -p 127.0.0.1:3000:3000 <TAG_ROLLBACK>`
   où `<TAG_ROLLBACK>` = image taguée par le script au step 1 (ex. `fedpawa-next:prod-pre-deploy-<timestamp>` ; liste : `docker images | grep prod-pre-deploy`).
3. Re-vérifier `GET https://app.fedpawa.com/` → 200 et `/sw.js` → 200.
4. Le rollback ne touche que le conteneur front ; l'API prod n'est jamais modifiée par ce déploiement.

## Notes
- `NEXT_PUBLIC_API_URL=https://app.fedpawa.com` au build (même valeur que l'image prod actuelle) → appels API same-origin via le reverse proxy.
- Ne JAMAIS commiter de secret ; les clés VAPID restent dans les .env serveur.
