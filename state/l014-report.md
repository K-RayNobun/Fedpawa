# Rapport L014 — Pages Politique de Confidentialité + CGU/CGV (FR+EN) liées aux cases à cocher

Date : 2026-10-18 | Agent : l014-subagent | Statut : DONE

## Livrables

### Nouvelles pages (4)
| Fichier | Contenu | HTTP |
|---|---|---|
| `fedpawa_light/public/politique-confidentialite.php` | 10 sections : responsable du traitement, données collectées (identité, entreprise, KYC, paiements Mobile Money, courriers numérisés, technique), finalités, bases légales, durées de conservation (courrier 1 mois art. 5/11, destruction 30 j), droits (accès/rectification/suppression art. 12), cookies (sessions PHP + localStorage), sécurité, destinataires, transferts, contact | 200 |
| `fedpawa_light/public/cgu.php` | CGU+CGV en 8 sections : objet/acceptation, comptes clients, souscriptions, paiements Mobile Money (Orange/MTN, USSD), engagements réciproques, résiliation (préavis 15 j art. 9, suspension retard 10 j art. 10, destruction courrier 30 j art. 11), responsabilité, PI + modifications + droit OHADA/Cameroun + tribunaux de Douala | 200 |
| `fedpawa_light/public/en/politique-confidentialite.php` | Traduction EN complète | 200 |
| `fedpawa_light/public/en/cgu.php` | Traduction EN complète | 200 |

Pattern `contrats.php` respecté (site-header/page-hero/legal-section/legal-alert/solutions-grid/site-footer, CSS pages.css existant, zéro nouvelle dépendance).
Données légales réelles utilisées, rien d'inventé : FEDPAWA CORPORATE SOLUTIONS SARL, capital 1 000 000 FCFA, RCCM CM-DLA-01-2026-B13-00767 (Douala), NIU M09261890362B, Immeuble Pharmacie de Logpom, loi n° 2010/012 du 21/12/2010, Actes Uniformes OHADA, contact@fedpawacorporatesolutions.com, +237 691 70 48 02. Pages liées entre elles (cross-links).

### Cases à cocher liées (target=_blank rel=noopener)
- `authentification.html` L214 : label `#cgu` → 2 liens `<a>` (FR, HTML statique).
- `assets/js/auth.js` : `cgu_label` FR + EN réécrits avec les liens (innerHTML injecté au switch de langue) + clés `legal_cgu`/`legal_privacy`.
- `souscription_domiciliation.php` L336 : ligne `chk-cgv` uniquement — CGV + Politique de Confidentialité cliquables.
- `tunnel_souscription.php` L587 : ligne de la case uniquement — CGV + Politique cliquables.

### Footer + sitemap + bump
- `templates/partials/site-footer.php` : 2 liens dans `footer-bottom` (FR/EN via `$lang`) — vérifiés sur /, /contrats.php, /en/contrats.php, les 4 nouvelles pages.
- `authentification.html` : page statique sans site-footer → ligne de liens légaux ajoutée dans `.auth-footer-info` (avec data-i18n).
- `sitemap.xml` : +4 URLs (XML valide, 20 URLs au total, hreflang FR/EN/x-default).
- Bump `auth.js?v=2` → `v=3` (seul endroit où auth.js est référencé).

## Lint
`php -l` OK sur les 7 fichiers PHP touchés ; `node --check` OK sur auth.js.

## E2E réel (playwright-core 1.58.1 + chromium-1234)
Script : `verify-l014.mjs` — **37 checks, 0 échec** (détail : `audit/l014_e2e_results.json`).
- 4 pages 200 + hero + footer + CSS thémé (captures `audit/l014_policy.png`, `l014_cgu.png`, `l014_policy_en.png`, `l014_cgu_en.png`).
- Label auth : 2 liens présents, target=_blank rel=noopener, **clic réel → nouvel onglet navigué vers /cgu.php** (vérifié via framenavigated).
- Switch langue réel FR→EN→FR : label toujours avec liens.
- Cases sub-dom + tunnel : 2 liens chacune (analyse du HTML servi ; pages `data-auth="user"` — l'anonyme est redirigé par auth-guard, vérif DOM par fetch, comportement inchangé).
- Footer : 2 liens sur les 7 pages PHP testées + page auth (footer dédié).
- sitemap.xml : 200 + 4 URLs présentes.

## Notes d'intégrité
- Conflit d'écriture évité : `site-footer.php` a été modifié par une lane concurrente (main.js v5) entre ma lecture et mon patch → relecture puis patch ciblé ligne unique.
- Une lane concurrente (commit L012 `29990f6`) a committé une partie de mes edits en cours (label authentification.html + cgu_label auth.js) via un git add balayant. Le disque actuel — celui servi par le serveur de test et validé par l'E2E — est l'état voulu ; les diffs restants non commités sont les miens (footer, sitemap, lignes des cases, clés legal_*).
- Non touché (conforme mandat) : dashboard.js, admin-dashboard.js, main.js, AdminController, StorageController, le reste de souscription_domiciliation.php / tunnel_souscription.php.
