// ============================================================
// FEDPAWA — Composant Paiement (Lane #2)
// Écran de paiement Mobile Money responsive + garde de connexion.
// Dépend de: config.js (apiUrl), fedpawa-ui.js (FedpawaUI.modal/toast)
// ============================================================
(function () {
    'use strict';

    if (window.FedpawaPay) return;

    function esc(s) {
        return String(s).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
    }

    function fmtFCFA(n) { return Number(n || 0).toLocaleString('fr-FR') + ' FCFA'; }

    // ---------- Token CSRF (session liée: récupéré après connexion) ----------
    let cachedCsrf = null;
    async function getCsrf() {
        if (cachedCsrf) return cachedCsrf;
        try {
            const r = await fetch(window.apiUrl('/api/csrf-token'), { credentials: 'include' });
            if (!r.ok) return null;
            const d = await r.json();
            cachedCsrf = d.csrf_token || null;
            return cachedCsrf;
        } catch (e) { return null; }
    }

    // ---------- État de session ----------
    async function getSession() {
        try {
            if (typeof window.apiUrl !== 'function') return { authenticated: false };
            const r = await fetch(window.apiUrl('/api/me'), { credentials: 'include' });
            if (!r.ok) return { authenticated: false };
            return await r.json();
        } catch (e) { return { authenticated: false }; }
    }

    // ---------- Modal de connexion (inline, thème du site) ----------
    function loginModal(onSuccess) {
        if (!window.FedpawaUI) { window.location.href = 'authentification.html'; return; }
        const m = window.FedpawaUI.modal({
            title: 'Connexion requise',
            iconType: 'info',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
            message: 'Connectez-vous pour finaliser votre souscription.<br>Vos données du formulaire sont conservées.',
            hideClose: false,
            buttons: []
        });
        // injecter le mini-form dans la modal
        const body = m.el.querySelector('.fp-modal');
        const form = document.createElement('form');
        form.className = 'pay-login-form';
        form.innerHTML = '' +
            '<div class="pay-field"><label>E-mail</label><input type="email" class="form-control" id="payLoginEmail" required placeholder="vous@entreprise.com"></div>' +
            '<div class="pay-field"><label>Mot de passe</label><input type="password" class="form-control" id="payLoginPwd" required placeholder="••••••••"></div>' +
            '<div class="pay-login-err" id="payLoginErr" style="display:none;"></div>' +
            '<button type="submit" class="btn btn-primary pay-login-submit">Se connecter</button>' +
            '<div class="pay-login-alt">Pas encore de compte ? <a href="authentification.html" id="paySignupLink">Créer un compte</a></div>' +
            '<div class="pay-login-alt" style="margin-top:8px;"><a href="mot_de_passe_oublie.html" style="font-size:0.8rem;">Mot de passe oublié ?</a></div>';
        body.appendChild(form);
        const err = form.querySelector('#payLoginErr');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = form.querySelector('#payLoginEmail').value.trim();
            const pwd = form.querySelector('#payLoginPwd').value;
            const btn = form.querySelector('.pay-login-submit');
            btn.disabled = true; btn.textContent = 'Connexion...';
            try {
                const r = await fetch(window.apiUrl('/api/login'), {
                    method: 'POST', credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, mot_de_passe: pwd })
                });
                const data = await r.json().catch(() => ({}));
                if (r.ok) {
                    cachedCsrf = null; // nouvelle session -> nouveau token
                    m.close();
                    if (window.FedpawaUI) window.FedpawaUI.toast('Connexion réussie', 'success');
                    if (onSuccess) onSuccess(data);
                } else {
                    err.style.display = 'block';
                    err.textContent = data.error || 'Identifiants invalides.';
                    btn.disabled = false; btn.textContent = 'Se connecter';
                }
            } catch (e2) {
                err.style.display = 'block';
                err.textContent = 'Erreur réseau. Réessayez.';
                btn.disabled = false; btn.textContent = 'Se connecter';
            }
        });
        setTimeout(() => { const i = form.querySelector('#payLoginEmail'); if (i) i.focus(); }, 120);
        return m;
    }

    // ---------- Écran de paiement Mobile Money (responsive) ----------
    // config: { label, priceFCFA, phone, onSubmit(payload) -> Promise<{ok,status,message,subscription_ref}> }
    // Lane contrat : ecran "Verifier Mon Paiement" puis presentation du contrat personnalise a signer.
