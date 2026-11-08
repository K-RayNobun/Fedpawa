// Admin Publications FR — écran admin minimal (Phase 1, contrat §4) :
// liste + création/édition + upload médias + publier/dépublier/
// programmer + suppression. Protégé par le rôle admin (Guarded).

import type { Metadata } from "next";
import AdminPublicationsGuarded from "@/components/admin-publications/Guarded";

const title = "Publications Admin | FEDPAWA CORPORATE SOLUTIONS";
const description =
  "Administration des publications FEDPAWA : création, édition, médias, programmation, publication, dépublication et suppression (réservé au rôle admin).";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/admin/publications",
    languages: {
      fr: "/admin/publications",
      en: "/en/admin/publications",
    },
  },
};

export default function AdminPublicationsPage() {
  return <AdminPublicationsGuarded locale="fr" />;
}
