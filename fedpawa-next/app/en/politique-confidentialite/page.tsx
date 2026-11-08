// Privacy en — conversion de politique-confidentialite.php (vague B).

import type { Metadata } from "next";
import Privacy from "@/components/politique-confidentialite/Privacy";
import { getDictionary } from "@/lib/i18n";

const { meta } = getDictionary("en").shared;

const title = "FEDPAWA CORPORATE SOLUTIONS | Privacy Policy";
const description =
  "FEDPAWA CORPORATE SOLUTIONS SARL Privacy Policy: data collected, purposes, retention periods, your access, rectification and erasure rights, cookies and how to contact us.";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  alternates: {
    canonical: "https://www.fedpawa.com/en/politique-confidentialite.php",
    languages: {
      fr: "https://www.fedpawa.com/politique-confidentialite.php",
      en: "https://www.fedpawa.com/en/politique-confidentialite.php",
      "x-default": "https://www.fedpawa.com/politique-confidentialite.php",
    },
  },
  openGraph: {
    type: "website",
    siteName: meta.siteName,
    title,
    description,
    url: "https://www.fedpawa.com/en/politique-confidentialite.php",
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

export default function EnPrivacyPage() {
  return <Privacy locale="en" />;
}
