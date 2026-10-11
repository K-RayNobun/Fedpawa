# FEDPAWA Corporate Solutions — Plateforme Web

Plateforme officielle de **FEDPAWA CORPORATE SOLUTIONS SARL** : infrastructure d'affaires et hub opérationnel à Douala (Logpom, Cameroun). Site vitrine, tunnel de souscription en ligne, espace client et back-office d'administration.

## Structure du projet

```
fedpawa_light/
├── public/              # Racine web : pages du site (.php), assets (css/js/images), API
│   ├── index.php        # Contrôleur frontal : routes /api/* + page d'accueil + 404
│   ├── .htaccess        # Apache : DirectoryIndex + réécriture /api/ vers index.php
│   └── assets/          # CSS, JS, images du site
├── src/                 # Backend PHP (namespace App\)
│   ├── Controller/      # Auth, Souscription, Dashboard, Admin, KYC, Webhooks Campay…
│   ├── Service/         # Base de données (SQLite/PDO), PDF (Dompdf), Campay, OTP…
│   └── bootstrap.php    # Chargement .env, session durcie, migrations automatiques
├── templates/
│   ├── partials/        # Header / footer partagés (source unique de toutes les pages)
│   └── pages/           # Contenu de la page d'accueil
├── storage/             # Données runtime (SQLite, logs, documents) — accès web bloqué
├── source_contenu/      # Documentation de référence (contenu officiel, formulaires)
├── schema_sqlite.sql    # Schéma de la base (appliqué automatiquement au démarrage)
└── tests/               # Scripts de test CLI
```

## Prérequis

