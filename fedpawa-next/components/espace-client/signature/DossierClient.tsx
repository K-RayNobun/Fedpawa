// ==========================================================
// FEDPAWA — composant client de la route /espace-client/signature/[id]
// (garde client + page de signature du dossier). L'id du dossier est lu
// via useParams (le <Suspense> de la page couvre ce hook, cacheComponents).
// ==========================================================

"use client";

import { useParams } from "next/navigation";
import SignatureGuarded from "@/components/espace-client/signature/Guarded";
import SignatureDossier from "@/components/espace-client/signature/SignatureDossier";

export default function SignatureDossierClient() {
  const params = useParams<{ id: string }>();
  const dossierId = Number.parseInt(params?.id ?? "", 10);

  return (
    <SignatureGuarded locale="fr">
      <main className="db-main sig-main">
        {Number.isInteger(dossierId) && dossierId > 0 ? (
          <SignatureDossier dossierId={dossierId} />
        ) : (
          <div className="db-section" style={{ color: "var(--color-danger)" }}>
            Identifiant de dossier invalide.
          </div>
        )}
      </main>
    </SignatureGuarded>
  );
}
