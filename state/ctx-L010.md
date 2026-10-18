# CTX L010 — Modaux Facture Proforma + Smart RCCM/NIU: thème + comportement

## Besoin utilisateur (verbatim 18/10/2026, Lane#2)
1. Les modaux « facture » et « pas encore de RCCM/NIU » doivent avoir leur style adapté au
   thème — actuellement un FOND BLANC qui ne se présente pas bien du tout.
2. Radio/checkbox « Je ne dispose pas encore de RCCM / NIU — mon entreprise n'est pas encore
   immatriculée » :
   - RETIRER le texte en dessous « 💡 Pas de souci : FEDPAWA peut créer votre entreprise... »
   - DÈS le clic (cochage) → ouvrir le modal IMMÉDIATEMENT
   - EMPECHER de continuer le formulaire tant que la case est cochée (blocage de la
     soumission/next step)
3. Le modal smart lui-même change :
   - L'option « Non, ... » (actuellement texte souligné cliquable) devient un VRAI BOUTON
   - Au clic sur « Non » : un petit LOADER apparaît ~1/3 de seconde, PUIS le texte change pour
     « il ne peut pas continuer sans avoir créé son entreprise », avec un CTA « Compris »
   - Le CTA « Compris » redirige vers la page du service Création d'entreprise

## Cartographie technique (vérifiée par l'orchestrateur)
### A. Modal smart RCCM/NIU
- HTML: /root/Fedpawa/fedpawa_light/public/souscription_domiciliation.php
  - Case: ligne ~90 `<input type="checkbox" id="opt-no-immat" data-smart-signal="strong">`
  - Texte à RETIRER: ligne ~95 `<small style="color: var(--color-text-muted); ...">💡 Pas de souci : FEDPAWA peut créer...`
  - Modal: lignes ~402-411 `#smart-modal-overlay` (overlay) > `#smart-modal` avec
    style inline `background: var(--color-bg-card, #fff)` ← FOND BLANC (le bug)
  - Boutons: `#smart-modal-yes` (btn-primary, OK) et `#smart-modal-no` (style inline
    `background:none; border:none; text-decoration:underline` ← le « texte cliquable » à
    transformer en vrai bouton .btn .btn-outline ou équivalent thémé)
- JS: /root/Fedpawa/fedpawa_light/public/assets/js/souscription_domiciliation.js
  - Lignes ~101-115: handler `opt-no-immat` change → ouvre l'overlay; handlers yes/no/overlay-click
  - ACTUELLEMENT: cliquer « Non » ferme juste l'overlay (ligne 112) → le client continue
    son formulaire alors qu'il a coché « pas d'entreprise » → incohérence à corriger
- La MÊME case existe dans le tunnel générique: /root/Fedpawa/fedpawa_light/public/tunnel_souscription.php
  ligne ~116 `opt-no-niu-fiscal` (checkbox fiscal) + tunnel.js lignes ~525-527 (textes smart)
  → VÉRIFIER si le modal smart y est aussi câblé (data-smart-signal) et appliquer les MÊMES
  corrections si oui (fond, bouton Non, loader, texte blocage, CTA Compris → creation page).
- Page cible CTA « Compris »: `creation_entreprise.php` (existe, déjà cible du bouton Oui
  ligne 113). Conserver ce ciblage.

### B. Bloc Facture Proforma (étape 6 domiciliation)
- HTML: souscription_domiciliation.php ligne ~354
  `<div id="invoiceBox" class="invoice-box" style="background: var(--color-surface, #fff); ...">`
  ← le fond BLANC: `--color-surface` n'est PAS défini dans le thème navy (vérifié), fallback #fff.
- JS rendu: souscription_domiciliation.js `buildInvoice()` lignes ~406-444 — HTML inline
  (utilise déjà des var(--color-*) dans les tables mais le fond du box reste blanc).
- RENDU TUNNEL: vérifier si tunnel_souscription.php / fedpawa-pay.js affichent aussi un
  récap facture avec fond blanc (chercher `invoice-box`, `--color-surface`, `#fff`) et
  corriger pareillement.

