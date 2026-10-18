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
