// Publications EN — miroir de app/(site)/publications/page.tsx.

import { Suspense } from "react";
import type { Metadata } from "next";
import PublicationsFeed from "@/components/publications/PublicationsFeed";
import { getDictionary } from "@/lib/i18n";

const { meta } = getDictionary("en").shared;

const title = "FEDPAWA CORPORATE SOLUTIONS | Publications";
const description =
  "Official FEDPAWA Corporate Solutions publications: announcements, guides and news (text, image, video, gallery), newest first. Public page, no account required.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: {
    canonical: "https://www.fedpawa.com/en/publications",
    languages: {
      fr: "https://www.fedpawa.com/publications",
      en: "https://www.fedpawa.com/en/publications",
      "x-default": "https://www.fedpawa.com/publications",
    },
  },
  openGraph: {
    type: "website",
    siteName: meta.siteName,
    title,
    description,
    url: "https://www.fedpawa.com/en/publications",
    locale: "en_US",
    alternateLocale: "fr_FR",
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

export default function EnPublicationsPage() {
  return (
    <Suspense fallback={null}>
      <PublicationsFeed locale="en" />
    </Suspense>
  );
}
