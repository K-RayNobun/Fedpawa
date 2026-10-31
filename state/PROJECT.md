# FEDPAWA — CONTEXTE PROJET (état au 17/10/2026)
Fichier d'entrée pour toute nouvelle session : lire ceci + `state/lane.py status`, puis la skill `fedpawa` pour les procédures détaillées. Ne PAS relire la base de code pour s'orienter.

## 1. Produit
FEDPAWA CORPORATE SOLUTIONS — cabinet juridique (Douala, Cameroun) : site vitrine FR/EN + espace client + dashboard admin + tunnels de souscription + paiement Mobile Money (mode démo : CAMPAY_ENABLED=0 ; prod réelle = Campay). 5 services : création d'entreprise, OAPI (marques), fiscalité, contrats, domiciliation (seul avec contrat signé électroniquement).

## 2. Architecture
- **Stack** : PHP 8.3+ sans framework (`src/` contrôleurs+services, `public/` front HTML/JS custom, routes dans `public/index.php`), SQLite (`src/schema_sqlite.sql`), Docker, Caddy, Cloudflare.
- **Conteneurs** : `fedpawa-api` = PROD (port hôte 18080, image figée — tout changement exige rebuild `docker build -f Dockerfile.api` + recréation) ; `fedpawa-api-test` = dev (18081, bind-mount : éditions live de public/, templates/, src/ via `./dev-test-container.sh`).
- **⚠ Volume partagé** : les DEUX conteneurs montent `/root/fedpawa-data/storage` (base `fedpawa.sqlite` commune prod↔test). Données créées via :18081 = données réelles. Purger ses données de test (préfixe email + DELETE par client_id sur abonnements/factures/tickets/paiements/kyc_documents/courriers/contrats/password_resets).
- **Domaines** : `www.fedpawa.com` (Cloudflare proxifié, sert pages + API same-origin) ; apex → 301 www ; `api.fedpawa.com` conserve /api/* + webhooks. Cache edge CF ≈ 4h → bumper `?v=N` les assets modifiés.
- **Caddy** : `/etc/caddy/Caddyfile` (éditer via terminal, l'outil patch refuse /etc).

## 3. État Git / déploiement (17/10/2026)
- Repo `/root/Fedpawa`, remote `https://github.com/K-RayNobun/Fedpawa.git` (branche main).
- **Dernier push GitHub** : `e16a83c`. **Commits locaux non poussés** : `f89e538` (W-14), `2b49462` (L003-L006), `629a9fb` (bump v3) — tous DÉPLOYÉS en prod et vérifiés live. Push bloqué faute de token GitHub (l'utilisateur doit en fournir un nouveau).
- W-14 (barre d'onglets mobile espace client + admin) : **déployé en prod et vérifié live** sur www.fedpawa.com.

## 4. Toolset lanes (ce répertoire `state/`)
- `lane.py` — CLI du tableau : `new`/`claim`/`log`/`done`/`fail`/`status [--json]`/`show`. `board.json` = état, `lanes/<ID>.md` = journaux append-only (position d'arrêt si crash).
- `PROTOCOL.md` — mécanique des lanes, mandat orchestrateur/sub-agent, reprise après crash, anti-règles de dispatch.
- `PROJECT.md` — ce fichier. **Maintenir les sections 3, 5 et 6 à chaque changement durable.**
- Usage : l'orchestrateur crée N lanes puis les délègue en UN SEUL delegate_task (contexte = « lis PROTOCOL.md + ta lane ») ; chaque sub-agent claim + log ses avancées ; status signale [STALE] les in_progress sans MAJ.

## 5. Problèmes OUVERTS (bug tracker)
| ID | Gravité | Titre | Où le détail |
|----|---------|-------|--------------|
| W-1 | Moyen | Accueil : valeur pas lisible en <10s (5 services à égalité) | `audit/workflows_audit.md` |
| W-6 | Majeur | Pas de guidance premier usage (KYC/abonnement) pour client neuf | idem |
| W-12 | Moyen | Courriers : pas de « marquer comme lu » | idem |
| + S1-S5 | — | Findings UX/SEO/A11Y/SEC mineurs des sections accueil/services/contact/auth/tunnel | `audit/s<N>_rapport.json` |
| W-1 | Moyen | Accueil : valeur pas lisible en <10s (5 services à égalité) | `audit/workflows_audit.md` |
| W-6 | Majeur | Pas de guidance premier usage (KYC/abonnement) pour client neuf | idem |
| W-12 | Moyen | Courriers : pas de « marquer comme lu » | idem |
| + S1-S5 | — | Findings UX/SEO/A11Y/SEC mineurs des sections accueil/services/contact/auth/tunnel | `audit/s<N>_rapport.json` |

## 6. Corrigés & vérifiés (ne pas re-signaler)
W-2 hreflang /en/ 404 · W-9 statut abonnement incohérent · W-10 aucune facture au paiement (FactureService, actif via /api/paiement/verifier) · W-13 réponse admin aux tickets invisible · W-3 footer tél/WhatsApp · W-14 onglets dashboards mobiles · F1-F11 espace client · **S-2 écran de vérification de paiement sur les 4 services du tunnel (contractFlowScreen pour tous ; « confirmé » seulement après /api/paiement/verifier paid) — E2E prouvé (fixl3_*.png)** · **S-3 flux contrat+OTP domiciliation atteignable (api: out dans onSubmit) — E2E prouvé (fixl4_signature.png)** · **S-1 CTA header pack=national-essential** · **F3 0 « Chargement… » restant (y compris KYC existant sans contenu)** · **F6 Changer de pack route par pack→service** · **F12 autocomplete** · **SEC-S4-1 OTP plus exposé (backend déjà commité d783194 + front password-reset.js nettoyé, debug_otp=0 en prod)** · **UX-S3-1 contact réel : form → Api.post /api/contact → ContactController (validation+honeypot+INSERT contact_messages+notification) — E2E prouvé + ligne en base** · **SEO-S5-1 sitemap sur www.fedpawa.com (0 référence à l'ancien domaine)**. Commits 2b49462+629a9fb, déployés prod, vérifiés live (assets ?v= bumpés). Preuves : audit/fixl*_*.png.

## 7. Carte des livrables d'audit
- `audit/subscription_flows_audit.{md,json}` — 6 voies de souscription E2E (2e ronde, 17/10) + S-1..S-6
- `audit/espace_client_audit.json` — espace client F1-F12 (3e vague)
- `audit/espace_client_post_w.{md,json}` — re-vérification post-correctifs (F1-F12, W-9/10/13)
- `audit/workflows_audit.{md,json}` — workflows utilisateurs W-1..W-13 (1re ronde)
- `audit/s[1-5]_rapport.json` + `s[1-5]_raw.json` — audit multi-faces par section (accueil, services, contact, auth, tunnel/SEO)
- `audit/Audit_E2E_Fedpawa_2026-10-17.pdf` — rapport consolidé (7 pages)
- `audit/consolidation.json`, `pdf_spec*.json` — données sources des PDF

## 8. Comptes & conventions de test
- Client jetable : préfixe email dédié par vague (sw2-, sw3-, mob4-…), mdp `Sw2test!2026` ; purge obligatoire en fin de lane (voir §2 volume partagé).
- Admin E2E : `audit-e2e@fedpawa.com` / `AuditE2E-Admin-2026` (admin_dashboard.html ; sessions admin via /api/admin/login).
- Mode démo paiement : POST /api/souscription → payment_pending + signature_otp ; POST /api/paiement/verifier {sub_id} → paid → abonnement actif + facture FAC-*.
- CSRF sur tout POST /api/* : GET /api/csrf-token → header X-CSRF-Token.
- Playwright : chromium-1234 + `/root/lofi-cities/tools/node_modules/playwright-core/index.mjs` (pattern complet dans PROTOCOL.md et skill).

## 9. Ce qui attend une décision utilisateur
1. Token GitHub à fournir → pousser `f89e538`.
2. Feu vert pour corriger S-2/S-3 (le paiement mensonger) — correction proposée, pas encore implémentée.
3. SEC-S4-1 (OTP exposé) : critique si SMTP réel, à planifier.


## 2026-10-29 20:59 UTC — Nouvelle pile applicative : app.fedpawa.com (lane L024, TERMINÉE)

**Rôle** : l'application convertie (frontend Next.js + API Laravel) est servie sur `app.fedpawa.com`, en parallèle du site PHP historique qui reste sur www/api — aucune bascule, l'ancien n'a pas bougé.

- **API Laravel** : conteneur `fedpawa-app-api`, image `php:8.5-cli`, dépôt `/root/fedpawa-api` monté sur `/app`, `php artisan serve` sur `127.0.0.1:8000`.
  - `.env` modifié (sauvegarde `.env.bak-<date>`) : APP_ENV=production, APP_URL=https://app.fedpawa.com, SANCTUM_STATEFUL_DOMAINS=app.fedpawa.com,localhost,localhost:3000,127.0.0.1:8000, SESSION_SECURE_COOKIE=true.
  - Piège : php:8.3-cli échoue (`vendor/composer/platform_check.php`) — le vendor est compilé pour PHP 8.5. Utiliser php:8.5-cli.
  - Limite connue : `artisan serve` est mono-processus (pas de concurrence). À passer en php-fpm/Apache si la charge devient réelle.
- **Frontend Next.js** : conteneur `fedpawa-next`, image `fedpawa-next:prod` (Dockerfile mono-étage node:22-alpine créé en L024), `127.0.0.1:3000`. `NEXT_PUBLIC_API_URL=https://app.fedpawa.com` **inliné au build** — changer cette valeur exige un rebuild de l'image.
- **Caddy** : bloc `app.fedpawa.com` — `/api/*`, `/sanctum/*`, `/up` → `127.0.0.1:8000` ; le reste → `127.0.0.1:3000`. Sauvegarde : `/etc/caddy/Caddyfile.bak-20261029-app`.
  - Tant que le DNS n'existe pas, le bloc est servi en `http://app.fedpawa.com` (port 80) pour permettre la vérification locale ; l'ACME échoue en NXDOMAIN (comportement attendu).
- **Bascule HTTPS** : `/root/fedpawa-deploy/switch-app-https.sh` — refuse de tourner si `dig +short A app.fedpawa.com` est vide, sinon retire le préfixe `http://`, recharge Caddy, attend le certificat et teste `/up`, `/api/user`, `/`.
- **Surveillance** : `/root/fedpawa-deploy/health-app.sh` + cron toutes les 5 min → `logs/health-app.log` (api, frontend, URL publique dès qu'elle existe).
- **Verrou connu** : aucun enregistrement DNS pour `app.fedpawa.com` (zone Cloudflare, pas de jeton sur le VPS). À créer : `A app.fedpawa.com → 206.72.195.234`, proxifié.


## 2026-10-29 21:08 UTC — app.fedpawa.com EN LIGNE (HTTPS) + campagne de test lancee

- **DNS cree par l'utilisateur**, puis bascule automatique via `/root/fedpawa-deploy/switch-app-https.sh` : certificat **Let's Encrypt** obtenu (subject CN=app.fedpawa.com, issuer CN=YE2), Caddy recharge.
- Verifications reelles : `https://app.fedpawa.com/up` 200, `/api/user` 401, `/` 200 ; test navigateur (Playwright) : accueil FR servi, `/authentification` = « Espace Client », **service worker PWA enregistre** (le HTTPS active enfin la PWA), aucune reponse >= 400, trafic passe au travers de Cloudflare sans blocage.
- Note pour plus tard : le bloc Caddy de prod sert desormais en HTTPS automatique ; le bloc de test `http://app-test.fedpawa.com` reste en HTTP avec base isolee.

### Campagne de test de l'app convertie (workspace `/root/fedpawa-campagne/`)
- `BRIEF.md` = contrat commun ; `ctx-S1-processus.md` et `ctx-S2-details.md` = mandats des deux superviseurs.
- Superviseurs lances (lane L025 inventaire des parcours, L026 inventaire des details page par page), delegation `deleg_01acfed1`.
- **Harnais de navigation humaine teste et fonctionnel** : `/root/fedpawa-campagne/outils/human_browser.py` — profil persistant, cadence humaine, captures, journal horodate, reseau, console, telechargements. Piege resolu : le cache Chromium de Playwright (revisions 1234/1243) ne correspond pas a la version installee (qui reclame 1248) → `executable_path` explicite dans le harnais.
- Deux surfaces de test :
  1. `https://app.fedpawa.com` — fidelite maximale (HTTPS, cookies Secure, service worker, Cloudflare), **base de production** : n'y creer que des donnees de test identifiables, purgeables par identifiant exact.
  2. `http://app-test.fedpawa.com` — base isolee `/root/fedpawa-test/database.sqlite`, pile de test (conteneurs `fedpawa-app-api-test` :8001 et `fedpawa-next-test` :3001) : surface des tests destructifs/bulletproof.
- Skills ecrits pour ce type de mission (reutilisables sur d'autres sites) : `test-surface-inventory`, `human-simulation-e2e`, `bulletproof-page-audit`.


## 2026-10-29 22:16 UTC — Campagne de test de l'app convertie : RESULTATS (lanes L025-L029, toutes terminees)

Livrables : `/root/fedpawa-campagne/rapports/{SYNTHESE-CAMPAGNE.md,SYNTHESE-CAMPAGNE.pdf,BULLET-A-PUBLIC.md,BULLET-B-AUTH.md,PARCOURS-1-DOMICILIATION.md}`, inventaires dans `surface/{PROCESSUS.md,MATRICE-VERIFICATION.md}`, preuves dans `preuves/`.

**Verdict : l'app est solide là où c'est difficile, mais inutilisable par un vrai client aujourd'hui — deux verrous non liés au code.**
1. `MAIL_MAILER=log` en production : aucun email ne part. Conséquence : les 108 codes OTP sont écrits en clair dans `storage/logs/laravel.log` (vérifié) → signature de contrat impossible pour un client, et signature possible par quiconque lit le serveur. **Réparable immédiatement : brancher le serveur mail déjà en place (contact@ / mme.law@fedpawa.com) et supprimer l'écriture du code dans les logs.**
2. Paiement non configuré : `POST /api/v1/souscription` → 503 payment_unavailable. Le tunnel va jusqu'à la facture proforma, puis plus rien (ni contrat, ni facture, ni reçu).

**Autres défauts vérifiés** : énumération de comptes sur `otp/verify` (404 « Client introuvable » vs 400) ; aucune limitation de tentatives sur la branche admin du login (10 essais, aucun 429, aucune ligne login_throttle) ; XSS stocké dans le formulaire de contact ; CGU et confirmation de mot de passe non exigées côté serveur ; double soumission non idempotente (contact 2 lignes, souscription 6 abonnements) ; téléphone `abc` accepté en souscription ; upload 11 Mo → 200 text/html avec warning PHP brut ; 2 liens `.php` morts sur les pages légales ; changement d'email → dashboard 401 ; pas de déconnexion visible dans l'espace client.

**Ce qui marche vraiment** : gardes d'accès solides (**15 tentatives d'IDOR, 0 défaut** ; 401 anonyme / 403 client sur les 10 endpoints admin), parcours inscription → connexion → espace client (8 onglets) sans erreur, tunnel 6 étapes avec téléversements réels, facture proforma cohérente, persistance de session, page 404 custom, service worker PWA enregistré sur le domaine réel, continuité d'un second service.

**Erreur d'orchestration corrigée** : l'isolation de la base de test n'a jamais fonctionné (`php artisan serve` ne propage pas les variables du conteneur → écriture dans la base de PRODUCTION). Corrigé par une copie de dépôt dédiée + `.env` propre (vérifié empiriquement). Lignes de campagne purgées par identifiant exact après sauvegarde (`backups/database-prod-*.sqlite`).

**Non testé** : parcours admin (mot de passe admin inconnu), rendu du XSS stocké (même raison), paiement/webhook Campay, réception réelle d'emails, signature OTP, documents finaux.


## 2026-10-30 01:24 UTC — Signature électronique des contrats : chaîne opposable implémentée et vérifiée

Décisions de K Ray : **cachet Fedpawa** (notre certificat, pas celui du prestataire) et **relais SMTP authentifié sur le 587** pour la remise des codes (le port 25 sortant est bloqué par l'hébergeur — vérifié : aucune connexion vers un MX public ; le 587 sort, lui). Défauts retenus pour les trois questions non répondues : contrat généré par l'app (+ possibilité de pointer un PDF importé), KYC approuvé + code vérifié + consentement horodaté, horloge serveur + ancrage d'empreinte.

**Ce qui est fait et vérifié** (dans la copie isolée `fedpawa-api-test`, production intacte) :
- Autorité de certification Fedpawa (`Fedpawa Root CA` + certificat de scellement, usage Digital Signature + Non Repudiation, EKU document signing), outils `pki.sh`, `sceller.py`, `verifier.py`, `tamponner.py`.
- Chaîne complète : porte d'identité serveur (KYC approuvé + OTP 6 chiffres TTL 10 min + consentement + IP/agent) → composition du contrat → tampon visible → **scellement PAdES Fedpawa** → empreintes SHA-256 → journal en ajout seul (triggers SQLite bloquant UPDATE/DELETE) → dossier de preuve PDF 4 pages.
- Endpoints : POST /api/v1/signature/dossier, /otp, /signer ; GET /signature/dossier/ID, /contrat.pdf, /preuve.pdf (propriété vérifiée : 403/404 pour autrui, 401 anonyme, admin OK).
- Preuves réelles : 27/27 assertions, PDF scellé valide/intact/de confiance ENTIRE_FILE, **altération d'un octet détectée**, refus 403 sans KYC, 400 sans/faux OTP, 400 sans consentement, OTP livré par SMTP local et lu par IMAP, 0 code OTP en clair dans les logs. Documents : `signature/{ARCHITECTURE-SIGNATURE,DOCS-CRAFTMYPDF,RAPPORT-IMPL-SIGNATURE}.md`, preuves dans `signature/tests/`.

**CraftMyPDF — verdict honnête** : leur eSignature délègue à Documenso (niveau eIDAS SES), le cachet est au nom de leur instance, le PDF signé et la piste d'audit ne sont pas récupérables par API, et chaque enveloppe coûte 10 crédits sur les 50 du plan gratuit (**5 contrats signés/mois maximum**). Leurs opérations PDF simples (ajout de texte, fusion) coûtent 0,5 crédit (≈100/mois) — c'est le seul usage où l'offre est exploitable. **Compte non créé : l'inscription exige un reCAPTCHA v2 vérifié côté serveur** et il n'existe aucun endpoint de création de compte ; la saisie d'un mot de passe dans un formulaire navigateur m'est interdite. Endpoints confirmés existants par réponses réelles (400 Invalid API Key). Mot de passe préparé en chmod 600, boîte contrats@fedpawa.com opérationnelle (IMAP testé).

**Reste à faire** : UI client de signature (en cours, lane L033), relais SMTP 587 à choisir et brancher, promotion de la chaîne en production (migration + .env + endpoints), PDF de contrat officiel si différent de celui que l'app génère aujourd'hui.
