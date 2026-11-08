// Layout des routes /espace-client/signature* — métadonnées (les pages
// sont des composants client : useParams pour l'id du dossier).
import type { Metadata } from "next";

const title = "Signature électronique | FEDPAWA CORPORATE SOLUTIONS";
const description =
  "Signez vos contrats électroniquement depuis votre espace client FEDPAWA : consentement, code de confirmation par e-mail, signature au doigt ou à la souris, contrat scellé et dossier de preuve téléchargeables.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  robots: { index: false, follow: false },
};

export default function SignatureLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
