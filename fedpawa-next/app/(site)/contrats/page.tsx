// Contrats FR — conversion de contrats.php.

import type { Metadata } from "next";
import Contrats from "@/components/contrats/Contrats";
import { getDictionary } from "@/lib/i18n";
import { ServiceJsonLd } from "@/components/seo/jsonld";

const { meta } = getDictionary("fr").shared;

const title = "FEDPAWA CORPORATE SOLUTIONS | Rédaction de Contrats Juridiques";
const description =
  "Rédaction de contrats sociaux, commerciaux, de travail, NDAs et conventionnels par des juristes FEDPAWA. Souscription en ligne dès 100 000 FCFA HT.";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  alternates: {
    canonical: "https://www.fedpawa.com/contrats.php",
    languages: {
      fr: "https://www.fedpawa.com/contrats.php",
      en: "https://www.fedpawa.com/en/contrats.php",
      "x-default": "https://www.fedpawa.com/contrats.php",
    },
  },
  openGraph: {
    type: "website",
    siteName: meta.siteName,
    title,
    description,
    url: "https://www.fedpawa.com/contrats.php",
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

export default function ContratsPage() {
  return (
    <>
      <ServiceJsonLd service="contrats" locale="fr" />
      <Contrats locale="fr" />
    </>
  );
}
