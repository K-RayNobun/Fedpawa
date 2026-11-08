// Admin Mails EN — miroir de app/(site)/admin/mails/page.tsx.

import type { Metadata } from "next";
import AdminMailsGuarded from "@/components/admin-mails/Guarded";
import { SITE_URL } from "@/lib/routes";

const title = "Inbox Admin | FEDPAWA CORPORATE SOLUTIONS";
const description =
  "FEDPAWA inbox administration (received @fedpawa.com mail): list, unread filter, search, sanitized detail and attachments (admin role only).";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/en/admin/mails",
    languages: {
      fr: SITE_URL + "/admin/mails",
      en: SITE_URL + "/en/admin/mails",
    },
  },
};

export default function EnAdminMailsPage() {
  return <AdminMailsGuarded locale="en" />;
}
