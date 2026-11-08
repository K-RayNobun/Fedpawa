"use client";

// ==========================================================
// FEDPAWA — Mot de passe oublié : machine à 4 états
// (password-reset.js répliqué en React) :
// 1. Demande   → POST /api/v1/auth/password/forgot { email }
// 2. OTP       → POST /api/v1/auth/otp/verify { email, otp }
//    (timer 3 min + renvoi, auto-focus des 6 cases)
// 3. Nouveau   → POST /api/v1/auth/password/reset
//    { email, otp, mot_de_passe } (stateless BE: e-mail+otp
//    requis à chaque étape, pas de session de reset)
//    (jauge de force + checklist live)
// 4. Succès    → lien vers l'authentification
// Modale "mode pré-production" si mail_service=not_configured.
// ==========================================================

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { type Locale, getPageDictionary } from "@/lib/i18n";
import { apiPost, ApiError } from "@/lib/api";
import { routesFor } from "@/lib/routes";

export interface ForgotProps {
  locale?: Locale;
}

type Stage = "request" | "otp" | "newPwd" | "success";

interface Toast {
  message: string;
  type: "success" | "error";
}

const EYE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EYE_OFF = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const STRENGTH = {
  colors: ["#dc3545", "#ffc107", "#17a2b8", "#28a745"],
  widths: ["25%", "50%", "75%", "100%"],
};

