// ==========================================================
// FEDPAWA — Web App Manifest (PWA)
// Doc Next 16 : node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/01-metadata/manifest.md — fichier spécial
// app/manifest.ts rendu sur /manifest.webmanifest et lié
// automatiquement dans <head> par Next.
// Couleurs : thème navy de globals.css — --color-primary #15294D
// (utilisé aussi par viewport.themeColor dans les layouts FR/EN),
// fond --color-surface-darker #05080F (écran de démarrage).
// Icônes générées par ImageMagick depuis
// public/assets/images/logo.jpg ; maskable = padding 10 %
// safe-zone sur fond #15294D (manifeste maskable exigé pour
// l'installation Android/Chrome sans rognage).
// ==========================================================

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FEDPAWA Corporate Solutions",
    short_name: "FEDPAWA",
    description:
      "Domiciliation d'entreprises, création d'entreprise, conseil fiscal, protection OAPI et rédaction de contrats à Douala, Logpom (Cameroun).",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    lang: "fr",
    dir: "auto",
    background_color: "#05080F",
    theme_color: "#15294D",
    categories: ["business", "productivity", "finance"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
