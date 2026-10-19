# CTX L022 — Contrat: remplir les ………… depuis le formulaire + lisible/téléchargeable AVANT signature

## Besoin utilisateur (verbatim, capture img_ad26048cf7b3)
« Ce contrat a besoin de remplir des informations qui sont pourtant bien présentes sur le site web. Corrigés cela et remplis à partir des informations entrées dans le formulaire. On peut les utiliser car le client a dans une étape préalable coché et donc affirmé qu'il est certain des informations qu'il a rentrées. Le contrat devrait pouvoir être vu et téléchargeable avant d'avoir à le signer. On mentionnera clairement qu'il vaut mieux que le client lise attentivement le contrat avant de le signer. »

## Causes (vérifiées)
- contract.html.twig + contract_templates (base): bloc PRÉAMBULE avec ………… (capital, RCCM, NIU, siège, représentant, qualité du Domicilié) — MAIS le formulaire souscription_domiciliation.php collecte rccm (L82) et niu (L87) et adresse (L202) SANS jamais les stocker: SubscriptionService::store() n'insère que client_id/pack/prix/date/statut dans abonnements. → les données saisies sont PERDUES.
- La vue intégrale existe (L018: /api/contract/preview) mais avec les ………… puisque non disponibles.

## Fixes
1. Persistance: ALTER TABLE abonnements ADD COLUMN details TEXT (JSON: rccm, niu, siege, capital, representant, qualite, raison_sociale/entreprise, contact) — migration additive dans le bootstrap/migrations du projet (chercher comment les migrations tournent: src/Service/MigrationRunner ou similaire; si pas de système, exécuter le ALTER une fois via script + l'inclure dans le bootstrap pour les nouvelles bases). Storage partagé test+prod: le ALTER est idempotent (IF NOT EXISTS / try-catch).
2. SubscriptionService::store(): lire rccm/niu/adresse/representant/capital du payload et les stocker dans details (JSON encode). Ne pas casser les appels existants (champs optionnels).
3. PdfService::generateContract: recevoir les données du Domicilié (client_name, company_name, price + rccm/niu/siege/representant/qualite/capital) et les substituer AUX ………… du template (str_replace ciblé des 6 séquences du bloc PRÉAMBULE + bloc signature final « Je, soussigné Person… »). Si un champ est absent → « en cours » (pour rccm/niu) ou laissons le tireté pour capital/qualite — mais rccm/niu/siège/representant DOIVENT venir du formulaire.
4. SubscriptionController::finalize: passer les details à generateContract.
5. SubscriptionController::preview (L018): mêmes substitutions (preview = le PDF avant signature).
6. fedpawa-pay.js contractSignScreen: ajouter SOUS le bouton « Voir le contrat complet » (L018) un lien « 💾 Télécharger le contrat (PDF) » → window.open('/api/contract/download?subscription_id=N') — NOUVELLE route qui génère le PDF (DomPDF, même contenu que preview, placeholders remplis) SANS exiger la signature. + note claire au-dessus du formulaire OTP: « ⚠️ Nous vous recommandons de lire attentivement l'intégralité du contrat avant de le signer. »
7. Vérifier que le PDF signé (après OTP) utilise AUSSI les données remplies (même chemin generateContract).

## Fichiers
- src/Service/SubscriptionService.php (store + details)
- src/Service/PdfService.php (substitution des …………)
- src/Controller/SubscriptionController.php (finalize + preview + NOUVELLE download route)
- public/index.php (route /api/contract/download)
- public/assets/js/fedpawa-pay.js (lien download + mention lecture attentive)
- templates/contract.html.twig + base contract_templates: remplacer les ………… PAR DES PLACEHOLDERS NOMMÉS ([DOMICILIE_RCCM] etc. — rétro-compatibles: le texte ………… disparaît au profit de marqueurs substitués; pour les PDF/admin éditeur, documenter les marqueurs) — ATTENTION: contract_templates.content est édité par l'admin (L012): mettre à jour la ligne en base + le twig miroir.
- NE PAS TOUCHER: StorageController, FactureService, invoice.html.twig, dashboard.js, messagerie.

## DoD
- E2E: souscription test avec rccm/niu/adresse remplis → preview/download du contrat AVANT signature → PDF contient les valeurs (pdftotext grep), plus aucun ………… sur les champs fournis; mention « lire attentivement » visible au modal; le contrat signé contient aussi les données.
- 403/404 de download (même garde que preview). php -l + node --check. Purge des données test.
