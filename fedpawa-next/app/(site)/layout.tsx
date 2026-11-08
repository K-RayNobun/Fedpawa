// Layout racine FR (audit lang/SEO) — conversion de l'ancien
// app/layout.tsx : squelette <head> repris du partial source
// (templates/partials/site-header.php) : fonts Google, meta/OG
// par défaut, JSON-LD Organization+WebSite (corrigé : téléphone
// complet depuis le PHP source, urlTemplate sans index.php,
// inLanguage fr), Header + <main> + Footer, reveal au scroll.
// Multi-root layouts Next 16 : ce layout rend <html lang="fr">,
// app/en/layout.tsx rend <html lang="en">.

import type { Metadata, Viewport } from "next";
import "../globals.css";
import "../../styles/mobile-nav-override.css";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import RevealOnScroll from "@/components/site/RevealOnScroll";
import AnalyticsBeacon from "@/components/AnalyticsBeacon";
import PwaProvider from "@/components/pwa/PwaProvider";
import EmailVerificationProvider from "@/components/verification/EmailVerificationProvider";
import { getDictionary } from "@/lib/i18n";
import { SITE_URL } from "@/lib/routes";

const { meta } = getDictionary("fr").shared;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: meta.defaultTitle,
    template: `%s | ${meta.siteName}`,
  },
  description: meta.defaultDescription,
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/assets/images/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/images/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/assets/images/apple-touch-icon.png",
  },
  alternates: {
    canonical: "/",
    languages: {
      fr: SITE_URL + "/",
      en: SITE_URL + "/en",
      "x-default": SITE_URL + "/",
    },
  },
  openGraph: {
    type: "website",
    siteName: meta.siteName,
    title: meta.defaultTitle,
    description: meta.defaultDescription,
    url: SITE_URL + "/",
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15294D",
};

// JSON-LD global (L016) — repris du partial source, corrigé
// (audit SEO) : téléphone complet +237691704802 (le PHP source
// concatène '+237' . '691' . '70' . '4802', le masque ****4802
// était une erreur de conversion), urlTemplate sans index.php
// (routes Next sans extension), inLanguage "fr" (ce layout).
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": SITE_URL + "/#organization",
      name: "FEDPAWA CORPORATE SOLUTIONS",
      legalName: "FEDPAWA CORPORATE SOLUTIONS SARL",
      url: SITE_URL + "/",
      logo: SITE_URL + "/assets/images/logo.jpg",
      description:
        "Infrastructure d'affaires et hub opérationnel à Douala, Logpom (Cameroun) : domiciliation d'entreprises, création d'entreprise, conseil fiscal, protection OAPI et rédaction de contrats.",
      email: "contact@fedpawa.com",
      telephone: "+237691704802",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Immeuble Pharmacie de Logpom",
        addressLocality: "Douala",
        addressRegion: "Littoral",
        postalCode: "",
        addressCountry: "CM",
      },
      openingHoursSpecification: [
        ["Monday", "08:00", "18:00"],
        ["Tuesday", "08:00", "18:00"],
        ["Wednesday", "08:00", "18:00"],
        ["Thursday", "08:00", "18:00"],
        ["Friday", "08:00", "18:00"],
        ["Saturday", "09:00", "14:00"],
      ].map(([day, opens, closes]) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: day,
        opens,
        closes,
      })),
      sameAs: ["https://wa.me/237691704802"],
    },
    {
      "@type": "WebSite",
      "@id": SITE_URL + "/#website",
      url: SITE_URL + "/",
      name: "FEDPAWA CORPORATE SOLUTIONS",
      inLanguage: "fr",
      publisher: { "@id": SITE_URL + "/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: SITE_URL + "/?s={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function FrRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="navy" data-mode="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var p=location.pathname;var m=document.querySelectorAll(".main-nav a[href]");for(var i=0;i<m.length;i++){var a=m[i];var h=a.getAttribute("href");if(!h||h==="#")continue;var act=(p===h)||(h!=="/"&&p.indexOf(h+"/")===0);if(act){a.classList.add("is-active");var dd=a.closest(".nav-dropdown");if(dd){var t=dd.querySelector(":scope>a.nav-link");if(t)t.classList.add("is-active")}}}}catch(e){}})();` }} />
        {/* is-active polyfill: parité PHP (état actif rendu avant JS, aucun flash) */}
        {/* PWA : enregistre /sw.js + bouton notifications (contexte) */}
        {/* Vérification e-mail : statut email_verified (source /auth/me) */}
        <EmailVerificationProvider>
          <PwaProvider locale="fr">
            <Header locale="fr" />
            <main>{children}</main>
            <Footer locale="fr" />
          </PwaProvider>
        </EmailVerificationProvider>
        {/* Réplique du §4 de main.js : reveal au scroll des .reveal */}
        <RevealOnScroll />
        {/* Mesure d'audience navigateur — inerte sauf si NEXT_PUBLIC_ANALYTICS_ENABLED=true au build */}
        <AnalyticsBeacon />
      </body>
    </html>
  );
}
