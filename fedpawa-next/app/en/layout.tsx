// Layout racine EN (audit lang/SEO) — miroir de app/(site)/layout.tsx
// mais rend <html lang="en"> (fix lang codé dur). Multi-root layouts
// Next 16 : chaque locale a son propre document <html>. JSON-LD
// Organization+WebSite avec inLanguage "en", urlTemplate sans .php.

import type { Metadata, Viewport } from "next";
import "../globals.css";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import RevealOnScroll from "@/components/site/RevealOnScroll";
import AnalyticsBeacon from "@/components/AnalyticsBeacon";
import PwaProvider from "@/components/pwa/PwaProvider";
import EmailVerificationProvider from "@/components/verification/EmailVerificationProvider";
import { getDictionary } from "@/lib/i18n";
import { SITE_URL } from "@/lib/routes";

const { meta } = getDictionary("en").shared;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: meta.defaultTitle,
    template: `%s | ${meta.siteName}`,
  },
  description: meta.defaultDescription,
  alternates: {
    canonical: "/en",
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
    url: SITE_URL + "/en",
    locale: "en_US",
    alternateLocale: "fr_FR",
    images: [
      {
        url: "/assets/images/og-cover.jpg",
        width: 1200,
        height: 630,
        alt: meta.siteName,
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15294D",
};

// JSON-LD EN (L016) — miroir du FR, inLanguage "en".
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
        "Business infrastructure and operational hub in Douala, Logpom (Cameroon): company domiciliation, company formation, tax advisory, OAPI protection and contract drafting.",
      email: "contact@fedpawa.com",
      telephone: "+237691704802",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Logpom Pharmacy Building",
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
      url: SITE_URL + "/en",
      name: "FEDPAWA CORPORATE SOLUTIONS",
      inLanguage: "en",
      publisher: { "@id": SITE_URL + "/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: SITE_URL + "/en?s={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function EnRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="navy" data-mode="dark">
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
        {/* Email verification: email_verified status (source /auth/me) */}
        <EmailVerificationProvider>
          <PwaProvider locale="en">
            <Header locale="en" />
            <main>{children}</main>
            <Footer locale="en" />
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
