# DEPLOY-L024 — journal de déploiement (écrit au fil de l'eau)

- Date (UTC) : 2026-10-29
- Mandat : ctx-L024 — image `fedpawa-next:prod` + conteneur `fedpawa-next` sur 127.0.0.1:3000
- Périmètre d'écriture strict : `/root/fedpawa-next` uniquement (Dockerfile, .dockerignore, DEPLOY-L024.md)
- Aucun fichier applicatif (`app/`, `components/`, `lib/`, `public/`, `package.json`) modifié.

Commande : boucle `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/api/user` toutes les 15 s, borne 5 min.
Sortie brute :
```
20:49:53 tentative 1/20 -> HTTP 000
20:50:08 tentative 2/20 -> HTTP 401
API_VIVANTE code=401
FIN_SONDAGE
```
→ 401 = serveur vivant (route protégée, comportement attendu). Poursuite du mandat.

## Étape 2 — Création de `/root/fedpawa-next/Dockerfile` (mono-étage, node:22-alpine)

Contenu exact écrit :
```dockerfile
FROM node:22-alpine

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
```
`ARG` + `ENV NEXT_PUBLIC_API_URL` placés avant `npm run build` (inlining au build), `COPY package*.json` + `npm ci` avant `COPY . .` pour le cache des couches.

## Étape 3 — Création de `/root/fedpawa-next/.dockerignore`

Contenu exact écrit :
```
node_modules
.next
.git
DEPLOY-L024.md
```

## Étape 4 — Build de l'image `fedpawa-next:prod`

Commande exacte :
```
docker build --build-arg NEXT_PUBLIC_API_URL=https://app.fedpawa.com -t fedpawa-next:prod /root/fedpawa-next
```
Observation préalable (20:50 UTC) : `getent hosts app.fedpawa.com` → exit 2 (non résolu) ; `curl -s -o /dev/null -w '%{http_code}' https://app.fedpawa.com/` → code 000, exit 6 (could not resolve host). Le DNS de `app.fedpawa.com` n'est pas encore posé sur cet hôte au moment du run. Si le build échoue sur un téléchargement vers `https://app.fedpawa.com`, la clause de repli s'applique (`NODE_TLS_REJECT_UNAUTHORIZED=0` en build-arg + `ENV` limité à l'étape de build).

Journal brut intégral du build : `$TMPDIR/build-L024.log`. Sortie brute (extrait) :

```
Step 8/10 : RUN npm run build
> fedpawa-next@0.1.0 build
> next build
▲ Next.js 16.4.3 (Turbopack)
✓ Compiled successfully in 10.8s
  Running TypeScript ...
  Finished TypeScript in 14.4s ...
✓ Generating static pages using 1 worker (42/42) in 3.0s
  Finalizing page optimization ...
Route (app) — extrait brut :
┌ ○ /
├ ○ /_not-found
├ ○ /admin-dashboard
├ ○ /contact
├ ○ /contrats
├ ○ /domiciliation
├ ○ /en
├ ○ /en/contact
├ ○ /en/domiciliation
├ ○ /espace-client
├ ○ /fiscalite
├ ○ /manifest.webmanifest
├ ○ /robots.txt
├ ƒ /sitemap.xml
└ ○ /tunnel-souscription
(42 routes au total, toutes prérendues sans erreur)
 ---> 8b1c18ff36de
Step 9/10 : EXPOSE 3000
Step 10/10 : CMD ["npm", "run", "start"]
Successfully built 3d79faa93a78
Successfully tagged fedpawa-next:prod
BUILD_EXIT=0
```
Aucun échec de téléchargement vers `https://app.fedpawa.com` durant le build (pages statiques, aucun fetch build-time vers l'API) → la clause `NODE_TLS_REJECT_UNAUTHORIZED=0` n'a PAS été nécessaire ; le Dockerfile est resté inchangé.

## Étape 5 — Lancement du conteneur

Commandes exactes :
```
docker rm -f fedpawa-next        # (conteneur inexistant : "No such container: fedpawa-next")
docker run -d --name fedpawa-next --restart unless-stopped -p 127.0.0.1:3000:3000 fedpawa-next:prod
```
Sortie brute :
```
b491bb31d232ed40e95fcfe51e40ae51d9265ed5a487c958cef93c8d9db420c7
=== docker ps ===
NAMES              IMAGE              STATUS          PORTS
fedpawa-next       fedpawa-next:prod  Up 8 seconds    127.0.0.1:3000->3000/tcp
=== ss -ltn ===
LISTEN 0 4096  127.0.0.1:3000  0.0.0.0:*
=== docker logs fedpawa-next ===
▲ Next.js 16.4.3
- Local:   http://localhost:3000
✓ Ready in 286ms
=== docker inspect (fin) ===
fedpawa-next | fedpawa-next:prod | Up About a minute | 127.0.0.1:3000->3000/tcp
RestartPolicy = unless-stopped
Env image = "NEXT_PUBLIC_API_URL=https://app.fedpawa.com"
```

## Étape 6 — Vérifications HTTP (sorties brutes)

```
GET /            -> 200
GET / | head -c 400 -> <!DOCTYPE html><html lang="fr" data-theme="navy" ...><link rel="stylesheet" href="/_next/static/chunks/0gsonx_e6rqv8.css" ...>
<title>/</title>  -> FEDPAWA CORPORATE SOLUTIONS | Infrastructure d'affaires à Douala, Logpom   (contenu FR confirmé ; extrait body : "entreprises, création d'entreprise, conseil fiscal, protection OAPI et rédaction de contrats", "Domiciliation", "Création d'entreprise")
GET /en          -> 200   <title> FEDPAWA CORPORATE SOLUTIONS | Business Infrastructure in Douala, Logpom
Routes applicatives réelles (listées depuis ls /root/fedpawa-next/app) :
/contact -> 200 | /domiciliation -> 200 | /contrats -> 200 | /qui-sommes-nous -> 200
/en/contact -> 200 | /en/domiciliation -> 200
Asset extrait du HTML : /_next/static/chunks/0gsonx_e6rqv8.css -> GET 200
```

## Preuves d'intégrité (artefacts)

```
docker images | grep fedpawa-next
fedpawa-next:prod   3d79faa93a78   1.05GB   306MB

docker ps (final)
fedpawa-next | fedpawa-next:prod | Up About a minute | 127.0.0.1:3000->3000/tcp

ss -ltn
LISTEN 127.0.0.1:3000

Build : Successfully built 3d79faa93a78 / Successfully tagged fedpawa-next:prod / BUILD_EXIT=0
         (journal brut intégral : $TMPDIR/build-L024.log)
Sonde API : 20:50:08 tentative 2/20 -> HTTP 401 sur http://127.0.0.1:8000/api/user (serveur vivant)
```

## Notes / risques

- `app.fedpawa.com` ne résolvait pas sur l'hôte au moment du run (getent exit 2) — **sans impact** : les 42 pages sont prérendues statiquement, aucun fetch build-time vers l'API ; la clause `NODE_TLS_REJECT_UNAUTHORIZED=0` n'a pas été utilisée, le Dockerfile est conforme au mandat à la lettre.
- Aucun fichier hors de `/root/fedpawa-next` n'a été modifié ; `app/`, `components/`, `lib/`, `public/`, `package.json` intacts. Fichiers créés : `Dockerfile`, `.dockerignore`, `DEPLOY-L024.md`.
- Caddy (configuré par l'orchestrateur en parallèle) devra proxifier `app.fedpawa.com` vers `127.0.0.1:3000`.
