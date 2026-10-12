// Configuration centrale — URL de l'API backend.
// Sur GitHub Pages (site statique), l'API vit sur un domaine séparé.
window.FEDPAWA_CONFIG = window.FEDPAWA_CONFIG || {
    API_BASE: 'https://api.fedpawa.com'
};
window.apiUrl = function (path) {
    return window.FEDPAWA_CONFIG.API_BASE.replace(/\/$/, '') + path;
};
