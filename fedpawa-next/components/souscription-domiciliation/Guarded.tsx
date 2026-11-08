// ==========================================================
// FEDPAWA — Souscription gardée (audit #2 : data-auth="user"
// source souscription_domiciliation.php). Garde client-side :
// anonyme → /authentification?next=…, connecté → souscription.
// Prérendu statique intact (JS redirect, parité auth-guard.js).
// ==========================================================

"use client";

import Souscription from "@/components/souscription-domiciliation/Souscription";
import VerificationGateModal from "@/components/verification/VerificationGateModal";
import { useUserPageGuard } from "@/components/dashboard/useUserPageGuard";
import type { Locale } from "@/lib/i18n";

export default function SouscriptionGuarded({ locale }: { locale: Locale }) {
  const status = useUserPageGuard(locale);

  if (status !== "allowed") return null;

  // Modal bloquante non fermable si e-mail non vérifié (CONTRAT-VERIF) :
  // le contenu reste rendu derrière (reprise fluide après vérification).
  return (
    <>
      <Souscription locale={locale} />
      <VerificationGateModal locale={locale} />
    </>
  );
}
