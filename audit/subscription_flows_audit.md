# Audit E2E — Workflows de souscription (2e tour de ronde)
Date: 2026-10-17 · Cible: conteneur dev http://127.0.0.1:18081 (miroir de prod) · Code NON modifié (audit lecture seule)

## Méthodologie
Parcours réels en navigateur (Playwright/chromium-1234, viewport desktop + mobile 375px), étape par étape, en utilisateur:
visiteur → garde auth → inscription compte neuf (formulaire UI) → login → formulaire service étape par étape →
paiement Mobile Money (mode démo) → vérification Espace Client + base SQLite (lecture seule).
23 captures d'écran: `audit/wf2_*.png`. Données de test purgées à la fin (16 clients sw2-*).

## Résultat par voie

### A — Création d'entreprise (tunnel, pack standard 100 000) — ⚠ parcours OK, finalisation cassée
- Garde auth avec `next=` ✓ · Inscription UI ✓ (toggle "Créer un compte", 8 champs + CGU) · Retour au tunnel après login ✓
- Étapes 1-3 (Projet → Dirigeant → Documents) validées via les vrais boutons ✓ · Récap 102 000 FCFA (frais 2% corrects) ✓
- Paiement MM modal (numéro + opérateur Orange) ✓ → **écran « ✅ Paiement confirmé »** …
- **MAIS**: aucun appel à `/api/paiement/verifier` — abonnement **`en_attente`** à vie en base, **0 facture**. Preuves: `wf2_a10_sequence.png` (modal confirmé), trace réseau (seul appel: `POST /api/souscription` → `payment_pending`).

### B — OAPI (tunnel, protect_brand 200 000) — ⚠ même défaut
Total 204 000 ✓ · mêmes étapes ✓ · « Paiement confirmé » affiché · abo `en_attente`, 0 facture.

### C — Fiscalité (tunnel, simplifié 35 000) — ⚠ même défaut
Total 35 700 ✓ · « Paiement confirmé » · abo `en_attente`, 0 facture.

### D — Contrats (tunnel, standard 50 000) — ⚠ même défaut
Total 51 000 ✓ · « Paiement confirmé » · abo `en_attente`, 0 facture. (Flux « juriste recontacte » cohérent pour ce service, mais le libellé "paiement confirmé" reste faux.)

### E — Domiciliation via tunnel → redirection vers formulaire dédié ✓ (intentionnel)
`tunnel_souscription.php?service=domiciliation` redirige (JS) vers `souscription_domiciliation.php?pack=<planId>` ✓

### F — Domiciliation dédiée (national-business 45 000/mois) — ❌ finalisation contrat INATTEIGNABLE
- CTAs de la page domiciliation: 6 packs valides présélectionnés ✓ … mais le **CTA header global « Je m'abonne » utilise `pack=essentiel` (inexistant)** → select pack vide, aucune erreur affichée (`wf2_f_pack_essentiel.png`)
- Étapes 1-5 (Situation → Représentant → Coordonnées → Formule → KYC) ✓ · Validation bloquante avec messages d'erreur précis et scroll auto ✓ (pièce d'identité manquante signalée)
- Upload des 3 pièces (CNI, justificatif, logo) via inputs file (dropzones) ✓ → **Étape 7 Facture Proforma** avec TVA 19,25% affichée (7 264 / 45 000) ✓ (`wf2_f_proforma3.png`)
- Paiement MM 45 000 ✓ → **« Souscription enregistrée ! »** …
- **MAIS**: `contract: true` est passé à `FedpawaPay.momoScreen`, or `onSubmit` (souscription_domiciliation.js) ne retourne PAS le champ `api` attendu par fedpawa-pay.js pour lancer `contractFlowScreen` (écran « Paiement en cours de confirmation » + bouton **« Vérifier mon paiement »** + génération du contrat + signature OTP).
- Résultat: le bouton "Vérifier mon paiement" (btnVerifyPay) **n'apparaît jamais** → abonnement `en_attente`, **0 facture, 0 contrat**, l'OTP de signature (`signature_otp` renvoyé par l'API, ex. 949240) n'est jamais consommé.
- Le flux contrat complet n'est atteignable par AUCUNE voie UI: tunnel.js redirige vers le form dédié, et le form dédié ne déclenche pas contractFlow.

## Problèmes identifiés (vérifiés, re-vérifiés)

### S-1 [Moyen] CTA global « Je m'abonne » → pack inexistant
`templates/partials/site-header.php:123` + `site-header-standalone.html:52`: `tunnel_souscription.php?service=domiciliation&pack=essentiel`.
Les packs domiciliation valides sont `national-essential|business|premium`, `international-*`. `pack=essentiel` → select vide, aucune pré-sélection, aucun message. L'utilisateur perd le bénéfice du CTA (il doit deviner qu'il faut re-choisir un pack). Preuve: `wf2_s1_pack_vide.png`.
Fix: `pack=national-essential` (ou supprimer le paramètre).

