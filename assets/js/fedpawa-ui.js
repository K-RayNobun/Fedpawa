// ==========================================================
// FEDPAWA UI — Composants Toast & Modal (thème-adaptatifs)
// Dépend des variables CSS du site (--color-primary, --color-gold, etc.)
// S'adapte automatiquement au thème actif (bordeaux / navy / dark).
// ==========================================================
(function () {
    'use strict';

    if (window.FedpawaUI) return; // singleton

    // ---------- TOAST ----------
    const TOAST_ICONS = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
    };

    function toast(message, type, opts) {
        type = TOAST_ICONS[type] ? type : 'info';
        opts = opts || {};
        const duration = typeof opts.duration === 'number' ? opts.duration : 4000;

        let container = document.querySelector('.fp-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'fp-toast-container';
            container.setAttribute('role', 'status');
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }
        // un seul toast à la fois par défaut (remplace l'existant)
        if (!opts.stack) container.innerHTML = '';

        const el = document.createElement('div');
        el.className = 'fp-toast fp-toast-' + type;
        el.innerHTML = '<span class="fp-toast-icon">' + (TOAST_ICONS[type] || TOAST_ICONS.info) + '</span><div class="fp-toast-body">' + message + '</div>';
        if (!opts.duration) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'fp-toast-close';
            closeBtn.setAttribute('aria-label', 'Fermer');
            closeBtn.innerHTML = '&times;';
            el.appendChild(closeBtn);
        }
        container.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));

        const dismiss = () => {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 350);
        };
        if (opts.duration !== 0) setTimeout(dismiss, duration); // 0 = persistant
        el.addEventListener('click', (e) => { if (e.target.closest('.fp-toast-close')) dismiss(); });
        el.addEventListener('click', dismiss);
        return { dismiss };
    }

    // ---------- MODAL / POPUP ----------
    let activeModal = null;

    function modal(config) {
        config = config || {};
        // Fermer une éventuelle modal ouverte
        if (activeModal) activeModal.close();

        const overlay = document.createElement('div');
        overlay.className = 'fp-modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        if (config.id) overlay.id = config.id;

        const iconHtml = config.icon ? '<div class="fp-modal-icon fp-modal-icon-' + (config.iconType || 'info') + '">' + config.icon + '</div>' : '';
        const titleHtml = config.title ? '<h3 class="fp-modal-title">' + config.title + '</h3>' : '';
        const msgHtml = config.message ? '<div class="fp-modal-message">' + config.message + '</div>' : '';
        const xHtml = config.hideClose ? '' : '<button class="fp-modal-x" aria-label="Fermer">&times;</button>';

        const buttons = (config.buttons || []).map((b, i) =>
            '<button class="fp-modal-btn ' + (b.className || 'fp-modal-btn-secondary') + '" data-fp-btn="' + i + '">' + b.label + '</button>'
        ).join('');

        overlay.innerHTML = '<div class="fp-modal ' + (config.className || '') + '">' + xHtml + iconHtml + titleHtml + msgHtml + '<div class="fp-modal-actions">' + buttons + '</div></div>';

        const onCloseCallbacks = [];
        const api = {
            el: overlay,
            close() {
                if (!overlay.parentNode) return;
                overlay.classList.remove('open');
                setTimeout(() => overlay.remove(), 250);
                document.removeEventListener('keydown', escHandler);
                onCloseCallbacks.forEach(cb => { try { cb(); } catch (e) {} });
                if (activeModal === api) activeModal = null;
            },
            onClose(cb) { onCloseCallbacks.push(cb); return api; }
        };

        const escHandler = (e) => { if (e.key === 'Escape' && !config.disableEsc) api.close(); };
        document.addEventListener('keydown', escHandler);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && !config.disableOverlayClose) api.close(); // clic hors contenu
        });
        overlay.querySelectorAll('.fp-modal-x').forEach(x => x.addEventListener('click', () => api.close()));
        overlay.querySelectorAll('[data-fp-btn]').forEach(btn => {
            btn.addEventListener('click', () => {
                const conf = config.buttons[parseInt(btn.dataset.fpBtn, 10)];
                if (conf.action) {
                    const result = conf.action(api);
                    if (result !== false) api.close(); // retour explicite false = rester ouverte
                } else {
                    api.close();
                }
            });
        });

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        const origClose = api.close;
        api.close = () => { document.body.style.overflow = ''; origClose(); };
        requestAnimationFrame(() => overlay.classList.add('open'));
        const focusTarget = overlay.querySelector('.fp-modal-btn') || overlay.querySelector('.fp-modal-x');
        if (focusTarget) focusTarget.focus();
        activeModal = api;
        return api;
    }

    // ---------- CONFIRM (raccourci) ----------
    function confirm(config) {
        return modal({
            title: config.title,
            message: config.message,
            icon: TOAST_ICONS[config.iconType || 'warning'],
            iconType: config.iconType || 'warning',
            buttons: [
                { label: config.cancelLabel || 'Annuler', className: 'fp-modal-btn-secondary', action: () => { if (config.onCancel) config.onCancel(); } },
                { label: config.confirmLabel || 'Confirmer', className: 'fp-modal-btn-primary', action: () => { if (config.onConfirm) config.onConfirm(); } }
            ]
        });
    }

    window.FedpawaUI = { toast, modal, confirm };
})();
