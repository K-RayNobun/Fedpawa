"use client";

// ==========================================================
// FEDPAWA — Tunnel de paiement Mobile Money : réplication de
// fedpawa-pay.js en React (momoScreen, loginModal, getSession,
// flux contrat + signature OTP). Utilisé par la souscription
// domiciliation (contract=true).
// ==========================================================

import { useEffect, useState } from "react";
import { apiPost, ApiError } from "@/lib/api";
import { apiAuthGetBlob, apiAuthPost, setToken } from "@/lib/auth";
import { isEmailNonVerifieError } from "@/lib/verification";
import { useEmailVerification } from "@/components/verification/EmailVerificationProvider";

export interface PayModalConfig {
  label: string;
  priceFCFA: number;
  contract?: boolean;
  onSubmit: (pay: { phone: string; operator: string; price: number }) => Promise<{
    ok: boolean;
    message?: string;
    subscription_ref?: string | null;
    api?: Record<string, unknown>;
  }>;
  onSuccessCloseUrl: string;
  labels: Record<string, string>;
}

interface Session {
  authenticated: boolean;
}

type Screen =
  | { kind: "login" }
  | { kind: "momo" }
  | { kind: "verif"; sub: Record<string, unknown> }
  | { kind: "contract"; sub: Record<string, unknown>; payInfo: Record<string, unknown> }
  | { kind: "signed"; contratUrl?: string }
  | { kind: "simpleOk" }
  | { kind: "ok"; message?: string; ref?: string | null };

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

