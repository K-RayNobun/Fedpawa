// Qui sommes-nous FR — conversion de qui-sommes-nous.php (vague B).

import type { Metadata } from "next";
import About from "@/components/qui-sommes-nous/About";
import { getDictionary } from "@/lib/i18n";

const { meta } = getDictionary("fr").shared;

const title = "FEDPAWA CORPORATE SOLUTIONS | Qui sommes-nous ?";
const description =
  "Découvrez FEDPAWA Corporate Solutions, cabinet expert en création d'entreprises OHADA, dépôt de marques OAPI et conseil fiscal au Cameroun.";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  alternates: {
    canonical: "https://www.fedpawa.com/qui-sommes-nous.php",
    languages: {
      fr: "https://www.fedpawa.com/qui-sommes-nous.php",
      en: "https://www.fedpawa.com/en/qui-sommes-nous.php",
      "x-default": "https://www.fedpawa.com/qui-sommes-nous.php",
    },
  },
  openGraph: {
    type: "website",
    siteName: meta.siteName,
    title,
    description,
    url: "https://www.fedpawa.com/qui-sommes-nous.php",
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

export default function AboutPage() {
  return <About locale="fr" />;
}
