// About Us EN — miroir de app/(site)/qui-sommes-nous/page.tsx.

import type { Metadata } from "next";
import About from "@/components/qui-sommes-nous/About";
import { getDictionary } from "@/lib/i18n";

const { meta } = getDictionary("en").shared;

const title = "FEDPAWA CORPORATE SOLUTIONS | About Us";
const description =
  "About FEDPAWA CORPORATE SOLUTIONS - The strategic partner for your business in Cameroon: domiciliation, company formation, tax advisory, OAPI, contracts.";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  alternates: {
    canonical: "https://www.fedpawa.com/en/qui-sommes-nous.php",
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
    url: "https://www.fedpawa.com/en/qui-sommes-nous.php",
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

export default function EnAboutPage() {
  return <About locale="en" />;
}