export default function PayModal({ config, onClose }: { config: PayModalConfig; onClose: () => void }) {
  const L = config.labels;
  const verif = useEmailVerification();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [loading, setLoading] = useState(false);
  const [momo, setMomo] = useState({ phone: "", operator: "" });
  const [login, setLogin] = useState({ email: "", pwd: "" });
  const [err, setErr] = useState("");
  const [otp, setOtp] = useState("");
  const [prevScreen, setPrevScreen] = useState<Screen | null>(null);

  // Garde de connexion : /api/v1/auth/me → sinon loginModal puis momoScreen.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await apiPost<Session>("/api/v1/auth/me", {});
        if (!cancelled) setScreen(session.authenticated ? { kind: "momo" } : { kind: "login" });
      } catch {
        // La source : /api/me renvoie { authenticated:false } (200) → login.
        // En erreur réseau/401 on affiche aussi le login.
        if (!cancelled) setScreen({ kind: "login" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Login inline (loginModal) — token Sanctum stocké (lib/auth.ts) ----
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const data = await apiPost<{ token?: string; error?: string }>(
        "/api/v1/auth/login",
        {
          email: login.email.trim(),
          mot_de_passe: login.pwd,
        },
      );
      if (data.token) setToken(data.token);
      setScreen({ kind: "momo" });
    } catch (error) {
      const b =
        error instanceof ApiError && error.status > 0
          ? ((error.body as Record<string, string | undefined>) ?? null)
          : null;
      setErr(b?.error || L.payLoginKo);
    } finally {
      setLoading(false);
    }
  }

  // ---- Écran MoMo : soumet onSubmit (crée la souscription) ----
  async function handleMomo(e: React.FormEvent) {
    e.preventDefault();
    if (!momo.operator) {
      setErr(L.payChooseOp);
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const res = await config.onSubmit({
        phone: momo.phone.trim(),
        operator: momo.operator,
        price: config.priceFCFA,
      });
      if (res.ok && res.api) {
        // Flux contrat (domiciliation) : écran "vérifier paiement".
        setPrevScreen({ kind: "momo" });
        setScreen({ kind: "verif", sub: res.api });
      } else if (res.ok) {
        setScreen({ kind: "ok", message: res.message, ref: res.subscription_ref });
      } else {
        setErr(res.message || L.payKo);
      }
    } catch {
      setErr(L.payNetworkKo);
    } finally {
      setLoading(false);
    }
  }

  // ---- Vérification du paiement : POST /api/v1/paiement/verifier ----
  async function handleVerify() {
    const sub = (screen as { sub?: Record<string, unknown> }).sub ?? {};
    setLoading(true);
    setErr("");
    try {
      const data = await apiAuthPost<{ status?: string; error?: string; message?: string }>(
        "/api/v1/paiement/verifier",
        { sub_id: sub.subscription_id },
      );
      if (data.status === "error" || data.error) {
        setErr(data.error || data.message || L.payVerifKo);
        setLoading(false);
        return;
      }
      if (data.status !== "paid") {
        setErr(L.payVerifNotPaid);
        setLoading(false);
        return;
      }
      if (config.contract === false) {
        setScreen({ kind: "simpleOk" });
      } else {
        setScreen({ kind: "contract", sub, payInfo: data });
      }
    } catch (err) {
      // 403 email_non_verifie intercepté → ré-affiche la modal bloquante.
      if (isEmailNonVerifieError(err)) {
        verif.requestGate();
        void verif.refresh();
        setErr((err as ApiError).message);
      } else {
        setErr(L.payVerifKo);
      }
    } finally {
      setLoading(false);
    }
  }

  // ---- Aperçu du contrat (audit #3) : GET /api/v1/contract/preview ----
  // L'ancien window.open('/api/contract/preview') tapait le serveur Next
  // (ni /v1 ni origine API) → 404. On passe par apiAuthGetBlob (Bearer +
  // API_BASE_URL), puis object URL ouverte dans un nouvel onglet.
  async function handlePreviewContract() {
    const sid = sub.subscription_id ?? sub.id;
    if (!sid) return;
    setLoading(true);
    setErr("");
    try {
      const blob = await apiAuthGetBlob(
        `/api/v1/contract/preview?subscription_id=${encodeURIComponent(String(sid))}`,
      );
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank", "noopener");
      // Laisser au navigateur le temps d'ouvrir l'onglet avant la libération.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch {
      setErr(L.payPreviewKo || "Aperçu indisponible (session expirée ou document absent).");
    } finally {
      setLoading(false);
    }
  }

  // ---- Signature OTP : POST /api/v1/signature ----
  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    const s = screen as { sub?: Record<string, unknown> };
    const sub = s.sub ?? {};
    setLoading(true);
    setErr("");
    try {
      const data = await apiAuthPost<{ error?: string; contrat_url?: string }>(
        "/api/v1/signature",
        { sub_id: sub.subscription_id, client_id: sub.client_id, otp: otp.trim() },
      );
      if (data.error) {
        setErr(data.error || L.paySignKo);
        setLoading(false);
        return;
      }
      setScreen({ kind: "signed", contratUrl: data.contrat_url });
    } catch (err) {
      // 403 email_non_verifie intercepté → ré-affiche la modal bloquante.
      if (isEmailNonVerifieError(err)) {
        verif.requestGate();
        void verif.refresh();
        setErr((err as ApiError).message);
      } else {
        setErr(L.paySignKo);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!screen) {
    return (
      <div className="fp-modal-overlay" style={overlayStyle}>
        <div className="fp-modal">{L.payProcessing}</div>
      </div>
    );
  }

  const sub =
    "sub" in screen ? ((screen as { sub?: Record<string, unknown> }).sub ?? {}) : {};

  return (
    <div className="fp-modal-overlay" style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fp-modal pay-momo-modal" style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* ---------- LOGIN ---------- */}
        {screen.kind === "login" && (
          <>
            <h3 style={{ marginTop: 0 }}>{L.payLoginTitle}</h3>
            <p style={{ fontSize: "0.9rem", opacity: 0.85 }}>{L.payLoginText}</p>
            <form onSubmit={handleLogin}>
              <div className="pay-field" style={fieldStyle}>
                <label>{L.payLoginEmail}</label>
                <input
                  type="email"
                  className="form-control"
                  required
                  placeholder="vous@entreprise.com"
                  value={login.email}
                  onChange={(e) => setLogin((s) => ({ ...s, email: e.target.value }))}
                />
              </div>
              <div className="pay-field" style={fieldStyle}>
                <label>{L.payLoginPwd}</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  placeholder="••••••••"
                  value={login.pwd}
                  onChange={(e) => setLogin((s) => ({ ...s, pwd: e.target.value }))}
                />
              </div>
              {err && <div className="pay-login-err" style={errStyle}>{err}</div>}
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {L.payLoginBtn}
              </button>
              <div className="pay-login-alt" style={altStyle}>
                {L.payLoginAlt}{" "}
                <a href="/authentification">{L.payLoginAltLink}</a>
              </div>
              <div style={{ ...altStyle, marginTop: 8 }}>
                <a href="/mot-de-passe-oublie" style={{ fontSize: "0.8rem" }}>
                  {L.payLoginForgot}
                </a>
              </div>
            </form>
          </>
        )}

        {/* ---------- MOMO ---------- */}
        {screen.kind === "momo" && (
          <>
            <div className="pay-momo-head" style={{ textAlign: "center", marginBottom: 16 }}>
              <div className="pay-momo-amount" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                {fmt(config.priceFCFA)}
              </div>
              <div className="pay-momo-desc" style={{ opacity: 0.85 }}>{config.label}</div>
            </div>
            <form onSubmit={handleMomo}>
              <div className="pay-field" style={fieldStyle}>
                <label>{L.payPhoneLabel} *</label>
                <input
                  type="tel"
                  className="form-control"
                  required
                  placeholder="+237 6XX XX XX XX"
                  value={momo.phone}
                  onChange={(e) => setMomo((s) => ({ ...s, phone: e.target.value }))}
                />
              </div>
              <div className="pay-momo-operators" style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                {[
                  { v: "orange", l: L.payOrange },
                  { v: "mtn", l: L.payMtn },
                ].map((op) => (
                  <label
                    key={op.v}
                    className="pay-op-pill"
                    style={{
                      flex: 1,
                      cursor: "pointer",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: momo.operator === op.v ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                      textAlign: "center",
                    }}
                  >
                    <input
                      type="radio"
                      name="payOp"
                      style={{ display: "none" }}
                      checked={momo.operator === op.v}
                      onChange={() => setMomo((s) => ({ ...s, operator: op.v }))}
                    />
                    {op.l}
                  </label>
                ))}
              </div>
              <div className="pay-momo-note" style={noteStyle}>{L.payNote}</div>
              {err && <div className="pay-momo-err" style={errStyle}>{err}</div>}
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? L.payProcessing : `${L.payBtn} ${fmt(config.priceFCFA)}`}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-block"
                style={{ marginTop: 8 }}
                onClick={onClose}
              >
                {L.payCancel}
              </button>
            </form>
          </>
        )}

        {/* ---------- VÉRIFICATION PAIEMENT ---------- */}
        {screen.kind === "verif" && (
          <>
            <h3 style={{ marginTop: 0, textAlign: "center" }}>{L.payVerifTitle}</h3>
            <div style={{ textAlign: "center", fontSize: "1.3rem", fontWeight: 700, margin: "8px 0" }}>
              {fmt(config.priceFCFA)}
            </div>
            <div style={{ textAlign: "center", opacity: 0.85, marginBottom: 12 }}>
              {L.payVerifRef}{" "}
              <strong>
                {String(
                  sub.subscription_ref ||
                    sub.transaction_id ||
                    "SUB-" + String(sub.subscription_id ?? "-"),
                )}
              </strong>
            </div>
            <div className="pay-momo-note" style={noteStyle}>{L.payVerifNote}</div>
            {err && <div className="pay-momo-err" style={errStyle}>{err}</div>}
            <button className="btn btn-primary btn-block" disabled={loading} onClick={handleVerify}>
              {loading ? L.payVerifPending : L.payVerifBtn}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-block"
              style={{ marginTop: 8 }}
              onClick={onClose}
            >
              {L.payVerifLater}
            </button>
          </>
        )}

        {/* ---------- CONTRAT + SIGNATURE OTP ---------- */}
        {screen.kind === "contract" && (
          <>
            <h3 style={{ marginTop: 0, textAlign: "center" }}>{L.payContractTitle}</h3>
            <div style={{ textAlign: "center", fontSize: "1.3rem", fontWeight: 700, margin: "8px 0" }}>
              {fmt(config.priceFCFA)}
            </div>
            <div
              className="contract-doc"
              style={{
                maxHeight: "42vh",
                overflow: "hidden",
                position: "relative",
                border: "1px solid var(--color-border,#ddd)",
                borderRadius: 10,
                padding: "18px 20px 34px",
                margin: "10px 0",
                fontSize: "0.8rem",
                lineHeight: 1.6,
                background: "#fdfcf9",
                color: "#15294D",
              }}
            >
              <div style={{ textAlign: "center", borderBottom: "2px solid #b08d57", paddingBottom: 8, marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: "0.92rem", letterSpacing: ".08em" }}>
                  {L.payContractDocTitle}
                </div>
                <div style={{ fontSize: "0.66rem", color: "#5a6472", marginTop: 3 }}>
                  {L.payContractDocSub}
                </div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  margin: "6px 0 10px",
                  textTransform: "uppercase",
                }}
              >
                {L.payContractDocHead}
              </div>
              <p style={{ margin: "0 0 6px", textAlign: "justify" }}>
                <strong>{L.payContractBetween}</strong> {L.payContractCompany}
              </p>
              <p style={{ margin: "0 0 8px", textAlign: "justify" }}>
                {L.payContractAnd} <strong>{String(sub.client_name || "Client")}</strong>{" "}
                {L.payContractClient}
              </p>
              <p style={{ margin: "0 0 6px", textAlign: "justify" }}>
                <strong>{L.payContractObjetLabel}</strong> {L.payContractObjet}
              </p>
              <p style={{ margin: "0 0 6px" }}>
                <strong>{L.payContractFormule}</strong> {config.label}
              </p>
              <p style={{ margin: "0 0 6px" }}>
                <strong>{L.payContractMontant}</strong> {fmt(config.priceFCFA)}{" "}
                {L.payContractPaidBy}{" "}
                {String((screen.payInfo as { transaction_id?: string }).transaction_id || "-")}).
              </p>
              <p style={{ margin: 0 }}>
                <strong>{L.payContractFait}</strong>{" "}
                {new Date().toLocaleDateString("fr-FR")}.
              </p>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: "8px 12px",
                  background: "linear-gradient(180deg, rgba(253,252,249,0) 0%, #fdfcf9 55%)",
                  textAlign: "center",
                  fontSize: "0.72rem",
                  color: "#8a8474",
                }}
              >
                {L.payContractMore}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ marginBottom: 10 }}
              onClick={handlePreviewContract}
              disabled={loading}
            >
              {loading ? L.payProcessing : L.payViewContract}
            </button>
            <div className="pay-momo-note" style={noteStyle}>{L.paySignNote}</div>
            <form onSubmit={handleSign}>
              <div className="pay-field" style={fieldStyle}>
                <label>{L.payOtpLabel}</label>
                <input
                  type="text"
                  className="form-control"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              {err && <div className="pay-momo-err" style={errStyle}>{err}</div>}
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? L.paySigning : L.paySignBtn}
              </button>
            </form>
          </>
        )}

        {/* ---------- SIGNÉ ---------- */}
        {screen.kind === "signed" && (
          <>
            <h3 style={{ marginTop: 0, textAlign: "center" }}>{L.paySignedTitle}</h3>
            <p style={{ fontSize: "0.92rem", opacity: 0.85 }}>{L.paySignedText}</p>
            {screen.contratUrl && (
              <a
                href={screen.contratUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-block"
                style={{ marginBottom: 8 }}
              >
                {L.payDownload}
              </a>
            )}
            <a href={config.onSuccessCloseUrl} className="btn btn-outline btn-block">
              {L.payGoClient}
            </a>
          </>
        )}

        {/* ---------- OK SIMPLE (autres services) ---------- */}
        {screen.kind === "simpleOk" && (
          <>
            <h3 style={{ marginTop: 0, textAlign: "center" }}>✅ {L.payVerifBtn}</h3>
            <a href={config.onSuccessCloseUrl} className="btn btn-primary btn-block">
              {L.payGoClient}
            </a>
          </>
        )}

        {/* ---------- OK AVEC RÉFÉRENCE ---------- */}
        {screen.kind === "ok" && (
          <>
            <h3 style={{ marginTop: 0, textAlign: "center" }}>✅ {L.successTitle}</h3>
            <p style={{ fontSize: "0.92rem", opacity: 0.85 }}>
              {screen.message}
              {screen.ref && (
                <>
                  <br />
                  <small>
                    {L.payVerifRef} <strong>{screen.ref}</strong>
                  </small>
                </>
              )}
            </p>
            <a href={config.onSuccessCloseUrl} className="btn btn-primary btn-block">
              {L.payGoClient}
            </a>
          </>
        )}
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(8,12,24,0.55)",
  backdropFilter: "blur(2px)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const modalStyle: React.CSSProperties = {
  background: "var(--color-bg-main, #fff)",
  color: "var(--color-heading, #15294D)",
  borderRadius: 14,
  maxWidth: 520,
  width: "100%",
  padding: 28,
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  border: "1px solid var(--color-border, #ddd)",
  maxHeight: "90vh",
  overflowY: "auto",
};

const fieldStyle: React.CSSProperties = { marginBottom: 14 };
const errStyle: React.CSSProperties = {
  color: "#dc3545",
  fontSize: "0.88rem",
  marginBottom: 12,
};
const noteStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  opacity: 0.8,
  background: "rgba(176,141,87,0.12)",
  border: "1px solid rgba(176,141,87,0.4)",
  borderRadius: 8,
  padding: 12,
  marginBottom: 14,
};
const altStyle: React.CSSProperties = {
  textAlign: "center",
  fontSize: "0.85rem",
  marginTop: 12,
  opacity: 0.85,
};
