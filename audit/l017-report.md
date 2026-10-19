# Rapport L017 — Lisibilité mobile des pages Politique de confidentialité + CGU

**Date :** 2026-10-19 · **Statut :** TERMINÉ · **E2E : 28/28 PASS** (`audit/l017_e2e_results.json`)

## Problème
Les longues énumérations (`<ul class="solution-list">`) des 4 pages juridiques étaient rendues sur mobile
en blocs denses : lignes flex serrées (line-height 1.5, padding 0), lecture pénible ≤640px.

## Solution appliquée
1. **Scope strict** : classe `legal-page` ajoutée aux 2 sections de listes de chacune des 4 pages
   (jamais au `<main>` de site-header.php — fichier L016, jamais aux 13 autres pages utilisant `solution-list`).
2. **`pages.css` — bloc `@media (max-width: 640px)` scoping `.legal-page`** (38 lignes, fin de fichier) :
   - chaque `<li>` devient une tuile : `display:block`, fond `var(--color-bg-alt)`, bordure gauche 3px
     `var(--color-gold)`, radius 8px, padding 14px 16px, marge 14px, font-size 0.95rem, line-height 1.65 ;
   - puce `✓` retirée en mobile (`::before { content: none }`) — la bordure gauche reprend le rôle de marqueur ;
   - cartes `solution-card` respirent (padding 28px 20px), `<strong>` conservé (letter-spacing léger),
     listes imbriquées indentées à 18px max (`overflow-wrap` anti-débordement 375px).
3. **Cache-bust** : `$extraCss` des 4 pages → `pages.css?v=4` (anciennes refs sans `?v=`, aucune double-bump).
4. **Bonus intégrité** : suppression d'un `</div>` orphelin dans `public/en/politique-confidentialite.php`
   (ligne 34, déséquilibre préexistant section legal-alert).

## Fichiers modifiés (exclusifs lane)
| Fichier | Changement |
|---|---|
| `fedpawa_light/public/assets/css/pages.css` | +38 lignes : bloc media query `.legal-page` ≤640px |
| `fedpawa_light/public/politique-confidentialite.php` | `legal-page` ×2 + `?v=4` |
| `fedpawa_light/public/cgu.php` | `legal-page` ×2 + `?v=4` |
| `fedpawa_light/public/en/politique-confidentialite.php` | `legal-page` ×2 + `?v=4` + fix div orphelin |
| `fedpawa_light/public/en/cgu.php` | `legal-page` ×2 + `?v=4` |

Harnais : `verify-l017.mjs` (racine). **Zéro touch** : site-header.php, home.php, sitemap.xml (L016).

## Preuves E2E (Playwright, chromium-1234, http://127.0.0.1:18081)
**AVANT** (CSS d'origine intercepté depuis `git show HEAD:`) : li `display:flex`, fond transparent,
`border-left:0`, `::before:"✓"` — captures `l017_*_mobile_avant.png`.

**APRÈS mobile 375×720** (les 4 pages, FR+EN) :
- `pages.css?v=4` référencé, 2 sections `.legal-page` détectées ;
- li : `display:block`, padding 14/14px (≥10px requis), fond `rgb(250,249,246)`,
  `border-left:3px rgb(212,175,55)`, radius 8px, **line-height 1.65 (≥1.6)**, `::before:none` ;
- **scrollWidth = 375 ≤376** (aucun overflow) sur les 4 pages ;
- captures `l017_privacy-fr_mobile_apres.png` (visuellement vérifiée : tuiles dorées empilées aérées),
  `l017_cgu-fr/privacy-en/cgu-en_mobile_apres.png`.

**Desktop 1440×900** : `getComputedStyle(li)` AVANT/APRÈS **identiques** sur les 4 pages
(fond transparent, border-left 0, radius 0, flex, fs 14.4px, lh 1.5, sw 1440) — **zéro changement**.
Captures `l017_*_desktop_avant.png` / `_apres.png` (rendu visuel ✓ identique).

**Non-fuite** : `/contrats.php` en 375px → 0 section `.legal-page`, li inchangés (flex, ✓, transparent).

**Lint** : `php -l` OK sur les 4 .php. **JS** : zéro erreur console toutes phases.

## points_echoues
Aucun.
