# CTX L018 — Présentation du contrat (étape signature) : 1re page structurée + visionneuse intégrale

## Problème (4e signalement utilisateur — MUST FIX)
À l'étape de signature OTP (après paiement domiciliation), le « contrat » affiché dans le modal est un PLACEHOLDER de 3 lignes (`fedpawa-pay.js` `contractSignScreen` L171-196 : titre + « Article 1 — Objet. Article 2 — … » en une phrase + note). Ce n'est PAS une présentation de contrat. L'utilisateur veut :

1. **La VRAIE première page du contrat, structurée, en bonne et due forme** dans le modal (en-tête FEDPAWA, titre CONVENTION, PRÉAMBULE, parties avec données réelles, objet, formule + montant, date).
2. **Un bouton juste en bas** : « Voir le contrat complet » → ouvre le contrat **intégral (toutes ses pages)** dans un **nouvel onglet**.

## Architecture (état des lieux vérifié)
- Contenu source de vérité : table `contract_templates` (name='contract', HTML complet h1/h2 14 articles — injectée par MigrationRunner depuis `templates/contract.html.twig`).
- PDF signé : `PdfService::generateContract($data)` (DomPDF, A4) → `documents/contrat_<id>.pdf` → servi par `GET /api/document?type=contrat&id=N` (StorageController, auth, `Content-Disposition: inline`) — PARFAIT pour l'onglet APRÈS signature, mais AVANT signature le fichier n'existe pas.
- Modal signature : `fedpawa-pay.js` `contractSignScreen(m, config, sub, payInfo)` — `sub` = réponse de création de souscription (subscription_id, transaction_id…), `config` = {label, priceFCFA…}. Le nom client est dans `sub.client_name || window.FP_contractName || 'Client'`.
- La souscription vit en base (table abonnements, statut en attente de signature).

## Implémentation

### A) Route preview HTML : `GET /api/contract/preview?subscription_id=N`
Dans `SubscriptionController::preview()` (NOUVELLE méthode, route ajoutée dans `public/index.php`) :
- Auth obligatoire (client propriétaire de la souscription ; admin OK).
- Charge `contract_templates.content` (base) + remplace les placeholders twig connus (`{{ client_name }}`, `{{ company_name|default('Entreprise') }}`, `{{ price }}`) par les données réelles de la souscription (nom, société si dispo, prix).
- Renvoie `Content-Type: text/html; charset=utf-8` — le HTML complet du contrat, ENVELOPPÉ dans une page présentable : `<style>` minimal A4 (pages visuelles : `@page`, conteneur max-width 800px, marges, typographie serif juridique, h2 bordés, footer « FEDPAWA CORPORATE SOLUTIONS SARL — document généré électroniquement »).
- 404/403 propres (non-propriétaire, souscription inexistante).

### B) Le modal (fedpawa-pay.js contractSignScreen)
Remplacer le bloc `.contract-doc` placeholder par :
- **Vraie 1re page structurée** (statique, données du contexte) : en-tête société (dénomination complète, RCCM, NIU, siège), titre centré, PRÉAMBULE condensé (le paragraphe « Entre les soussignés… »), bloc objet + formule/montant + référence transaction + date. Fond papier (#faf9f7), bordure sobre, typographie juridique, PAS de scroll infini (max-height + ombre de coupe « suite du contrat ↓ »).
- **Bouton sous le bloc** : `📄 Voir le contrat complet` → `window.open('/api/contract/preview?subscription_id=' + sub.subscription_id, '_blank', 'noopener')` — ouvre l'onglet intégral.
- Conserver le formulaire OTP + « Signer mon contrat » à l'identique (fonctionnalité inchangée).

### C) Après signature
Le lien « Télécharger le PDF signé » existe déjà (`contrat_url`). Dans l'espace client le tableau Contrats pointe déjà le PDF. AUCUN changement requis là.

## Fichiers
- `src/Controller/SubscriptionController.php` — + preview() (méthode nouvelle, ne rien toucher d'autre du fichier)
- `public/index.php` — + 1 route GET /api/contract/preview
- `public/assets/js/fedpawa-pay.js` — contractSignScreen : bloc 1re page + bouton window.open
- (styles du modal : réutiliser vars CSS existantes, pas de #fff dur)

## HORS PÉRIMÈTRE (noté pour lane séparée — NE PAS FAIRE ICI)
- Faille `signature_otp` renvoyé dans la réponse JSON de création de souscription (SubscriptionController L88) — identique au pattern SEC-S4 déjà corrigé sur password-reset. Lane sécurité séparée.

## Definition of Done
- Modal signature : la 1re page structurée visible (capture), bouton « Voir le contrat complet » sous le bloc.
- Clic bouton → nouvel onglet avec le contrat INTÉGRAL (14 articles présents — grep « Article 14 » dans le HTML servi), données client remplies, pas de {{ }} résiduel.
- 403 si souscription d'un autre client / 404 si inexistante (preuve curl).
- `node --check fedpawa-pay.js` + `php -l` sur les 2 .php.
- E2E navigateur : flux complet (login test → souscription mode test → paiement vérifié → modal 1re page → clic bouton → onglet contrat complet) — utiliser le bandeau MODE TEST ADMIN du tunnel si actif sur :18081, sinon créer souscription via API en base de test et appeler la route preview directement.
