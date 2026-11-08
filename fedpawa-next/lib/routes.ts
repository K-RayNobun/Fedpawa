// ==========================================================
// FEDPAWA — routes internes (vague A : squelette partagé)
// Les pages PHP deviennent des routes Next sans extension :
// index.php → "/", domiciliation.php → "/domiciliation", etc.
// FR = racine, EN = miroir sous /en.
// ==========================================================

export interface RouteMap {
  home: string;
  domiciliation: string;
  creationEntreprise: string;
  fiscalite: string;
  oapi: string;
  contrats: string;
  publications: string;
  aboutUs: string;
  contact: string;
  cgu: string;
  privacy: string;
  auth: string;
  forgotPassword: string;
  souscription: string;
  tunnel: string;
  espaceClient: string;
  adminDashboard: string;
  adminDocument: string;
  verificationEmail: string;
}

/** Routes FR (racine). */
export const frRoutes: RouteMap = {
  home: "/",
  domiciliation: "/domiciliation",
  creationEntreprise: "/creation-entreprise",
  fiscalite: "/fiscalite",
  oapi: "/oapi",
  contrats: "/contrats",
  publications: "/publications",
  aboutUs: "/qui-sommes-nous",
  contact: "/contact",
  cgu: "/cgu",
  privacy: "/politique-confidentialite",
  auth: "/authentification",
  forgotPassword: "/mot-de-passe-oublie",
  souscription: "/souscription-domiciliation",
  tunnel: "/tunnel-souscription",
  espaceClient: "/espace-client",
  adminDashboard: "/admin-dashboard",
  adminDocument: "/admin-document",
  verificationEmail: "/verification-email",
};

/** Routes EN (miroir sous /en). */
export const enRoutes: RouteMap = {
  ...frRoutes,
  home: "/en",
  domiciliation: "/en/domiciliation",
  creationEntreprise: "/en/creation-entreprise",
  fiscalite: "/en/fiscalite",
  oapi: "/en/oapi",
  contrats: "/en/contrats",
  publications: "/en/publications",
  aboutUs: "/en/qui-sommes-nous",
  contact: "/en/contact",
  cgu: "/en/cgu",
  privacy: "/en/politique-confidentialite",
  auth: "/en/authentification",
  forgotPassword: "/en/mot-de-passe-oublie",
  souscription: "/en/souscription-domiciliation",
  tunnel: "/en/tunnel-souscription",
  espaceClient: "/en/espace-client",
  adminDashboard: "/en/admin-dashboard",
  adminDocument: "/en/admin-document",
  verificationEmail: "/en/verification-email",
};

/** Routes pour une locale. */
export function routesFor(locale: "fr" | "en"): RouteMap {
  return locale === "en" ? enRoutes : frRoutes;
}

/**
 * Garde anti open-redirect pour ?next= (audit #3, P0).
 * Parité auth.js source (regex .php|.html) transposée routes Next :
 * n'accepte QUE un chemin interne — commence par « / » unique,
 * jamais « // » (protocol-relative), jamais http(s)/protocole,
 * pas de backslash (équiv. « / » côté navigateur).
 */
export function isSafeNextPath(next: string | null | undefined): next is string {
  if (!next) return false;
  return /^\/(?!\/)[^\\]*$/.test(next);
}

// ==========================================================
// Changement de langue — page miroir (parité main.js source
// l.147-153 : switchLanguage conserve la page courante,
// FR: /page ↔ EN: /en/page). Table de correspondance explicite
// (équivalent du « file.split('/').pop() » PHP→Next sans .php).
// ==========================================================

/** Segments partagés FR↔EN (identiques dans les deux locales). */
const MIRROR_SEGMENTS = [
  "domiciliation",
  "creation-entreprise",
  "fiscalite",
  "oapi",
  "contrats",
  "publications",
  "qui-sommes-nous",
  "contact",
  "cgu",
  "politique-confidentialite",
  "authentification",
  "mot-de-passe-oublie",
  "souscription-domiciliation",
  "tunnel-souscription",
  "espace-client",
  "admin-dashboard",
  "admin-document",
  "verification-email",
] as const;

/**
 * Calcule l'href de la page jumelle (FR↔EN) depuis le pathname
 * courant. `/` ↔ `/en` ; `/fiscalite` ↔ `/en/fiscalite`.
 * Fallback : accueil de la locale cible (comportement source :
 * page inconnue → index de l'autre langue).
 */
export function mirrorHref(pathname: string, locale: "fr" | "en"): string {
  const clean = pathname.split("?")[0].split("#")[0];
  const segments = clean.split("/").filter(Boolean);
  const isEn = segments[0] === "en";
  const rest = isEn ? segments.slice(1) : segments;

  // Racine : `/` ↔ `/en`
  if (rest.length === 0) return locale === "en" ? "/en" : "/";

  // Page mappée : conserve la page courante
  if (MIRROR_SEGMENTS.includes(rest[0] as (typeof MIRROR_SEGMENTS)[number])) {
    const page = rest[0];
    return locale === "en" ? `/en/${page}` : `/${page}`;
  }

  // Page inconnue (404, routes dynamiques…) → accueil (parité source)
  return locale === "en" ? "/en" : "/";
}

/** URL absolue de production (canonical/hreflang). */
export const SITE_URL = "https://www.fedpawa.com";
