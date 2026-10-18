# Rapport Lane L011 — Dashboard Admin : header dynamique, CTA KYC, visionneuse documents

**Agent :** hermes-l011-re (re-dispatch glm-5.3-flash, 1er agent sans travail réel)
**Date :** 2026-10-18 · **E2E :** 29/29 PASS (`audit/l011_e2e_results.json`, `verify-l011.mjs`)

## 1. Header dynamique (main.js v5)
- `renderNavActions(me)`: si `me.role==='admin'` → CTA **« Dashboard »** → `admin_dashboard.html` (même style `.nav-login.nav-espace-client`), jamais « Espace Client ». Client connecté : inchangé.
- `buildSubmenu(container, withAccount, role)`: menu profil admin → **« 🛡️ Dashboard Admin »** (pas « Mon Espace ») ; menu burger mobile adapté pareillement. Client : « 👤 Mon Espace » conservé.
- Preuves : `audit/l011_header_admin.png` (CTA DASHBOARD doré), `l011_header_client.png` (Espace Client inchangé), checks A1/A2/A3/B1/B2 PASS.

## 2. Onglet KYC — styles
- **Cause racine :** les inline styles utilisaient `--color-success/danger/warning` **jamais définis** dans le design system → boutons invalides (bg transparent).
- Corrections : tokens définis dans `style.css` (:root + navy/dark pour contraste AA) ; classes dédiées `.kyc-actions .btn-approve/.btn-reject` dans `dashboard.css` (hover inclus) ; inline styles supprimés dans `admin-dashboard.js` ET `admin_dashboard.html`.
- **Bonus bug préexistant corrigé :** l'attribut `onerror` échappé `\\"` des vignettes KYC injectait un texte parasite `">` sous les images → remplacé par `data-fallback` + listener d'erreur délégué.
- Preuves : `l011_kyc_before.png` (bug recréé depuis CSS git HEAD~1) / `l011_kyc.png` (boutons verts/rouges propres, zéro inline, zéro parasite), C0→C3 PASS, approve/rejet réels G1/G2 PASS (état kyc 7 restauré `en_cours`).

## 3. Visionneuse documents
- **Backend :** `StorageController::documentInfo()` (admin-only, 403 sinon) → `{exists, filename, size, mime, date, client_nom, entreprise, type_label, download_url}` ; route `GET /api/admin/document-info` dans `index.php`. `exists:false` (200) si ligne OK mais fichier absent ; 404 si ID inconnu.
- **AdminController::lists()** enrichi : `doc_exists` (contrats, courriers) + `doc_exists_identite/doc_exists_justificatif` (kyc) — `file_exists` réel disque (mêmes règles anti-traversal que serve()).
- **Front :** liens « Consulter/Voir » rendus **uniquement si** `doc_exists` ; clic → re-vérification `document-info` (race-proof) → `window.open('/admin_document.html?…')` ou **modal FedpawaUI** « Document non disponible ». Délégation d'événements `.fp-doc-link`.
- **Nouvelle page** `public/admin_document.html` : `data-auth="admin"`, header Fedpawa complet, fiche infos (client/entreprise/type/date/fichier/taille/format), bouton **Télécharger** (download_url + attribut download) + **Retour au dashboard**, état « indisponible » si absent, noindex + robots.txt Disallow.
- Preuves : contrat id 3 → visionneuse + download 200 application/pdf %PDF (D2/D3) ; ligne factice → AUCUN lien (E1), exists:false (E2), modal (E3), purge faite (E4) ; 403 non-admin et client connecté (F1/F1bis).

## 4. Divers
- Title `admin_dashboard.html` = « Dashboard Admin | … » (déjà corrigé au commit 6efe722, vérifié, laissé tel quel).
- Bumps : `main.js?v=5` (4 pages HTML + site-footer.php), `dashboard.css?v=9` (6 fichiers), `admin-dashboard.js?v=9`.
- Lint : `node --check` OK (main.js, admin-dashboard.js), `php -l` OK (StorageController, AdminController, index.php, souscription/tunnel php).
- Coexistence lanes : patchs ciblés uniquement ; blocs `l012-*` et méthodes template*/OTP intacts (commit L012 29990f6 survenu pendant la lane — mes fichiers fusionnés sans perte, vérifié).
- Purge : 0 client test l011 restant, 0 contrat test, kyc 7 = en_cours, contrats=5, courriers=7 (état initial).

## Captures
`l011_header_admin.png`, `l011_header_client.png`, `l011_kyc_before.png`, `l011_kyc.png`, `l011_doc_visionneuse.png`, `l011_doc_absent_ligne.png`, `l011_modal_absent.png` (+ `l011_e2e_results.json`).

## Fichiers modifiés
- public/assets/js/main.js — public/assets/js/admin-dashboard.js
- public/assets/css/style.css — public/assets/css/dashboard.css
- public/admin_dashboard.html — public/admin_document.html (nouveau)
- src/Controller/StorageController.php — src/Controller/AdminController.php (lists() seulement)
- public/index.php — public/robots.txt
- Bumps : espace_client.html, authentification.html, mot_de_passe_oublie.html, souscription_domiciliation.php, tunnel_souscription.php, templates/partials/site-footer.php
