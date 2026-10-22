# L023 — Campay: tests sandbox + passage live préparé

## Objectif
1. Tests de paiement sandbox Campay (numéros doc) SANS transactions réelles.
2. Basculer l'URL demo → live piloté par env (`CAMPAY_MODE`), préparer tous les pré-requis live.
3. Numéros de réception configurables: CAMPAY_ORANGE=237691704802, CAMPAY_MTN=237650863195.

## Numéros de test Campay (doc officielle)
- 237677777777 MTN : EN ATTENTE → RÉUSSIE
- 237677777770 MTN : EN ATTENTE → ÉCHOUÉE
- 237699999999 Orange : EN ATTENTE → RÉUSSIE
- 237699999990 Orange : EN ATTENTE → ÉCHOUÉE

## Implémentation (en session, mono-perimètre src/Service/CampayService.php + wiring routes)
- `CampayService` : baseUrl piloté par fedpawa_env('CAMPAY_MODE', 'demo') → https://demo.campay.net ou https://www.campay.net.
- Token : `CAMPAY_TOKEN` env (token live direct fourni par l'utilisateur) ; fallback username/password (CAMPAY_USER/CAMPAY_PASSWORD) si absent.
- `getToken()` : si CAMPAY_TOKEN présent → le retourner tel quel (pas d'appel /api/token). Sinon flux actuel.
- Header Authorization existant : `'Authorization: Token ' . $token` (vérifié sur disque par od -c — pas le *** du read_file, c'est le scrubber d'affichage).
- Numéros de réception : pas d'usage direct dans collect (from = numéro client payeur). Exposés en config env CAMPAY_ORANGE/CAMPAY_MTN pour usage futur (ex. affichage "payez au 237691704802"), jamais hardcodés.
- Webhook : conserver handleCampay ; TODO signature à traiter en lane sécurité séparée (pas dans celle-ci).

## Test sandbox (script node, conteneur :18081, CAMPAY_MODE=demo + CAMPAY_ENABLED=1)
- IMPORTANT : les appels sandbox exigent les credentials DEMO (test_user/test_pass par défaut) — vérifier que demo.campay.net accepte ces valeurs par défaut, sinon demander à l'utilisateur.
- collect sur chaque numéro de test → statut attendu EN ATTENTE ; checkStatus → RÉUSSIE/ÉCHOUÉE après délai.
- E2E : process → verifyPayment → statut base paiements.

## Pré-requis live (à poser avant toute transaction réelle)
- CAMPAY_TOKEN dans ~/.hermes/.env (l'utilisateur fournit le token live).
- CAMPAY_MODE=live + CAMPAY_ENABLED=1 sur le conteneur prod AU MOMENT du go-live (jamais avant).
- CAMPAY_ORANGE / CAMPAY_MTN posés en env conteneur.

## Definition of done
- php -l sur CampayService.php + fichiers touchés
- Tests sandbox exécutés (ou cause exacte documentée si credentials demo manquants)
- Code commité ; prod rebuildée seulement à la fin de la vague (pas de go-live sans ton feu vert)
