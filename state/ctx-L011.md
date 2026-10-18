# CTX L011 — Dashboard Admin: header dynamique, styles CTA KYC, visionneuse documents

## Besoin utilisateur (verbatim 18/10/2026)
1. Le header doit être DYNAMIQUE: déterminer si le connecté est client ou admin. Le bouton
   « Espace Client » ne doit PAS apparaître pour un admin — le remplacer par un CTA
   « Dashboard » (stylé comme les autres CTA). Le menu déroulant du bouton profil doit
   lui aussi refléter le rôle (admin → entrées admin, pas « Espace Client »).
2. Dashboard admin, onglet « Validation KYC »: certains CTA n'ont pas de style bien appliqué
   → corriger (boutons Approuver/Rejeter de .kyc-actions et tout bouton de l'onglet).
3. Les liens « Consulter/Voir » (Courriers, Contrats, KYC, …) mènent à une erreur. Voulu:
   - Document PRÉSENT → l'ouvrir dans un NOUVEL ONGLET, sur une PAGE SPÉCIFIQUE Fedpawa où
     l'admin peut TÉLÉCHARGER le document et voir toutes les infos relatives (date d'envoi,
     nom du destinataire/client, type, …).
   - Document ABSENT → un MODAL l'indiquant. Et veiller que l'ÉTAT AFFICHÉ correspond à
     l'état RÉEL: on ne propose jamais « Voir » pour un document qui n'existe pas.

## Cartographie technique (vérifiée par l'orchestrateur)
### 1. Header dynamique
- Rendu JS: public/assets/js/main.js `renderNavActions(me)` (~ligne 315-374):
  - `me.authenticated` → innerHTML navActions avec « Espace Client » + bouton profil; menu
    profil = buildSubmenu(profileMenu, true).
  - `/api/me` RENVOIE DÉJÀ le rôle: `role: $_SESSION['role'] ?? 'client'` (AuthController
    ligne ~408), et le portail admin renvoie `role: 'admin'` (index.php:32-34).
  - DONC: dans renderNavActions, si `me.role === 'admin'`: CTA « Dashboard » →
    admin_dashboard.html (même classe .nav-login / même style CTA), et le menu profil:
    adapter les entrées (ex: remplacer « Mon Espace Client » par « Dashboard admin »,
    garder thème, langue, déconnexion).
  - VÉRIFIER aussi buildSubmenu (main.js ~175+) pour l'entrée compte.
  - html data-auth="admin" sur admin_dashboard.html (guard existant OK).
- BUG BONUS (vérifié): admin_dashboard.html <title> = « Espace Client | FEDPAWA... » →
  corriger en « Dashboard Admin | FEDPAWA ... ».

### 2. Onglet Validation KYC — styles
- Rendu: public/assets/js/admin-dashboard.js lignes ~104-125: .kyc-review-card >
  .kyc-actions > boutons avec INLINE styles (border-color/color danger; background success)
  + classes btn btn-outline/btn-primary. CSS dashboard.css:238-244 (.kyc-review-card,
  .kyc-actions existent). Le rendu réel est à diagnostiquer en live (screenshot) — l'onglet
  n'est peuplé QUE si des dossiers existent (lists.kyc). Comptes admin de test: voir
  PROJECT.md section comptes (ou créer admin en base: table `admins`).
- Symptôme probable: les inline styles écrasent/conflictent avec .btn-primary (bg success
  sur btn-primary), ou les classes btn manquent sur certains éléments. DOnc: diagnostiquer
  en capture réelle, puis corriger proprement (classes dédiées .btn-approve/.btn-reject
  dans dashboard.css, sans inline styles).
- VÉRIFIER AUSSI: admin-dashboard.js?v=7 (bump déjà fait), dashboard.css?v=7 dans
  admin_dashboard.html ligne ~17.

### 3. Visionneuse documents
- ÉTAT: StorageController.serve (src/Controller/StorageController.php) SERT DÉJÀ les PDF
  (/api/document?type=courrier|kyc|contrat&id=&file=) avec anti-path-traversal + ownership
  admin-tout-voir. MAIS les liens de l'UI cassent:
  - Contrats: admin-dashboard.js ligne ~99 génère `/api/document?type=contrat&id=${ct.id}`
    avec ct.id = ID SQL (1..5) — le test curl id=44 échoue. L'UI affiche « CT-003 » avec
    l'id SQL. Le VRAI fichier = documents/contrat_49.pdf (colonne fichier).
    → Le lien utilise déjà ct.id (id SQL): OK en fait pour contrats. VÉRIFIER le 404 réel
      par type (tester les 5 ids SQL en admin).
  - KYC: liens /api/document?type=kyc&id=X&file=piece_identite — les cellules <img> ont un
    onerror qui remplace par du texte; le « Voir » (dossiers traités) est un target=_blank
    direct qui, si le fichier manque (relPath vide / fichier absent), affiche le JSON
    d'erreur brut dans l'onglet → l'expérience « erreur » signalée.
  - Courriers: lien uniquement si co.scan, sinon « — ». Bien. Mais si le fichier scan est
    absent du disque → même problème.
