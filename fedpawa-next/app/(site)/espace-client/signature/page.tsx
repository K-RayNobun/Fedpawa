// /espace-client/signature — liste des documents en attente de signature.
"use client";

import SignatureGuarded from "@/components/espace-client/signature/Guarded";
import SignatureListe from "@/components/espace-client/signature/SignatureListe";

export default function SignaturePage() {
  // Interrupteur de mise en service : sans NEXT_PUBLIC_SIGNATURE_ENABLED=true au build,
  // la fonctionnalité reste invisible en production (les routes API n'existent
  // pour l'instant que sur la pile de test).
  if (process.env.NEXT_PUBLIC_SIGNATURE_ENABLED !== "true") {
    return (
      <main className="db-main sig-main">
        <p>La signature électronique des contrats n&apos;est pas encore activée sur cet environnement.</p>
      </main>
    );
  }
  return (
    <SignatureGuarded locale="fr">
      <main className="db-main sig-main">
        <SignatureListe />
      </main>
    </SignatureGuarded>
  );
}
