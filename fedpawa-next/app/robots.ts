// robots.txt (audit SEO) — parité robots.txt source : pages
// privées (espace client, admin, auth, tunnel, souscription)
// exclues, sitemap déclaré. FR racine + miroir /en.

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/routes";

/** Chemins privés (source : public/robots.txt) — FR + miroir /en. */
const privatePaths = [
  "/espace-client",
  "/admin-dashboard",
  "/admin-document",
  "/authentification",
  "/mot-de-passe-oublie",
  "/tunnel-souscription",
  "/souscription-domiciliation",
];

export default function robots(): MetadataRoute.Robots {
  const disallow = [...privatePaths, ...privatePaths.map((p) => "/en" + p)];

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow,
    },
    sitemap: SITE_URL + "/sitemap.xml",
  };
}
