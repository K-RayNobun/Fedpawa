// Privacy fr — conversion de politique-confidentialite.php (vague B).

import type { Metadata } from "next";
import Privacy from "@/components/politique-confidentialite/Privacy";
import { getDictionary } from "@/lib/i18n";

const { meta } = getDictionary("fr").shared;

const title = 'FEDPAWA CORPORATE SOLUTIONS | Politique de Confidentialité';
const description = 'Comment FEDPAWA collecte, utilise et protège vos données personnelles : KYC, paiements Mobile Money, courriers numérisés, cookies et vos droits.';

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  alternates: {
    canonical: "https://www.fedpawa.com/politique-confidentialite.php",
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
    url: "https://www.fedpawa.com/politique-confidentialite.php",
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

export default function PrivacyPage() {
  return <Privacy locale="fr" />;
}
