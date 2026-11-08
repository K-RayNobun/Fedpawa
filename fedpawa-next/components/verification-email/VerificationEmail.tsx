// ==========================================================
// FEDPAWA — Page /verification-email (CONTRAT-VERIF, worker A)
// Lit ?token=, appelle automatiquement POST /api/v1/auth/verify-email
// au montage. 4 états rendus :
// - chargement ;
// - succès (200 verified:true — variante deja_verifie:true) ;
// - lien expiré (410 lien_expire) ;
// - lien invalide/déjà utilisé (400 lien_invalide).
// Sans token : variante « renvoyer le lien » (resend si connecté,
// sinon invitation à se connecter). Aucune fuite d'information :
// un token inconnu ne dit jamais si un compte existe.
// ==========================================================

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { apiErrorCode, verifTexts, verifyEmailToken } from "@/lib/verification";
import { useEmailVerification } from "@/components/verification/EmailVerificationProvider";
import { routesFor } from "@/lib/routes";
import type { Locale } from "@/lib/i18n";

type PageState =
  | { kind: "loading" }
  | { kind: "success"; dejaVerifie: boolean }
  | { kind: "expired" }
  | { kind: "invalid" }
  | { kind: "no-token" }
  | { kind: "network" };

export default function VerificationEmail({ locale = "fr" }: { locale?: Locale }) {
  const t = verifTexts(locale);
  const routes = routesFor(locale);
  const params = useSearchParams();
  const token = params.get("token")?.trim() ?? "";
  const [state, setState] = useState<PageState>({ kind: "loading" });
  const started = useRef(false);
  const { resend, resending, resendFeedback, clearResendFeedback, refresh, authenticated } =
    useEmailVerification();

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setState({ kind: "no-token" });
      return;
    }
    let cancelled = false;
    verifyEmailToken(token)
      .then((r) => {
        if (cancelled) return;
        // Un succès de vérification met à jour le store au prochain /me.
        void refresh();
        setState({ kind: "success", dejaVerifie: r.deja_verifie === true });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 410 && apiErrorCode(err) === "lien_expire") {
          setState({ kind: "expired" });
        } else if (
          err instanceof ApiError &&
          err.status === 400 &&
          apiErrorCode(err) === "lien_invalide"
        ) {
          setState({ kind: "invalid" });
        } else if (err instanceof ApiError && err.status === 0) {
          setState({ kind: "network" });
        } else {
          // Toute autre erreur sur un token = lien invalide (aucune
          // fuite : on ne distingue pas « inconnu » d'autre chose).
          setState({ kind: "invalid" });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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

  const canResend = getToken() !== null || authenticated;
  // next interne uniquement (garde anti open-redirect isSafeNextPath appliqué côté Auth).
  const loginHref = `${routes.auth}?next=${encodeURIComponent(routes.verificationEmail)}`;

  const renderResendBlock = () =>
    canResend ? (
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleResend}
        disabled={resending}
      >
        {t.btnResend}
      </button>
    ) : (
      <Link href={loginHref} className="btn btn-primary">
        {t.btnLoginToResend}
      </Link>
    );

  let body: React.ReactNode;
  switch (state.kind) {
    case "loading":
      body = (
        <>
          <div className="fp-verif-page-spinner" aria-hidden="true" />
          <h1>{t.pageLoading}</h1>
        </>
      );
      break;
    case "success":
      body = (
        <>
          <div className="fp-verif-page-icon fp-verif-ok" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1>{state.dejaVerifie ? t.successAlreadyTitle : t.successTitle}</h1>
          <p>{state.dejaVerifie ? t.successAlreadyText : t.successText}</p>
          <Link href={routes.espaceClient} className="btn btn-primary">
            {t.btnGoEspace}
          </Link>
        </>
      );
      break;
    case "expired":
      body = (
        <>
          <div className="fp-verif-page-icon fp-verif-warn" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1>{t.expiredTitle}</h1>
          <p>{t.expiredText}</p>
          {feedbackText && <p className={"fp-verif-page-feedback fp-verif-" + resendFeedback?.type}>{feedbackText}</p>}
          {renderResendBlock()}
        </>
      );
      break;
    case "invalid":
      body = (
        <>
          <div className="fp-verif-page-icon fp-verif-warn" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1>{t.invalidTitle}</h1>
          <p>{t.invalidText}</p>
          {feedbackText && <p className={"fp-verif-page-feedback fp-verif-" + resendFeedback?.type}>{feedbackText}</p>}
          {renderResendBlock()}
        </>
      );
      break;
    case "no-token":
      body = (
        <>
          <div className="fp-verif-page-icon fp-verif-info" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h1>{t.noTokenTitle}</h1>
          <p>{t.noTokenText}</p>
          {feedbackText && <p className={"fp-verif-page-feedback fp-verif-" + resendFeedback?.type}>{feedbackText}</p>}
          {renderResendBlock()}
        </>
      );
      break;
    case "network":
      body = (
        <>
          <div className="fp-verif-page-icon fp-verif-warn" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1>{t.networkKo}</h1>
        </>
      );
      break;
  }

  return (
    <div className="fp-verif-page" data-testid="verification-email-page">
      <div className="fp-verif-page-card">{body}</div>
    </div>
  );
}
