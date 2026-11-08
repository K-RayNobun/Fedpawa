// ==========================================================
// FEDPAWA — Dashboard Admin gardé (vague D)
// Garde admin (parité auth-guard.js data-auth="admin") dans un
// client component : client → espace client, anonyme → auth.
// Charge les données admin APRÈS le feu vert (provider interne).
// ==========================================================

"use client";

import { AdminDashboardWithProviders } from "@/components/admin-dashboard/Component";
import { useAuthGuard } from "@/components/dashboard/useAuthGuard";
import type { Locale } from "@/lib/i18n";

export default function AdminDashboardGuarded({
  locale,
  documentViewerPath,
}: {
  locale: Locale;
  documentViewerPath?: string;
}) {
  const guard = useAuthGuard("admin", locale);

  if (guard.status === "checking" || guard.status === "denied") {
    return null;
  }

  return (
    <AdminDashboardWithProviders
      documentViewerPath={documentViewerPath ?? "/admin-document"}
    />
  );
}
