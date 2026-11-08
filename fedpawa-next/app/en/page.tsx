// Accueil EN — miroir de app/(site)/page.tsx (textes EN de /en/index.php source).

import type { Metadata } from "next";
import Home from "@/components/index/Home";
import { getDictionary } from "@/lib/i18n";

const { meta } = getDictionary("en").shared;

const title = "FEDPAWA CORPORATE SOLUTIONS | Business Infrastructure in Douala, Logpom";
const description =
  "FEDPAWA CORPORATE SOLUTIONS — Business infrastructure and operational hub in Douala, Logpom: domiciliation, company formation, tax advisory, OAPI, contracts and a 100% online client area.";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  alternates: {
    canonical: "https://www.fedpawa.com/en/index.php",
    languages: {
      fr: "https://www.fedpawa.com/",
      en: "https://www.fedpawa.com/en/index.php",
      "x-default": "https://www.fedpawa.com/",
    },
  },
  openGraph: {
    type: "website",
    siteName: meta.siteName,
    title,
    description,
    url: "https://www.fedpawa.com/en/index.php",
    locale: "en_US",
    alternateLocale: "fr_FR",
    images: [
      {
        url: "/assets/images/og-cover.jpg",
        width: 1200,
        height: 630,
        alt: meta.siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/assets/images/og-cover.jpg"],
  },
};

export default function EnHomePage() {
  return <Home locale="en" />;
}