- PHP ≥ 8.1 (extensions : `pdo_sqlite`, `openssl`, `fileinfo`, `mbstring`)
- [Composer](https://getcomposer.org) (Dompdf, phpdotenv)

## Installation

```bash
git clone <url-du-depot>
cd FedPawa/fedpawa_light
composer install
```

Le schéma de la base SQLite est appliqué automatiquement au premier chargement (`MigrationRunner` dans `src/bootstrap.php`).

## Serveur local (développement)

```bash
php -S localhost:8000 -t public public/index.php
```

Puis ouvrir http://localhost:8000/ (page d'accueil) ou http://localhost:8000/domiciliation.php, etc.

## Déploiement (production, Apache)

1. `DocumentRoot` → `fedpawa_light/public/`
2. Le fichier `public/.htaccess` gère l'index et le routage de `/api/*`
3. `storage/` est protégé par son propre `.htaccess` (base, logs et documents inaccessibles depuis le web)
4. Configurer les identifiants Campay via variables d'environnement (`CAMPAY_USER`, `CAMPAY_PASSWORD`) ou un fichier `.env` à la racine de `fedpawa_light/`

## Fonctionnalités clés

- **Site vitrine** : pages services (domiciliation, création d'entreprise, fiscalité, OAPI, contrats) avec header/footer partagés et double thème (Bordeaux / Nuit & Or)
- **Tunnel de souscription** : formulaires conformes au formulaire officiel, paiement Mobile Money (Campay) ou virement/carte avec téléversement de justificatif
- **Espace client** : tableau de bord, abonnement, factures, contrats, courriers, profil, support — données servies depuis la base
- **Back-office admin** : KPI temps réel, gestion clients, validation KYC, enregistrement de courriers
- **Sécurité** : sessions durcies (HttpOnly, SameSite), CSRF, en-têtes de sécurité, mots de passe Argon2id, réinitialisation par OTP à expiration
- **PDF** : contrats de domiciliation et factures générés via Dompdf

## Tunnel de souscription dynamique (Oct 2026)

Le tunnel `public/tunnel_souscription.php` est **dynamique par service et par pack** :

- **Routing URL** : `?service=<id>&pack=<id>` pré-sélectionne la prestation ET le plan
  (ex: `tunnel_souscription.php?service=contrats&pack=complexe`).
- **Catalogue PLANS** (source de vérité dans `assets/js/tunnel.js`) : tarifs réels par plan —
  OAPI (Protect Brand 200k, Antériorité 50k, Brevets sur devis), Contrats (Standard 50k, Complexe 150k, Audit sur devis),
  Fiscalité (Simplifié 35k/mois, Réel sur devis), Création (100k), Domiciliation (6 packs 25k–175k/mois),
  Recouvrement (commission, sur devis).
- **Synchronisation bilatérale** : les `<select data-plan-select>` des formulaires mettent à jour le panier/sidebar
  (changement de complexité → nouveau total), et la pré-sélection URL resynchronise le select.
- **Cas "Sur devis"** : prix 0 → total "Sur devis personnalisé", bouton d'envoi de demande au lieu du paiement,
  payload `/api/souscription` enrichi (`plan`, `planLabel`).
- **Cartes services** : 6 cartes (Création, OAPI, Fiscalité, Domiciliation, Contrats, Recouvrement) + 6 formulaires dédiés.
- Liens FR corrigés vers `tunnel_souscription.php?service=…&pack=…` ; pages EN reliées via `../tunnel_souscription.php`.

### Tests E2E (Playwright, 14 vertes)

- `verify-tunnel.mjs` (8) : pré-sélection service+pack, totaux exacts avec frais 2 % (204 000 / 153 000 / 35 700 / 45 900 /
  178 500 FCFA), cas "sur devis", aucun paramètre = rien de présélectionné, changement manuel de pack, carte Recouvrement.
- `verify-plan-sync.mjs` (6) : les selects de formulaire (complexité contrats, régime fiscal, type d'actif OAPI)
  pilotent le plan en temps réel et le total suit.

Lancer : `php -S 127.0.0.1:8097 -t public` depuis `fedpawa_light/`, puis `node verify-tunnel.mjs http://127.0.0.1:8097`
depuis `/root/Fedpawa/`. Playwright-core : `/root/lofi-cities/tools/node_modules/playwright-core` ;
Chrome : `~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`.

> Note : en dev sans `vendor/autoload.php`, `/favicon.ico` renvoie 500 (route API du contrôleur frontal) — sans impact sur le tunnel.

## Détection intelligente des besoins (Oct 2026 — lane #1)

Le tunnel détecte les besoins implicites du client à partir de signaux du formulaire et propose le service correspondant :

**Signaux forts → modal de redirection** (besoin réel détecté) :
- Opt-in « Je ne dispose pas encore de RCCM / NIU » (Domiciliation, étape 2) → modal « Création d'entreprise recommandée » → redirige vers `creation_entreprise.php` si accepté.
- Opt-in « Je ne dispose pas encore de NIU » (Fiscalité, étape 2) → même modal (message NIU).
- Option « Assistance à la création / Immatriculation » cochée (étape 3, tous services) → même modal.
- Décocher l'opt-in referme le modal ; clic sur l'overlay ou « Non merci » referme aussi.

**Signaux faibles → bannière contextuelle** (suggestion discrète en étape 2, fermable ✕) :
- Contrats → type « Statuts & pactes d'associés » : bannière Création d'Entreprise.
- Contrats → type « Bail / Location » : bannière Domiciliation (adresse fiscale dès 25 000 FCFA/mois).
- Fiscalité → régime « Nouveau/Non attribué » : bannière Création d'Entreprise.

Implémentation : marqueurs `data-smart-signal="strong" data-smart-from="…"` (opt-ins) et `data-smart-soft="…"` (options de select) dans `tunnel_souscription.php` ; moteur `smartInit()` dans `tunnel.js` (section 10) ; modal `#smart-modal-overlay` + bannière `#smart-banner`.

Test E2E : `verify-smart.mjs` (12 scénarios : modals, redirection Oui, dismiss Non/overlay/décochage, bannières ciblées, absence de faux positif, pas de re-trigger intempestif). À lancer comme les autres (serveur 8097).

## Menu mobile du header (Oct 2026 — lane #2)

Refonte du menu déroulant mobile (4 specs utilisateur), desktop inchangé :

1. **Toggles dans le menu** : clair/sombre + FR/EN déplacés dans `.mobile-nav-toggles` (haut du menu) ; cachés de la barre sur mobile (`@media (max-width: 991px)` cache `.nav-actions .mode-toggle/.lang-toggle`). Les boutons mobiles portent aussi les classes desktop pour hériter du style.
2. **Animation** : `translateY(100%)` + `opacity`, `cubic-bezier(0.231, 0.553, 0.35, 1.0)`, 0.4s.
3. **Fermeture** : bouton ✕ dans le menu + clic hors contenu (listener document avec `contains`) — le burger est exclu de la fermeture (bug initial : le clic d'ouverture refermait le menu).
4. **Hauteur compacte** : `max-height: 90vh`, `overflow: hidden`, padding aéré (24/30px), liens à 12px ; z-index 110 (au-dessus de la top-bar z-100 qui interceptait les clics).

Branchements JS ajoutés (le bouton existed sans handler) : `mobileModeToggle` + `mobileLangToggle` dans `main.js` (switchLanguage partagé, corrige aussi le bug `.php`->`.html` de l'ancien handler).

Test E2E : `verify-mobile-menu.mjs` (12 assertions mobile 390x844 + régression desktop 1440x900 : burger caché, toggles visibles dans la barre). Lancer sur une page fonctionnelle (ex: `creation_entreprise.php`) — `index.php` renvoie 500 en dev sans `vendor/autoload.php`.
