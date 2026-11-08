// Mot de passe oublié en — conversion de mot_de_passe_oublie.php (vague C).
// PAS de source EN pour ce flux (règle : JAMAIS INVENTER) :
// contenu + méta servis en FR (copie exacte de la page FR).

import type { Metadata } from "next";
import PasswordReset from "@/components/mot-de-passe-oublie/PasswordReset";
import { getDictionary } from "@/lib/i18n";
import { SITE_URL } from "@/lib/routes";

const { meta } = getDictionary("en").shared;

const title = "Mot de passe oublié | FEDPAWA CORPORATE SOLUTIONS";
const description =
  "Réinitialisez votre mot de passe Espace Client FEDPAWA : code de vérification par e-mail, nouveau mot de passe sécurisé.";

export const metadata: Metadata = {
  // Title déjà complet (suffixe marque inclus) — absolute évite la
  // duplication du template « %s | FEDPAWA CORPORATE SOLUTIONS ».
  title: { absolute: title },
  description,
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/en/mot-de-passe-oublie",
    languages: {
      fr: SITE_URL + "/mot-de-passe-oublie",
      en: SITE_URL + "/en/mot-de-passe-oublie",
      "x-default": SITE_URL + "/mot-de-passe-oublie",
    },
  },
};

export default function EnForgotPasswordPage() {
  return <PasswordReset locale="en" />;
}
