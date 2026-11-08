// Vérification e-mail fr — page publique /verification-email (CONTRAT-VERIF).
// useSearchParams dans un composant client → enveloppé dans <Suspense>
// (rendu statique Next 16). Page noindex (lien de vérification = jeton).

import type { Metadata } from "next";
import { Suspense } from "react";
import VerificationEmail from "@/components/verification-email/VerificationEmail";
import { verifTexts } from "@/lib/verification";
import { SITE_URL } from "@/lib/routes";

const t = verifTexts("fr");

export const metadata: Metadata = {
  title: { absolute: t.metaTitle },
  description: t.metaDescription,
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/verification-email",
    languages: {
      fr: SITE_URL + "/verification-email",
      en: SITE_URL + "/en/verification-email",
      "x-default": SITE_URL + "/verification-email",
    },
  },
};

export default function VerificationEmailPage() {
  return (
    <Suspense fallback={<div className="fp-verif-page">{t.pageLoading}</div>}>
      <VerificationEmail locale="fr" />
    </Suspense>
  );
}
