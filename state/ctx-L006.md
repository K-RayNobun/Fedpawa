# CTX L006 — Sécurité + SEO + Contact: SEC-S4-1, SEO-S5-1, UX-S3-1

## Fichiers EXCLUSIFS
src/Controller/AuthController.php, public/sitemap.xml, public/contact.php (front), src/Controller/ContactController.php, public/index.php (routes), public/assets/js/main.js (si le form y est géré), src/NotificationService.php (lecture). INTERDIT: version bumps, commit, push, docker, fichiers des autres lanes.

## SEC-S4-1 [CRITIQUE] — OTP de reset exposé dans la réponse HTTP
- AuthController.php: la réponse du reset renvoie `debug_otp` (le code OTP dans le JSON) → n'importe qui peut reset n'importe quel compte. En démo (pas de SMTP) c'était un raccourci de test.
- Fix: NE JAMAIS renvoyer l'OTP dans la réponse JSON. À la place: error_log("OTP reset <email>: <code>") pour qu'il soit traçable dans storage/logs/php_errors.log (le mode démo reste testable en lisant le log). Lire d'abord NotificationService (garde isConfigured) — si SMTP configuré l'envoi existe déjà; le log couvre le mode démo. Chercher toutes les occurrences debug_otp.
- Test: POST /api/auth/request-reset (route exacte à vérifier dans index.php) pour un email existant → réponse SANS champ otp; grep du code dans storage/logs/php_errors.log; le flux complet (verifyOtp + reset) reste OK avec le code lu dans le log.

## SEO-S5-1 [Élevée] — sitemap.xml sur le mauvais domaine
- public/sitemap.xml pointe vers www.fedpawacorporatesolutions.com (ancien domaine) au lieu de https://www.fedpawa.com.
- Fix: remplacer toutes les occurrences. Test: curl -s :18081/sitemap.xml | grep -c fedpawacorporatesolutions → 0, et URLs en www.fedpawa.com.

## UX-S3-1 [Critique] — Formulaire de contact = simulateur (grep 'onsubmit=' public/contact.php)
- Le formulaire affiche un succès JS sans ENVOYER quoi que ce soit. ContactController.php (2487 octets) existe — le LIRE d'abord: il a peut-être déjà une méthode utilisable mais non routée.
- Fix backend: route POST /api/contact dans public/index.php → ContactController: validation (nom, email, telephone, message; longueurs max), stockage table `messages_contact` (CREATE TABLE IF NOT EXISTS id/client_id NULL/nom/email/telephone/sujet/message/date_lu NULL — pattern FactureService pour le CREATE), + NotificationService->isConfigured() → notifier contact@fedpawa.com si SMTP.
- Fix front: retirer le onsubmit simulateur; soumettre via window.Api.post('/api/contact', {...}) (api.js chargé sur la page — vérifier; sinon fetch + X-CSRF-Token), garder le message de succès SEULEMENT sur 200, afficher l'erreur serveur sinon.
- Test E2E: soumettre le formulaire réel en navigateur → 200 → ligne en base (lecture sqlite mode=ro) → PURGER la ligne de test.

## Pattern Playwright + pièges
(import: /root/lofi-cities/tools/node_modules/playwright-core/index.mjs; executablePath /root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome, ['--no-sandbox'])
- CSRF: GET /api/csrf-token → X-CSRF-Token sur tout POST /api/*. Lint OBLIGATOIRE: php -l sur chaque .php modifié, node --check sur chaque .js modifié.
- `:visible` invalide en querySelectorAll; regex \n fragiles (split(String.fromCharCode(10))).
- Le conteneur :18081 est bind-mounté: tes éditions sont live immédiatement.

## Purge
Ligne messages_contact de test supprimée + tout client/email de test créé (prefix fixl6-). Budget: 45 min max. Log chaque avancée via lane.py.
