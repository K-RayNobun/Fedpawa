// ==========================================================
// FEDPAWA — Vérification e-mail (CONTRAT-VERIF.md, worker A)
// Client des endpoints du contrat + textes FR/EN partagés
// (bannière espace client, modal souscription, page
// /verification-email). Pattern PwaProvider : dictionnaire
// TEXTS inline par locale (composants transverses).
// ==========================================================

import { ApiError, apiPost } from "@/lib/api";
import { apiAuthPost, type MeResponse } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";

// ---------- Endpoints (contrat) ----------

export interface VerifyEmailResult {
  verified: boolean;
  deja_verifie?: boolean;
}

/**
 * POST /api/v1/auth/verify-email — PUBLIC, body {token}.
 * 200 {verified:true[, deja_verifie:true]} ; 410 {code:"lien_expire"} ;
 * 400 {code:"lien_invalide"}. Lève ApiError(status, message, body).
 */
export function verifyEmailToken(token: string): Promise<VerifyEmailResult> {
  return apiPost<VerifyEmailResult>("/api/v1/auth/verify-email", { token });
}

export interface ResendResult {
  envoye: boolean;
  retry_after?: number;
}

/**
 * POST /api/v1/auth/resend-verification — auth requis (Bearer auto),
 * uniquement si non vérifié. 202 {envoye:true} ; 429 {code:"deja_envoye",
 * retry_after:<s>} ; 401 si non connecté.
 */
export function resendVerification(): Promise<ResendResult> {
  return apiAuthPost<ResendResult>("/api/v1/auth/resend-verification");
}

// ---------- Helpers d'erreur ----------

