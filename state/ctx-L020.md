# CTX L020 — Messagerie interne: le client ne voit PAS les réponses

## Cause diagnostiquée
- Routes /api/mail/* (InternalMailController: thread/send/reply) — l'ADMIN a l'onglet Messagerie (admin-dashboard.js ensureTabMessages lit lists.messages).
- Le CLIENT n'a AUCUNE vue messagerie: dashboard.js n'appelle jamais /api/mail/* — quand l'admin répond via « Messagerie » (/api/mail/reply), le message part dans internal_messages (receiver=client) mais le client ne le voit JAMAIS. Ses réponses via « Tickets Support » fonctionnent (ticket.reponse affiché).
- L'utilisateur a envoyé un message depuis l'onglet Support (ticket #14 « Salut » client 133, open, réponse NULL) et ne voit pas de retour.

## Fixes à implémenter
1. Vérifier InternalMailController (thread/send/reply): schéma sender_id/sender_type/receiver_id/receiver_type/content/is_read — s'assurer que thread côté CLIENT retourne SES messages (les 2 sens).
2. Espace client: ajouter l'affichage de la messagerie interne dans l'onglet Support existant (dashboard.js): sous les tickets, une section « Messages de l'administration » qui GET /api/mail/thread et affiche les messages non lus (badge), ou un onglet séparé si la structure l'exige déjà côté HTML — REPRENDRE le style existant (cards var(--color-border), badge).
3. Marquer is_read=1 quand le client charge le thread (route dédiée ou param).
4. Admin: bouton « Répondre » de la messagerie doit aussi (ou à la place) créer une réponse sur le TICKET support correspondant si le message vient d'un ticket — NON: garder les 2 canaux séparés mais faire apparaître clairement les 2 sections côté client: Tickets (avec réponses) + Messages directs.
5. Vérifier pourquoi l'utilisateur n'a pas eu de retour sur son ticket #14: l'admin n'a simplement pas encore répondu (reponse NULL) — le fix principal est la VISIBILITÉ messagerie client.

## Fichiers
- src/Controller/InternalMailController.php (thread client + mark read)
- public/assets/js/dashboard.js (section messagerie dans l'onglet Support)
- public/espace_client.html (si structure de section nécessaire)
- NE PAS TOUCHER: StorageController, FactureService, admin-dashboard.js (sauf bug `const nav = +document.querySelector('.db-nav');` L202 — var morte à SUPPRIMER), SubscriptionController, PdfService.

## DoD
- E2E complet du flux: client envoie ticket → admin répond (ticket) → client voit la réponse; admin envoie message direct (mail/reply) → LE CLIENT LE VOIT dans son espace (section messages).
- Badge messages non lus client. is_read passe à 1 après consultation.
- node --check + php -l.
