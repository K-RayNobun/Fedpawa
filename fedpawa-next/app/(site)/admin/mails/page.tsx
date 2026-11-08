// Admin Mails FR — boîte de réception admin (CONTRAT-MAIL.md §3) :
// liste paginée antichronologique, filtre non-lus, recherche, badge
// de non-lus, détail (corps HTML assaini + pièces jointes), marquer
// comme lu. Protégé par le même garde admin que /admin/publications.

import type { Metadata } from "next";
import AdminMailsGuarded from "@/components/admin-mails/Guarded";

const title = "Boîte de réception Admin | FEDPAWA CORPORATE SOLUTIONS";
const description =
  "Administration de la boîte de réception FEDPAWA (courrier reçu @fedpawa.com) : liste, filtre non lus, recherche, détail assaini et pièces jointes (réservé au rôle admin).";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/admin/mails",
    languages: {
      fr: "/admin/mails",
      en: "/en/admin/mails",
    },
  },
};

export default function AdminMailsPage() {
  return <AdminMailsGuarded locale="fr" />;
}
