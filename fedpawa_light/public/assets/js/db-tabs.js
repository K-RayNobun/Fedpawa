/* ============================================================
   db-tabs.js — Navigation par onglets des dashboards (client + admin)
   Extrait de dashboard.js pour être partagé entre espace_client.html
   et admin_dashboard.html. Ne fait AUCUN appel API (les données sont
   chargées par dashboard.js côté client / admin-dashboard.js côté admin).
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.db-nav-item');
    const tabContents = document.querySelectorAll('.db-tab-content');

    if (navItems.length > 0) {
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabId = item.dataset.tab;
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                tabContents.forEach(content => content.classList.remove('active'));
                const activeTab = document.getElementById('tab-' + tabId);
                if (activeTab) activeTab.classList.add('active');
            });
        });
    }

    // Rendu initial : activer le 1er onglet si aucun n'est actif
    if (tabContents.length > 0 && !document.querySelector('.db-tab-content.active')) {
        const first = tabContents[0];
        first.classList.add('active');
    }

    window.switchTab = function(tabId) {
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.tab === tabId) item.classList.add('active');
        });
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === 'tab-' + tabId) content.classList.add('active');
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
});
