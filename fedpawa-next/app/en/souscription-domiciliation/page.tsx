// Souscription domiciliation en — conversion de souscription_domiciliation.php (vague C).
// PAS de source EN pour ce flux (règle : JAMAIS INVENTER) :
// contenu + méta servis en FR (copie exacte de la page FR).

import type { Metadata } from "next";
import SouscriptionGuarded from "@/components/souscription-domiciliation/Guarded";
import { getDictionary } from "@/lib/i18n";
import { SITE_URL } from "@/lib/routes";

const { meta } = getDictionary("en").shared;

const title = "Souscription Domiciliation | FEDPAWA CORPORATE SOLUTIONS";
const description =
  "Souscrivez à la domiciliation d'entreprise FEDPAWA : 6 étapes (entreprise, représentant, contact, formule, documents KYC, facturation), packs nationaux et internationaux, paiement Mobile Money.";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/en/souscription-domiciliation",
    languages: {
      fr: SITE_URL + "/souscription-domiciliation",
      en: SITE_URL + "/en/souscription-domiciliation",
      "x-default": SITE_URL + "/souscription-domiciliation",
    },
  },
};

export default function EnSouscriptionPage() {
  // Audit #2 : garde data-auth="user" (client-side, parité source).
  return <SouscriptionGuarded locale="en" />;
}
