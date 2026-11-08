// Accueil FR — conversion de index.php (vague B).
// JSON-LD LocalBusiness conservé (L016) : script inline du <main> source.

import type { Metadata } from "next";
import Home from "@/components/index/Home";
import { getDictionary } from "@/lib/i18n";

const { meta } = getDictionary("fr").shared;

export const metadata: Metadata = {
  // Title réel du source (dist/index.html) : suffixe marque inclus —
  // absolute évite la duplication « FEDPAWA CORPORATE SOLUTIONS | … ».
  title: {
    absolute: "FEDPAWA CORPORATE SOLUTIONS | Infrastructure d'affaires à Douala, Logpom",
  },
  description: meta.defaultDescription,
  alternates: {
    canonical: "https://www.fedpawa.com/",
    languages: {
      fr: "https://www.fedpawa.com/",
      en: "https://www.fedpawa.com/en/index.php",
      "x-default": "https://www.fedpawa.com/",
    },
  },
  openGraph: {
    type: "website",
    siteName: meta.siteName,
    title: meta.defaultTitle,
    description: meta.defaultDescription,
    url: "https://www.fedpawa.com/",
    locale: "fr_FR",
    alternateLocale: "en_US",
    images: [
      {
        url: "/assets/images/og-cover.jpg",
        width: 1200,
        height: 630,
        alt: meta.siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: meta.defaultTitle,
    description: meta.defaultDescription,
    images: ["/assets/images/og-cover.jpg"],
  },
};

// JSON-LD LocalBusiness/ProfessionalService — repris tel quel du <main> source (L016).
const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "ProfessionalService"],
  "@id": "https://www.fedpawa.com/#localbusiness.php",
  name: "FEDPAWA CORPORATE SOLUTIONS SARL",
  description:
    "Centre de domiciliation et infrastructure d'affaires à Logpom, Douala : adresse commerciale, gestion de courrier, création d'entreprise, conseil fiscal, OAPI et contrats.",
  url: "https://www.fedpawa.com/",
  image: "https://www.fedpawa.com/assets/images/og-cover.jpg.php",
  logo: "https://www.fedpawa.com/assets/images/logo.jpg.php",
  telephone: "+237691704802",
  email: "contact@fedpawa.com",
  priceRange: "FCFA 25,000 - FCFA 70,000",
  currenciesAccepted: "XAF",
  paymentAccepted: "Mobile Money, Cash, Bank Transfer",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Immeuble Pharmacie de Logpom",
    addressLocality: "Douala",
    addressRegion: "Littoral",
    addressCountry: "CM",
  },
  geo: { "@type": "GeoCoordinates", latitude: 4.0836, longitude: 9.737 },
  areaServed: [
    { "@type": "Country", name: "Cameroun" },
    { "@type": "City", name: "Douala" },
  ],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "09:00",
      closes: "14:00",
    },
  ],
  sameAs: ["https://wa.me/237691704802"],
  identifier: [
    { "@type": "PropertyValue", name: "RCCM", value: "CM-DLA-01-2026-B13-00767" },
    { "@type": "PropertyValue", name: "NIU", value: "M09261890362B" },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd),
        }}
      />
      <Home locale="fr" />
    </>
  );
}
