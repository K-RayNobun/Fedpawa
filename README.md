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
