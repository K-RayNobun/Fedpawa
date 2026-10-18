# CTX L014 — Pages Politique de Confidentialité + CGU/CGV, liées à toutes les cases à cocher

## Besoin utilisateur (verbatim 18/10/2026, 3e lane)
Rédiger la politique de confidentialité et les termes (CGU/CGV). Créer une page pour cela et
la LIER aux différents endroits où on demande de cocher pour accepter (pages auth,
formulaires de souscription). Toute personne doit y trouver des explications claires sur
la politique et les termes de Fedpawa.

## Cartographie (vérifiée par l'orchestrateur)
### Cases à cocher existantes qui référencent CGU/CGV/confidentialité SANS lien (à brancher)
1. public/authentification.html L213-214: `#cgu` — « J'accepte les Conditions Générales
   d'Utilisation (CGU) et la politique de confidentialité de FEDPAWA. » (label data-i18n
   cgu_label; EN: auth.js L223). ⚠ page STATIQUE .html.
2. public/souscription_domiciliation.php L336: `#chk-cgv` — « J'accepte expressément les
   Conditions Générales de Vente, la Politique de Confidentialité et la Charte KYC... »
3. public/tunnel_souscription.php L587: checkbox required — « J'accepte les Conditions
   Générales de Vente (CGV), la Politique de Confidentialité et la Charte KYC... »
4. public/en/ : vérifier les équivalents anglais des 3 points (ex en/domiciliation.php,
   en/contact.php...) et les brancher avec les textes EN (auth.js a cgu_label EN L223).
### Pattern page PHP à suivre
- public/contrats.php: $title/$description/$active + site-header.php partial + page-hero +
  sections + site-footer.php. Le style existe: .legal-section, .legal-alert, .page-hero.
### Références légales réelles de l'entreprise (déjà citées dans le contrat de domiciliation
### en base contract_templates — s'y conformer, ne rien inventer)
- Dénomination: FEDPAWA CORPORATE SOLUTIONS SARL, capital 1 000 000 FCFA, RCCM
  CM-DLA-01-2026-B13-00767 (Douala), NIU M09261890362B, siège: Immeuble Pharmacie de
  Logpom, Douala, Cameroun. Contact: contact@fedpawacorporatesolutions.com,
  +237 691 70 48 02.
- Cadre juridique citable: Loi n° 2010/012 du 21/12/2010 (cybersécurité/cybercriminalité
  Cameroun) — signature électronique; Actes Uniformes OHADA; droit camerounais.
- KYC: la Charte KYC existe déjà (section KYC de domiciliation.php + contrat art. 8) —
  la politique de confidentialité doit couvrir: données collectées (identité, entreprise,
  pièces KYC, paiements Mobile Money, courriers numérisés), finalités, base légale,
  durée de conservation (archivage courrier 1 mois par formule — cf art. 5/11 du contrat),
  droits (accès/rectification/suppression — déjà mentionné art. 12 du contrat), contact
  DPO/privacy, cookies (sessions PHP, préférences thème/langue stockées localement).

## Implémentation attendue
1. NOUVELLE page public/politique-confidentialite.php: page PHP complète au pattern
   contrats.php (header partial, page-hero « Politique de Confidentialité », sections
   claires numérotées, français professionnel, TERMS réutilisant les vraies données
   ci-dessus). Sitemap + meta description propres.
2. NOUVELLE page public/cgu.php (Conditions Générales d'Utilisation ET de Vente —
   exposer: objet du site, comptes client, processus de souscription, paiements
   Mobile Money, engagements réciproques, résiliation (reprendre les art. 9/10/11 du
   contrat: préavis 15 jours, suspension 10 jours retard, destruction courrier 30
   jours), limitations de responsabilité, droit applicable OHADA/Cameroun,
   tribunaux de Douala, modifications des CGU, contact).
   → Les 2 pages séparées (confidentialité ≠ CGU) MAIS liées entre elles.
3. Versions EN: public/en/politique-confidentialite.php et public/en/cgu.php avec le
   MÊME contenu traduit (le site a une section /en complète).
4. Lier les cases à cocher (rendre « CGU », « politique de confidentialité » cliquables,
   ouverture NOUVEL ONGLET target=_blank rel=noopener):
   - authentification.html: le label #cgu (L214) + le message toast auth.js L125 (texte
     seulement, pas de lien nécessaire dans le toast) — MAIS la page est STATIQUE .html:
     le label HTML contient le texte FR; ajouter les <a> directement dans le label HTML
     ET mettre à jour auth.js cgu_label FR/EN (L191/L223) pour inclure les liens.
   - souscription_domiciliation.php L336: les <strong> « Conditions Générales de Vente »
     et « Politique de Confidentialité » du span deviennent des <a target=_blank>.
   - tunnel_souscription.php L587: idem.
   - EN équivalents (grep 'privacy\|CGU\|terms' public/en/*.php *.html).
5. Footer: ajouter les 2 liens dans templates/partials/site-footer.php (footer-links,
   L26+) — section Mentions légales si elle existe, sinon la créer discrètement.
6. Sitemap public/sitemap.xml (existant — vérifier) + éventuel menu footer EN.
7. Bump des assets si touchés (auth.js v3).

## Règles (leçons des vagues précédentes)
- Servi depuis public/, pattern des partials PHP existant, aucune nouvelle dépendance.
- Pas de PHP dans les .js. php -l sur chaque .php, node --check sur chaque .js touché.
- NE PAS TOUCHER: dashboard.js, admin-dashboard.js/main.js/AdminController (L011 en cours),
  les fichiers tunnel_souscription.php/souscription_domiciliation.php SEULEMENT aux
  lignes des cases à cocher (L010/L009 ont stabilisé le reste — patchs chirurgicaux
  old_string unique).
- Contenu: FR professionnel, cohérent avec les références légales réelles ci-dessus.
  PAS de placeholders « Lorem », PAS de données inventées.

## Definition of Done (E2E, http://127.0.0.1:18081)
1. /politique-confidentialite.php et /cgu.php répondent 200, complètes, thémées (capture
   l014_policy.png, l014_cgu.png), EN versions 200 aussi (l014_policy_en.png).
2. authentification.html: le label CGU contient 2 liens cliquables → ouverture OK
   (vérifier href + target).
3. souscription_domiciliation.php + tunnel_souscription.php: les cases à cocher
   contiennent les liens (curl grep).
4. Footer contient les liens sur TOUTES les pages (curl grep sur /).
5. Sitemap contient les 4 nouvelles pages.
6. php -l OK sur toutes les pages nouvelles/modifiées; node --check auth.js.
7. Journal state/lanes/L014.md + lane.py done L014 à la fin.