// Document Admin fr — conversion de admin_document.html (vague D).
// Visionneuse d'un document (type, id, file depuis ?query) remplie
// par GET /api/v1/admin/document-info. Auth admin requise.
// useSearchParams vit dans le client component <AdminDocumentReader>
// (Suspense requis par cacheComponents).

import { Suspense } from "react";
import type { Metadata } from "next";
import AdminDocumentReader from "@/components/admin-document/Reader";

const title = "Document Admin | FEDPAWA CORPORATE SOLUTIONS";
const description =
  "Consultation et téléchargement sécurisés de documents (espace administration FEDPAWA).";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/admin-document",
    languages: {
      fr: "/admin-document",
      en: "/en/admin-document",
    },
  },
};

export default function AdminDocumentPage() {
  return (
    <Suspense fallback={null}>
      <AdminDocumentReader locale="fr" />
    </Suspense>
  );
}
