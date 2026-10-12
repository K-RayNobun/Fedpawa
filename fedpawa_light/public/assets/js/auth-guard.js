// ============================================================
// FEDPAWA — Garde d'accès selon état de session (Lane #4)
// Usage: <html data-auth="client"> ou <html data-auth="admin">
//   - data-auth="client" : page réservée aux clients (admin redirigé vers admin_dashboard, anonyme vers login)
//   - data-auth="admin"  : page réservée aux admins (client redirigé vers espace client, anonyme vers login)
//   - data-auth="guest"  : page pour non-connectés (connecté -> redirigé vers son espace)
// ============================================================
(function () {
    'use strict';
    var required = document.documentElement.getAttribute('data-auth');
    if (!required) return; // page publique: rien à faire

    function redirectTo(page) {
        var isEn = window.location.pathname.indexOf('/en/') !== -1;
        window.location.replace((isEn ? '../' : '') + page);
    }

    function apply(auth) {
        var role = auth && auth.authenticated ? (auth.role || 'client') : null;
        if (required === 'client') {
            if (!role) { redirectTo('authentification.html'); return; }
            if (role === 'admin') { redirectTo('admin_dashboard.html'); return; }
            // client: accès autorisé
        } else if (required === 'admin') {
            if (!role) { redirectTo('authentification.html'); return; }
            if (role !== 'admin') { redirectTo('espace_client.html'); return; }
        } else if (required === 'guest') {
            if (role === 'admin') { redirectTo('admin_dashboard.html'); return; }
            if (role) { redirectTo('espace_client.html'); return; }
        }
    }

    function run() {
        // Si l'API n'est pas encore expose (config.js absent), réessayer après chargement
        if (typeof window.apiUrl !== 'function') {
            window.addEventListener('load', function () {
                if (typeof window.apiUrl === 'function') run(); else apply(null);
            });
            return;
        }
        fetch(window.apiUrl('/api/me'), { credentials: 'include' })
            .then(function (r) { return r.ok ? r.json() : { authenticated: false }; })
            .then(apply)
            .catch(function () { /* API injoignable: laisser la page visible (dégradation gracieuse, cohérent avec le site statique) */ });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
})();
