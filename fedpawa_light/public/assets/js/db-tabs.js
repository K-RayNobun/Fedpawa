/* ============================================================
   db-tabs.js — Navigation par onglets des dashboards (client + admin)
   Extrait de dashboard.js pour être partagé entre espace_client.html
   et admin_dashboard.html. Ne fait AUCUN appel API (les données sont
   chargées par dashboard.js côté client / admin-dashboard.js côté admin).
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.db-nav-item');
    const tabContents = document.querySelectorAll('.db-tab-content');

    function activateTab(tabId) {
        document.querySelectorAll('.db-nav-item').forEach(nav => nav.classList.remove('active'));
        const nav = document.querySelector('.db-nav-item[data-tab="' + tabId + '"]');
        if (nav) nav.classList.add('active');
        document.querySelectorAll('.db-tab-content').forEach(content => content.classList.remove('active'));
        const panel = document.getElementById('tab-' + tabId);
        if (panel) panel.classList.add('active');
    }

    if (navItems.length > 0) {
        navItems.forEach(item => {
            item.addEventListener('click', () => activateTab(item.dataset.tab));
        });
    }

    // Délégation globale : couvre aussi les onglets ajoutés DYNAMIQUEMENT après le
    // chargement (Tickets Support et Messagerie sont injectés par admin-dashboard.js
    // une fois les données reçues — inexistants au moment du bind initial).
    document.addEventListener('click', (e) => {
        const item = e.target.closest('.db-nav-item');
        if (item && item.dataset.tab) {
            e.preventDefault();
            activateTab(item.dataset.tab);
        }
    });

    // Rendu initial : activer le 1er onglet si aucun n'est actif
    if (tabContents.length > 0 && !document.querySelector('.db-tab-content.active')) {
        const first = tabContents[0];
        first.classList.add('active');
    }

    window.switchTab = function(tabId) {
        activateTab(tabId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
});
