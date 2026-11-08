// Domiciliation FR — conversion de domiciliation.php (vague B).

import type { Metadata } from "next";
import Domiciliation from "@/components/domiciliation/Domiciliation";
import { getDictionary } from "@/lib/i18n";
import { ServiceJsonLd } from "@/components/seo/jsonld";

const { meta } = getDictionary("fr").shared;

const title = "FEDPAWA CORPORATE SOLUTIONS | Domiciliation d'Entreprises à Douala";
const description = "Domiciliation d'entreprises à Douala Logpom : adresse commerciale prestigieuse, gestion du courrier, salles de réunion. Dès 35 000 FCFA/mois HT.";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  alternates: {
    canonical: "https://www.fedpawa.com/domiciliation.php",
    languages: {
      fr: "https://www.fedpawa.com/domiciliation.php",
      en: "https://www.fedpawa.com/en/domiciliation.php",
      "x-default": "https://www.fedpawa.com/domiciliation.php",
    },
  },
  openGraph: {
    type: "website",
    siteName: meta.siteName,
    title,
    description,
    url: "https://www.fedpawa.com/domiciliation.php",
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

export default function DomiciliationPage() {
  return (
    <>
      <ServiceJsonLd service="domiciliation" locale="fr" />
      <Domiciliation locale="fr" />
    </>
  );
}
