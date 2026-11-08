// Contact en — conversion de contact.php (vague B).

import type { Metadata } from "next";
import Contact from "@/components/contact/Contact";
import { getDictionary } from "@/lib/i18n";

const { meta } = getDictionary("en").shared;

const title = "FEDPAWA CORPORATE SOLUTIONS | Contact & Appointments in Douala";
const description =
  "Contact FEDPAWA CORPORATE SOLUTIONS SARL - Logpom, Douala. Domiciliation, company formation, tax advisory, OAPI, contracts.";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  alternates: {
    canonical: "https://www.fedpawa.com/en/contact.php",
    languages: {
      fr: "https://www.fedpawa.com/contact.php",
      en: "https://www.fedpawa.com/en/contact.php",
      "x-default": "https://www.fedpawa.com/contact.php",
    },
  },
  openGraph: {
    type: "website",
    siteName: meta.siteName,
    title,
    description,
    url: "https://www.fedpawa.com/en/contact.php",
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

export default function EnContactPage() {
  return <Contact locale="en" />;
}
