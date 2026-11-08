// Dashboard Admin en — miroir de /admin-dashboard (vague D).
// Garde admin côté composant. Contenus FR conservés : pas de page
// EN dédiée côté source.

import type { Metadata } from "next";
import AdminDashboardGuarded from "@/components/admin-dashboard/Guarded";
import { SITE_URL } from "@/lib/routes";

const title = "Admin Dashboard | FEDPAWA CORPORATE SOLUTIONS";
const description =
  "FEDPAWA admin dashboard: activity overview, clients, subscriptions, payments, mail handling, KYC validation, tickets and internal messaging.";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/en/admin-dashboard",
    languages: {
      fr: SITE_URL + "/admin-dashboard",
      en: SITE_URL + "/en/admin-dashboard",
    },
  },
};

export default function AdminDashboardEnPage() {
  return <AdminDashboardGuarded locale="en" documentViewerPath="/en/admin-document" />;
}
