// ==========================================================
// FEDPAWA — VerificationGateModal (CONTRAT-VERIF, worker A)
// Modal BLOQUANTE non fermable sur les pages de souscription
// (/souscription-domiciliation, /tunnel-souscription — fr+en) :
// affichée SI authentifié ET email_verified=false (ou 403
// email_non_verifie intercepté → requestGate). Pas de croix,
// pas de clic extérieur, pas d'Échap : le contenu derrière reste
// rendu (grisé) pour une reprise fluide après vérification.
// Boutons : « Renvoyer le lien » (resend, 429 géré) et
// « J'ai vérifié mon e-mail » (re-appelle /auth/me → si true,
// la modal disparaît et la page reprend normalement).
// ==========================================================

"use client";

import { useEffect } from "react";
import { useEmailVerification } from "@/components/verification/EmailVerificationProvider";
import { verifTexts } from "@/lib/verification";
import type { Locale } from "@/lib/i18n";

export default function VerificationGateModal({ locale = "fr" }: { locale?: Locale }) {
  const t = verifTexts(locale);
  const {
    status,
    unverified,
    gateOpen,
    refresh,
    refreshing,
    resend,
    resending,
    resendFeedback,
    clearResendFeedback,
  } = useEmailVerification();

  const visible = status === "unverified" || (gateOpen && status !== "anonymous" && status !== "verified");

  // Pendant que la modal est visible : bloquer le scroll du contenu derrière.
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  // Non fermable : Échap ne fait rien (aucun handler de fermeture).
  if (!visible) return null;

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

  const handleChecked = async () => {
    // Re-lit /auth/me : si email_verified passe à true, le provider
    // repasse en "verified" et cette modal disparaît d'elle-même.
    await refresh();
  };

  return (
    <div
      className="fp-verif-gate"
      role="alertdialog"
      aria-modal="true"
      aria-label={t.gateTitle}
      data-testid="verification-gate"
      // Non fermable : AUCUN onClick de fermeture sur l'overlay.
    >
      <div className="fp-verif-gate-box" onClick={(e) => e.stopPropagation()}>
        <div className="fp-verif-gate-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2>{t.gateTitle}</h2>
        <p>{t.gateText}</p>
        {feedbackText && (
          <p className={"fp-verif-gate-feedback fp-verif-" + resendFeedback?.type}>
            {feedbackText}
          </p>
        )}
        <div className="fp-verif-gate-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleChecked}
            disabled={refreshing}
          >
            {refreshing ? t.checking : t.btnChecked}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleResend}
            disabled={resending}
          >
            {t.btnResend}
          </button>
        </div>
        {/* Pas de croix, pas de fermeture : la modal ne se ferme que
            quand /auth/me renvoie email_verified=true. */}
      </div>
    </div>
  );
}
