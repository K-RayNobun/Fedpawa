# Audit Espace Client post-paiement — re-vérification F1-F12 + W-9/W-10/W-13 après correctifs
Date: 17/10/2026 · Cible: http://127.0.0.1:18081 (miroir prod) · Navigation navigateur réelle, lecture seule · Données de test purgées.

## Méthode
Client neuf (sw3-*) → register + login → souscription création standard via API → paiement vérifié (mode démo) → abonnement ACTIF + facture FAC-DEMO-SUB-81 créée → audit de chaque onglet de l'espace client en UI réelle (clics, screenshots ec3x_*.png). Second client neuf sans abonnement (sw3b-*) pour F2/F3. Vue mobile 375px pour F4. Admin audit-e2e pour la réponse ticket (W-13).

## Résultats

| ID | Statut | Preuve |
|---|---|---|
| F1 Déconnexion impossible | ✅ CORRIGÉ | Clic « Se déconnecter » → /api/me authenticated:true→false + redirection authentification.html. Boutons logout visibles desktop + mobile. |
| F2 Badge Actif mensonger sans abo | ✅ CORRIGÉ | Client sans abonnement: aucun badge ACTIF sur l'aperçu. |
| F3 « Chargement… » éternel | ⚠️ PARTIEL (2/3 corrigé) | Carte Abonnement OK (standard/ACTIF). MAIS cartes « CONFORMITÉ (KYC) » et « DERNIER COURRIER REÇU » affichent encore « Chargement… » en sous-valeur quand il n'y a pas encore de KYC/courrier (client payé, ec3x_sans_abo.png / aperçu). |
| F4 Profil/déconnexion inaccessibles mobile | ✅ CORRIGÉ | 375px: menu burger contient « 👤 MON ESPACE » et « 🚪 Se déconnecter », 2 boutons logout visibles. |
| F5 « Se souvenir de moi » décoratif | ✅ RÉSOLU (retiré) | La checkbox a disparu de l'UI (supprimée du DOM de l'auth). |
| F6 « Changer de pack » inerte | ✅ CORRIGÉ (à noter) | Le bouton redirige désormais. ⚠️ Destination = souscription_domiciliation.php pour un abonnement création — incohérence de ciblage à revoir. |
| F7 Pas d'historique tickets | ✅ CORRIGÉ | Section « Mes demandes précédentes »: ticket visible après envoi+reload avec statut OUVERT. |
| F8 Tables vides muettes | ✅ CORRIGÉ | « Aucun contrat pour le moment… », « Aucun courrier reçu pour le moment… » affichés. |
| F9 Statuts/CNI mappés sur le même champ | ✅ CORRIGÉ | Onglet Documents: 4 entrées distinctes (CNI/Passeport, Statuts de l'entreprise, Justificatif de domicile, Description d'activité) chacune avec son état. |
| F10 Pas de limite sujet/message | ✅ CORRIGÉ | maxLength 150 (sujet) / 5000 (message). |
| F11 Inputs sans id / labels sans for | ✅ CORRIGÉ | 0 input sans id, 0 label sans for sur les formulaires. |
| F12 Autocomplete absent | ❌ TOUJOURS OUVERT | Champs mot de passe sans attribut autocomplete (WCAG 1.3.5). |

## Re-vérification des correctifs W (UI)
- **W-9 ✅** Aperçu et onglet Abonnement affichent le même statut réel « ACTIF » pour le client payé (carte « ABONNEMENT ACTIF | standard | ACTIF »).
- **W-10 ✅** Facture FAC-DEMO-SUB-81 créée au paiement vérifié ET visible dans l'onglet Mes factures (table 3 lignes d'état + la facture).
- **W-13 ✅** Admin répond → client voit après rechargement: statut « RÉPONDU » + « Réponse du support : … » + date (ticket « Test audit EC3 », ec3x_w13b.png).

## Nouveaux points relevés
1. [Moyen] Cartes KYC et Dernier courrier: sous-valeur « Chargement… » jamais résolue quand vide (F3 résiduel) — afficher « — » ou « Aucun élément ».
2. [Mineur] « Changer de pack / Ajouter des options » (abonnement création) redirige vers souscription_domiciliation.php — devrait rouvrir le tunnel du service concerné.
3. [Mineur] F12 autocomplete toujours absent.

## Données de test
Purgées: clients sw3-* / sw3b-* (122, 123) + abonnements, factures, tickets, paiements liés. Vérifié 0 restant.
