// Document Admin en — miroir de /admin-document (vague D).
// Visionneuse document admin (auth admin), ?type=&id=&file=.

import { Suspense } from "react";
import type { Metadata } from "next";
import AdminDocumentReader from "@/components/admin-document/Reader";
import { SITE_URL } from "@/lib/routes";

const title = "Admin Document | FEDPAWA CORPORATE SOLUTIONS";
const description =
  "Secure consultation and download of documents (FEDPAWA administration area).";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/en/admin-document",
    languages: {
      fr: SITE_URL + "/admin-document",
      en: SITE_URL + "/en/admin-document",
    },
  },
};

export default function AdminDocumentEnPage() {
  return (
    <Suspense fallback={null}>
      <AdminDocumentReader locale="en" />
    </Suspense>
  );
}
