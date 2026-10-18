# CTX L012 — Onglet Contrats (admin): éditeur de contrat intégré + OTP admin

## Besoin utilisateur (verbatim 18/10/2026)
Dans l'onglet Contrats du dashboard admin, il doit être possible de MODIFIER MANUELLEMENT
le contrat en restant dans le site, avec un ÉDITEUR DE TEXTE INTÉGRÉ (les librairies/packages
nécessaires doivent être dans le code — self-hosted). Dans cet onglet, un bouton demande à
modifier le contenu du contrat. Ce moyen demande D'ABORD à l'admin de vérifier son
authenticité par un CODE OTP envoyé à l'adresse mail de l'admin.

## Cartographie technique (vérifiée par l'orchestrateur)
### Backend existant (À RÉUTILISER, ne pas réinventer)
- Template de contrat en BDD: table `contract_templates` (id, name='contract', content,
  updated_at). Contenu = HTML complet (feuille de style inline) avec variables Twig
  {{ client_name }}, {{ company_name }}, {{ price }} — rendu par PdfService (Twig + Dompdf).
- `AdminController::updateTemplate()` (L139-177) existe déjà: POST /api/admin/template/update
  → UPDATE contract_templates + INSERT contract_history (template_id, old_content) +
  AuditLogger::log('UPDATE_CONTRACT_TEMPLATE'). AUCUN OTP demandé aujourd'hui → c'est le
  point à ajouter.
- OTP infrastructure existante (pattern reset-password, AuthController L187-228):
  - `MailService` (src/Service/MailService.php) avec `sendOtp($email, $token)` — utilisé
    pour les clients. Vérifier son implémentation exacte (SMTP? log fallback?) et si
    besoin ajouter sendOtpAdmin OU réutiliser tel quel.
  - `OtpService` (src/Service/OtpService.php): generate(clientId)/verify/clear — clé par
    clientId, stockage storage/otp_<id>.txt avec password_hash. Pour l'admin: utiliser
    admin_id (ex 3386) avec un préfixe de fichier distinct OU étendre OtpService avec un
    param scope ('client'|'admin') — NE PAS casser l'existant (le path otp_<id>.txt des
    clients ne doit pas être réutilisé tel quel pour éviter collision admin_id/client_id:
    utiliser otp_admin_<id>.txt via un param scope).
  - Admins en base: table `admins` — ids 3386 (audit-e2e@fedpawa.com), 1 (mme.law@fedpawa.com).
    L'email de réception OTP = email de l'admin connecté ($_SESSION['admin_email']).
- AuditLogger::log existe — journaliser aussi l'envoi OTP et la vérification.

### Front admin
- Onglet Contrats: admin_dashboard.html `#tab-contrats` (data-tab="contrats"), peuplé par
  admin-dashboard.js (table listant les contrats, colonnes CT-xxx).
- Modal system: FedpawaUI.modal (fedpawa-ui.js) — L'UTILISER (pattern L010/L011).
- Éditeur: TinyMCE 6.8.3 DÉJÀ INSTALLÉ self-hosted par l'orchestrateur dans
  public/assets/vendor/tinymce/ (tinymce.min.js + themes/silver + icons/default +
  skins/ui/oxide(+-dark) + skins/content/default — 3.7MB, testé servi 200 sur :18081).
  → Charger via <script src="assets/vendor/tinymce/tinymce.min.js"></script> UNIQUEMENT
  dans admin_dashboard.html (pas sur les pages publiques).
- Le contenu à éditer = contract_templates.content (HTML). tinymce.init({ selector: '#...',
  skin: 'oxide-dark' (cohérent thème navy) ou 'oxide', height ~450, menubar minimal,
  plugins: table lists link, toolbar classique }). RÉCUPÉRER le contenu via une route
  GET /api/admin/template (nouvelle) → { content: '...' } (admin only, 403 sinon).

### Flux OTP exigé
1. Bouton « Modifier le contrat » dans #tab-contrats (btn-primary, style dashboard).
2. Clic → POST /api/admin/template/otp-request (NOUVELLE route): génère OTP 6 chiffres
   (OtpService étendu scope admin), l'envoie à $_SESSION['admin_email'] via MailService,
   AuditLogger::log('TEMPLATE_OTP_SENT'), répond { sent: true, email: masked (a***@...*) }.
   (Si MailService échoue (SMTP absent en local), fallback: error_log comme AuthController
   et répondre sent:true + dev_hint SEULEMENT en environnement de test local — mais JAMAIS
   exposer l'OTP dans la réponse API. En E2E local, lire le code dans storage/otp_admin_*.txt
   n'est pas possible (hashé) → pour le test, vérifier via la valeur retournée par generate
   interceptée dans les logs OU simplement prouver le flux avec l'OTP lu depuis error_log
   (pattern existant AuthController L197: '[OTP-DEV] code pour ...').)
