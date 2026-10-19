# CTX L017 — Politique de confidentialité + CGU : lisibilité mobile des longues énumérations

## Besoin utilisateur (19/10/2026)
« Dans les pages de politique de confidentialité et de CGU, il y a beaucoup de texte sur des énumérations ce qui ne rend pas bien sur mobile. Améliore cela en changeant la disposition sur écran mobile. »

## Pages concernées (4)
- public/politique-confidentialite.php (FR)
- public/cgu.php (FR)
- public/en/politique-confidentialite.php (EN)
- public/en/cgu.php (EN)

## Problème
Longues énumérations (listes `<ul>/<ol>` denses, paragraphes compacts) rendues en blocs de texte serrés sur petit écran : lignes trop longues, pas de respiration, lecture pénible.

## Solution (disposition mobile)
Media query ≤640px dans `assets/css/pages.css` (chargé par ces 4 pages via $extraCss) :
- listes énumérations : passer en **cartes empilées espacées** (chaque `<li>` devient une tuile : padding vertical généreux, bordure gauche accent, fond léger var(--color-bg-alt), border-radius) — pas de changement desktop ;
- typographie mobile : font-size 0.95rem, line-height 1.65, paragraphes max-width none mais marges verticales accrues ;
- `<strong>` internes aux li : garder le gras mais lettrage respirant ;
- listes imbriquées : indentation réduite mobile pour éviter le débordement 375px ;
- scope STRICT : cibler UNIQUEMENT les conteneurs des 2 pages juridiques (ex. `.legal-content` wrapper ou sélecteur scoping par classe de page posée sur `<main>`/`<body>` des 4 fichiers) — ne pas muter les listes des autres pages (services, footer, etc.).
- Si un wrapper de scope n'existe pas : l'AJOUTER aux 4 pages (attribut class sur la balise main ou un div englobant existant — patch minimal, php -l après).

## Fichiers (exclusifs à cette lane)
- public/assets/css/pages.css (bloc media query à la fin)
- public/politique-confidentialite.php, public/cgu.php, public/en/politique-confidentialite.php, public/en/cgu.php (uniquement si ajout du wrapper de scope nécessaire)
- Bump `pages.css?v=N` dans les 4 pages (vérifier le style de quotes des refs).

## Anti-collision
L016 (SEO) touche site-header.php/home.php — AUCUN recouvrement avec ces fichiers.

## Definition of Done
- E2E mobile 375×720 : capture AVANT/APRÈS des 4 pages ; mesure : hauteur des `<li>` (padding effectif ≥10px), interligne ≥1.6, aucun overflow horizontal (document.scrollingElement.scrollWidth ≤ 375+1).
- Desktop 1440 : captures montrant AUCUN changement visuel des listes hors mobile (getComputedStyle d'un li : pas de fond ni bordure en desktop).
- php -l sur les 4 .php si touchés.
- node --check si JS touché (non prévu).
