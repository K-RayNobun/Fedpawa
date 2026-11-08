/* Fedpawa — mesure d'audience côté navigateur (couche « temps actif »).
 *
 * Ce fichier n'est injecté dans les pages que si la valeur de build
 * NEXT_PUBLIC_ANALYTICS_ENABLED vaut exactement "true" (défaut false :
 * aucune mesure, rien n'est envoyé). Voir components/AnalyticsBeacon.tsx
 * et lib/README-analytics.md — même pattern que l'interrupteur de signature.
 *
 * Envoi vers /collect (publié par Caddy, proxy vers 127.0.0.1:8020) :
 *   { session_id, chemin, titre,
 *     evenement: "vue" | "coeur" | "sortie",
 *     temps_visible_ms, temps_focus_ms }
 *
 * - "vue"    : chargement de la page (ou navigation SPA détectée)
 * - "coeur"  : battement toutes les 30 s, UNIQUEMENT si la page est visible
 *              (Page Visibility API) ET au premier plan (focus/blur)
 * - "sortie" : envoi final via navigator.sendBeacon à la sortie (pagehide)
 *              et quand la page passe en arrière-plan (visibilitychange)
 *
 * temps_visible_ms / temps_focus_ms sont CUMULATIFS depuis l'ouverture de la
 * page : le tableau de bord prend le MAX par (session, chemin), jamais la somme.
 */
(function () {
  "use strict";
  if (window.__fedpawaAnalytics) { return; } // jamais deux fois

  var ENDPOINT = "/collect";
  var HEARTBEAT_MS = 30000;

  function uuid() {
    if (window.crypto && crypto.randomUUID) { return crypto.randomUUID(); }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  var sessionId = uuid();
  var chemin = location.pathname;
  var titreInit = document.title || "";
  var visibleMs = 0, focusMs = 0;
  var visibleSince = null, focusSince = null;

  function now() { return Date.now(); }
  function pageVisible() { return document.visibilityState === "visible"; }
  function pageAuPremierPlan() { return document.hasFocus(); }

  function totaux() {
    var t = now();
    var v = visibleMs, f = focusMs;
    if (visibleSince !== null) { v += t - visibleSince; }
    if (focusSince !== null) { f += t - focusSince; }
    return { visible: Math.round(v), focus: Math.round(f) };
  }

  function figer() { // fige les compteurs à l'instant présent
    var t = now();
    if (visibleSince !== null) { visibleMs += t - visibleSince; visibleSince = null; }
    if (focusSince !== null) { focusMs += t - focusSince; focusSince = null; }
  }

  function reprendre() {
    var t = now();
    if (pageVisible() && visibleSince === null) { visibleSince = t; }
    if (pageAuPremierPlan() && focusSince === null) { focusSince = t; }
  }

  function envoyer(evenement, opts) {
    opts = opts || {};
    var tt = totaux();
    var payload = {
      session_id: sessionId,
      chemin: chemin,
      titre: String(document.title || titreInit || "").slice(0, 512),
      evenement: evenement,
      temps_visible_ms: tt.visible,
      temps_focus_ms: tt.focus
    };
    var body = JSON.stringify(payload);
    if (opts.beacon && navigator.sendBeacon) {
      try {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
        return;
      } catch (e) { /* retombe sur fetch */ }
    }
    try {
      fetch(ENDPOINT, {
        method: "POST",
        body: body,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        credentials: "omit"
      });
    } catch (e) { /* mesure best-effort : jamais d'erreur visible */ }
  }

  // --- compteurs : visibilité (Page Visibility API) ---
  document.addEventListener("visibilitychange", function () {
    if (pageVisible()) {
      if (visibleSince === null) { visibleSince = now(); }
    } else {
      figer();
      envoyer("sortie", { beacon: true }); // page passée en arrière-plan
    }
  });

  // --- compteurs : premier plan (focus / blur) ---
  window.addEventListener("focus", function () {
    if (focusSince === null) { focusSince = now(); }
  });
  window.addEventListener("blur", function () {
    var t = now();
    if (focusSince !== null) { focusMs += t - focusSince; focusSince = null; }
  });

  // --- envoi final à la fermeture / sortie de la page ---
  window.addEventListener("pagehide", function () {
    figer();
    envoyer("sortie", { beacon: true });
  });

  // --- battement toutes les 30 s, UNIQUEMENT si visible ET au premier plan ---
  setInterval(function () {
    if (pageVisible() && pageAuPremierPlan()) {
      envoyer("coeur");
    }
  }, HEARTBEAT_MS);

  // --- navigation SPA (Next.js App Router) : changement de chemin sans rechargement ---
  (function () {
    var dernier = location.pathname;
    function navigue() {
      var courant = location.pathname;
      if (courant !== dernier) {
        figer();
        envoyer("sortie", { beacon: true }); // fin de la page précédente
        chemin = courant;
        dernier = courant;
        visibleMs = 0; focusMs = 0;
        reprendre();
        envoyer("vue", { beacon: true }); // nouvelle page vue
      }
    }
    var ps = history.pushState, rs = history.replaceState;
    history.pushState = function () { ps.apply(this, arguments); navigue(); };
    history.replaceState = function () { rs.apply(this, arguments); navigue(); };
    window.addEventListener("popstate", navigue);
  })();

  // --- démarrage ---
  reprendre();
  envoyer("vue");
  window.__fedpawaAnalytics = { sessionId: sessionId };
})();