3. Modal OTP (FedpawaUI.modal): « Un code de vérification a été envoyé à a***@fedpawa.com.
   Saisissez-le pour déverrouiller l'éditeur. » + input 6 chiffres + bouton Valider.
4. POST /api/admin/template/otp-verify (NOUVELLE): OtpService verify (scope admin) → si OK:
   $_SESSION['template_edit_unlocked'] = time() (validité 10 min), AuditLogger, répond
   { unlocked: true }. Rate-limit: 5 tentatives max puis clear (pattern login_throttle).
5. Si unlocked → charger GET /api/admin/template + open modal éditeur (TinyMCE) avec le
   contenu, bouton « Enregistrer » → POST /api/admin/template/update AVEC vérification
   côté serveur: updateTemplate() DOIT exiger $_SESSION['template_edit_unlocked'] récent
   (< 10 min), sinon 403 { error: 'OTP requis' } — C'EST LA SÉCURITÉ RÉELLE: même en
   appelant l'API direct, sans OTP la MAJ est refusée. Après succès: OtpService clear +
   unset session unlock + toast succès.
6. Après enregistrement, proposer (optionnel si simple): aperçu du nouveau contrat via la
   génération existante (PdfService) — NON BLOQUANT, ne pas s'y perdre.

### Routes à ajouter (public/index.php, pattern L69-78)
- $router->get('/api/admin/template', 'AdminController@getTemplate');
- $router->post('/api/admin/template/otp-request', 'AdminController@templateOtpRequest');
- $router->post('/api/admin/template/otp-verify', 'AdminController@templateOtpVerify');
(POST /api/admin/template/update existe déjà — le durcir avec le check OTP.)

### Interface admin-dashboard.js
- Où: section Contrats #tab-contrats — après la table existante, un bloc
  « Modifier le modèle de contrat » avec bouton. NE PAS toucher au rendu de la table.
- Modals OTP + éditeur avec FedpawaUI.modal. Toast FedpawaUI.toast.
- Bump admin-dashboard.js?v=7→8, admin_dashboard.html (script tinymce), dashboard.css si
  styles éditeur (v8 déjà en cours).

## Règles (leçons des vagues précédentes)
- Servi depuis public/, JAMAIS dist/. Pas de PHP dans les .js. Variables CSS du design
  system. TinyMCE self-hosté UNIQUEMENT (déjà en place — ne pas ajouter de CDN externe).
- php -l sur chaque .php, node --check sur chaque .js.
- NE PAS TOUCHER: dashboard.js (espace client), souscription_domiciliation.*, tunnel*
  (L009/L010 terminées par l'orchestrateur, fichier stabilisé).
- Le OTP ne doit JAMAIS apparaître en clair dans une réponse API.

## Definition of Done (E2E obligatoire, http://127.0.0.1:18081, admin connecté)
1. Onglet Contrats: bouton « Modifier le contrat » visible et stylé.
2. Clic → OTP généré + loggué + mail envoyé (ou fallback log local si SMTP off) + modal OTP
   affiché avec email masqué. Capture l012_otp_modal.png.
3. Mauvais OTP → erreur affichée, pas d'édition. Capture l012_otp_wrong.png.
4. Bon OTP (lu depuis error_log pattern [OTP-DEV] en local) → modal éditeur TinyMCE ouvert
   avec le contenu HTML du template chargé. Capture l012_editor.png.
5. Édition (modifier un mot) → Enregistrer → toast succès; vérifier en base:
   contract_templates.content contient la modification + contract_history a une nouvelle
   ligne avec l'ANCIEN contenu + audit_log contient UPDATE_CONTRACT_TEMPLATE.
6. POST /api/admin/template/update SANS session unlock → 403 (preuve sécurité).
7. php -l + node --check OK sur tout fichier touché. Journal state/lanes/L012.md à chaque
   avancée + lane.py done L012 à la fin.