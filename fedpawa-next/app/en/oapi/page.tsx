// Oapi EN — miroir de app/(site)/oapi/page.tsx.

import type { Metadata } from "next";
import Oapi from "@/components/oapi/Oapi";
import { getDictionary } from "@/lib/i18n";
import { ServiceJsonLd } from "@/components/seo/jsonld";

const { meta } = getDictionary("en").shared;

const title = "FEDPAWA CORPORATE SOLUTIONS | Trademarks & Intellectual Property (OAPI)";
const description =
  "Trademark, logo, application and software registration with OAPI. Protect your intellectual property across francophone Africa.";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  alternates: {
    canonical: "https://www.fedpawa.com/en/oapi.php",
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
    url: "https://www.fedpawa.com/en/oapi.php",
    locale: "en_US",
    alternateLocale: "fr_FR",
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

export default function EnOapiPage() {
  return (
    <>
      <ServiceJsonLd service="oapi" locale="en" />
      <Oapi locale="en" />
    </>
  );
}