- EXIGENCE: au lieu de liens directs, faire un ENDPOINT de métadonnées + une PAGE de
  visionneuse:
  a) Backend: NOUVELLE route GET /api/admin/document-info?type=X&id=N&file=F (AdminController
     ou StorageController): renvoie { exists: bool, filename, size, mime, date (courrier:
     date_reception / kyc: date_soumission / contrat: date_signature), client_nom,
     entreprise, type_label, download_url: '/api/document?...' } — 404 seulement si
     l'ID n'existe pas; exists:false si le fichier physique manque. Ajouter la route dans
     public/index.php ($router->get). Auth: admin uniquement (session admin_logged_in).
     VÉRIFIER le routeur: routes existantes $router->get('/api/admin/overview', ...).
  b) Front admin-dashboard.js: chaque « Consulter/Voir » → fetch document-info:
     - exists true → window.open('/admin_document.html?type=..&id=..&file=..') NOUVELLE
       page publique-côté-Fedpawa (thémée, design system existant) affichant: header Fedpawa,
       bloc infos (client, date, type, taille), bouton « Télécharger » (href download_url,
       download attr) + bouton « Retour au dashboard ». La page charge /api/document-info
       et affiche un état absent propre si besoin.
     - exists false → MODAL thémé (FedpawaUI.modal existe dans fedpawa-ui.js — L'UTILISER,
       ne pas réinventer): « Ce document n'est pas disponible (fichier absent) ».
  c) COHÉRENCE D'ÉTAT (exigence clé): pour chaque liste, le lien « Voir » ne doit être
     proposé QUE si le document existe réellement. Options: inclure exists dans
     AdminController.lists() (jointure EXISTS sur fichier + is_file) OU vérifier au clic
     (document-info). FAIRE LES DEUX: lists() renvoie un booléen doc_exists par ligne
     (contrats: fichier + file_exists; courriers: scan + file_exists; kyc: piece_identite/
     justificatif + file_exists) et l'UI n'affiche « Voir » que si true; le clic re-vérifie
     via document-info (race-proof).
     - CHEMINS FICHIERS: contrats → storage/documents/, courriers+kyc → storage/uploads/
       (StorageController fait déjà le mapping: candidates [uploadsBase, base]).
- STOCKAGE VÉRIFIÉ: /root/fedpawa-data/storage/documents/contrat_{35,44,47,48,49}.pdf,
  uploads/client_NN/doc_*.png|pdf. Table contrats: ids SQL 1..5 (fichiers 35..49).
  kyc: ids 6,7,8 (client_50, client_133). courriers: ids 5,6,7.
- Page admin_document.html: NOUVELLE page à créer (public/admin_document.html), data-auth=
  "admin", style dashboard.css + style.css, responsive, thème navy+light, i18n FR
  (pas besoin EN pour l'admin — le dashboard admin est FR).

## Règles (leçons des vagues précédentes)
- Servi depuis public/, JAMAIS dist/. Pas de PHP dans les .js. Variables CSS du design
  system uniquement (var(--color-*)), zéro #fff hardcodé, zéro inline style si une classe
  peut le faire.
- Linter: php -l sur chaque .php touché, node --check sur chaque .js touché.
- Bumps: admin-dashboard.js?v=8, main.js bump (chercher main.js?v= dans toutes les pages
  .php/.html qui l'incluent — TOUTES les pages l'incluent, bumper partout), dashboard.css?v=
  8 si CSS touchée. Nouvelle page admin_document.html → l'ajouter au sitemap? Non (page
  admin privée), mais vérifier robots.
- NE PAS TOUCHER: dashboard.js (L009), souscription_domiciliation.* et tunnel (L010),
  DashboardController.php (L009).

## Definition of Done (E2E obligatoire, http://127.0.0.1:18081)
1. Connecté en ADMIN (session admin): header montre CTA « Dashboard » (pas « Espace
   Client »), menu profil adapté. Connecté en CLIENT: inchangé (« Espace Client »).
   Capture des 2 états (l011_header_admin.png, l011_header_client.png).
2. Onglet KYC: boutons stylés proprement (capture l011_kyc.png), approuver/rejeter
   fonctionnels (E2E sur un dossier en_cours).
3. Documents: pour 1 contrat existant (ex id SQL 3 → contrat_47.pdf), clic « Consulter » →
   nouvel onglet page admin_document.html avec infos + Télécharger fonctionne (200 + PDF
   téléchargé). Pour 1 document ABSENT (créer une ligne factice de test avec fichier
   inexistant, puis la supprimer), clic → modal « non disponible », PAS de lien « Voir »
   proposé dans la liste. Capture (l011_modal_absent.png).
4. /api/admin/document-info: vérifier exists:true/false correct, 403 pour non-admin.
5. Tests curl: /api/document?type=contrat&id=3 (admin cookie) → 200 PDF.
6. Titre admin_dashboard.html corrigé.
7. Journal state/lanes/L011.md à chaque étape; python3 lane.py done L011 --summary à la fin.