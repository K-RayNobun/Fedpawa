// ==========================================================
// FEDPAWA — Tunnel gardé (audit #2 : data-auth="user" source)
// Garde client-side (parité auth-guard.js) : anonyme →
// /authentification?next=…, connecté (client OU admin) → tunnel.
// Le prérendu statique reste intact : la page est rendue puis
// l'expulsion se fait au navigateur (JS redirect), jamais en SSR.
// ==========================================================

"use client";

import Abonnement from "@/components/tunnel-souscription/Abonnement";
import VerificationGateModal from "@/components/verification/VerificationGateModal";
import { useUserPageGuard } from "@/components/dashboard/useUserPageGuard";
import type { Locale } from "@/lib/i18n";

export default function TunnelGuarded({
  locale,
  service,
  pack,
}: {
  locale: Locale;
  service?: string;
  pack?: string;
}) {
  const status = useUserPageGuard(locale);

  if (status !== "allowed") return null;

  return (
    <>
      <Tunnel locale={locale} service={service} pack={pack} />
      <VerificationGateModal locale={locale} />
    </>
  );
}
