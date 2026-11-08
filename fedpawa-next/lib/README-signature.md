# Signature électronique — interrupteur de mise en service

La fonctionnalité de signature (`/espace-client/signature`) est **volontairement invisible par défaut**. Elle n'apparaît que si la valeur de build `NEXT_PUBLIC_SIGNATURE_ENABLED` vaut exactement `true`.

## Pourquoi

L'interface et l'API ne se déploient pas ensemble :

- l'interface vit dans ce dépôt (`/root/fedpawa-next`), partagé entre l'environnement de production et la pile de test ;
- les routes API de signature (`/api/v1/signature/*`) n'existent aujourd'hui que dans la copie de travail de l'API utilisée par la pile de test.

Conséquence à éviter : un rebuild de production de l'interface afficherait « Signer un contrat » à de vrais clients, alors que l'API de production ne connaît pas encore ces routes — le client cliquerait sur un bouton mort. L'interrupteur, désactivé par défaut, rend cette erreur impossible.

## Comment activer

Au moment du build de l'image (la valeur est figée à la compilation, ce n'est pas une variable d'exécution) :

```bash
docker build -t fedpawa-next:test \
  --build-arg NEXT_PUBLIC_API_URL=http://app-test.fedpawa.com \
  --build-arg NEXT_PUBLIC_SIGNATURE_ENABLED=true \
  /root/fedpawa-next
```

Sans l'argument `NEXT_PUBLIC_SIGNATURE_ENABLED`, le Dockerfile applique `false` : entrée de navigation masquée, et un accès direct à l'URL affiche un message d'indisponibilité au lieu d'un écran cassé.

## Ordre de promotion en production

1. Promouvoir d'abord **l'API** (migrations `signature_dossiers` et `signature_audit_events`, services, routes) et vérifier la chaîne complète en production.
2. Vérifier que la remise des codes fonctionne réellement vers une boîte externe (relais SMTP sur le port 587 — le port 25 sortant est bloqué par l'hébergeur).
3. Reconstruire **l'interface** avec `NEXT_PUBLIC_SIGNATURE_ENABLED=true`.

Ne jamais inverser l'ordre : une interface active devant une API absente est visible par le client, l'inverse ne l'est pas.

## Fichiers concernés

- `components/espace-client/Component.tsx` — entrée « Signer un contrat » (barre latérale et onglets mobiles), conditionnée par l'interrupteur.
- `app/(site)/espace-client/signature/page.tsx` et `.../signature/[id]/page.tsx` — message d'indisponibilité si l'interrupteur est éteint.
- `components/espace-client/signature/*` — liste des contrats à signer, dossier de signature (aperçu, consentement, code, pavé de signature, résultat).
- `lib/signature.ts` — client typé des routes `/api/v1/signature/*`.
- `Dockerfile` — déclaration de l'argument de build, valeur par défaut `false`.

## Points ouverts côté serveur

- Aucune unicité dossier/abonnement : chaque clic sur « Signer » crée un nouveau dossier. À contraindre côté API (un dossier scellé par contrat, les brouillons réutilisés).
- Pas d'endpoint dédié aux contrats en attente de signature : l'interface déduit la liste de `GET /api/v1/dashboard` (contrats sans date de signature). Un endpoint explicite serait plus solide.
