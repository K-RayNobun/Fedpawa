# CTX L016 — SEO continu (objectif: « Fedpawa » en 1re page Google)

## Besoin utilisateur (19/10/2026)
« Il faut améliorer le SEO du site. Ce processus sera lancé en boucle et en chaîne en arrière-plan afin d'apporter toujours un peu plus, afin que le site soit visible sur Google par recherche "Fedpawa" dès la première page des résultats. »

## Objectif
1re page Google sur la requête « fedpawa » (et variantes proches : « fedpawa cameroun », « fedpawa domiciliation », « fedpawa douala »).

## État SEO actuel (recon 19/10)
- Titles : format imposé « FEDPAWA CORPORATE SOLUTIONS | <sujet> » (marque EN TÊTE) — déjà conforme partout.
- Canonical + hreflang fr/en/x-default + OG/Twitter : générés centralisés dans site-header.php ✓.
- sitemap.xml : 20 URLs, soumis dans robots.txt ✓.
- robots.txt : pages privées exclues ✓.
- OG image : existe (1200×630) ✓.
- **PAS de JSON-LD structuré** (0 `application/ld+json`) — le gros levier manquant.

## Périmètre d'action de la lane (fichiers exclusifs)
- `templates/partials/site-header.php` — injecter JSON-LD Organization/WebSite (+ SearchAction sitelinks searchbox) global.
- `templates/pages/home.php` — JSON-LD LocalBusiness/ProfessionalService (adresse Logpom-Douala, horaires, geo, sameAs réseaux si existants, areaServed Cameroun, priceRange).
- `public/sitemap.xml` — compléter si pages publiques manquantes (politique-confidentialite, cgu déjà ajoutées par L014 — vérifier).
- `public/robots.txt` — rien à censurer de plus, préserver.
- SEO on-page : vérifier h1 uniques par page, alts descriptifs (déjà audités), maillage interne (liens croisés footer/body entre pages services).
- **Interdits** : ne PAS toucher aux JS/CSS existants, ne PAS réécrire les pages (patchs chirurgicaux), ne PAS créer de contenu dupliqué, ne PAS mentir sur les données (adresse réelle Immeuble Pharmacie de Logpom, Douala; horaires Lun–Ven 8h–18h, Sam 9h–14h).
- Performance SEO (mesure, pas fix dans cette lane) : mesurer poids pages + gzip + time_total sur 5 pages clés ; rapporter les métriques dans le rapport (les fixes perf = autre lane si besoin).

## « Boucle en chaîne en arrière-plan » — mise en place continue
Après cette lane initiale, l'orchestrateur tiendra une boucle de vérification périodique (via le cron existant ou un cron dédié no_agent) qui :
1. relit `lane.py status` + les métriques SEO (site: queries simulées par curl Google — non fiable ; utiliser les Search Console-style checks : sitemap 200, robots 200, JSON-LD parsable, titles uniques, hreflang symétriques) ;
2. ouvre une lane SEO incrémentale quand un levier est identifié.

Le « toujours un peu plus » = itérations incrémentales : JSON-LD → rich snippets eligibility (faq si contenus), Open Graph image dédiée par page, breadcrumb JSON-LD, maillage interne, vitesse (webp partout ✓ déjà fait).

## Definition of Done
- JSON-LD Organization + WebSite valides (parse par `python3 -c "import json,sys; json.load(sys.stdin)"` sur le bloc extrait) sur toutes les pages publiques via site-header.
- JSON-LD LocalBusiness sur la home.
- E2E : `curl -s https://www.fedpawa.com/ | grep -c 'application/ld+json'` ≥ 2 sur prod après rebuild.
- sitemap.xml complet (toutes pages publiques FR+EN, même count que les <loc> attendus).
- Mesures perf relevées (time_total médian ×3, gzip, poids) sur /, /domiciliation.php, /cgu.php, /en/index.php, /contact.php — rapportées.
- php -l sur tout .php touché.
