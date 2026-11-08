// Tunnel souscription en — conversion de tunnel_souscription.php (vague C).
// PAS de source EN pour ce flux (règle : JAMAIS INVENTER) :
// contenu + méta servis en FR (copie exacte de la page FR).
// Routing ?service=&pack= côté client (comportement tunnel.js source) :
// la page reste statique, le panier s'initialise à l'hydratation.

import type { Metadata } from "next";
import TunnelGuarded from "@/components/tunnel-souscription/Guarded";
import { getDictionary } from "@/lib/i18n";
import { SITE_URL } from "@/lib/routes";

const { meta } = getDictionary("en").shared;

const title = "Tunnel de Souscription | FEDPAWA CORPORATE SOLUTIONS";
const description =
  "Souscrivez à vos services FEDPAWA : création d'entreprise, fiscalité, OAPI, contrats, recouvrement. 4 étapes : projet, options, pièces KYC, paiement Mobile Money.";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/en/tunnel-souscription",
    languages: {
      fr: SITE_URL + "/tunnel-souscription",
      en: SITE_URL + "/en/tunnel-souscription",
      "x-default": SITE_URL + "/tunnel-souscription",
    },
  },
};

export default function EnTunnelPage() {
  // Audit #2 : garde data-auth="user" (client-side, parité source).
  return <TunnelGuarded locale="en" />;
}
