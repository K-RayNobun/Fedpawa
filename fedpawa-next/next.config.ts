import type { NextConfig } from "next";

// ============================================================
// Sécurité (audit FIX-SECURITY) : CSP stricte + entêtes de
// défense sur toutes les réponses.
//
// CSP — 'unsafe-inline' en script-src EST requis : le site rend
// des <script type="application/ld+json"> inline (JSON-LD dans
// app/(site)/layout.tsx, app/en/layout.tsx, app/(site)/page.tsx)
// — vérifié, pas d'externalisation possible. style-src 'unsafe-
// inline' requis aussi (styles inline React + skin TinyMCE).
// TinyMCE charge depuis le CDN officiel cdn.tiny.cloud (L012).
// ============================================================

const isDev = process.env.NODE_ENV === "development";

// Origine de l'API Laravel consommée par le navigateur (fetch depuis
// lib/api.ts / lib/auth.ts) : incluse dans connect-src pour que le
// front puisse appeler l'API quand elle n'est pas same-origin
// (dev/test : NEXT_PUBLIC_API_URL=http://app-test.fedpawa.com).
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").origin;
  } catch {
    return "http://localhost:8000";
  }
})();

const csp = [
  "default-src 'self'",
  // JSON-LD inline (+ 'unsafe-eval' en dev pour HMR uniquement).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://cdn.tiny.cloud`,
  // Fonts Google + skin oxide TinyMCE + styles inline React.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tiny.cloud",
  "font-src 'self' data: https://fonts.gstatic.com https://cdn.tiny.cloud",
  // data: images (SVG inline) + blob: (uploads/aperçus).
  "img-src 'self' data: blob:",
  // Prod : API same-origin derrière le reverse proxy.
  // Si NEXT_PUBLIC_API_URL est vide ou local, on n'ajoute rien au connect-src (same-origin suffit).
  `connect-src 'self'${apiOrigin.includes("localhost") || !apiOrigin ? "" : ` ${apiOrigin}`}`,
  // Aperçu PDF du contrat à signer : iframe sur blob: (fetch authentifié Bearer).
  "frame-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // PWA — service worker /sw.js servi same-origin (public/).
  "worker-src 'self'",
  // Manifest lié par Next (app/manifest.ts) + SW /sw.js.
  "manifest-src 'self'",
].join("; ");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Proxy API local UNIQUEMENT pour l'e2e hors ligne (worker A) :
  // actif seulement si E2E_PROXY_API=1 au build — jamais en prod/test
  // (où NEXT_PUBLIC_API_URL pointe déjà vers l'API, même origine via Caddy
  // ou cross-origin autorisé). Permet de servir le front sur
  // http://localhost:PORT (contexte sécurisé) avec /api/v1 en same-origin.
  async rewrites() {
    if (process.env.E2E_PROXY_API === "1") {
      const target = (process.env.E2E_API_TARGET ?? "https://app.fedpawa.com").replace(/\/+$/, "");
      return [{ source: "/api/v1/:path*", destination: `${target}/api/v1/:path*` }];
    }
    return [];
  },
  // 404 globale brandée — nécessaire avec les layouts racines
  // multiples FR/EN (cf. doc file-conventions/not-found).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Prod servira le domaine en HTTPS.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
