// ==========================================================
// FEDPAWA — Admin Mails gardé (CONTRAT-MAIL.md §3) : même
// garde admin que /admin/publications (useAuthGuard "admin") :
// client → espace client, anonyme → auth.
// ==========================================================

"use client";

import AdminMails from "@/components/admin-mails/Component";
import { useAuthGuard } from "@/components/dashboard/useAuthGuard";
import type { Locale } from "@/lib/i18n";

export default function AdminMailsGuarded({
  locale,
}: {
  locale: Locale;
}) {
  const guard = useAuthGuard("admin", locale);

  if (guard.status === "checking" || guard.status === "denied") {
    return null;
  }

  return <AdminMails locale={locale} />;
}