// Etat 1: bouton verifier (apres envoi USSD). Etat 2: contrat pre-rempli + OTP signature.
function contractFlowScreen(m, config, sub) {
    const body = m.el.querySelector('.fp-modal');
    const fmt = window.FedpawaPay ? FedpawaPay.fmtFCFA : (n => n + ' FCFA');
    body.innerHTML = '' +
        '<button class="fp-modal-x" aria-label="Fermer">&times;</button>' +
        '<div class="pay-momo-head">' +
        '  <div class="pay-momo-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg></div>' +
        '  <h3 class="fp-modal-title">Paiement en cours de confirmation</h3>' +
        '  <div class="pay-momo-amount">' + esc(fmt(config.priceFCFA)) + '</div>' +
        '  <div class="pay-momo-desc">Reference : <strong>' + esc(sub.subscription_ref || sub.transaction_id || ('SUB-' + sub.subscription_id)) + '</strong></div>' +
        '</div>' +
        '<div class="pay-momo-note">Composez le code USSD recu sur votre telephone pour valider le paiement Mobile Money, puis cliquez sur le bouton ci-dessous.</div>' +
        '<div class="pay-momo-err" id="payVerifyErr" style="display:none;"></div>' +
        '<button type="button" class="btn btn-primary pay-momo-submit" id="btnVerifyPay">V\u00e9rifier Mon Paiement</button>' +
        '<button type="button" class="pay-momo-cancel" id="btnVerifyCancel">Plus tard</button>';

    const err = body.querySelector('#payVerifyErr');
    const x = body.querySelector('.fp-modal-x');
    if (x) x.addEventListener('click', () => m.close());
    body.querySelector('#btnVerifyCancel').addEventListener('click', () => m.close());

    body.querySelector('#btnVerifyPay').addEventListener('click', async () => {
        const btn = body.querySelector('#btnVerifyPay');
        btn.disabled = true; btn.textContent = 'V\u00e9rification en cours...';
        err.style.display = 'none';
        try {
            const res = await Api.post('/api/paiement/verifier', { sub_id: sub.subscription_id });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.status === 'error' || data.error) {
                err.style.display = 'block';
                err.textContent = (data && (data.error || data.message)) || 'Le paiement n\u2019a pas encore ete recu. Reessayez.';
                btn.disabled = false; btn.textContent = 'V\u00e9rifier Mon Paiement';
                return;
            }
            if (data.status !== 'paid') {
                err.style.display = 'block';
                err.textContent = 'Paiement pas encore confirme. Verifiez votre telephone puis reessayez.';
                btn.disabled = false; btn.textContent = 'V\u00e9rifier Mon Paiement';
                return;
            }
            // Paiement recu : presenter le contrat personnalise
            contractSignScreen(m, config, sub, data);
        } catch (e2) {
            err.style.display = 'block';
            err.textContent = 'Erreur reseau. Reessayez.';
            btn.disabled = false; btn.textContent = 'V\u00e9rifier Mon Paiement';
        }
    });
}