export default function Forgot({ locale = "fr" }: ForgotProps) {
  const t = getPageDictionary(locale, "mot_de_passe_oublie");
  const routes = routesFor(locale);

  const [stage, setStage] = useState<Stage>("request");
  const [toast, setToast] = useState<Toast | null>(null);
  const [modal, setModal] = useState<{ title: string; message: string; btn: string } | null>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(179);
  const [canResend, setCanResend] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState({ newPwd: false, confirmPwd: false });
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Compte à rebours de renvoi (3 min), comme startOtpTimer().
  useEffect(() => {
    if (stage !== "otp") return;
    setCanResend(false);
    setOtpTimer(179);
    const interval = setInterval(() => {
      setOtpTimer((s) => {
        if (s <= 0) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  const timerText = () => {
    if (canResend) return t.otpCanResend;
    const m = Math.floor(otpTimer / 60);
    const s = otpTimer % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const catchErr = (err: unknown, fallback: string, networkMsg = t.toastNetwork) => {
    if (err instanceof ApiError && err.status > 0) {
      const b = err.body as { error?: string } | null;
      showToast(b?.error || fallback, "error");
    } else {
      showToast(networkMsg, "error");
    }
  };

  // ---- Étape 1 : demande du code ----
  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiPost<{ mail_service?: string; error?: string }>(
        "/api/v1/auth/password/forgot",
        { email },
      );
      if (data.mail_service === "not_configured") {
        setModal({
          title: t.preprodTitle,
          message: t.preprodMsg,
          btn: t.preprodBtn,
        });
      } else {
        showToast(t.toastCodeSent, "success");
      }
      setStage("otp");
    } catch (err) {
      catchErr(err, t.toastSendKo);
    } finally {
      setLoading(false);
    }
  }

  // ---- Renvoi du code ----
  async function handleResend(e: React.MouseEvent) {
    e.preventDefault();
    setCanResend(false);
    try {
      const data = await apiPost<{ mail_service?: string; error?: string }>(
        "/api/v1/auth/password/forgot",
        { email },
      );
      if (data.mail_service === "not_configured") {
        setModal({ title: t.resendModalTitle, message: t.resendModalMsg, btn: t.resendModalBtn });
      } else {
        showToast(t.toastCodeResent, "success");
      }
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      setStage("otp");
    } catch (err) {
      catchErr(err, t.toastResendKo);
      setCanResend(true);
    }
  }

  // ---- Auto-saut des cases OTP ----
  function handleOtpChange(i: number, v: string) {
    const digit = v.replace(/\D/g, "").slice(0, 1);
    setOtp((arr) => arr.map((x, j) => (j === i ? digit : x)));
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  }

  // ---- Étape 2 : vérification OTP (stateless : email + otp requis) ----
  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      showToast(t.toastInvalidCode, "error");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/api/v1/auth/otp/verify", { email, otp: code });
      setStage("newPwd");
    } catch (err) {
      catchErr(err, t.toastInvalidCode);
    } finally {
      setLoading(false);
    }
  }

  // ---- Force du mot de passe (jauge + checklist) ----
  const rules = {
    length: newPwd.length >= 8,
    upperLower: /[A-Z]/.test(newPwd) && /[a-z]/.test(newPwd),
    number: /[0-9]/.test(newPwd),
    special: /[@#$%^&*!]/.test(newPwd),
  };
  const strength = Number(rules.length) + Number(rules.upperLower) + Number(rules.number) + Number(rules.special);
  const strengthLabel = t["strength" + Math.max(strength, 1)] ?? t.strength1;

  // ---- Étape 3 : nouveau mot de passe (stateless : email + otp + mot_de_passe) ----
  async function handleNewPwd(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      showToast(t.toastMismatch, "error");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/api/v1/auth/password/reset", {
        email,
        otp: otp.join(""),
        mot_de_passe: newPwd,
      });
      setStage("success");
    } catch (err) {
      catchErr(err, t.toastResetKo);
    } finally {
      setLoading(false);
    }
  }

  const pwdToggle = (field: "newPwd" | "confirmPwd", inputId: string) => (
    <button
      type="button"
      className="pwd-toggle"
      aria-label="Toggle password visibility"
      onClick={() => setShowPwd((v) => ({ ...v, [field]: !v[field] }))}
    >
      {showPwd[field] ? EYE_OFF : EYE}
    </button>
  );

  return (
    <div className="auth-wrapper">
      {/* ============== VERSO VISUEL ============== */}
      <aside className="auth-visual">
        <Link href={routes.home} className="auth-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/images/logo.jpg"
            alt="Logo FEDPAWA Corporate Solutions"
            className="auth-brand-logo"
            width={48}
            height={48}
          />
          <span>
            <strong>FEDPAWA</strong>
            <small>Corporate Solutions</small>
          </span>
        </Link>
        <div className="auth-content">
          <h1 dangerouslySetInnerHTML={{ __html: t.heroTitle }} />
          <p>{t.heroDesc}</p>
          <ul className="auth-features">
            <li className="auth-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>{" "}
              {t.feat1}
            </li>
            <li className="auth-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>{" "}
              {t.feat2}
            </li>
            <li className="auth-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>{" "}
              {t.feat3}
            </li>
          </ul>
        </div>
        <div className="auth-footer-info">{t.copyright}</div>
      </aside>

      {/* ============== ÉTATS ============== */}
      <section className="auth-forms">
        <div className="form-container">
          {/* ---------- ÉTAT 1 : DEMANDE ---------- */}
          <div className={"reset-state" + (stage === "request" ? " active" : "")} id="state-request">
            <Link href={routes.auth} className="back-link">
              {t.backLogin}
            </Link>
            <div className="form-header">
              <h2>{t.reqTitle}</h2>
              <p>{t.reqText}</p>
            </div>
            <form id="requestForm" onSubmit={handleRequest}>
              <div className="form-group" id="emailInput">
                <label>{t.reqLabel}</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder={t.reqPlaceholder}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {t.reqButton}
              </button>
            </form>
            <p style={{ textAlign: "center", marginTop: 30, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              {t.troubleText}
              <br />
              <a
                href="https://wa.me/237691704802"
                style={{ fontWeight: 600, color: "var(--color-primary)" }}
              >
                {t.supportLink}
              </a>
            </p>
          </div>

          {/* ---------- ÉTAT 2 : OTP ---------- */}
          <div className={"reset-state" + (stage === "otp" ? " active" : "")} id="state-otp">
            <a
              href="#"
              className="back-link"
              onClick={(e) => {
                e.preventDefault();
                setStage("request");
              }}
            >
              {t.backEdit}
            </a>
            <div className="form-header">
              <h2>{t.otpTitle}</h2>
              <p>{t.otpText}</p>
            </div>
            <form id="otpForm" onSubmit={handleOtp}>
              <div className="otp-group">
                {otp.map((v, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    className="otp-input"
                    maxLength={1}
                    required
                    value={v}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                  />
                ))}
              </div>
              <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: 20 }}>
                {t.otpTimerLabel}
                <strong style={{ color: "var(--color-danger)" }}>{timerText()}</strong>
                <br />
                {canResend && (
                  <a
                    href="#"
                    id="resendLink"
                    style={{ color: "var(--color-primary)", fontWeight: 600 }}
                    onClick={handleResend}
                  >
                    {t.otpResend}
                  </a>
                )}
              </p>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {t.otpButton}
              </button>
            </form>
          </div>

          {/* ---------- ÉTAT 3 : NOUVEAU MOT DE PASSE ---------- */}
          <div className={"reset-state" + (stage === "newPwd" ? " active" : "")} id="state-new-pwd">
            <div className="form-header">
              <h2>{t.pwdTitle}</h2>
              <p>{t.pwdText}</p>
            </div>
            <form id="newPwdForm" onSubmit={handleNewPwd}>
              <div className="form-group">
                <label>{t.newPwdLabel}</label>
                <div className="pwd-input-wrapper">
                  <input
                    type={showPwd.newPwd ? "text" : "password"}
                    id="newPwd"
                    className="form-control"
                    required
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                  />
                  {pwdToggle("newPwd", "newPwd")}
                </div>
                <div className="pwd-strength-bar">
                  <div
                    className="pwd-strength-fill"
                    id="strengthFill"
                    style={{
                      width: newPwd ? STRENGTH.widths[strength - 1] || "100%" : "0%",
                      backgroundColor:
                        newPwd ? STRENGTH.colors[strength - 1] || "#28a745" : "transparent",
                    }}
                  />
                </div>
                <div
                  className="pwd-strength-text"
                  id="strengthText"
                  style={{
                    color: newPwd ? STRENGTH.colors[strength - 1] || "#28a745" : "inherit",
                  }}
                >
                  {newPwd ? strengthLabel : ""}
                </div>
              </div>

              <ul className="pwd-checklist">
                <li className={rules.length ? "valid" : ""}>{t.chk1}</li>
                <li className={rules.upperLower ? "valid" : ""}>{t.chk2}</li>
                <li className={rules.number ? "valid" : ""}>{t.chk3}</li>
                <li className={rules.special ? "valid" : ""}>{t.chk4}</li>
              </ul>

              <div className="form-group">
                <label>{t.confirmPwdLabel}</label>
                <div className="pwd-input-wrapper">
                  <input
                    type={showPwd.confirmPwd ? "text" : "password"}
                    id="confirmPwd"
                    className="form-control"
                    required
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                  />
                  {pwdToggle("confirmPwd", "confirmPwd")}
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {t.pwdUpdateButton}
              </button>
            </form>
          </div>

          {/* ---------- ÉTAT 4 : SUCCÈS ---------- */}
          <div className={"reset-state" + (stage === "success" ? " active" : "")} id="state-success">
            <div className="success-state">
              <div className="success-icon-large">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2>{t.okTitle}</h2>
              <p>{t.okText}</p>
              <Link
                href={routes.auth}
                className="btn btn-primary btn-block"
                style={{ marginTop: 30 }}
              >
                {t.okButton}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============== TOAST ============== */}
      {toast && (
        <div
          className={`auth-toast auth-toast-${toast.type}`}
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 99999,
            padding: "14px 20px",
            borderRadius: 8,
            color: "#fff",
            background: toast.type === "success" ? "#28a745" : "#dc3545",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontSize: "0.9rem",
          }}
          role="status"
        >
          {toast.message}
        </div>
      )}

      {/* ============== MODALE PRÉ-PRODUCTION ============== */}
      {modal && (
        <div
          className="fp-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setModal(null)}
        >
          <div
            className="fp-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              color: "#15294D",
              borderRadius: 12,
              padding: 28,
              maxWidth: 420,
              width: "90%",
              textAlign: "center",
            }}
          >
            <h3 style={{ marginTop: 0 }}>{modal.title}</h3>
            <p dangerouslySetInnerHTML={{ __html: modal.message }} />
            <button
              className="btn btn-primary btn-block"
              onClick={() => setModal(null)}
            >
              {modal.btn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
