// Sitemap XML (audit SEO) — les ~30 routes kebab FR + EN avec
// alternates hreflang. Sources : lib/routes.ts (vagues A–D),
// robots.txt source (pages privées exclues de l'indexation).

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/routes";

/** Routes publiques indexables, par locale. */
const publicRoutes: Record<"fr" | "en", readonly string[]> = {
  fr: [
    "/",
    "/domiciliation",
    "/creation-entreprise",
    "/fiscalite",
    "/oapi",
    "/contrats",
    "/publications",
    "/qui-sommes-nous",
    "/contact",
    "/cgu",
    "/politique-confidentialite",
  ],
  en: [
    "/en",
    "/en/domiciliation",
    "/en/creation-entreprise",
    "/en/fiscalite",
    "/en/oapi",
    "/en/contrats",
    "/en/publications",
    "/en/qui-sommes-nous",
    "/en/contact",
    "/en/cgu",
    "/en/politique-confidentialite",
  ],
};

/** Miroir EN d'une route FR ("" = racine). */
function enPath(fr: string): string {
  return fr === "/" ? "/en" : "/en" + fr;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Pages publiques FR avec hreflang → /en.
  const fr = publicRoutes.fr.map((path) => ({
    url: SITE_URL + path,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.8,
    alternates: {
      languages: {
        fr: SITE_URL + path,
        en: SITE_URL + enPath(path),
      },
    },
  }));

  // Pages publiques EN avec hreflang → FR.
  const en = publicRoutes.en.map((path) => ({
    url: SITE_URL + path,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: path === "/en" ? 1 : 0.8,
    alternates: {
      languages: {
        fr: SITE_URL + (path === "/en" ? "/" : path.slice(3)),
        en: SITE_URL + path,
      },
    },
  }));

  return [...fr, ...en];
}
