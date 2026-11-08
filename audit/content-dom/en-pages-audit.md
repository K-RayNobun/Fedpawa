# Audit EN — 12 pages Next vs sources .en.html PHP

**Date** : 2026-10-26 · **Serveurs** : PHP `:8791` · Next `:3000` · **Règle** : jamais inventer de contenu EN · **Aucune correction appliquée** (audit seul).

## Sources EN réellement existantes

`/root/Fedpawa/fedpawa_light/public/en/` : `index.php`, `qui-sommes-nous.php`, `fiscalite.php`, `domiciliation.php`, `creation_entreprise.php`, `cgu.php`, `politique-confidentialite.php`, `contact.php`, `oapi.php`, `contrats.php` (10 fichiers). Pas de `*.en.html` littéraux — les sources EN sont ces `.php` (servies sur `:8791/en/*.php`). En complément, `assets/js/auth.js` contient un dictionnaire EN inline pour authentification (source exacte, donc légitime).

## Verdicts par page

| Page | Verdict | Texte | Méta |
|---|---|---|---|
| /en (index) | ⚠️ DIVERGENCES | 2 (bandeaux FR en +) | 0 (title/desc/twitter conformes) |
| /en/qui-sommes-nous | ⚠️ DIVERGENCES | 1 (compteurs stats) | 6 (title + desc reformulés) |
| /en/fiscalite | ⚠️ DIVERGENCES | 2 (1 phrase absente) | 6 |
| /en/domiciliation | ⚠️ DIVERGENCES | 3 (1 section réordonnée) | 6 |
| /en/creation-entreprise | ⚠️ DIVERGENCES | 4 (traductions vs FR résiduel source) | 6 |
| /en/cgu | ⚠️ DIVERGENCES | 1 (« and up-to-date » → « , up-to-date ») | 4 |
| /en/politique-confidentialite | ⚠️ DIVERGENCES | 2 (certificates→quittances ; guillemets) | 4 |
| /en/contact | ⚠️ DIVERGENCES | 2 (bloc adresse FR→EN dans le corps) | 6 |
| /en/oapi | ⚠️ DIVERGENCES | 0 (corps conforme) | 1 (title dupliqué) |
| /en/contrats | ⚠️ DIVERGENCES | 0 (corps conforme) | 1 (title dupliqué) |

**Conforme partout** : `lang="en"` (les 12 pages), hreflang fr/en/x-default (3 liens, URLs sans `.php` — écart attendu de la migration), liens internes du corps tous préfixés `/en`, `og:locale` en_US + alt fr_FR, `twitter:card` summary_large_image, `twitter:image` og-cover.jpg. Nav mobile et footer : corrects EN. **Aucune page 404** (HTTP 200).

**30 divergences de texte + 40 de méta relevées** (détail exhaustif dans `en-pages.json`).

## Bugs transverses (touchent les 12 pages EN)

1. **Nav desktop en FRANÇAIS sur toutes les pages EN** : `Accueil · Création d'entreprise · Conseils & Suivi Fiscal · Protection OAPI · Qui sommes-nous` avec liens FR (`/`, `/domiciliation`, `/fiscaliation`… sans préfixe `/en`). Cause : `components/site/Header.tsx:164` rend `<NavLinks />` **sans prop `locale`** (défaut `fr` dans `NavLinks.tsx:10`). Source EN attend : `Home · Company Formation · Tax & Legal Advisory · OAPI Protection · About Us` vers `../index.php` etc.
2. **`<title>` suffixe dupliqué** sur 9 pages (toutes sauf index) : `"X | FEDPAWA CORPORATE SOLUTIONS | FEDPAWA CORPORATE SOLUTIONS"` — title en dur + template `%s | siteName` du layout EN.
3. **Liens relatifs `.php` → 404** dans authentification/souscription-domiciliation/tunnel-souscription EN : `href="cgu.php"`, `href="politique-confidentialite.php"` (dict `authEn.cguLabel`) → `/en/cgu.php` = 404.

## Divergences par page (côte à côte)

### /en (index) — 2 divergences texte
- **PHP source (absent du Next)** : la source EN n'a ni `hero-proof` ni `float-card` (blocs FR du héros FR). **Next ajoute** : `100 % en ligne · 4,9★ avis clients · 24/7 espace client` + carte `Un hub pensé pour vous — Adresse, démarches et suivi au même endroit.` → **texte FR affiché sur la page EN** (dict `indexEn` non traduit : `heroProofOnlineLabel="en ligne"`, `heroProofStarsLabel="avis clients"`, `heroProof247Label="espace client"`, `heroFloatTitle`, `heroFloatText`, `servicesIntro`). `servicesIntro` FR n'est pas rendu (`locale === "fr" &&`), les autres le sont.
- Méta title/description/og/twitter : **conformes mot à mot**.

