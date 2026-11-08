// Espace Client fr — conversion de espace_client.html (vague D).
// Dashboard client data-driven (profil, factures, contrats, courriers,
// KYC, support, messagerie) — garde client côté composant (Guarded.tsx).

import type { Metadata } from "next";
import EspaceClientGuarded from "@/components/espace-client/Guarded";

const title = "Espace Client | FEDPAWA CORPORATE SOLUTIONS";
const description =
  "Votre espace client FEDPAWA : abonnement, factures, contrats, courriers scannés, dossier KYC, messagerie et support.";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/espace-client",
    languages: {
      fr: "/espace-client",
      en: "/en/espace-client",
    },
  },
  openGraph: {
    type: "website",
    title,
    description,
    url: "/espace-client",
    locale: "fr_FR",
    images: [{ url: "/assets/images/og-cover.jpg", width: 1200, height: 630, alt: "FEDPAWA CORPORATE SOLUTIONS" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/assets/images/og-cover.jpg"],
  },
};

export default function EspaceClientPage() {
  return <EspaceClientGuarded locale="fr" />;
}
