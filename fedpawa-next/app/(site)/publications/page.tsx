// Publications FR — page publique (Phase 1, contrat §4) :
// liste paginée des publications publiées, accessible sans compte.
// useSearchParams vit dans <PublicationsFeed> (Suspense requis par
// cacheComponents).

import { Suspense } from "react";
import type { Metadata } from "next";
import PublicationsFeed from "@/components/publications/PublicationsFeed";
import { getDictionary } from "@/lib/i18n";

const { meta } = getDictionary("fr").shared;

const title = "FEDPAWA CORPORATE SOLUTIONS | Publications";
const description =
  "Publications officielles de FEDPAWA Corporate Solutions : annonces, guides et actualités (texte, image, vidéo, galerie), les plus récentes en premier. Page publique, sans compte.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: {
    canonical: "https://www.fedpawa.com/publications",
    languages: {
      fr: "https://www.fedpawa.com/publications",
      en: "https://www.fedpawa.com/en/publications",
      "x-default": "https://www.fedpawa.com/publications",
    },
  },
  openGraph: {
    type: "website",
    siteName: meta.siteName,
    title,
    description,
    url: "https://www.fedpawa.com/publications",
    locale: "fr_FR",
    alternateLocale: "en_US",
    images: [
      { url: "/assets/images/og-cover.jpg", width: 1200, height: 630, alt: meta.siteName },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/assets/images/og-cover.jpg"],
  },
};

export default function PublicationsPage() {
  return (
    <Suspense fallback={null}>
      <PublicationsFeed locale="fr" />
    </Suspense>
  );
}
