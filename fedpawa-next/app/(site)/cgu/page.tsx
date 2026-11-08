// Cgu fr — conversion de cgu.php (vague B).

import type { Metadata } from "next";
import Cgu from "@/components/cgu/Cgu";
import { getDictionary } from "@/lib/i18n";

const { meta } = getDictionary("fr").shared;

const title = "FEDPAWA CORPORATE SOLUTIONS | Conditions Générales d'Utilisation et de Vente";
const description = 'CGU/CGV FEDPAWA : comptes clients, souscriptions, paiements Mobile Money, engagements réciproques, résiliation et responsabilité.';

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  alternates: {
    canonical: "https://www.fedpawa.com/cgu.php",
    languages: {
      fr: "https://www.fedpawa.com/cgu.php",
      en: "https://www.fedpawa.com/en/cgu.php",
      "x-default": "https://www.fedpawa.com/cgu.php",
    },
  },
  openGraph: {
    type: "website",
    siteName: meta.siteName,
    title,
    description,
    url: "https://www.fedpawa.com/cgu.php",
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

export default function CguPage() {
  return <Cgu locale="fr" />;
}
