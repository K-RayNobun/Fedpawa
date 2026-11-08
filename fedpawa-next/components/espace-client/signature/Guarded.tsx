// ==========================================================
// FEDPAWA — garde client pour les routes /espace-client/signature*
// (même garde que l'espace client : anonyme → /authentification,
// admin → dashboard admin).
// ==========================================================

"use client";

import { useAuthGuard } from "@/components/dashboard/useAuthGuard";
import VerificationBanner from "@/components/verification/VerificationBanner";
import type { Locale } from "@/lib/i18n";

export default function SignatureGuarded({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const guard = useAuthGuard("client", locale);
  if (guard.status === "checking" || guard.status === "denied") return null;
  return (
    <>
      <VerificationBanner locale={locale} />
      {children}
    </>
  );
}
