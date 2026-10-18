# CTX L004 — S-3 [MAJEUR] Domiciliation: flux contrat + signature OTP inatteignable

## Contexte (audit 17/10)
souscription_domiciliation.js passe `contract: true` à FedpawaPay.momoScreen, mais son onSubmit retourne `{ok, message, subscription_ref}` SANS le champ `api` que fedpawa-pay.js exige pour afficher contractFlowScreen (écran « Paiement en cours de confirmation » + bouton « Vérifier Mon Paiement » + génération contrat + écran signature OTP). Résultat E2E: « Souscription enregistrée ! », abo en_attente, 0 contrat, l'OTP de signature (renvoyé par le serveur, ex. 949240) jamais consommé.

## Fix attendu (fichier EXCLUSIF: public/assets/js/souscription_domiciliation.js)
Dans onSubmit (recherche `return { ok: true, message: out.message`), retourner AUSSI `api: out` (le JSON complet de /api/souscription: subscription_id, signature_otp, transaction_id...) — comme le fait tunnel.js. UNE ligne + éventuels ajustements de cohérence. fedpawa-pay.js fait le reste (contractFlowScreen existe déjà).
- INTERDIT: modifier fedpawa-pay.js (lane L003 l'a en exclusif), version bumps, commit, push, docker.

## E2E obligatoire (preuve de fin)
Script de référence PROUVÉ s'il existe encore: /tmp/wf2_domi11.mjs — le lire et l'adapter. Sinon le reconstruire:
1. Register+login (prefix fixl4-, mdp FixL4!2026).
2. souscription_domiciliation.php?pack=national-business (pack présélectionné).
3. Boucle étapes 1→5: remplir tous les champs visibles requis de .tunnel-step-content.active; à l'étape 5 KYC cocher #chk-cgv #chk-cadre #chk-exactitude ET uploader le même PDF sur les 3 inputs (`p.setInputFiles('input[type=file] >> nth=' + n, path)` — ils sont invisibles mais ciblables), puis bouton VALIDER ET GÉNÉRER.
4. Étape 7 Facture Proforma (TVA 19,25% affichée) → bouton paiement → modal MM (numéro + Orange + submit).
5. ÉCRAN ATTENDU: « Paiement en cours de confirmation » avec Reference + bouton « Vérifier Mon Paiement » (btnVerifyPay) → clic → paid → écran de signature OTP (contrat généré; en mode démo le code peut apparaître).
6. /api/dashboard: subscription.statut=actif ET facture FAC-*. Screenshot → /root/Fedpawa/audit/fix_l4_*.png.

## Pattern Playwright + pièges
(import chromium: /root/lofi-cities/tools/node_modules/playwright-core/index.mjs; executablePath /root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome, args ['--no-sandbox'])
- L'étape 5 exige l'upload AVANT de cliquer VALIDER, sinon errorsBox bloque (message explicite — c'est le comportement normal).
- Le 1er clic Continuer peut ne pas avancer tout de suite (attendre 1.8-2s par étape).
- `:visible` invalide en querySelectorAll; regex \n fragiles (split(String.fromCharCode(10))).
- PDF de test: écrire un faux fichier '%PDF-1.4 test' en /tmp avant les uploads.

## Purge (volume partagé prod!)
DELETE clients fixl4-% + DELETE par client_id sur les 8 tables (abonnements, factures, tickets_support, paiements, password_resets, kyc_documents, courriers, contrats). Vérifier 0 restant.
Budget: 45 min max. Log chaque avancée via lane.py.