// Etat 2 : le contrat pre-rempli avec les informations de l'utilisateur + signature par OTP
function contractSignScreen(m, config, sub, payInfo) {
    const body = m.el.querySelector('.fp-modal');
    const fmt = window.FedpawaPay ? FedpawaPay.fmtFCFA : (n => n + ' FCFA');
    body.innerHTML = '' +
        '<button class="fp-modal-x" aria-label="Fermer">&times;</button>' +
        '<div class="pay-momo-head">' +
        '  <div class="pay-momo-icon ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>' +
        '  <h3 class="fp-modal-title">Paiement re\u00e7u \u2014 votre contrat est pr\u00eat</h3>' +
        '  <div class="pay-momo-amount">' + esc(fmt(config.priceFCFA)) + '</div>' +
        '</div>' +
        '<div class="contract-doc" style="max-height:38vh;overflow:auto;border:1px solid var(--color-border,#ddd);border-radius:8px;padding:14px 16px;margin:10px 0;font-size:0.82rem;line-height:1.55;background:#faf9f7;">' +
        '  <div style="text-align:center;font-weight:700;color:#7A1C1C;letter-spacing:0.06em;">CONVENTION DE DOMICILIATION & SERVICES</div>' +
        '  <p style="margin:10px 0 4px;"><strong>Entre les soussignes :</strong></p>' +
        '  <p style="margin:0 0 4px;">La soci\u00e9t\u00e9 <strong>FEDPAWA CORPORATE SOLUTIONS SARL</strong>, sise a l\u2019Immeuble Pharmacie de Logpom, Douala, Cameroun.</p>' +
        '  <p style="margin:0;">Et : <strong>' + esc((sub.client_name || window.FP_contractName || 'Client')) + '</strong>.</p>' +
        '  <p style="margin:8px 0 2px;"><strong>Objet :</strong> ' + esc(config.label || 'Prestation') + '</p>' +
        '  <p style="margin:0;"><strong>Montant :</strong> ' + esc(fmt(config.priceFCFA)) + ' \u2014 r\u00e8gle par Mobile Money (ref. ' + esc(payInfo.transaction_id || '-') + ').</p>' +
        '  <p style="margin:8px 0 0;color:#666;">Article 1 \u2014 Objet. Article 2 \u2014 Engagements & Confidentialite. Article 3 \u2014 Conditions Financieres. Le contrat integral est genere en PDF apres signature.</p>' +
        '</div>' +
        '<div class="pay-momo-note">Pour signer \u00e9lectroniquement ce contrat, saisissez le code \u00e0 6 chiffres qui vous a \u00e9t\u00e9 envoy\u00e9.</div>' +
        '<form id="contractSignForm" class="pay-momo-form">' +
        '  <div class="pay-field"><label for="contractOtp">Code de signature (OTP)</label>' +
        '  <input type="text" id="contractOtp" class="form-control" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required placeholder="123456"></div>' +
        '  <div class="pay-momo-err" id="contractErr" style="display:none;"></div>' +
        '  <button type="submit" class="btn btn-primary pay-momo-submit">Signer mon contrat</button>' +
        '</form>';

    const x = body.querySelector('.fp-modal-x');
    if (x) x.addEventListener('click', () => m.close());
    const err = body.querySelector('#contractErr');

    // Mode demo : l'API renvoie l'OTP dans la reponse (aucun SMS/e-mail configure).
    // On le pre-remplit pour rendre le flux testable ; en production ce champ
    // n'est pas renvoye et l'utilisateur saisit celui recu par SMS.
    if (sub && sub.signature_otp) {
        const otpInput = body.querySelector('#contractOtp');
        if (otpInput) otpInput.value = sub.signature_otp;
    }

    body.querySelector('#contractSignForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const otp = body.querySelector('#contractOtp').value.trim();
        const btn = body.querySelector('.pay-momo-submit[type="submit"]');
        btn.disabled = true; btn.textContent = 'Signature en cours...';
        err.style.display = 'none';
        try {
            const res = await Api.post('/api/signature', {
                sub_id: sub.subscription_id,
                client_id: sub.client_id,
                otp: otp
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.error) {
                err.style.display = 'block';
                err.textContent = (data && (data.error || data.message)) || 'Signature invalide. Verifiez le code recu.';
                btn.disabled = false; btn.textContent = 'Signer mon contrat';
                return;
            }
            // Succes : contrat signe, proposer le telechargement
            body.innerHTML = '' +
                '<div class="pay-momo-success">' +
                '  <div class="pay-momo-icon ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>' +
                '  <h3 class="fp-modal-title">Contrat sign\u00e9 !</h3>' +
                '  <div class="pay-momo-desc">Votre contrat personnalisé a été généré et signé électroniquement. Vous pouvez le télécharger dès maintenant et le retrouver dans votre Espace Client.</div>' +
                (data.contrat_url ? '<a href="' + esc(data.contrat_url) + '" target="_blank" rel="noopener" class="btn btn-primary pay-momo-submit" style="text-align:center;">T\u00e9l\u00e9charger mon contrat (PDF)</a>' : '') +
                '  <a href="espace_client.html" class="pay-momo-cancel" style="text-align:center;display:block;">Aller \u00e0 mon Espace Client</a>' +
                '</div>';
        } catch (e2) {
            err.style.display = 'block';
            err.textContent = 'Erreur reseau. Reessayez.';
            btn.disabled = false; btn.textContent = 'Signer mon contrat';
        }
    });
}

