# Rapport L012 — Onglet Contrats admin : éditeur de contrat + OTP admin

Date: 2026-10-18 | Agent: hermes-l012 | Statut: DONE

## Ce qui a été livré

### Backend (réutilise l'existant, n'invente rien)
- `src/Service/OtpService.php` — étendu avec param `scope` ('client'|'admin').
  Fichier admin distinct `storage/otp_admin_<id>.txt` (aucune collision
  client_id/admin_id). Signature historique generate/verify/callers inchangée
  pour les clients.
- `src/Service/NotificationService.php` — ajout `sendOtpAdmin(email, code)`
  (même canal SMTP que sendOtp, retour false si SMTP non configuré).
- `src/Controller/AdminController.php` :
  - `getTemplate()` — GET /api/admin/template → { content } (admin only via
    constructeur 403).
  - `templateOtpRequest()` — génère OTP 6 chiffres scope admin, l'envoie à
    $_SESSION['admin_email'], répond { sent:true, email:"a***@fedpawa.com" }
    (email masqué). OTP JAMAIS dans la réponse. Fallback local: error_log
    '[OTP-ADMIN-DEV] code pour …' (pattern AuthController L187-197).
    Audit: TEMPLATE_OTP_SENT.
  - `templateOtpVerify()` — rate-limit 5 tentatives (session) puis clear,
    400 si code invalide (+attempts_remaining), si OK:
    $_SESSION['template_edit_unlocked']=time() (10 min) + clear OTP.
    Audit: TEMPLATE_OTP_VERIFIED / TEMPLATE_OTP_FAILED / TEMPLATE_OTP_LOCKED.
  - `updateTemplate()` DURCI — vérifie session unlock < 600 s, sinon 403
    {error:'OTP requis'} + audit TEMPLATE_UPDATE_BLOCKED. Après succès:
    UPDATE contract_templates + INSERT contract_history (ancien contenu) +
    audit UPDATE_CONTRACT_TEMPLATE + clear OTP + unset unlock (à la fois
    branche API et branche formulaire).
- `public/index.php` — 3 nouvelles routes: GET /api/admin/template,
  POST /api/admin/template/otp-request, POST /api/admin/template/otp-verify.

### Front
- `public/admin_dashboard.html` — onglet Contrats: bloc « Modèle de contrat »
  + bouton `#btn-edit-template` « Modifier le contrat » (btn-primary) ;
  script `assets/vendor/tinymce/tinymce.min.js` (self-hosted, AUCUN CDN) ;
  bump admin-dashboard.js.
- `public/assets/js/admin-dashboard.js` (bumpé, voir note versions) — flux
  complet: clic → POST otp-request → modal OTP FedpawaUI (email masqué,
  input 6 chiffres, erreur inline) → POST otp-verify → GET template → modal
  éditeur TinyMCE 6.8.3 (skin oxide-dark, plugins lists/table/link, licence
  gpl, hauteur 450) → Enregistrer → POST update → toast succès / toast 403
  « Déverrouillage expiré ». Délégation sûre via guard dataset (pas de bind
  statique cassé par re-render).
- `public/assets/css/dashboard.css` — styles `.l012-editor-hint`,
  `.l012-otp-*`, `.l012-editor-*`, modal large `.fp-template-modal`.

### TinyMCE — installation COMPLÉTÉE sans aucun téléchargement
L'install existante n'avait que le core + theme (fichiers au mauvais chemin
canonique) : plugins/, models/, themes/silver/, skins/content/dark/ MANQUANTS
→ l'éditeur ne se construisait pas (« Failed to load theme: silver »).
Le tarball officiel tinymce-6.8.3.tgz était DÉJÀ dans le cache npm local
(/root/.npm/_cacache, sha512 vérifié contre l'integrity du cache). J'en ai
extrait UNIQUEMENT les dossiers manquants vers assets/vendor/tinymce/ :
plugins/{lists,table,link}, models/dom, themes/silver/, skins/content/dark/.
Zéro requête réseau, zéro CDN.

## E2E réel (playwright-core + chromium-1234, /root/Fedpawa/verify-l012.mjs)
11/11 PASS — http://127.0.0.1:18081, admin audit-e2e@fedpawa.com :
1. PASS bouton « Modifier le contrat » visible et stylé (fond or #D4AF37)
2. PASS modal OTP affichée avec email masqué a***@fedpawa.com
2b. PASS OTP généré + loggué (fallback [OTP-ADMIN-DEV] dans docker logs)
3. PASS mauvais OTP refusé: « Code invalide » affiché, éditeur non ouvert
4. PASS bon OTP (lu depuis error_log) → éditeur TinyMCE ouvert avec le
   contenu HTML du template (14487 chars visibles dans l'iframe)
5a. PASS toast succès « Modèle de contrat enregistré. »
5b. PASS modification sauvée en base (marqueur E2E trouvé dans
    contract_templates.content)
5c. PASS contract_history: nouvelle ligne avec l'ANCIEN contenu (17534
    chars, sans le marqueur)
5d. PASS audit_log contient UPDATE_CONTRACT_TEMPLATE
6. PASS POST /api/admin/template/update SANS unlock → 403 {OTP requis}
7. PASS aucune erreur JS non interceptée

Captures: /root/Fedpawa/audit/l012_bouton.png, l012_otp_modal.png,
l012_otp_wrong.png, l012_editor.png, l012_saved.png

## Lint
php -l OK sur AdminController.php, OtpService.php, NotificationService.php,
index.php (dans le conteneur). node --check OK sur admin-dashboard.js.

## Note versions (interaction L011)
Le mandat demandait un bump v8, mais la lane L011 (tournée en parallèle) a
déjà bumpé admin-dashboard.js + dashboard.css en v9 et main.js en v5 sur ce
même fichier HTML. Le bump L012 est donc couvert par v9 (supérieur à v8) —
aucun downgrade effectué, le cache-busting reste valide.

## Hygiène
Données de test purgées: contract_templates.content restauré (18117 chars
d'origine), contract_history vidé, audit TEMPLATE_* purgé, otp_admin_*.txt
supprimés, scripts temporaires supprimés. Le E2E peut être rejoué à froid.
