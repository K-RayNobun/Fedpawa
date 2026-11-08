// ==========================================================
// FEDPAWA — VerificationBanner (CONTRAT-VERIF, worker A)
// Bannière pleine largeur en HAUT de l'espace client (fr+en),
// visible SI ET SEULEMENT SI authentifié ET email_verified=false.
// Persistante et NON fermable tant que non vérifié ; disparaît
// dès que le statut passe à true (provider → /auth/me).
// ==========================================================

"use client";

import Link from "next/link";
import { useEmailVerification } from "@/components/verification/EmailVerificationProvider";
import { verifTexts } from "@/lib/verification";
import { routesFor } from "@/lib/routes";
import type { Locale } from "@/lib/i18n";

export default function VerificationBanner({ locale = "fr" }: { locale?: Locale }) {
  const t = verifTexts(locale);
  const routes = routesFor(locale);
  const { status, unverified, resend, resending, resendFeedback, clearResendFeedback } =
    useEmailVerification();

  if (status !== "unverified" || !unverified) return null;

  const feedbackText =
    resendFeedback == null
      ? null
      : resendFeedback.type === "success"
        ? t.resendOk
        : resendFeedback.type === "info"
          ? t.resendWait.replace("{s}", String(resendFeedback.retryAfter ?? "60"))
          : resendFeedback.text === "needLogin"
            ? t.resendNeedLogin
            : t.resendKo;

  const handleResend = async () => {
    clearResendFeedback();
    await resend();
  };

  return (
    <div
      className="fp-verif-banner"
      role="alert"
      data-testid="verification-banner"
    >
      <div className="fp-verif-banner-inner container">
        <svg
          className="fp-verif-banner-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        <div className="fp-verif-banner-text">
          <strong>{t.bannerTitle}</strong>
          <span>{t.bannerText}</span>
          {feedbackText && (
            <span className={"fp-verif-banner-feedback fp-verif-" + resendFeedback?.type}>
              {feedbackText}
            </span>
          )}
        </div>
        <div className="fp-verif-banner-actions">
          <Link href={routes.verificationEmail} className="btn btn-primary btn-sm">
            {t.btnVerifyNow}
          </Link>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleResend}
            disabled={resending}
          >
            {t.btnResend}
          </button>
        </div>
        {/* AUCUN bouton de fermeture : persistant tant que non vérifié. */}
      </div>
    </div>
  );
}
