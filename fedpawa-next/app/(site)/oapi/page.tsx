// Oapi FR — conversion de oapi.php.

import type { Metadata } from "next";
import Oapi from "@/components/oapi/Oapi";
import { getDictionary } from "@/lib/i18n";
import { ServiceJsonLd } from "@/components/seo/jsonld";

const { meta } = getDictionary("fr").shared;

const title = "FEDPAWA CORPORATE SOLUTIONS | Marques & Propriété Intellectuelle (OAPI)";
const description =
  "Enregistrement de vos marques, logos, applications et logiciels auprès de l'OAPI. Protection de votre propriété intellectuelle en zone francophone.";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  alternates: {
    canonical: "https://www.fedpawa.com/oapi.php",
    languages: {
      fr: "https://www.fedpawa.com/oapi.php",
      en: "https://www.fedpawa.com/en/oapi.php",
      "x-default": "https://www.fedpawa.com/oapi.php",
    },
  },
  openGraph: {
    type: "website",
    siteName: meta.siteName,
    title,
    description,
    url: "https://www.fedpawa.com/oapi.php",
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

export default function OapiPage() {
  return (
    <>
      <ServiceJsonLd service="oapi" locale="fr" />
      <Oapi locale="fr" />
    </>
  );
}
