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