### S-2 [Critique] « Paiement confirmé » affiché sans paiement réel ni vérification (4 services tunnel)
fedpawa-pay.js `simplePaidFlow` affiche « ✅ Paiement confirmé / Votre paiement a bien été reçu » dès que `POST /api/souscription` répond `payment_pending`. Aucun appel à `/api/paiement/verifier` n'est fait pour les services sans contrat (création, oapi, fiscalité, contrats). L'abonnement reste `en_attente` indéfiniment, aucune facture n'est créée, et l'Espace Client n'offre AUCUN moyen de finaliser (pas de bouton "vérifier/relancer le paiement").
- En mode démo: le client croit avoir payé, rien n'est enregistré comme payé.
- En prod réelle (Campay): le client doit confirmer par USSD puis la vérification doit être déclenchée — ici l'écran de confirmation apparait AVANT toute confirmation réelle.
Impact: perte de confiance majeure + dossiers qui traînent en attente sans action possible côté client.
Fix proposé: pour les 4 services, après `payment_pending`, afficher l'écran de vérification (comme contractFlow) avec bouton « Vérifier mon paiement » qui appelle `/api/paiement/verifier`, et/ou auto-vérification en mode démo. En cas de paiement non confirmé, afficher « Paiement en attente de confirmation » (pas "confirmé").

### S-3 [Majeur] Domiciliation: le flux contrat + signature OTP est inatteignable (dead code UI)
souscription_domiciliation.js passe `contract: true` mais son `onSubmit` retourne `{ok, message, subscription_ref}` sans le champ `api` (les données `subscription_id`/`otp` renvoyées par le serveur). fedpawa-pay.js exige `res.api` pour afficher `contractFlowScreen` (bouton « Vérifier mon paiement » → `/api/paiement/verifier` → génération contrat → écran signature OTP). Résultat E2E: « Souscription enregistrée ! », abo `en_attente`, 0 contrat, OTP jamais utilisé. Le seul service prévu pour contrat+signature ne finalise jamais.
Fix: retourner `api: out` dans le `onSubmit` de souscription_domiciliation.js (comme le fait tunnel.js).

### S-4 [Mineur] Tunnel étape 3 (oapi): bouton « Voir le récapitulatif → » ne matche pas le pattern des autres étapes
Les étapes 1-2 utilisent « Continuer → », l'étape 3 oapi « Voir le récapitulatif → » (incohérence de libellé, pas de blocage). Confirmé sur le DOM (`onclick="validateStep(3, 4)"` fonctionne).

### S-5 [Mineur] Select civilité inscription: valeur vide par défaut requise
`#civility` (required) garde la valeur `""` ("Sélectionner") par défaut → soumission bloquée par la bulle HTML5 si l'utilisateur oublie. Comportement standard mais la première option ne devrait pas être un placeholder requis.

### S-6 [Observation] Register n'auto-connecte pas
Après « Compte créé avec succès ! Connectez-vous. » l'utilisateur doit re-saisir email+mot de passe. Le `?next=` est bien conservé à travers la bascule login → retour au tunnel ✓. Frottement UX évitable (auto-login après inscription), mais pas un bug.

## Ce qui fonctionne bien
- Garde d'authentification systématique avec `next=` fidèle (y compris URL encodée) — retour au tunnel/souscription après login, même en cours de parcours.
- Frais de transaction 2% calculés et affichés correctement partout (102 000 / 204 000 / 35 700 / 51 000).
- Facture proforma domiciliation: TVA 19,25% affichée, totaux justes, étapes claires, validation bloquante avec messages précis + scrollIntoView.
- Pages vitrine (9 pages FR + 2 EN testées): 0 image cassée, 0 placeholder, 0 fuite FR/EN, H1 corrects, aucune 404.
- Redirection tunnel sans service → `index.php#services` (élégant) · service inconnu → garde auth (pas de fuite).
- Throttle, CSRF, sessions: aucune erreur de console JS bloquante sur l'ensemble du parcours.

## Détail technique des preuves
- Réseau voie A: `POST /api/souscription 200 → {"status":"payment_pending","transaction_id":"DEMO-SUB-76"...}` puis PLUS AUCUN appel API avant l'écran confirmé.
- Voie F: `POST /api/souscription 200 → {"status":"payment_pending",...,"signature_otp":"949240"}` — l'OTP est renvoyé mais jamais demandé à l'utilisateur (l'écran signature n'apparaît pas).
- Base après tests (avant purge): abonnements 76-80 tous `en_attente`, factures 0, contrats 0.
