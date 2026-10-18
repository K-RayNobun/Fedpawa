# CTX L005 — Correctifs UX groupés: S-1 + F3' + F6' + F12

## Fichiers EXCLUSIFS
templates/partials/site-header.php, templates/partials/site-header-standalone.html, public/assets/js/dashboard.js, public/espace_client.html, public/authentification.html, public/assets/css/dashboard.css (si besoin). INTERDIT: version bumps, commit, push, docker, fichiers des autres lanes.

## S-1 [Moyen] — CTA global « Je m'abonne » → pack inexistant
- site-header.php:123 et site-header-standalone.html:52: href `tunnel_souscription.php?service=domiciliation&pack=essentiel`. Or les packs domiciliation valides (PLANS dans souscription_domiciliation.js) = national-essential|business|premium, international-*. `pack=essentiel` → select vide, aucune présélection, aucun message.
- Fix: `pack=national-essential` (vérifier le libellé exact dans les PLANS d'abord).
- Test: :18081/creation_entreprise.php (login client requis pour passer la garde) → depuis le HTML servi, href correct; en navigateur: clic → souscription_domiciliation.php?pack=national-essential → #pack value = national-essential.

## F3' [Moyen] — « Chargement… » persistant (cartes KYC + Dernier courrier)
- dashboard.js: pour un client PAYÉ sans KYC ni courrier, les cartes « CONFORMITÉ (KYC) » et « DERNIER COURRIER REÇU » de l'aperçu gardent « Chargement… » en sous-valeur (l'état vide n'est jamais résolu — pas de else).
- Fix: quand il n'y a pas de donnée, remplacer la sous-valeur par « — » (cohérent avec ce que fait la carte abonnement). Chercher où les sub-value des overviewCards sont remplies.
- Test: client fixl5- avec abonnement actif (via /api/souscription + /api/paiement/verifier, pattern W-10) mais sans KYC/courriers → ouvrir espace_client.html → 0 « Chargement… » restant après chargement (attendre 2.5s).

## F6' [Mineur] — « Changer de pack » redirige toujours vers la domiciliation
- dashboard.js: le bouton (onglet abonnement) envoie vers souscription_domiciliation.php quel que soit le service de l'abonnement.
- Fix: router selon le service de l'abonnement courant (domiciliation → form dédié; sinon → tunnel_souscription.php?service=<service>&pack=<pack existant du PLANS tunnel.js>). Utiliser les données déjà chargées de /api/dashboard.
- Test: abo création actif → clic « Changer de pack » → URL tunnel_souscription.php?service=creation (PAS domiciliation).

## F12 [Mineur] — autocomplete des mots de passe
- authentification.html: #login_password → autocomplete="current-password"; #signup_password et #confirm_password → autocomplete="new-password".
- Test: attributs présents dans le DOM.

## Pattern Playwright + API
(import: /root/lofi-cities/tools/node_modules/playwright-core/index.mjs; executablePath /root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome, ['--no-sandbox'])
- CSRF: GET /api/csrf-token → header X-CSRF-Token sur tout POST /api/*.
- Abonnement actif express: register → login → POST /api/souscription {service:'creation', pack:'standard', plan:'standard', planLabel:'Standard', prix:102000, paymentMethod:'momo', momo_phone:'+237 699 11 22 33', momo_operator:'orange', nom, name, email, telephone, denomination:'X', forme_juridique:'SARL', activite:'Services', ville:'Douala'} → POST /api/paiement/verifier {sub_id}.
- `:visible` invalide en querySelectorAll (offsetParent); regex \n fragiles (split(String.fromCharCode(10))).

## Purge (volume partagé prod!)
DELETE clients fixl5-% + 8 tables par client_id. Vérifier 0 restant.
Budget: 35 min max. Un mini-E2E par fix, log de chaque via lane.py. Screenshots /root/Fedpawa/audit/fix_l5_*.png si utile.
