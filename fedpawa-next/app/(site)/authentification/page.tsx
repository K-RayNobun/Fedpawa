// Authentification fr — conversion de authentification.php (vague C).

import type { Metadata } from "next";
import Auth from "@/components/authentification/Auth";
import { getDictionary } from "@/lib/i18n";
import { SITE_URL } from "@/lib/routes";

const { meta } = getDictionary("fr").shared;

const title = 'Espace Client | FEDPAWA CORPORATE SOLUTIONS';
const description = 'Connectez-vous à votre espace client FEDPAWA : suivi des démarches, documents KYC, courriers scannés, factures et attestations fiscales.';

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/authentification",
    languages: {
      fr: SITE_URL + "/authentification",
      en: SITE_URL + "/en/authentification",
      "x-default": SITE_URL + "/authentification",
    },
  },
};

export default function AuthPage() {
  return <Auth locale="fr" />;
}