function momoScreen(config) {
        if (!window.FedpawaUI) { alert('Composant UI indisponible'); return null; }
        const m = window.FedpawaUI.modal({
            title: 'Paiement Mobile Money',
            hideClose: true,
            disableOverlayClose: true,
            disableEsc: true,
            className: 'pay-momo-modal',
            buttons: []
        });
        if (m.el) m.el.classList.add('pay-momo-modal'); // classe aussi sur l'overlay pour le CSS mobile
        const body = m.el.querySelector('.fp-modal');
        body.innerHTML = '' +
            '<button class="fp-modal-x" aria-label="Fermer">&times;</button>' +
            '<div class="pay-momo-head">' +
            '  <div class="pay-momo-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg></div>' +
            '  <h3 class="fp-modal-title">Paiement Mobile Money</h3>' +
            '  <div class="pay-momo-amount" id="payMomoAmount">' + esc(fmtFCFA(config.priceFCFA)) + '</div>' +
            '  <div class="pay-momo-desc" id="payMomoDesc">' + esc(config.label || '') + '</div>' +
            '</div>' +
            '<form id="payMomoForm" class="pay-momo-form">' +
            '  <div class="pay-field"><label for="payMomoPhone">Numéro Mobile Money <em class="req">*</em></label>' +
            '  <input type="tel" id="payMomoPhone" class="form-control" required placeholder="+237 6XX XX XX XX" pattern="\\+?[0-9\\s]{9,16}"></div>' +
            '  <div class="pay-momo-operators">' +
            '    <label class="pay-op-pill"><input type="radio" name="payOp" value="orange" required><span>🟠 Orange Money</span></label>' +
            '    <label class="pay-op-pill"><input type="radio" name="payOp" value="mtn" required><span>🟡 MTN MoMo</span></label>' +
            '  </div>' +
            '  <div class="pay-momo-note">📱 Une invite de confirmation USSD sera envoyée sur ce numéro. Composez votre code secret pour valider.</div>' +
            '  <div class="pay-momo-err" id="payMomoErr" style="display:none;"></div>' +
            '  <button type="submit" class="btn btn-primary pay-momo-submit" id="payMomoSubmit">Payer ' + esc(fmtFCFA(config.priceFCFA)) + '</button>' +
            '  <button type="button" class="pay-momo-cancel" id="payMomoCancel">Annuler</button>' +
            '</form>';
        const x = body.querySelector('.fp-modal-x');
        if (x) x.addEventListener('click', () => m.close());
        body.querySelector('#payMomoCancel').addEventListener('click', () => m.close());

        const err = body.querySelector('#payMomoErr');
        body.querySelector('#payMomoForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = body.querySelector('#payMomoPhone').value.trim();
            const op = body.querySelector('input[name="payOp"]:checked');
            if (!op) { err.style.display = 'block'; err.textContent = 'Choisissez votre opérateur.'; return; }
            const btn = body.querySelector('#payMomoSubmit');
            btn.disabled = true; btn.textContent = 'Traitement...';
            err.style.display = 'none';
            try {
                const res = await config.onSubmit({ phone, operator: op.value, price: config.priceFCFA });
                if (res && res.ok && res.api) {
                    // Lane contrat : le backend a enregistré la souscription et attend
                    // la confirmation du paiement -> écran « Vérifier Mon Paiement » puis contrat
                    contractFlowScreen(m, config, res.api);
                    return;
                }
                if (res && res.ok) {
                    body.innerHTML = '' +
                        '<div class="pay-momo-success">' +
                        '  <div class="pay-momo-icon ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>' +
                        '  <h3 class="fp-modal-title">Souscription enregistrée !</h3>' +
                        '  <div class="pay-momo-desc">' + esc(res.message || 'Votre demande a bien été transmise.') + (res.subscription_ref ? '<br><small>Référence : <strong>' + esc(res.subscription_ref) + '</strong></small>' : '') + '</div>' +
                        '  <a href="espace_client.html" class="btn btn-primary pay-momo-submit" style="text-align:center;">Aller à mon Espace Client</a>' +
                        '</div>';
                } else {
                    err.style.display = 'block';
                    err.textContent = (res && res.message) || 'Le paiement a échoué. Réessayez.';
                    btn.disabled = false; btn.textContent = 'Payer ' + fmtFCFA(config.priceFCFA);
                }
            } catch (e2) {
                err.style.display = 'block';
                err.textContent = 'Erreur réseau. Réessayez.';
                btn.disabled = false; btn.textContent = 'Payer ' + fmtFCFA(config.priceFCFA);
            }
        });
        return m;
    }

    // ---------- Garde: paiement réservé aux connectés ----------
    // Lance le paiement (ou la connexion d'abord si anonyme). Renvoie la promesse du résultat.
    async function requireLoginThenPay(config) {
        const session = await getSession();
        if (!session.authenticated) {
            return new Promise((resolve) => {
                loginModal(async (loginData) => {
                    const res = await config.afterLogin ? config.afterLogin(loginData) : null;
                    resolve(res);
                });
            });
        }
        return momoScreen(config);
    }

    window.FedpawaPay = { momoScreen, loginModal, requireLoginThenPay, getSession, getCsrf, fmtFCFA };
})();
