# CTX L007 — Galerie photos Domiciliation: rendre les 6 photos de l'utilisateur VISIBLES (FR + EN)

## Contexte (diagnostic orchestrateur, 18/10/2026)
- Les 6 photos utilisateur (810×1080 et 1080×810, md5 fa6ddc38e2/a0ca1fafc2/56e0048e42/260ac862a1/89b0c8f4de/cec00104b2) sont DÉJÀ intégrées en FR: `assets/images/domi_accueil_{1,2}.{jpg,webp}`, `domi_bureau_{1,2}.{jpg,webp}`, `domi_reunion_{1,2}.{jpg,webp}` — galerie fonctionnelle (6/6 chargées en prod, testé navigateur).
- PROBLÈME 1: la page EN (`public/en/domiciliation.php`) utilise encore les VIEILLES photos génériques `photo_1..photo_5` (5 items, pas 6) au lieu des 6 photos utilisateur.
- PROBLÈME 2: la galerie FR est à y≈2028px dans une page de 6525px (3e section sur 6) — trop profonde: l'utilisateur l'a cherchée sans la trouver.

## Fix attendu
1. **EN**: remplacer la galerie EN par la même que FR — 6 photos domi_* (3 groupes × 2: accueil/bureau/reunion), avec `<picture><source webp>` + fallback jpg + alt EN + captions EN + data-category identiques (accueil/bureau/reunion) + filtres EN (All/Reception/Private Offices/Meeting Room). Les chemins EN sont RELATIFS depuis /en/ → vérifier le préfixe (les pages /en/ utilisent '../assets/images/...' — vérifier comment la page EN actuelle référence photo_*.webp et suivre le même schéma).
2. **FR**: remonter la galerie pour qu'elle soit visible sans scroll interminable. Ordre cible des sections: hero → **Galerie** (2e position, y < ~900px) → Cadre Contractuel → Packs → KYC. Déplacer le bloc section galerie (de la ligne ~44-85 environ, chercher `Galerie de nos espaces`) juste après le hero/section d'intro. NE PAS modifier le contenu des autres sections.
3. Vérifier que le filtre JS marche encore (les .filter-btn + data-category; le script de filtrage vit peut-être dans main.js — le lire d'abord).
4. php -l sur les 2 pages modifiées.

## E2E preuve (navigateur réel, prod locale :18081 puis je déploierai)
- FR: /domiciliation.php → galleryY < 900px; 6 items; 6 img chargées après scrollIntoView; filtres: cliquer "Bureaux Privés" → 2 visibles, cliquer "Tout" → 6.
- EN: /en/domiciliation.php → 6 items domi_* chargés; 0 référence à photo_*.webp dans le HTML; captions EN.
- Screenshot /root/Fedpawa/audit/l007_fr.png et l007_en.png (après scrollIntoView sur la galerie).

## Règles
- Interdits: version bumps, commit, push, docker, toucher à d'autres fichiers que public/domiciliation.php, public/en/domiciliation.php (et lecture seule ailleurs).
- Pattern navigateur: playwright-core /root/lofi-cities/tools/node_modules/playwright-core/index.mjs, executablePath /root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome, args ['--no-sandbox']. `:visible` invalide en querySelectorAll (offsetParent). Regex \n fragiles → split(String.fromCharCode(10)).
- Log chaque avancée via lane.py (claim L007 d'abord).
- Budget: 30 min.
