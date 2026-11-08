// Tunnel souscription fr — conversion de tunnel_souscription.php (vague C).
// Routing ?service=&pack= côté client (comportement tunnel.js source) :
// la page reste statique, le panier s'initialise à l'hydratation.

import type { Metadata } from "next";
import TunnelGuarded from "@/components/tunnel-souscription/Guarded";
import { getDictionary } from "@/lib/i18n";
import { SITE_URL } from "@/lib/routes";

const { meta } = getDictionary("fr").shared;

const title = 'Tunnel de Souscription | FEDPAWA CORPORATE SOLUTIONS';
const description = "Souscrivez à vos services FEDPAWA : création d'entreprise, fiscalité, OAPI, contrats, recouvrement. 4 étapes : projet, options, pièces KYC, paiement Mobile Money.";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/tunnel-souscription",
    languages: {
      fr: SITE_URL + "/tunnel-souscription",
      en: SITE_URL + "/en/tunnel-souscription",
      "x-default": SITE_URL + "/tunnel-souscription",
    },
  },
};

export default function TunnelPage() {
  // Audit #2 : garde data-auth="user" (client-side, parité source).
  return <TunnelGuarded locale="fr" />;
}
