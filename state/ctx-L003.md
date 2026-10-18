# CTX L003 — S-2 [CRITIQUE] Vraie confirmation de paiement (4 services du tunnel)

## Contexte (audit 17/10)
Après POST /api/souscription (payment_pending), fedpawa-pay.js `simplePaidFlow` affiche « ✅ Paiement confirmé / Votre paiement a bien été reçu » SANS qu'aucune vérification n'ait eu lieu. Aucun appel à /api/paiement/verifier. Abonnement `en_attente` à vie, 0 facture, aucun recours client. Preuves: audit/subscription_flows_audit.md §S-2.

## Fix attendu (fichiers EXCLUSIFS: public/assets/js/fedpawa-pay.js — lecture seule pour le reste)
Dans le submit handler:
```js
if (res && res.ok && res.api) {
  if (config.contract === false) { simplePaidFlow(m, config); return; }  // ← le mensonge
  contractFlowScreen(m, config, res.api); return;
}
```
1. LIRE fedpawa-pay.js en entier d'abord. contractFlowScreen existe déjà (écran « Paiement en cours de confirmation » + Reference + bouton `btnVerifyPay` → POST /api/paiement/verifier {sub_id} → paid → suite).
2. Pour config.contract === false : appeler AUSSI contractFlowScreen (plus de simplePaidFlow immédiat).
3. Dans le handler post-vérification « paid » de contractFlowScreen : si config.contract === false → afficher l'écran de succès simple (le CONTENU de simplePaidFlow devient véridique — il ne s'affiche qu'après paiement réellement vérifié), SINON → flux contrat + signature OTP existant (domiciliation — ne pas y toucher).
4. Si verify répond non-paid : garder l'écran « en attente » + bouton re-vérifier (comportement déjà présent pour domiciliation).
- tunnel.js retourne déjà `api` (données brutes) — ne pas modifier tunnel.js sauf lecture nécessaire.
- INTERDIT: version bumps (?v=) — l'orchestrateur s'en charge au déploiement. INTERDIT: commit, push, docker, toucher aux fichiers des autres lanes.

## API
- POST /api/paiement/verifier, header X-CSRF-Token (GET /api/csrf-token), body {sub_id: subscription_id} → mode démo: {status:"paid"}.

## E2E obligatoire (preuve de fin)
Parcours complet création: register (prefix email fixl3-, mdp FixL3!2026) + login → tunnel_souscription.php?service=creation&pack=standard → remplir étapes 1-3 (champs required visibles de .tunnel-step-content.active, clic boutons Continuer) → cocher CGV step-4 → #finalPayBtn → modal MM (#payMomoPhone + input[name=payOp][value=orange] + #payMomoSubmit) → ÉCRAN ATTENDU: « Paiement en cours de confirmation » (PAS « confirmé ») + bouton Vérifier → clic → ALORS « Paiement confirmé » + /api/dashboard: subscription.statut=actif ET factures contient FAC-*. Screenshot à chaque étape clé → /root/Fedpawa/audit/fix_l3_*.png.

## Pattern Playwright
```js
import { chromium } from '/root/lofi-cities/tools/node_modules/playwright-core/index.mjs';
const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome', args: ['--no-sandbox'] });
```
Pièges: `:visible` invalide en querySelectorAll (offsetParent), regex \n mangées par le scrubber (utiliser split(String.fromCharCode(10))), login ne marche qu'avec le bon mot de passe (throttle 5 essais). register n'auto-connecte pas.

## Purge (volume partagé prod!)
En fin de lane: DELETE FROM clients WHERE email LIKE 'fixl3-%' + DELETE par client_id sur abonnements, factures, tickets_support, paiements, password_resets, kyc_documents, courriers, contrats. Vérifier 0 restant.
Budget: 40 min max. Log chaque avancée via lane.py.
