# L024 — Worker HEAVY : frontend Next.js servi sur app.fedpawa.com

## Périmètre STRICT
- Écritures autorisées **uniquement** dans `/root/fedpawa-next` (ajout de `Dockerfile`, `.dockerignore`, `DEPLOY-L024.md`).
- **Interdit** de modifier `app/`, `components/`, `lib/`, `public/`, `package.json` — le contenu applicatif est validé, on ne le retouche pas.
- **Interdit** de toucher `/root/fedpawa-api`, `/root/Fedpawa`, `/etc/caddy`, `/etc/hosts`, ou tout autre dépôt. L'orchestrateur (session principale) met en ligne l'API Laravel et la configuration Caddy **en parallèle de ton run**.
- Interdit de supprimer un fichier. Patchs chirurgicaux uniquement, jamais de réécriture d'un fichier entier.

## Objectif
Produire l'image Docker `fedpawa-next:prod` et faire tourner le conteneur `fedpawa-next` en écoute sur `127.0.0.1:3000`, prêt à être publié derrière Caddy sur `app.fedpawa.com`.

## Étapes
1. **Attendre l'API Laravel.** L'orchestrateur la met en ligne sur `http://127.0.0.1:8000`. Sonde toutes les 15 s :
   `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/api/user`
   (401, 403 ou 200 = serveur vivant). Borne : 5 minutes maximum. Passé ce délai, continue quand même et note le risque dans ton rapport.
2. **Créer `/root/fedpawa-next/Dockerfile`** (mono-étage, `node:22-alpine`) dans cet ordre :
   - `ARG NEXT_PUBLIC_API_URL` puis `ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL` **avant** `npm run build` (Next.js inline cette variable au build) ;
   - `COPY package*.json` → `npm ci` (mise en cache des couches) ;
   - `COPY . .` ;
   - `RUN npm run build` ;
   - `EXPOSE 3000` ; `CMD ["npm", "run", "start"]`.
3. **Créer `.dockerignore`** : `node_modules`, `.next`, `.git`, `DEPLOY-L024.md`.
4. **Builder** :
   `docker build --build-arg NEXT_PUBLIC_API_URL=https://app.fedpawa.com -t fedpawa-next:prod /root/fedpawa-next`
   Si le build échoue sur un téléchargement vers `https://app.fedpawa.com` (DNS pas encore posé au moment de ton run), ajoute `--build-arg NODE_TLS_REJECT_UNAUTHORIZED=0` et déclare-le dans le Dockerfile en `ENV` **limité à l'étape de build**. Si l'échec persiste, **arrête-toi et rapporte l'erreur exacte** : ne contourne pas en modifiant les sources des pages.
5. **Lancer** :
   `docker run -d --name fedpawa-next --restart unless-stopped -p 127.0.0.1:3000:3000 fedpawa-next:prod`
   (si un conteneur de ce nom existe déjà : `docker rm -f fedpawa-next` avant, c'est ton périmètre).
6. **Vérifier** et coller les sorties brutes dans le journal :
   - `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/` → attendu 200 ;
   - `curl -s http://127.0.0.1:3000/ | head -c 400` → doit contenir du contenu français de Fedpawa ;
   - au moins une route anglaise (`/en`) et une route applicative réelle listée depuis `ls /root/fedpawa-next/app` ;
   - un asset `/_next/static/...` extrait du HTML → 200.

## Journal exigé
Écris `/root/fedpawa-next/DEPLOY-L024.md` **au fil de l'eau** (pas à la fin) : une entrée par étape, avec la commande exacte et sa sortie brute. Un run qui meurt sans journal est un run perdu.

## Preuve d'intégrité (clause)
Ne rapporte que ce qui est prouvé par artefact : sortie de `docker images | grep fedpawa-next`, sortie de `docker ps`, codes HTTP observés. Un rapport optimiste sans preuve = lane rejetée. Le champ `points_echoues` est obligatoire : déclarer un échec vaut mieux qu'inventer un succès.

## Contrat de sortie (JSON)
`{"image": "...", "container_running": bool, "http_code": 0, "routes_verifiees": [], "fichiers_crees": [], "points_echoues": [], "preuves": []}`
