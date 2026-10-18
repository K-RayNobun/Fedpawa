# CTX L009 — Espace client: composant « Changer de Pack / Ajouter des options »

## Besoin utilisateur (verbatim, 18/10/2026)
Depuis l'espace client, bouton « Changer de Pack / Ajouter des options » doit ouvrir un
COMPOSANT ADDITIONNEL SUR LA MÊME PAGE (pas une redirection immédiate) qui présente les
différents packs selon le service recherché. Cliquer un pack → redirige vers le formulaire
de souscription de CE pack. Composant optionnel, affiché seulement si la personne veut
souscrire à un autre pack.

### Conditions
1. Pack ACTIF en cours → texte de WARNING dans le composant : le client doit d'abord épuiser
   son pack actuel avant de souscrire à un autre (les packs restent consultables, mais la
   souscription est clairement conditionnée — afficher le warning de façon visible).
2. PAS de pack actif MAIS abonnement passé existant (abonnements historiques en base) →
   dans la section « Mon Abonnement » : un texte + DEUX boutons :
   - « Souscrire à nouveau » (ressouscrire)
   - « Changer de pack »
   (les deux ouvrent le même composant).

## Cartographie technique (vérifiée par l'orchestrateur)
- Page: `/root/Fedpawa/fedpawa_light/public/espace_client.html`
  - Tab abonnement: `<div class="db-tab-content" id="tab-abonnement">` (ligne ~97)
  - Bouton actuel: ligne ~105 `<button class="btn btn-outline">Changer de pack / Ajouter des options</button>`
- JS: `/root/Fedpawa/fedpawa_light/public/assets/js/dashboard.js`
  - Handler actuel lignes ~239-250: redirige DIRECT vers tunnel (`changePackBtn`)
  - `window.__lastSub` = abonnement courant (SELECT * abonnements: id, client_id, pack, statut, dates)
  - `loadDashboardData()` pose `window.__lastSub` — data = {client, subscription, factures, ...}
  - Pack→service map existante: PACK2SERVICE (standard:creation, protect_brand/anteriorite/brevets:oapi,
    simplifie/reel:fiscalite, complexe:contrats, national-*/international-*:domiciliation)
- CATALOGUE SOURCE DE VÉRITÉ: `/root/Fedpawa/fedpawa_light/public/assets/js/tunnel.js` lignes 35-64:
  `const PLANS = { creation: {...}, oapi: {...}, fiscalite: {...}, contrats: {...}, domiciliation: {6 packs}, recouvrement: {...} }`
  → NE PAS dupliquer ces données en dur: le composant doit les lire depuis tunnel.js si
  possible, sinon les exposer via `window.PLANS` (éditer tunnel.js pour exposer
  `window.FP_PLANS = PLANS;` UNE ligne, et lire depuis dashboard.js).
- Routing souscription (déjà fonctionnel):
  - Services tunnel: `tunnel_souscription.php?service=X&pack=Y` (création, oapi, fiscalite, contrats)
  - Domiciliation: `souscription_domiciliation.php?pack=Y`
- API dashboard: réponse de /api/dashboard → data.subscription = abonnement actif ou null;
  si data expose aussi les anciens abonnements, VÉRIFIER dans DashboardController
  (/root/Fedpawa/fedpawa_light/src/Controller/DashboardController.php). Si les abonnements
  passés ne sont pas exposés, les ajouter (data.pastSubscriptions = liste) — c'est la
  condition n°2 qui en dépend.
- Statuts d'abonnement en base (sqlite /root/fedpawa-data/storage/fedpawa.sqlite):
  statuts possibles: 'actif', 'en_attente', 'expire', 'resilie'... VÉRIFIER les valeurs
  réelles avant d'écrire la condition (SELECT DISTINCT statut FROM abonnements).

## Implémentation attendue
1. espace_client.html: composant inline dans #tab-abonnement, caché par défaut
   (style="display:none" ou classe), structure: header « Choisissez votre nouveau pack »,
   warning-zone (condition 1), groupes par service avec cartes packs (label + prix + unit),
   chaque carte cliquable → window.location.href vers le bon formulaire.
2. dashboard.js:
   - Bouton → toggle le composant (plus de redirection directe).
   - Condition 1: si `window.__lastSub` && statut actif → afficher warning jaune/orange
     dans le composant (texte: « Vous avez un pack en cours. Vous devez d'abord épuiser
     votre pack actuel avant de souscrire à un autre. ») + NE PAS bloquer la navigation
     (le client peut voir les packs), mais le warning doit être visible AVANT tout clic.
   - Condition 2: pas d'abonnement actif → si le client a des abonnements passés
     (data.pastSubscriptions.length > 0), afficher dans le tab abonnement: texte
     « Vous n'avez pas de pack actif actuellement. » + 2 boutons « Souscrire à nouveau » /
     « Changer de pack » (les 2 ouvrent le composant).
   - Les cartes packs: rendu JS depuis window.FP_PLANS (pas de HTML en dur).
3. UI: réutiliser les classes existantes (db-tab-content, btn btn-outline, badge) — style
   cohérent dashboard.css. Responsive mobile: grille 1 colonne < 640px.
4. Bump versions: dashboard.js?v=6→7 et dashboard.css?v=6→7 dans espace_client.html
   (toutes les pages qui chargent dashboard.js/css doivent être bumpées: authentification.html,
   espace_client.html, admin_dashboard.html, mot_de_passe_oublie.html, tunnel_souscription.php,
   souscription_domiciliation.php, en/domiciliation.php).
   ATTENTION piège documenté: le site est servi depuis public/ — JAMAIS depuis dist/.

## Définition of Done (E2E obligatoire, playwright sur http://127.0.0.1:18081)
- Client AVEC abonnement actif (compte de test: créer via tunnel si besoin, ou manipuler la
  base sqlite de test): clic bouton → composant s'ouvre SUR LA PAGE, warning visible,
  6+ packs visibles groupés par service, clic sur un pack domiciliation → atterrit sur
  souscription_domiciliation.php?pack=... ; clic pack tunnel → tunnel_souscription.php?service=...
- Client SANS abonnement actif MAIS avec passé: texte + 2 boutons visibles, les 2 ouvrent
  le composant.
- php -l sur les .php modifiés; node --check sur les .js modifiés.
- Captures d'écran /root/Fedpawa/audit/l009_*.png
- Loguer chaque avancée dans state/lanes/L009.md (protocole PROTOCOL.md).
