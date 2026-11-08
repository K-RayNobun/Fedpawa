// Contact fr — conversion de contact.php (vague B).

import type { Metadata } from "next";
import Contact from "@/components/contact/Contact";
import { getDictionary } from "@/lib/i18n";

const { meta } = getDictionary("fr").shared;

const title = 'FEDPAWA CORPORATE SOLUTIONS | Contact — Douala, Cameroun';
const description = 'Contactez FEDPAWA : adresse, horaires, téléphone, WhatsApp, email et formulaire en ligne. Réponse sous 24h.';

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  alternates: {
    canonical: "https://www.fedpawa.com/contact.php",
    languages: {
      fr: "https://www.fedpawa.com/contact.php",
      en: "https://www.fedpawa.com/en/contact.php",
      "x-default": "https://www.fedpawa.com/contact.php",
    },
  },
  openGraph: {
    type: "website",
    siteName: meta.siteName,
    title,
    description,
    url: "https://www.fedpawa.com/contact.php",
    locale: "fr_FR",
    alternateLocale: "en_US",
    images: [
      { url: "/assets/images/og-cover.jpg", width: 1200, height: 630, alt: meta.siteName },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/assets/images/og-cover.jpg"],
  },
};

export default function ContactPage() {
  return <Contact locale="fr" />;
}
