// ==========================================================
// FEDPAWA — Admin Publications gardé (Phase 1) : garde admin
// (parité auth-guard.js data-auth="admin") dans un client
// component : client → espace client, anonyme → auth.
// ==========================================================

"use client";

import AdminPublications from "@/components/admin-publications/Component";
import { useAuthGuard } from "@/components/dashboard/useAuthGuard";
import type { Locale } from "@/lib/i18n";

export default function AdminPublicationsGuarded({
  locale,
}: {
  locale: Locale;
}) {
  const guard = useAuthGuard("admin", locale);

  if (guard.status === "checking" || guard.status === "denied") {
    return null;
  }

  return <AdminPublications locale={locale} />;
}
