// Email verification en — public page /en/verification-email (CONTRAT-VERIF).
// Mirror of app/(site)/verification-email/page.tsx.

import type { Metadata } from "next";
import { Suspense } from "react";
import VerificationEmail from "@/components/verification-email/VerificationEmail";
import { verifTexts } from "@/lib/verification";
import { SITE_URL } from "@/lib/routes";

const t = verifTexts("en");

export const metadata: Metadata = {
  title: { absolute: t.metaTitle },
  description: t.metaDescription,
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/en/verification-email",
    languages: {
      fr: SITE_URL + "/verification-email",
      en: SITE_URL + "/en/verification-email",
      "x-default": SITE_URL + "/verification-email",
    },
  },
};

export default function EnVerificationEmailPage() {
  return (
    <Suspense fallback={<div className="fp-verif-page">{t.pageLoading}</div>}>
      <VerificationEmail locale="en" />
    </Suspense>
  );
}
