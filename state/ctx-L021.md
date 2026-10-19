# CTX L021 — Facture: ajouter NIU/RCCM/Siège, retirer la TVA

## Besoin utilisateur (verbatim)
« Concernant la facture, il y a des informations qui manquent comme le NIU et le RCCM que je t'ai fournis. Hormis cela je voudrais que tu enlèves la TVA et son prix de la facture totale.
Voici encore les informations qui doivent toujours figurer sur une facture :
NIU: M092618980362B
RCCM: CM-DLA-01-2026-B13-00767
Siège Social : Douala - Logpom »

⚠ L'utilisateur a tapé M092618980362B (inversion de chiffres) — la valeur CORRECTE, celle du
contrat officiel et de tout le site, est **M09261890362B**. Utiliser M09261890362B. (Ne pas
modifier le contrat ni le reste du site.)

## État actuel
- invoice.html.twig: NIU/RCCM/Siège ABSENTS (juste N° facture, date, client, désignation, montant, Total).
- Pas de ligne TVA explicite dans le twig actuel — vérifier la version servie (la facture générée
  à la volée par serve() en L019 utilisera ce twig): si une ligne TVA apparaît quelque part
  (PDF déjà générés, ou twig miroir), la supprimer. Le TOTAL = montant exact, aucune mention TVA.

## Fixes
- templates/invoice.html.twig: en-tête émetteur FEDPAWA CORPORATE SOLUTIONS SARL + NIU M09261890362B
  + RCCM CM-DLA-01-2026-B13-00767 + Siège Social : Douala - Logpom (Immeuble Pharmacie de Logpom).
  ZÉRO mention de TVA (ni ligne, ni dans le total). Mise en page facture professionnelle sobre
  (reprendre l'existant, pas de refonte).
- Si facture.html.twig miroir existe (templates/), appliquer pareil.
- PdfService::generateInvoice: passer invoice_number/client_name/amount inchangés (déjà OK).
- VÉRIFIER la génération: le PDF d'une facture test contient bien NIU+RCCM+Siège et AUCUNE TVA
  (pdftotext ou re-générer + inspecter). Les factures existantes en base (FAC-DEMO-SUB-84/85/86)
  seront re-générées par L019 (lien_pdf null → à la volée) — elles prendront le nouveau format.

## Fichiers
- templates/invoice.html.twig (+ miroir éventuel)
- NE PAS TOUCHER: StorageController/FactureService (L019), SubscriptionController, contract.html.twig, dashboard.js.

## DoD
- PDF facture généré: grep pdftotext "NIU" + "RCCM" + "Logpom" présents, "TVA" absent.
- php -l. Capture du PDF rendu.
