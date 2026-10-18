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
- **Dernier push GitHub** : `e16a83c` (W-2/W-9/W-10/W-13/W-3). **Commits locaux non poussés** : `f89e538` (W-14 onglets mobiles — déployé en prod, commit en attente faute de token GitHub ; l'utilisateur doit en fournir un nouveau, l'ancien n'est stocké nulle part).
- W-14 (barre d'onglets mobile espace client + admin) : **déployé en prod et vérifié live** sur www.fedpawa.com.

## 4. Toolset lanes (ce répertoire `state/`)
- `lane.py` — CLI du tableau : `new`/`claim`/`log`/`done`/`fail`/`status [--json]`/`show`. `board.json` = état, `lanes/<ID>.md` = journaux append-only (position d'arrêt si crash).
- `PROTOCOL.md` — mécanique des lanes, mandat orchestrateur/sub-agent, reprise après crash, anti-règles de dispatch.
- `PROJECT.md` — ce fichier. **Maintenir les sections 3, 5 et 6 à chaque changement durable.**
- Usage : l'orchestrateur crée N lanes puis les délègue en UN SEUL delegate_task (contexte = « lis PROTOCOL.md + ta lane ») ; chaque sub-agent claim + log ses avancées ; status signale [STALE] les in_progress sans MAJ.

## 5. Problèmes OUVERTS (bug tracker)
| ID | Gravité | Titre | Où le détail |
|----|---------|-------|--------------|
| S-2 | **Critique** | Écran « Paiement confirmé » affiché sans vérification réelle sur les 4 services du tunnel (simplePaidFlow après payment_pending, aucun appel /api/paiement/verifier) → abonnements en_attente à vie, 0 facture, aucun recours client | `audit/subscription_flows_audit.md` |
| S-3 | Majeur | Domiciliation : flux contrat + signature OTP inatteignable — onSubmit (souscription_domiciliation.js) ne retourne pas le champ `api` attendu par fedpawa-pay.js pour contractFlowScreen. Fix = une ligne (`api: out`) | idem |
| S-1 | Moyen | CTA global « Je m'abonne » → `pack=essentiel` inexistant (header toutes pages, site-header.php:123) → aucun pack présélectionné | idem |
| F3' | Moyen | Cartes KYC + Dernier courrier de l'aperçu : « Chargement… » persistant en sous-valeur quand vide | `audit/espace_client_post_w.md` |
| F6' | Mineur | « Changer de pack » redirige vers souscription_domiciliation.php quel que soit le service de l'abonnement | idem |
| F12 | Mineur | Champs mot de passe sans `autocomplete` (WCAG 1.3.5) | idem |
| W-1 | Moyen | Accueil : valeur pas lisible en <10s (5 services à égalité) | `audit/workflows_audit.md` |
| W-6 | Majeur | Pas de guidance premier usage (KYC/abonnement) pour client neuf | idem |
| W-12 | Moyen | Courriers : pas de « marquer comme lu » | idem |
| SEC-S4-1 | **Critique** | FAILLE : OTP de reset renvoyé dans la réponse HTTP (debug_otp) — prise de compte possible en prod réelle | `audit/s4_rapport.json` |
| UX-S3-1 | Critique | Formulaire de contact = simulateur JS (n'envoie rien, aucun backend) | `audit/s3_rapport.json` |
| SEO-S5-1 | Élevée | sitemap.xml pointe vers www.fedpawacorporatesolutions.com (domaine différent) | `audit/s5_rapport.json` |
| + S1-S5 | — | Findings UX/SEO/A11Y/SEC mineurs des sections accueil/services/contact/auth/tunnel | `audit/s<N>_rapport.json` |

## 6. Corrigés & vérifiés (ne pas re-signaler)
W-2 hreflang /en/ 404 · W-9 statut abonnement incohérent · W-10 aucune facture au paiement (FactureService, actif via /api/paiement/verifier) · W-13 réponse admin aux tickets invisible · W-3 footer tél/WhatsApp · W-14 onglets dashboards mobiles (barre chips scrollable <991px, db-tabs.js + .db-tabs-mobile, layout colonne) · F1 logout · F2 badge Actif mensonger · F4 profil/logout mobile · F5 remember-me retiré · F6 bouton Changer de pack câblé · F7 historique tickets · F8 états vides · F9 documents dupliqués · F10 maxlength · F11 labels/for. Preuves : `audit/espace_client_post_w.{md,json}`, screenshots `audit/*.png`.

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
