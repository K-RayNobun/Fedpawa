// Espace Client en — miroir de /espace-client (vague D).
// Garde client côté composant. Contenus FR conservés : la source
// n'a pas de page EN dédiée pour l'espace connecté.

import type { Metadata } from "next";
import EspaceClientGuarded from "@/components/espace-client/Guarded";
import { SITE_URL } from "@/lib/routes";

const title = "Client Area | FEDPAWA CORPORATE SOLUTIONS";
const description =
  "Your FEDPAWA client area: subscription, invoices, contracts, scanned mail, KYC documents, messaging and support.";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/en/espace-client",
    languages: {
      fr: SITE_URL + "/espace-client",
      en: SITE_URL + "/en/espace-client",
    },
  },
  openGraph: {
    type: "website",
    title,
    description,
    url: SITE_URL + "/en/espace-client",
    locale: "en_US",
    alternateLocale: "fr_FR",
    images: [{ url: "/assets/images/og-cover.jpg", width: 1200, height: 630, alt: "FEDPAWA CORPORATE SOLUTIONS" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/assets/images/og-cover.jpg"],
  },
};

export default function EspaceClientEnPage() {
  return <EspaceClientGuarded locale="en" />;
}
