// /espace-client/signature/[id] — signature d'un dossier existant.
// Pattern du projet (cf. admin-document) : page serveur + <Suspense>,
// useParams vit dans le composant client.
import { Suspense } from "react";
import SignatureDossierClient from "@/components/espace-client/signature/DossierClient";

// Route dynamique : rendu bloquant autorisé (cacheComponents) — le
// usePathname du Header (layout) et le useParams de la page vivent
// sous le <Suspense> ci-dessous / dans le composant client.
export const instant = false;

export default function SignatureDossierPage() {
  if (process.env.NEXT_PUBLIC_SIGNATURE_ENABLED !== "true") {
    return (
      <main className="db-main sig-main">
        <p>La signature électronique des contrats n&apos;est pas encore activée sur cet environnement.</p>
      </main>
    );
  }
  return (
    <Suspense fallback={null}>
      <SignatureDossierClient />
    </Suspense>
  );
}