### /en/qui-sommes-nous — 1 texte + 6 méta
- Texte : compteurs stats — **PHP** : `data-target="300" data-suffix="+"` → `300+ Companies Structured`, `17 Pays`, `99.8 %`, `100 %` ; **Next** : suffixes affichés avant hydration `0 +`, `0 Pays`, `0.0 %`, `0 %` (valeur finale dépend du JS). Libellés `Notre Impact` / `Nos Valeurs` : FR **dans la source EN elle-même** (les deux côtés identiques).
- Méta : title PHP `FEDPAWA CORPORATE SOLUTIONS | About Us` → Next `… | The Strategic Partner for Your Business | FEDPAWA CORPORATE SOLUTIONS` ; description PHP `About FEDPAWA CORPORATE SOLUTIONS - The strategic partner…` → Next `Discover FEDPAWA Corporate Solutions, an expert firm in OHADA company formation…` ; og/twitter titres+descriptions idem (reformulation, pas mot à mot).

### /en/fiscalite — 2 textes + 6 méta
- **Phrase absente du Next** : `Complete coverage, from monthly e-filing to defence in the event of an audit.` (sous-titre de section « Our Fields of Intervention », `fiscalite.php:52`).
- Réordonnancement mineur de blocs en fin de page (footer CTA) sans perte de contenu.
- Méta : title `Legal & Tax Advisory` → `Legal and Tax Advisory for Companies` ; description PHP `…DGI e-filings, annual tax return (DSF), Tax Compliance Certificate (ACF) and administrative representation before the DGI.` → Next `…DGI e-filings, tax returns, optimisation and representation.` (reformulé ; l'audit SEO avait déjà relevé ce cas).

### /en/domiciliation — 3 textes + 6 méta
- **Ordre des sections inversé** : PHP = Contractual Framework → Virtual tour/Gallery → Plans ; Next = Virtual tour/Gallery → Plans → Contractual Framework (contenus identiques, positions échangées).
- Texte des sections : conforme mot à mot (packs, KYC, tarifs XAF).
- Méta : title `Business Domiciliation in Douala` → `Domiciliation for Legal Entities & Companies` ; description `…prestigious business address… From 35,000 FCFA/month.` → `First-class business address… From XAF 35,000/month excl. tax.`

### /en/creation-entreprise — 4 textes + 6 méta
- La source EN contient du **FR résiduel** que le Next a traduit (divergence vs source, mais amélioration) :
  - PHP : `Choice of Legal Form: orientation objective entre l'Sole Proprietorship (Nom propre), la SARL (Société à Responsabilité Limitée)…` → Next : `Selection of the Legal Form: objective guidance between the Sole Proprietorship, the SARL (Limited Liability Company)…`
  - PHP : `Structuration du Capital Social :` → Next : `Structuring of Share Capital:`
  - PHP : `Validation de la Gouvernance :` → Next : `Governance Validation:`
  - PHP : `Interface Notariale :` → Next : `Notarial Interface:`
- Méta : title `Company Formation in Cameroon` → `Company Formation, Restructuring & Legalization in Cameroon` ; description reformulée (`transformation, restructuring… by experienced legal experts` → `conversion and registration… notarial circuit, Registry and CFCE, complete Corporate Kit delivery`).

### /en/cgu — 1 texte + 4 méta
- Texte : PHP `Creating an account requires accurate and up-to-date information: identity, company, e-mail, phone.` → Next `accurate, up-to-date information` (« and » → « , » — divergence d'un caractère).
- Méta : title conforme + suffixe dupliqué ; description PHP `FEDPAWA CORPORATE SOLUTIONS SARL Terms of Service and Sale: … termination, liability, OHADA and Cameroonian law, Douala courts.` → Next `FEDPAWA Terms of Service and Sale: … termination and liability.` (tronquée/reformulée). og/twitter description idem.

### /en/politique-confidentialite — 2 textes + 4 méta
- Texte : PHP `Collecting Mobile Money payments and issuing invoices, receipts and certificates.` → Next `…invoices, receipts and quittances.` (mot FR « quittances » au lieu de « certificates » — le dict FR contient bien « quittances », le EN aurait dû dire certificates).
- Texte : guillemets typographiques `“Personal data”` → droits `\"Personal data\"` (encodage différent, contenu identique — divergence de rendu).
- Méta : description PHP `…data collected, purposes, retention periods, your access, rectification and erasure rights, cookies…` → Next `How FEDPAWA collects, uses and protects your personal data: KYC, Mobile Money payments, scanned mail, cookies and your rights.` (reformulée).

### /en/contact — 2 textes + 6 méta
- Texte : **bloc coordonnées FR dans la source EN** — PHP : `Adresse physique Immeuble Pharmacie de Logpom, en bordure de route … Horaires d'ouverture Lundi – Vendredi : 8h00 – 18h00 … Contact direct … Remplissez le formulaire ci-dessous, nous vous recontactons sous 24h.` → Next : `Physical address Pharmacie de Logpom Building, right by the roadside … Opening hours Monday – Friday: 8:00 – 18:00 … Direct contact … Fill in the form below, we will get back to you within 24 hours.` (le Next a traduit le FR résiduel de la source).
- Texte : PHP `Write to Us pour un devis` → Next `Write to us for a quote` (idem, FR résiduel source corrigé).
- Méta : title `Contact & Appointments in Douala` → `Contact — Douala, Cameroon` ; description reformulée.

### /en/oapi — 0 texte + 1 méta
- Corps conforme mot à mot (y compris le FR résiduel `Votre nom commercial, votre logo…` présent **des deux côtés** — la source EN elle-même mélange).
- Méta : title conforme + suffixe dupliqué `| FEDPAWA CORPORATE SOLUTIONS`.

### /en/contrats — 0 texte + 1 méta
- Corps conforme mot à mot. Méta : title conforme + suffixe dupliqué.

## Pages SANS source EN — vérification de la règle « FR conservé, jamais inventer »

| Page /en/… | Contenu servi | Conforme à la règle ? |
|---|---|---|
| authentification | **EN** (Client Portal, Log In…) | ✅ Légitime : dict EN inline **existe dans la source** `auth.js` (`en:` lignes 196-237), repris mot à mot. Seule ombre : `cguLabel` garde `href="cgu.php"`/`politique-confidentialite.php` relatifs → **404** sur /en (la source auth.js pointait `en/cgu.php`). |
| mot-de-passe-oublie | **EN INVENTÉ** (`Forgot your password?`, `Back to the login page`…) | ❌ **RÈGLE VIOLÉE** — `lib/i18n/pages/mot-de-passe-oublie.ts` : « EN : pas de source .en.html — traduction de la vague C ». Aucune trace EN dans `password-reset.js` ni `mot_de_passe_oublie.html`. Devait servir le FR conservé. |
| souscription-domiciliation | **EN INVENTÉ** (23 phrases : stepper, packs, KYC, proforma) | ❌ **RÈGLE VIOLÉE** — même mention « traduction vague C » dans le dict. Résidus FR : `25 000 FCFA / mois` dans les options du select. |
| tunnel-souscription | **EN INVENTÉ** (25 phrases : options, upload, paiement) | ❌ **RÈGLE VIOLÉE** — même mention. |
| espace-client | **FR CONSERVÉ** ✅ | ✅ Conforme : Guarded rend le composant FR (`Bonjour, Bienvenue dans votre espace client…`), SSR vide tant que la garde client n'a pas validé. Méta EN (title `Client Area`, description EN) — invention méta mineure mais page `noindex,nofollow`. |
| admin-dashboard | **FR CONSERVÉ** ✅ | ✅ Conforme : composant FR (`Vue d'ensemble`, `Gestion Clients`…), noindex. |
| admin-document | **FR CONSERVÉ** ✅ | ✅ Conforme : visionneuse FR, noindex. |

Note : les 7 pages servent `<html lang="en">` avec un contenu FR pour espace-client/admin-* — incohérence `lang` vs contenu, mais conforme à la règle de conservation FR.

## Top 3 des problèmes

1. **Contenu EN inventé** sur mot-de-passe-oublie, souscription-domiciliation, tunnel-souscription — violation directe de la règle « jamais inventer » (dicts « vague C »).
2. **Nav desktop FR partout sur /en/** (libellés + liens non préfixés) — bug `NavLinks` sans `locale`, visible sur les 12 pages.
3. **Méta reformulées** vs sources EN sur 8/10 pages (title/description/og/twitter) — l'audit SEO avait vu 3 pages ; réel : toutes sauf index/oapi/contrats (qui n'ont que le suffixe dupliqué).

## Livrables

- `audit/content-dom/en-pages.json` — données exhaustives (verdicts, méta, 30 divergences texte côte à côte, pages sans source).
- `audit/content-dom/en-pages-audit.md` — ce rapport.
- Scripts reproductibles : `collect_en.py`, `extract_en.py`, `diff_en.py`, `build_json.py` + brutes dans `raw_en/`.
