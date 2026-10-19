# CTX L019 — Téléchargements: factures/contrats/KYC partout + audit exhaustif des documents

## Causes diagnostiquées (vérifiées en direct)
1. FACTURES: PDF jamais généré (FactureService INSERT lien_pdf=NULL) + StorageController::serve() n'a PAS de case 'facture' (400 type invalide) + dashboard.js affiche href="#" (lien_pdf null).
2. CONTRATS espace client: dashboard.js L135 href RELATIF `${c.fichier}` = "documents/contrat_47.pdf" → 404 page (il faut /api/document?type=contrat&id=N).
3. KYC admin: liens /api/document?type=kyc corrects — mais auditer que les fichiers existent (storage/uploads/client_N/) et que les 2 types (piece_identite/justificatif_domicile) répondent.
4. admin_document.html id=10: fonctionne en test ET prod (vérifié 200) — l'échec utilisateur = probablement cache navigateur/CDN de la page datant d'avant le rebuild 13:57. Audit quand même le flux complet.

## Fixes à implémenter
- serve(): ajouter case 'facture' (table factures, client_id, lien_pdf) + fallback: si lien_pdf null → générer le PDF à la volée via PdfService::generateInvoice (numero, client nom, montant) et le stocker (UPDATE lien_pdf) puis servir — AINSI les 3 factures EXISTANTES (FAC-DEMO-SUB-84/85/86, lien_pdf NULL) deviennent téléchargeables immédiatement.
- FactureService::createForPayment: générer le PDF à la création (lien_pdf rempli) pour les futures.
- dashboard.js factures: href = lien_pdf (après le fix serve, remplir) → uniformiser sur /api/document?type=facture&id=N (passer par serve = garde ownership).
- dashboard.js contrats: href = `/api/document?type=contrat&id=${c.id}` (JAMAIS le chemin relatif).
- AUDIT EXHAUSTIF: lister TOUS les points de téléchargement du site (grep 'Télécharger\|download\|/api/document'), tester CHACUN en E2E navigateur avec session client (client 133 Dewa Albert existe avec données) ET session admin: matrice document×rôle → tous 200 (ou 404 propre si fichier absent, avec lien masqué).

## Fichiers
- src/Controller/StorageController.php (case facture + génération à la volée)
- src/Service/FactureService.php (PDF à la création)
- public/assets/js/dashboard.js (2 href)
- NE PAS toucher: SubscriptionController.php, PdfService.php (tâches L020/L021 dessus), admin-dashboard.js, messagerie.

## DoD
- E2E: facture id 5/6/7 → 200 PDF pour leur propriétaire; contrat client → 200; KYC admin → 200; matrice complète des liens de téléchargement → capture + codes HTTP.
- php -l + node --check. Comptes test jetables purgés.
