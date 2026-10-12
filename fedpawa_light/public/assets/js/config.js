// Configuration centrale — URL de l'API backend.
// Le site et l'API sont servis depuis la même origine (api.fedpawa.com):
// on utilise l'origine courante par défaut; FEDPAWA_CONFIG.API_BASE permet de forcer
// une API distante si le front est servi ailleurs (ex: GitHub Pages).
(function () {
    var sameOrigin = window.location.origin && window.location.protocol.indexOf('http') === 0 ? window.location.origin : '';
    window.FEDPAWA_CONFIG = window.FEDPAWA_CONFIG || { API_BASE: sameOrigin };
    window.apiUrl = function (path) {
        var base = (window.FEDPAWA_CONFIG.API_BASE || '').replace(/\/$/, '');
        if (!base) return path;
        return base + path;
    };
})();