/** Code applicatif renvoyé par l'API dans le corps d'erreur ({code:...}). */
export function apiErrorCode(err: unknown): string | null {
  if (err instanceof ApiError && err.body && typeof err.body === "object") {
    const code = (err.body as { code?: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  return null;
}

/**
 * 403 {"code":"email_non_verifie"} — gating serveur (CONTRAT-VERIF) :
 * à intercepter PARTOUT pour ré-afficher la modal de vérification.
 */
export function isEmailNonVerifieError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 403 && apiErrorCode(err) === "email_non_verifie";
}

/** Libellé du 403 serveur (contrat : message fixe). */
export function emailNonVerifieMessage(locale: Locale): string {
  return locale === "en"
    ? "Please verify your email address to continue."
    : "Vérifiez votre adresse e-mail pour continuer.";
}

// ---------- Textes FR/EN (composants transverses) ----------

export interface VerifTexts {
  bannerTitle: string;
  bannerText: string;
  btnVerifyNow: string;
  btnResend: string;
  resendOk: string;
  resendWait: string; // contient {s}
  resendKo: string;
  resendNeedLogin: string;
  gateTitle: string;
  gateText: string;
  btnChecked: string;
  checking: string;
  // Page /verification-email
  pageLoading: string;
  successTitle: string;
  successText: string;
  successAlreadyTitle: string;
  successAlreadyText: string;
  btnGoEspace: string;
  expiredTitle: string;
  expiredText: string;
  invalidTitle: string;
  invalidText: string;
  noTokenTitle: string;
  noTokenText: string;
  btnLoginToResend: string;
  networkKo: string;
  metaTitle: string;
  metaDescription: string;
}

export const VERIF_TEXTS: Record<Locale, VerifTexts> = {
  fr: {
    bannerTitle: "Adresse e-mail non vérifiée",
    bannerText:
      "Votre adresse e-mail n'a pas encore été vérifiée. Certaines actions (souscription, signature, paiement, notifications push) sont bloquées tant que l'e-mail n'est pas confirmé.",
    btnVerifyNow: "Vérifier maintenant",
    btnResend: "Renvoyer le lien",
    resendOk: "E-mail de vérification envoyé. Consultez votre boîte de réception (et les indésirables).",
    resendWait: "Un e-mail vient déjà d'être envoyé — réessayez dans {s} s.",
    resendKo: "Impossible d'envoyer l'e-mail de vérification pour le moment.",
    resendNeedLogin: "Connectez-vous pour renvoyer le lien de vérification.",
    gateTitle: "Vérification de votre e-mail requise",
    gateText:
      "Pour finaliser votre souscription, vous devez d'abord confirmer votre adresse e-mail. Cliquez sur le lien reçu par e-mail, puis revenez ici : votre souscription vous attend, intacte.",
    btnChecked: "J'ai vérifié mon e-mail",
    checking: "Vérification en cours…",
    pageLoading: "Vérification de votre lien…",
    successTitle: "E-mail vérifié",
    successText:
      "Votre adresse e-mail est confirmée. Vous pouvez maintenant souscrire, signer et payer en toute sécurité.",
    successAlreadyTitle: "E-mail déjà vérifié",
    successAlreadyText: "Cette adresse e-mail était déjà confirmée. Aucun changement nécessaire.",
    btnGoEspace: "Aller à mon espace client",
    expiredTitle: "Lien expiré",
    expiredText:
      "Ce lien de vérification a expiré (valable 72 h). Demandez un nouveau lien ci-dessous.",
    invalidTitle: "Lien invalide",
    invalidText:
      "Ce lien de vérification est invalide ou a déjà été utilisé. Demandez un nouveau lien ci-dessous.",
    noTokenTitle: "Vérification de votre e-mail",
    noTokenText:
      "Aucun lien de vérification n'est présent dans cette adresse. Si vous êtes connecté, vous pouvez demander l'envoi d'un nouveau lien.",
    btnLoginToResend: "Se connecter pour renvoyer le lien",
    networkKo: "Erreur réseau : l'API est inaccessible pour le moment.",
    metaTitle: "Vérification e-mail | FEDPAWA CORPORATE SOLUTIONS",
    metaDescription: "Confirmez votre adresse e-mail FEDPAWA pour débloquer la souscription, la signature et le paiement.",
  },
  en: {
    bannerTitle: "Email address not verified",
    bannerText:
      "Your email address has not been verified yet. Some actions (subscription, signature, payment, push notifications) are blocked until the email is confirmed.",
    btnVerifyNow: "Verify now",
    btnResend: "Resend the link",
    resendOk: "Verification email sent. Check your inbox (and spam folder).",
    resendWait: "A verification email was just sent — try again in {s} s.",
    resendKo: "Could not send the verification email right now.",
    resendNeedLogin: "Sign in to resend the verification link.",
    gateTitle: "Email verification required",
    gateText:
      "To complete your subscription, please confirm your email address first. Click the link sent to you by email, then come back here: your subscription will be waiting, untouched.",
    btnChecked: "I've verified my email",
    checking: "Checking…",
    pageLoading: "Verifying your link…",
    successTitle: "Email verified",
    successText: "Your email address is confirmed. You can now subscribe, sign and pay securely.",
    successAlreadyTitle: "Email already verified",
    successAlreadyText: "This email address was already confirmed. No action needed.",
    btnGoEspace: "Go to my client area",
    expiredTitle: "Link expired",
    expiredText: "This verification link has expired (valid for 72 h). Request a new one below.",
    invalidTitle: "Invalid link",
    invalidText: "This verification link is invalid or has already been used. Request a new one below.",
    noTokenTitle: "Verify your email",
    noTokenText:
      "No verification link is present in this address. If you are signed in, you can request a new link to be sent.",
    btnLoginToResend: "Sign in to resend the link",
    networkKo: "Network error: the API is unreachable right now.",
    metaTitle: "Email verification | FEDPAWA CORPORATE SOLUTIONS",
    metaDescription: "Confirm your FEDPAWA email address to unlock subscription, signature and payment.",
  },
};

export function verifTexts(locale: Locale): VerifTexts {
  return VERIF_TEXTS[locale] ?? VERIF_TEXTS.fr;
}

/** Type interne : statut déduit de /auth/me. */
export type VerificationStatus = "loading" | "anonymous" | "verified" | "unverified";

/** Déduit le statut depuis /auth/me (champ absent = vérifié, dégradation gracieuse). */
export function statusFromMe(me: MeResponse): VerificationStatus {
  if (!me.authenticated) return "anonymous";
  return me.email_verified === false ? "unverified" : "verified";
}
