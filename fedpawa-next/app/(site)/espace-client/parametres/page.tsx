// Espace Client > Paramètres (vague E) — page FR.
// Garde client côté composant (ParametresClient → useAuthGuard).

import type { Metadata } from "next";
import ParametresClient from "@/components/espace-client/parametres/ParametresClient";

const title = "Paramètres | FEDPAWA CORPORATE SOLUTIONS";
const description =
  "Paramètres de votre espace client FEDPAWA : notifications push et préférences par type d'événement.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/espace-client/parametres",
  },
};

export default function ParametresPage() {
  return <ParametresClient />;
}
