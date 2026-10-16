# Audit UX des Workflows Utilisateurs — Fedpawa (vérifié)

> Audit exécuté en arrière-plan (agent), puis **chaque finding re-vérifié manuellement en
> navigateur réel/API/base** par l'auditeur principal. 13 findings bruts → **8 validés,
> 5 invalidés (faux positifs)**.

## Validés (vérifiés ce 16 oct. 2026)

| ID | Persona | Gravité | Problème | Preuve |
|----|---------|---------|----------|--------|
| W-2 | Visiteur / SEO | **Critique** | hreflang EN pointe vers 404 | Le <head> de l'accueil émet `hreflang="en" href="https://www.fedpawa.com/en/"` → **404 en prod** (vérifié curl). `/en/index.php` répond 200. Google indexera une erreur. |
| W-9 | Client avec abo | **Critique** | Statut d'abonnement incohérent selon l'endroit | Client 50: carte Aperçu = badge « En attente », onglet Abonnement = « Actif » — pour le même compte (base: 3 actifs, 13 en_attente). Le JS lit des lignes différentes selon l'endroit. |
| W-10 | Client avec abo | **Majeur** | Aucune facture générée ni affichée | Table `factures` = 0 ligne (base partagée prod/test). Le paiement MoMo ne crée jamais de facture; l'onglet affiche « Aucune facture pour le moment » — véridique mais le flux est incomplet: pas de preuve de paiement pour le client. |
| W-6 | Client sans abo | **Majeur** | Pas de guidance premier usage | L'espace client d'un nouveau client est fonctionnel (états vides honnêtes) mais n'explique nulle part la prochaine étape (faire son KYC → souscrire). La carte KYC dit « Action requise » sans bouton/lien. |
| W-12 | Client avec abo | **Moyen** | Courriers: 7 non lus, pas d'action « marquer comme lu » | Base: tous les courriers client 50 en `non_lu`; l'UI liste sans action de nettoyage. |
| W-13 | Client avec abo | **Moyen** | Tickets support: statut figé « open », aucune réponse visible côté client | L'historique (F7) montre sujet+statut, mais pas de réponse admin rendue dans l'espace client — le client ne sait jamais si sa demande est traitée. (NB: les tickets test en base portent des sujets « Audit… », artefacts de tests.) |
| W-1 | Visiteur | **Moyen** (subjectif) | Accueil: offre pas lisible en <10s | 5 services présentés à égalité, pas de hiérarchie du CTA principal. Recommandation: un bandeau « Domiciliation d'entreprise à Douala — souscrivez en ligne » + CTA unique au-dessus de la ligne de flottaison. |
| W-3 | Visiteur | **Mineur** | Footer sans téléphone/WhatsApp | Footer: adresse + horaires + email seulement; le numéro existe ailleurs (page contact, bouton WhatsApp flottant). |

## Invalidés (faux positifs du sous-agent — re-testés manuellement)

| ID | Claim initial | Réalité vérifiée |
|----|---------------|------------------|
| W-5 | « Espace client désert, Chargement… partout » | **Faux** — les fixes F2/F3 fonctionnent: badge « Inactif », « Aucun abonnement actif pour le moment. », « Aucune facture pour le moment. Elles apparaîtront ici après… » (re-testé navigateur) |
| W-4 | « Register CSRF échoue » | **Faux** — les 11 suites E2E créent des comptes via /api/register avec CSRF, 100% vertes |
| W-7 | « Profil échoue silencieusement » | **Faux** — toast « Cet e-mail est déjà utilisé » s'affiche (re-testé avec email en doublon) |
| W-8 | « Pas de lien mot de passe oublié » | **Faux** — lien `mot_de_passe_oublie.html` présent sur la page de login |
| W-11 | « Contrats en DB mais pas dans l'UI » | **Faux** — l'onglet Contrats affiche les 3 contrats avec liens « Télécharger (PDF) » (re-testé) |

## Priorités de correction suggérées

1. **W-2** (1 ligne): faire pointer le hreflang EN vers `/en/index.php` (ou créer une réécriture `/en/` → `/en/index.php`) — c'est un 404 Google visible.
2. **W-9** (cohérence): lire TOUJOURS le même abonnement (le plus récent `actif`, sinon le plus récent tout court) dans la carte ET l'onglet.
3. **W-10** (fonctionnel): générer une entrée `factures` à chaque paiement MoMo confirmé + l'afficher (numéro, date, montant, lien PDF).
4. **W-6** (guidance): bannière « Bienvenue — prochaine étape » dans l'espace client tant que KYC non approuvé OU abonnement absent.
5. **W-12/W-13**: bouton « Marquer comme lu » sur les courriers; réponse admin visible sur les tickets.
