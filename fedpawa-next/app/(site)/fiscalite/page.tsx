// Fiscalite FR — conversion de fiscalite.php (vague B).

import type { Metadata } from "next";
import Fiscalite from "@/components/fiscalite/Fiscalite";
import { getDictionary } from "@/lib/i18n";
import { ServiceJsonLd } from "@/components/seo/jsonld";

const { meta } = getDictionary("fr").shared;

const title = 'FEDPAWA CORPORATE SOLUTIONS | Conseil Juridique & Fiscal';
const description = 'Conseil et suivi juridique et fiscal des entreprises au Cameroun : télé-déclarations DGI, liasse fiscale, optimisation et représentation.';

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  alternates: {
    canonical: "https://www.fedpawa.com/fiscalite.php",
    languages: {
      fr: "https://www.fedpawa.com/fiscalite.php",
      en: "https://www.fedpawa.com/en/fiscalite.php",
      "x-default": "https://www.fedpawa.com/fiscalite.php",
    },
  },
  openGraph: {
    type: "website",
    siteName: meta.siteName,
    title,
    description,
    url: "https://www.fedpawa.com/fiscalite.php",
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

export default function FiscalitePage() {
  return (
    <>
      <ServiceJsonLd service="fiscalite" locale="fr" />
      <Fiscalite locale="fr" />
    </>
  );
}
