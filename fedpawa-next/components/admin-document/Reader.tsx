// ==========================================================
// FEDPAWA — lecteur URL pour la visionneuse document admin (vague D)
// Lit ?type=&id=&file= (client component — useSearchParams), applique
// la garde admin puis rend la fiche. <Suspense> requis par
// cacheComponents (useSearchParams suspend au prerender).
// ==========================================================

"use client";

import { useSearchParams } from "next/navigation";
import AdminDocument from "@/components/admin-document/Component";
import { useAuthGuard } from "@/components/dashboard/useAuthGuard";
import type { Locale } from "@/lib/i18n";

export default function AdminDocumentReader({ locale }: { locale: Locale }) {
  const guard = useAuthGuard("admin", locale);
  const searchParams = useSearchParams();

  if (guard.status === "checking" || guard.status === "denied") {
    // Garde en cours / redirection : rendu vide (parité auth-guard.js).
    return null;
  }

  return (
    <AdminDocument
      locale={locale}
      docType={searchParams.get("type") ?? ""}
      docId={searchParams.get("id") ?? ""}
      docFile={searchParams.get("file") ?? ""}
    />
  );
}
