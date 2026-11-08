// Authentification en — conversion de authentification.php (vague C).

import type { Metadata } from "next";
import Auth from "@/components/authentification/Auth";
import { getDictionary } from "@/lib/i18n";
import { SITE_URL } from "@/lib/routes";

const { meta } = getDictionary("en").shared;

const title = 'Client Portal | FEDPAWA CORPORATE SOLUTIONS';
const description = 'Log in to your FEDPAWA client portal: procedure tracking, KYC documents, scanned mail, invoices and tax certificates.';

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/en/authentification",
    languages: {
      fr: SITE_URL + "/authentification",
      en: SITE_URL + "/en/authentification",
      "x-default": SITE_URL + "/authentification",
    },
  },
};

export default function EnAuthPage() {
  return <Auth locale="en" />;
}