### C. Thème (règles)
- Variables dispo: style.css — `--color-bg-main`, `--color-bg-alt`, `--color-bg-card`?
  VÉRIFIER laquelle existe réellement pour les surfaces: `.fp-modal` utilise
  `background: var(--color-bg-main)` (style.css:239) → réutiliser TOUJOURS des variables
  existantes, jamais de #fff hardcodé. Le modal smart doit s'aligner sur .fp-modal
  (bg-main, border --color-border, text --color-text-main) et marcher en thème navy ET light.
- NE PAS introduire de nouvelle variable CSS: réutiliser celles du design system.
- Le loader 1/3 de sec: `setTimeout(..., 333)` avec un spinner CSS simple
  (ex: `.fp-loader { animation: fp-spin .8s linear infinite }` ou réutiliser un spinner
  existant s'il y en a un — chercher "spinner" dans les css).

## Implémentation attendue
1. Retirer le <small> « 💡 Pas de souci... » (domiciliation + équivalent tunnel si présent).
2. Case cochée → modal s'ouvre immédiatement (déjà le cas) + BLOQUER la continuation:
   - Empêcher le passage à l'étape suivante tant que opt-no-immat est cochée (le form
     multi-étapes a goToStep(n) — intercepter / désactiver le bouton next), ET le
   - décocher automatiquement quand le modal se ferme via overlay-click (comme si le client
     revenait) — SAUF via le nouveau flux « Non » (voir 3) qui mène au blocage final.
3. Modal smart:
   - Fond et styles → thème (comme .fp-modal).
   - « Non, ... » devient un vrai bouton (btn-outline full width).
   - Clic « Non » → loader visible ~333ms (bouton désactivé + spinner) → remplace le contenu
     du modal par: texte blocage « Vous ne pouvez pas poursuivre la souscription sans avoir
     créé votre entreprise. » + CTA « Compris » (btn-primary) → window.location.href =
     'creation_entreprise.php'.
   - Le bouton « Oui, découvrir la Création d'Entreprise » reste (c'est le bon chemin).
4. invoiceBox: remplacer `background: var(--color-surface, #fff)` par la variable thémée
   correcte (ex: `var(--color-bg-main)` comme .fp-modal, ou bg-alt selon lisibilité) — le
   contenu de la facture doit rester LISIBLE en navy ET light (les couleurs internes
   utilisent déjà des var(--color-*), vérifier le contraste).
5. Bumps: souscription_domiciliation.js?v=3 → ?v=4, fedpawa-pay.js?v=3 → v=4 si touché,
   tunnel.js bump si touché (chercher tunnel.js?v= dans les pages), dashboard.css v6 → v7
   seulement si CSS touchée.
6. NE PAS toucher: le travail en cours de L009 sur dashboard.js/DashboardController.php
   (fenêtres différentes: toi = souscription_domiciliation.php/.js, tunnel_souscription.php,
   tunnel.js, fedpawa-pay.js PARTIE facture UNIQUEMENT — si fedpawa-pay.js doit être édité,
   faire des patchs chirurgicaux sans toucher aux fonctions de paiement du tunnel).

## Définition of Done (E2E obligatoire sur http://127.0.0.1:18081)
- domiciliation: le <small> « Pas de souci » n'existe plus (grep = 0).
- Cocher la case → modal thémé s'ouvre; fond PAS blanc en navy ET en light (screenshot).
- Cliquer le bouton Non → loader ~⅓ s → texte blocage + CTA Compris → clic → atterrit sur
  creation_entreprise.php (URL vérifiée).
- Case cochée → impossible de passer à l'étape suivante (tentative goToStep bloquée, bouton
  next désactivé ou intercepté).
- invoiceBox: fond thémé (capture navy + light), texte lisible.
- php -l OK sur .php touchés; node --check OK sur .js touchés.
- Captures: /root/Fedpawa/audit/l010_*.png (modal navy, modal light, facture navy, facture light).
- Journal state/lanes/L010.md à chaque avancée. lane.py done L010 à la fin.