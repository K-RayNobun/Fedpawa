// Admin Publications EN — miroir de app/(site)/admin/publications/page.tsx.

import type { Metadata } from "next";
import AdminPublicationsGuarded from "@/components/admin-publications/Guarded";
import { SITE_URL } from "@/lib/routes";

const title = "Publications Admin | FEDPAWA CORPORATE SOLUTIONS";
const description =
  "FEDPAWA publications administration: create, edit, media upload, schedule, publish, unpublish and delete (admin role only).";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/en/admin/publications",
    languages: {
      fr: SITE_URL + "/admin/publications",
      en: SITE_URL + "/en/admin/publications",
    },
  },
};

export default function EnAdminPublicationsPage() {
  return <AdminPublicationsGuarded locale="en" />;
}
