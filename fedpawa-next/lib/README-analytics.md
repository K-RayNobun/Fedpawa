# Mesure d'audience navigateur — interrupteur de mise en service

La mesure « temps actif » (`public/analytics-collect.js`, injectée par
`components/AnalyticsBeacon.tsx` dans les layouts racine FR et EN) est
**volontairement inactive par défaut** : elle ne s'active que si la valeur de
build `NEXT_PUBLIC_ANALYTICS_ENABLED` vaut exactement `true`.

## Pourquoi le même pattern que la signature

- La valeur est figée à la **compilation** (build Docker), pas à l'exécution :
  sans `--build-arg NEXT_PUBLIC_ANALYTICS_ENABLED=true`, le Dockerfile applique
  `false` et aucun script de mesure n'est servi ni exécuté.
- Le collecteur (`/collect` → 127.0.0.1:8020, service
  `fedpawa-collecteur.service`) existe indépendamment : activer le frontend sans
  collecteur produirait des erreurs réseau silencieuses côté client ; activer le
  collecteur sans frontend ne collecte que les appels directs à `/collect`.

## Activation (test)

```bash
docker build -t fedpawa-next:test \
  --build-arg NEXT_PUBLIC_API_URL=http://app-test.fedpawa.com \
  --build-arg NEXT_PUBLIC_ANALYTICS_ENABLED=true \
  /root/fedpawa-next
```

## Ce qui est envoyé (et quand)

Vers `/collect` (même origine, `navigator.sendBeacon` à la sortie) :
`{session_id, chemin, titre, evenement, temps_visible_ms, temps_focus_ms}`

- `vue` à l'ouverture de la page (et à chaque navigation SPA détectée) ;
- `coeur` toutes les 30 s **uniquement si** `document.visibilityState === "visible"`
  **et** `document.hasFocus()` — une page en arrière-plan n'émet aucun battement ;
- `sortie` via `sendBeacon` au `pagehide` et au passage en arrière-plan.

`temps_visible_ms` / `temps_focus_ms` sont **cumulatifs** par (session, page) :
le tableau de bord prend le MAX par groupe, jamais la somme.

## Fichiers concernés

- `public/analytics-collect.js` — script de mesure autonome (un seul fichier) ;
- `components/AnalyticsBeacon.tsx` — branchement conditionnel ;
- `app/(site)/layout.tsx`, `app/en/layout.tsx` — montage dans `<body>` ;
- `Dockerfile` — `ARG NEXT_PUBLIC_ANALYTICS_ENABLED=false`.

## Côté serveur (hors dépôt frontend)

- `/root/fedpawa-analytics/collecteur.py` — service 127.0.0.1:8020, publié par
  Caddy sur `/collect` (app.fedpawa.com et app-test.fedpawa.com) ;
- rétention, purge, rate limit, validation : voir
  `/root/fedpawa-analytics/REGISTRE-CONFORMITE.md`.
