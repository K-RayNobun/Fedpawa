"use client";

// ==========================================================
// FEDPAWA — Souscription Domiciliation : wizard 6 étapes
// (souscription_domiciliation.js répliqué en React).
// - Stepper avec validation par étape (domNext/goToStep)
// - Smart-detection "pas encore immatriculé" → modale
// - Forme juridique "Autre" conditionnelle
// - Gammes/packs dynamiques + détail pack + sidebar récap
// - Dropzones KYC (3 fichiers) — upload différé côté serveur
// - 3 validations obligatoires section 6
// - Étape facturation : proforma (total = montant exact, sans TVA) + PayModal
//   (fedpawa-pay répliqué) → POST /api/v1/souscription puis
//   /api/v1/paiement/verifier puis /api/v1/signature.
// ==========================================================

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { type Locale, getPageDictionary } from "@/lib/i18n";
import { ApiError } from "@/lib/api";
import { apiAuthPost, fetchMe } from "@/lib/auth";
import { emailNonVerifieMessage, isEmailNonVerifieError } from "@/lib/verification";
import { useEmailVerification } from "@/components/verification/EmailVerificationProvider";
import { routesFor } from "@/lib/routes";
import PayModal from "./PayModal";
import {
  PACKS,
  PACK_DETAILS,
  EXTRA_OPTIONS,
  PERIODICITES,
  fmtFCFA,
  COUNTRIES,
  SECTEURS,
  FORMES_JURIDIQUES,
  FONCTIONS,
  TYPES_PIECE,
} from "./plans";

export interface SouscriptionProps {
  locale?: Locale;
}

type Gamme = "nationale" | "internationale";

interface SouscriptionState {
  statutStructure: "existante" | "creation";
  denomination: string;
  formeJuridique: string;
  formeAutre: string;
  rccm: string;
  niu: string;
  noImmat: boolean;
  secteur: string;
  description: string;
  civilite: string;
  nomComplet: string;
  fonction: string;
  nationalite: string;
  typePiece: string;
  numPiece: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  pays: string;
  gamme: Gamme;
  pack: string;
  periodicite: string;
  options: string[];
  files: { identite?: File; statuts?: File; domicile?: File };
  chkCgv: boolean;
  chkCadre: boolean;
  chkExactitude: boolean;
}

const INITIAL: SouscriptionState = {
  statutStructure: "existante",
  denomination: "",
  formeJuridique: "",
  formeAutre: "",
  rccm: "",
  niu: "",
  noImmat: false,
  secteur: "",
  description: "",
  civilite: "",
  nomComplet: "",
  fonction: "",
  nationalite: "",
  typePiece: "",
  numPiece: "",
  email: "",
  telephone: "",
  adresse: "",
  ville: "",
  pays: "Cameroun",
  gamme: "nationale",
  pack: "",
  periodicite: "mensuel",
  options: [],
  files: {},
  chkCgv: false,
  chkCadre: false,
  chkExactitude: false,
};

const TOTAL_STEPS = 6;

export default function Souscription({ locale = "fr" }: SouscriptionProps) {
  const t = getPageDictionary(locale, "souscription_domiciliation");
  const routes = routesFor(locale);
  const verif = useEmailVerification();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SouscriptionState>(INITIAL);
  const [errors, setErrors] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [smartModal, setSmartModal] = useState<"closed" | "open" | "blocked">("closed");
  const [showPayModal, setShowPayModal] = useState(false);
  const [kycDone, setKycDone] = useState<string | null>(null); // statut KYC si déjà fourni
  const [dragOver, setDragOver] = useState<string | null>(null);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  const set = <K extends keyof SouscriptionState>(key: K, value: SouscriptionState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Pré-sélection depuis l'URL (?pack=national-premium) — cf. init du JS source.
  useEffect(() => {
    const urlPack = new URLSearchParams(window.location.search).get("pack");
    if (urlPack && (urlPack.startsWith("national-") || urlPack.startsWith("international-"))) {
      const g: Gamme = urlPack.startsWith("national-") ? "nationale" : "internationale";
      setForm((f) => ({ ...f, gamme: g, pack: urlPack }));
    }
    // SKIP KYC si déjà fait dans l'espace client (GET /api/v1/auth/me → kyc_status).
    (async () => {
      try {
        // fetchMe = GET + Bearer (l'ancien POST non authentifié était rejeté
        // par une route GET et n'envoyait pas le token).
        const me = await fetchMe();
        if (me && me.authenticated && me.kyc_status) setKycDone(me.kyc_status);
      } catch {
        /* dégradation : étape KYC normale */
      }
    })();
  }, []);

  // Naviguer revient en haut (showStep → window.scrollTo).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const enCreation = form.statutStructure === "creation";
  const isAutre = form.formeJuridique === "Autre (précisez)";

  const currentPack = useMemo(() => {
    const g = PACKS[form.gamme];
    return g.find((p) => p.value === form.pack) ?? null;
  }, [form.gamme, form.pack]);

  const months = PERIODICITES[form.periodicite]?.months ?? 1;
  const total = currentPack ? currentPack.price * months : 0;

  // ---------- Validation par étape (validateStep) ----------
  function validateStep(n: number): string[] {
    const errs: string[] = [];
    const required =
      (s: string) => !s.trim() && errs.push(t.errRequired);
    if (n === 1) {
      required(form.denomination);
      if (!form.formeJuridique) errs.push(t.errRequired);
      if (isAutre) required(form.formeAutre);
      if (!enCreation) {
        required(form.rccm);
        required(form.niu);
      }
      if (!form.secteur) errs.push(t.errRequired);
      required(form.description);
    } else if (n === 2) {
      if (!form.civilite) errs.push(t.errRequired);
      required(form.nomComplet);
      if (!form.fonction) errs.push(t.errRequired);
      required(form.nationalite);
      if (!form.typePiece) errs.push(t.errRequired);
      required(form.numPiece);
    } else if (n === 3) {
      required(form.email);
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.push(t.errEmail);
      required(form.telephone);
      if (form.telephone && !/^\+?[0-9\s]{9,16}$/.test(form.telephone)) errs.push(t.errPhone);
      required(form.adresse);
      required(form.ville);
      if (!form.pays) errs.push(t.errRequired);
    } else if (n === 4) {
      if (!form.pack) errs.push(t.errPackMissing);
    } else if (n === 5) {
      if (!kycDone) {
        if (!form.files.identite) errs.push(t.errIdentite);
        if (!form.files.statuts) errs.push(t.errStatuts);
      }
    }
    return [...new Set(errs)];
  }

  function domNext() {
    const errs = validateStep(step);
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    if (step < TOTAL_STEPS) setStep(step + 1);
  }

  function goToStep(n: number) {
    if (n >= 1 && n <= TOTAL_STEPS) setStep(n);
  }

  // ---------- Smart-detection ----------
  function handleNoImmat(checked: boolean) {
    set("noImmat", checked);
    if (checked) setSmartModal("open");
  }

  // ---------- Validation finale (validate) ----------
  function validateFinal(): string[] {
    const errs = validateStep(1)
      .concat(validateStep(2))
      .concat(validateStep(3))
      .concat(validateStep(4))
      .concat(validateStep(5));
    if (!form.chkCgv || !form.chkCadre || !form.chkExactitude) errs.push(t.errValidations);
    return [...new Set(errs)];
  }

  // ---------- Submit : passe à la facturation (étape 6) ----------
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.noImmat) {
      // Blocage réel : case "pas encore immatriculé" cochée.
      setErrors([t.smartNoText]);
      return;
    }
    const errs = validateFinal();
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    goToStep(6);
  }

  // ---------- Facture proforma ----------
  // Date de facture calculée côté client uniquement (prerender-safe :
  // new Date() est interdit au rendu statique des Client Components).
  const [invoice, setInvoice] = useState<{ dateStr: string; num: string } | null>(null);
  useEffect(() => {
    const now = new Date();
    setInvoice({
      dateStr: now.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      num: "F-" + now.getFullYear() + "-" + String(now.getTime()).slice(-6),
    });
  }, [step]);
  const periodLabel = PERIODICITES[form.periodicite]
    ? t[PERIODICITES[form.periodicite].key]
    : t.perMonth;
  const packLabel = currentPack ? currentPack.label.split("—")[0].trim() : t.invoiceDomiciliation;

  // ---------- Paiement (PayModal onSubmit → POST /api/v1/souscription) ----------
  async function submitSouscription(pay: { phone: string; operator: string }) {
    // Blocage client si e-mail non vérifié (le serveur renvoie de toute
    // façon 403 email_non_verifie) : ré-affiche la modal bloquante.
    if (verif.unverified) {
      verif.requestGate();
      return { ok: false, message: emailNonVerifieMessage(locale) };
    }
    try {
      const out = await apiAuthPost<{
        message?: string;
        error?: string;
        status?: string;
        subscription_ref?: string;
        subscription_id?: number;
        client_id?: number;
        client_name?: string;
        signature_otp?: string;
      }>("/api/v1/souscription", {
        service: "domiciliation",
        pack: form.pack,
        plan: form.pack,
        nom: form.nomComplet,
        name: form.nomComplet,
        planLabel: currentPack?.label ?? "",
        prix: total,
        periodicite: form.periodicite,
        paymentMethod: "momo",
        momo_phone: pay.phone,
        momo_operator: pay.operator,
        email: form.email,
        telephone: form.telephone || pay.phone,
        denom: form.denomination,
        entreprise: form.denomination,
        rccm: form.rccm,
        niu: form.niu,
        adresse: form.adresse,
        representant: form.nomComplet,
        civilite: form.civilite,
        fonction: form.fonction,
        nationalite: form.nationalite,
        type_piece: form.typePiece,
        num_piece: form.numPiece,
        ville: form.ville,
        pays: form.pays,
        secteur: form.secteur,
        description: form.description,
        forme_juridique: form.formeJuridique,
        statut_structure: form.statutStructure,
        options: form.options,
      });
      if (out.status === "error" || out.error) {
        return { ok: false, message: out.message || out.error };
      }
      return {
        ok: true,
        message: out.message || t.successTitle,
        subscription_ref: out.subscription_ref ?? null,
        api: out,
      };
    } catch (err) {
      if (isEmailNonVerifieError(err)) {
        // 403 email_non_verifie intercepté → ré-affiche la modal + re-lit /me.
        verif.requestGate();
        void verif.refresh();
        return { ok: false, message: emailNonVerifieMessage(locale) };
      }
      if (err instanceof ApiError) {
        return { ok: false, message: getFriendlyErrorMessage(err, "souscription") };
      }
      return { ok: false, message: t.payNetworkKo };
    }
  }

  // ---------- Dropzone ----------
  function Dropzone({ id, title, hint, accept, required }: {
    id: "identite" | "statuts" | "domicile";
    title: string;
    hint: string;
    accept: string;
    required?: boolean;
  }) {
    const file = form.files[id];
    return (
      <div
        className={"dropzone" + (required ? " required" : "") + (file ? " has-file" : "") + (dragOver === id ? " drag-over" : "")}
        onClick={() => document.getElementById("dz-file-" + id)?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(id);
        }}
        onDragLeave={() => setDragOver(null)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(null);
          if (e.dataTransfer.files.length) set("files", { ...form.files, [id]: e.dataTransfer.files[0] });
        }}
        style={{ cursor: "pointer" }}
      >
        <svg className="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <h5>
          {title} {required && <em className="req">*</em>}
        </h5>
        <p>{hint}</p>
        <span className="dz-filename">
          {file ? `📄 ${file.name} (${Math.round(file.size / 1024)} Ko)` : ""}
        </span>
        <input
          id={"dz-file-" + id}
          type="file"
          hidden
          accept={accept}
          onChange={(e) => {
            if (e.target.files?.length) set("files", { ...form.files, [id]: e.target.files[0] });
          }}
        />
      </div>
    );
  }

  const stepLabels = [t.step1, t.step2, t.step3, t.step4, t.step5, t.step6];

  return (
    <>
      {/* ============== STEPPER ============== */}
      <div className="progress-wrapper" id="domStepper">
        <div className="container">
          <div className="dom-step-mobile" id="domStepMobile">
            <div className="dom-step-mobile-txt">
              <span id="domStepCount">
                {t.stepLabel} {step}/{TOTAL_STEPS}
              </span>
              <strong id="domStepTitle">{stepLabels[step - 1]}</strong>
            </div>
            <div className="dom-step-mobile-bar">
              <div
                className="dom-step-mobile-fill"
                id="domStepFill"
                style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
              />
            </div>
          </div>
          <div className="progress-container">
            <div className="progress-line">
              <div
                className="progress-line-fill"
                id="progressFill"
                style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
              />
            </div>
            {stepLabels.map((label, i) => {
              const n = i + 1;
              return (
                <div
                  key={n}
                  className={
                    "progress-step" + (n === step ? " active" : n < step ? " completed" : "")
                  }
                  data-step={n}
                  onClick={() => n < step && goToStep(n)}
                  style={{ cursor: n < step ? "pointer" : "default" }}
                >
                  <div className="progress-dot">{n}</div>
                  <span className="progress-label">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: "32px 16px 64px" }}>
        <div className="tunnel-layout-v2">
          {/* ============== FORMULAIRE ============== */}
          <div
            className="tunnel-card"
            style={{ padding: 40, boxShadow: "none", border: "1px solid var(--color-border)" }}
            id="souscriptionForm"
          >
            {showSuccess ? (
              /* ---------- ÉCRAN DE SUCCÈS ---------- */
              <div id="form-success" style={{ textAlign: "center", padding: "60px 20px" }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    margin: "0 auto 24px",
                    borderRadius: "50%",
                    background: "var(--color-primary)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <svg viewBox="0 0 24 24" width={40} height={40} fill="none" stroke="#fff" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 style={{ fontSize: "1.5rem", marginBottom: 12 }}>{t.successTitle}</h2>
                <p style={{ color: "var(--color-text-muted)", maxWidth: 480, margin: "0 auto 8px" }}>
                  {t.successText1} <strong>{form.nomComplet || "client"}</strong>
                  {t.successText1End}
                </p>
                <p style={{ color: "var(--color-text-muted)", maxWidth: 480, margin: "0 auto 24px" }}>
                  {t.successText2.replace(t.success24h, "")}
                  <strong>{t.success24h}</strong>
                  {t.successText2.split(t.success24h)[1] ?? ""}
                </p>
                <Link href={routes.home} className="btn btn-outline">
                  {t.btnHome}
                </Link>
              </div>
            ) : (
              <>
                <div className="step-header" style={{ marginBottom: 28 }}>
                  <h1 style={{ fontSize: "1.6rem", color: "var(--color-surface, #fff)" }}>
                    {t.formTitle}
                  </h1>
                  <p style={{ fontSize: "1rem", color: "var(--color-gold, #D4AF37)", fontWeight: 600 }}>
                    {t.formSubtitle}
                  </p>
                </div>

                <form id="domiciliationForm" onSubmit={handleSubmit} noValidate>
                  {/* ---------- ÉTAPE 1 : ENTREPRISE ---------- */}
                  <div
                    className={"tunnel-step-content" + (step === 1 ? " active" : "")}
                    data-step="1"
                  >
                    <section className="form-section">
                      <h2 className="form-section-title">
                        <span className="form-section-num">1</span> {t.s1Title}
                      </h2>
                      <div className="form-group">
                        <label>
                          {t.statutLabel} <em className="req">*</em>
                        </label>
                        <div className="radio-row">
                          <label className="radio-pill">
                            <input
                              type="radio"
                              name="statut_structure"
                              value="existante"
                              checked={form.statutStructure === "existante"}
                              onChange={() => set("statutStructure", "existante")}
                            />{" "}
                            {t.statutExistante}
                          </label>
                          <label className="radio-pill">
                            <input
                              type="radio"
                              name="statut_structure"
                              value="creation"
                              checked={form.statutStructure === "creation"}
                              onChange={() => set("statutStructure", "creation")}
                            />{" "}
                            {t.statutCreation}
                          </label>
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="denomination">
                          {t.denominationLabel} <em className="req">*</em>
                        </label>
                        <input
                          type="text"
                          id="denomination"
                          className="form-control"
                          required
                          placeholder={t.denominationPh}
                          value={form.denomination}
                          onChange={(e) => set("denomination", e.target.value)}
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="forme_juridique">
                            {t.formeLabel} <em className="req">*</em>
                          </label>
                          <select
                            id="forme_juridique"
                            className="form-control"
                            required
                            value={form.formeJuridique}
                            onChange={(e) => set("formeJuridique", e.target.value)}
                          >
                            <option value="">{t.selectPlaceholder}</option>
                            {FORMES_JURIDIQUES.map((f) => (
                              <option key={f}>{f}</option>
                            ))}
                          </select>
                        </div>
                        {isAutre && (
                          <div className="form-group" id="forme-autre-group">
                            <label htmlFor="forme_autre">{t.formeAutreLabel}</label>
                            <input
                              type="text"
                              id="forme_autre"
                              className="form-control"
                              placeholder={t.formeAutrePh}
                              value={form.formeAutre}
                              onChange={(e) => set("formeAutre", e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="rccm">
                            {t.rccmLabel}{" "}
                            <em className="req" style={enCreation ? { display: "none" } : undefined}>
                              *
                            </em>
                          </label>
                          <input
                            type="text"
                            id="rccm"
                            className="form-control"
                            required={!enCreation}
                            placeholder={enCreation ? t.rccmCreatingPh : t.rccmPh}
                            value={form.rccm}
                            onChange={(e) => set("rccm", e.target.value)}
                          />
                          <small className="field-hint">{t.rccmHint}</small>
                        </div>
                        <div className="form-group">
                          <label htmlFor="niu">
                            {t.niuLabel}{" "}
                            <em className="req" style={enCreation ? { display: "none" } : undefined}>
                              *
                            </em>
                          </label>
                          <input
                            type="text"
                            id="niu"
                            className="form-control"
                            required={!enCreation}
                            placeholder={enCreation ? t.rccmCreatingPh : t.niuPh}
                            value={form.niu}
                            onChange={(e) => set("niu", e.target.value)}
                          />
                          <small className="field-hint">{t.rccmHint}</small>
                        </div>
                        <div
                          className="form-group"
                          style={{
                            background: "var(--color-bg-alt)",
                            padding: "12px 14px",
                            borderRadius: 8,
                            border: "1px dashed var(--color-border)",
                          }}
                        >
                          <label
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 12,
                              fontSize: "0.9rem",
                              textTransform: "none",
                              letterSpacing: 0,
                              fontWeight: 500,
                              cursor: "pointer",
                              marginBottom: 4,
                            }}
                          >
                            <input
                              type="checkbox"
                              id="opt-no-immat"
                              className="fp-check"
                              style={{ marginTop: 3 }}
                              checked={form.noImmat}
                              onChange={(e) => handleNoImmat(e.target.checked)}
                            />
                            <span>{t.noImmat}</span>
                          </label>
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="secteur">
                          {t.secteurLabel} <em className="req">*</em>
                        </label>
                        <select
                          id="secteur"
                          className="form-control"
                          required
                          value={form.secteur}
                          onChange={(e) => set("secteur", e.target.value)}
                        >
                          <option value="">{t.selectPlaceholder}</option>
                          {SECTEURS.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="description">
                          {t.descriptionLabel} <em className="req">*</em>
                        </label>
                        <textarea
                          id="description"
                          className="form-control"
                          rows={3}
                          required
                          placeholder={t.descriptionPh}
                          value={form.description}
                          onChange={(e) => set("description", e.target.value)}
                        />
                      </div>
                    </section>
                    <div className="btn-group">
                      <button type="button" className="btn btn-primary" onClick={domNext}>
                        {t.btnContinue}
                      </button>
                    </div>
                  </div>

                  {/* ---------- ÉTAPE 2 : REPRÉSENTANT ---------- */}
                  <div
                    className={"tunnel-step-content" + (step === 2 ? " active" : "")}
                    data-step="2"
                  >
                    <section className="form-section">
                      <h2 className="form-section-title">
                        <span className="form-section-num">2</span> {t.s2Title}
                      </h2>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="civilite">
                            {t.civiliteLabel} <em className="req">*</em>
                          </label>
                          <select
                            id="civilite"
                            className="form-control"
                            required
                            value={form.civilite}
                            onChange={(e) => set("civilite", e.target.value)}
                          >
                            <option value="">{t.selectPlaceholder}</option>
                            <option>Monsieur</option>
                            <option>Madame</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label htmlFor="nom_complet">
                            {t.nomCompletLabel} <em className="req">*</em>
                          </label>
                          <input
                            type="text"
                            id="nom_complet"
                            className="form-control"
                            required
                            placeholder={t.nomCompletPh}
                            value={form.nomComplet}
                            onChange={(e) => set("nomComplet", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="fonction">
                            {t.fonctionLabel} <em className="req">*</em>
                          </label>
                          <select
                            id="fonction"
                            className="form-control"
                            required
                            value={form.fonction}
                            onChange={(e) => set("fonction", e.target.value)}
                          >
                            <option value="">{t.selectPlaceholder}</option>
                            {FONCTIONS.map((f) => (
                              <option key={f}>{f}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label htmlFor="nationalite">
                            {t.nationaliteLabel} <em className="req">*</em>
                          </label>
                          <input
                            type="text"
                            id="nationalite"
                            className="form-control"
                            required
                            placeholder={t.nationalitePh}
                            value={form.nationalite}
                            onChange={(e) => set("nationalite", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="type_piece">
                            {t.typePieceLabel} <em className="req">*</em>
                          </label>
                          <select
                            id="type_piece"
                            className="form-control"
                            required
                            value={form.typePiece}
                            onChange={(e) => set("typePiece", e.target.value)}
                          >
                            <option value="">{t.selectPlaceholder}</option>
                            {TYPES_PIECE.map((p) => (
                              <option key={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label htmlFor="num_piece">
                            {t.numPieceLabel} <em className="req">*</em>
                          </label>
                          <input
                            type="text"
                            id="num_piece"
                            className="form-control"
                            required
                            placeholder={t.numPiecePh}
                            value={form.numPiece}
                            onChange={(e) => set("numPiece", e.target.value)}
                          />
                        </div>
                      </div>
                    </section>
                    <div className="btn-group">
                      <button type="button" className="btn btn-outline" onClick={() => goToStep(1)}>
                        {t.btnBack}
                      </button>
                      <button type="button" className="btn btn-primary" onClick={domNext}>
                        {t.btnContinue}
                      </button>
                    </div>
                  </div>

                  {/* ---------- ÉTAPE 3 : CONTACT ---------- */}
                  <div
                    className={"tunnel-step-content" + (step === 3 ? " active" : "")}
                    data-step="3"
                  >
                    <section className="form-section">
                      <h2 className="form-section-title">
                        <span className="form-section-num">3</span> {t.s3Title}
                      </h2>
                      <p className="section-intro">{t.s3Intro}</p>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="email">
                            {t.emailLabel} <em className="req">*</em>
                          </label>
                          <input
                            type="email"
                            id="email"
                            className="form-control"
                            required
                            placeholder={t.emailPh}
                            value={form.email}
                            onChange={(e) => set("email", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="telephone">
                            {t.telLabel} <em className="req">*</em>
                          </label>
                          <input
                            type="tel"
                            id="telephone"
                            className="form-control"
                            required
                            placeholder={t.telPh}
                            value={form.telephone}
                            onChange={(e) => set("telephone", e.target.value)}
                          />
                          <small className="field-hint">{t.telHint}</small>
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="adresse">
                          {t.adresseLabel} <em className="req">*</em>
                        </label>
                        <input
                          type="text"
                          id="adresse"
                          className="form-control"
                          required
                          placeholder={t.adressePh}
                          value={form.adresse}
                          onChange={(e) => set("adresse", e.target.value)}
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="ville">
                            {t.villeLabel} <em className="req">*</em>
                          </label>
                          <input
                            type="text"
                            id="ville"
                            className="form-control"
                            required
                            placeholder={t.villePh}
                            value={form.ville}
                            onChange={(e) => set("ville", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="pays">
                            {t.paysLabel} <em className="req">*</em>
                          </label>
                          <select
                            id="pays"
                            className="form-control"
                            required
                            value={form.pays}
                            onChange={(e) => set("pays", e.target.value)}
                          >
                            <option value="" disabled>
                              {t.paysPh}
                            </option>
                            {COUNTRIES.map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </section>
                    <div className="btn-group">
                      <button type="button" className="btn btn-outline" onClick={() => goToStep(2)}>
                        {t.btnBack}
                      </button>
                      <button type="button" className="btn btn-primary" onClick={domNext}>
                        {t.btnContinue}
                      </button>
                    </div>
                  </div>

                  {/* ---------- ÉTAPE 4 : FORMULE ---------- */}
                  <div
                    className={"tunnel-step-content" + (step === 4 ? " active" : "")}
                    data-step="4"
                  >
                    <section className="form-section">
                      <h2 className="form-section-title">
                        <span className="form-section-num">4</span> {t.s4Title}
                      </h2>
                      <div className="form-group">
                        <label>
                          {t.gammeLabel} <em className="req">*</em>
                        </label>
                        <div className="gamme-grid">
                          <div
                            className={
                              "selectable-card gamme-card" +
                              (form.gamme === "nationale" ? " selected" : "")
                            }
                            id="gamme-nationale"
                            onClick={() => {
                              setForm((f) => ({ ...f, gamme: "nationale", pack: "" }));
                            }}
                          >
                            <span className="card-badge">{t.gammeNationaleBadge}</span>
                            <h4>{t.gammeNationaleTitle}</h4>
                            <p className="card-desc">{t.gammeNationaleDesc}</p>
                          </div>
                          <div
                            className={
                              "selectable-card gamme-card" +
                              (form.gamme === "internationale" ? " selected" : "")
                            }
                            id="gamme-internationale"
                            onClick={() => {
                              setForm((f) => ({ ...f, gamme: "internationale", pack: "" }));
                            }}
                          >
                            <span className="card-badge">{t.gammeInternationaleBadge}</span>
                            <h4>{t.gammeInternationaleTitle}</h4>
                            <p className="card-desc">{t.gammeInternationaleDesc}</p>
                          </div>
                        </div>
                      </div>
                      <div className="form-group" id="pack-select-group">
                        <label htmlFor="pack">
                          {t.packLabel} <em className="req">*</em>
                        </label>
                        <select
                          id="pack"
                          className="form-control"
                          required
                          value={form.pack}
                          onChange={(e) => set("pack", e.target.value)}
                        >
                          <option value="" disabled>
                            {t.packPh}
                          </option>
                          {PACKS[form.gamme].map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                        <small className="field-hint">{t.packHint}</small>
                      </div>

                      {form.pack && PACK_DETAILS[form.pack] && (
                        <div className="pack-detail" id="packDetail" style={{ display: "block" }}>
                          <div className="pack-detail-head">
                            <div>
                              <span className="pack-detail-badge">
                                {PACK_DETAILS[form.pack].badge}
                              </span>
                              <h4 id="pdName">{PACK_DETAILS[form.pack].name}</h4>
                              {PACK_DETAILS[form.pack].usd && (
                                <p className="pack-detail-usd" id="pdUsd">
                                  {PACK_DETAILS[form.pack].usd} / mois
                                </p>
                              )}
                            </div>
                            <div className="pack-detail-price" id="pdPrice">
                              {currentPack ? fmtFCFA(currentPack.price) + " / mois" : ""}
                            </div>
                          </div>
                          <ul className="pack-detail-features" id="pdFeatures">
                            {PACK_DETAILS[form.pack].features[locale].map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="form-group">
                        <label htmlFor="periodicite">
                          {t.periodiciteLabel} <em className="req">*</em>
                        </label>
                        <select
                          id="periodicite"
                          className="form-control"
                          required
                          value={form.periodicite}
                          onChange={(e) => set("periodicite", e.target.value)}
                        >
                          <option value="mensuel">{t.perMonth}</option>
                          <option value="semestriel">{t.perSemestre}</option>
                          <option value="annuel">{t.perAnnee}</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>
                          {t.optionsLabel}{" "}
                          <small className="field-hint-inline">{t.optionsHint}</small>
                        </label>
                        <div className="options-list">
                          {EXTRA_OPTIONS.map((k) => (
                            <label className="checkbox-line" key={k}>
                              <input
                                type="checkbox"
                                checked={form.options.includes(t[k])}
                                onChange={(e) =>
                                  set(
                                    "options",
                                    e.target.checked
                                      ? [...form.options, t[k]]
                                      : form.options.filter((o) => o !== t[k]),
                                  )
                                }
                              />{" "}
                              {t[k]}
                            </label>
                          ))}
                        </div>
                        <small className="field-hint">{t.optionsHint2}</small>
                      </div>
                    </section>
                    <div className="btn-group">
                      <button type="button" className="btn btn-outline" onClick={() => goToStep(3)}>
                        {t.btnBack}
                      </button>
                      <button type="button" className="btn btn-primary" onClick={domNext}>
                        {t.btnContinue}
                      </button>
                    </div>
                  </div>

                  {/* ---------- ÉTAPE 5 : DOCUMENTS KYC ---------- */}
                  <div
                    className={"tunnel-step-content" + (step === 5 ? " active" : "")}
                    data-step="5"
                  >
                    <section className="form-section">
                      <h2 className="form-section-title">
                        <span className="form-section-num">5</span> {t.s5Title}
                      </h2>
                      <p className="section-intro">{t.s5Intro}</p>
                      {kycDone ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 14,
                            background: "rgba(16,185,129,.08)",
                            border: "1px solid #10b981",
                            borderRadius: 12,
                            padding: "18px 20px",
                          }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width={26}
                            height={26}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            style={{ flex: "0 0 26px" }}
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          <div>
                            <strong style={{ color: "var(--color-heading)" }}>
                              {t.kycAlreadyTitle}
                            </strong>
                            <div style={{ fontSize: "0.86rem", color: "var(--color-text-muted)", marginTop: 4 }}>
                              {t.kycAlreadyText}
                              {kycDone}
                              {t.kycAlreadyEnd}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Dropzone
                            id="identite"
                            title={t.dzIdentite}
                            hint={t.dzDrop}
                            accept=".pdf,.jpg,.jpeg,.png"
                            required
                          />
                          <Dropzone
                            id="statuts"
                            title={t.dzStatuts}
                            hint={t.dzDropPdf}
                            accept=".pdf"
                            required
                          />
                          <Dropzone
                            id="domicile"
                            title={t.dzDomicile}
                            hint={t.dzDomicileFormats}
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                          <p
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--color-text-muted)",
                              margin: "20px 0",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width={16}
                              height={16}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>{" "}
                            {t.kycNote}
                          </p>
                        </>
                      )}
                    </section>

                    {/* SECTION 6 : VALIDATION (dans la même étape 5, comme la source) */}
                    <section className="form-section">
                      <h2 className="form-section-title">
                        <span className="form-section-num">6</span> {t.s6Title}
                      </h2>
                      <div className="form-group validation-group">
                        <label className="checkbox-line validation-line">
                          <input
                            type="checkbox"
                            id="chk-cgv"
                            required
                            checked={form.chkCgv}
                            onChange={(e) => set("chkCgv", e.target.checked)}
                          />{" "}
                          <span dangerouslySetInnerHTML={{ __html: t.chkCgv }} />
                        </label>
                        <label className="checkbox-line validation-line">
                          <input
                            type="checkbox"
                            id="chk-cadre"
                            required
                            checked={form.chkCadre}
                            onChange={(e) => set("chkCadre", e.target.checked)}
                          />{" "}
                          <span dangerouslySetInnerHTML={{ __html: t.chkCadre }} />
                        </label>
                        <label className="checkbox-line validation-line">
                          <input
                            type="checkbox"
                            id="chk-exactitude"
                            required
                            checked={form.chkExactitude}
                            onChange={(e) => set("chkExactitude", e.target.checked)}
                          />{" "}
                          <span dangerouslySetInnerHTML={{ __html: t.chkExactitude }} />
                        </label>
                      </div>

                      {errors.length > 0 && (
                        <div id="form-errors" className="form-errors" style={{ display: "block" }}>
                          <strong>{t.errTitle}</strong>
                          <ul>
                            {errors.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ width: "100%", marginBottom: 14 }}
                        onClick={() => goToStep(4)}
                      >
                        {t.btnBackFull}
                      </button>
                      <button type="submit" className="btn btn-primary btn-block btn-validate">
                        {t.btnValidate}
                      </button>
                    </section>
                  </div>

                  {/* ---------- ÉTAPE 6 : FACTURATION ---------- */}
                  <div
                    className={"tunnel-step-content" + (step === 6 ? " active" : "")}
                    data-step="6"
                  >
                    <section className="form-section">
                      <h2 className="form-section-title">
                        <span className="form-section-num">7</span> {t.s7Title}
                      </h2>
                      <p className="section-intro">{t.s7Intro}</p>

                      <div
                        id="invoiceBox"
                        className="invoice-box"
                        style={{
                          background: "var(--color-bg-main)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 12,
                          padding: 28,
                          marginBottom: 24,
                          color: "var(--color-heading, #15294D)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 16,
                            borderBottom: "2px solid var(--color-primary)",
                            paddingBottom: 16,
                            marginBottom: 20,
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: "1.15rem", color: "var(--color-heading)" }}>
                              FEDPAWA CORPORATE SOLUTIONS SARL
                            </strong>
                            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                              NIU : M09261890362B
                              <br />
                              RCCM : CM-DLA-01-2026-B13-00767
                              <br />
                              Siège Social : Douala - Logpom (Immeuble Pharmacie de Logpom), Cameroun
                              <br />
                              +237 691 70 48 02 · contact@fedpawa.com
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                              {t.invoiceLabel}
                            </div>
                            <div style={{ fontSize: "0.85rem" }}>
                              {t.invoiceNum} {invoice?.num ?? "—"}
                            </div>
                            <div style={{ fontSize: "0.85rem" }}>
                              {t.invoiceDate} {invoice?.dateStr ?? "—"}
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 12,
                            marginBottom: 20,
                            fontSize: "0.9rem",
                          }}
                        >
                          <div>
                            <strong>{t.invoiceBilledTo}</strong>
                            <br />
                            {form.nomComplet || "Client"}
                            <br />
                            {form.email}
                            <br />
                            {form.telephone}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <strong>{t.invoiceService}</strong>
                            <br />
                            {t.invoiceDomiciliation} — {packLabel}
                            <br />
                            {t.invoicePeriod} {periodLabel}
                          </div>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", marginBottom: 8 }}>
                          <thead>
                            <tr style={{ background: "var(--color-bg-alt)" }}>
                              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid var(--color-border)" }}>
                                {t.invoiceDesignation}
                              </th>
                              <th style={{ textAlign: "right", padding: 10, borderBottom: "1px solid var(--color-border)" }}>
                                {t.invoiceAmount}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: 10, borderBottom: "1px solid var(--color-border)" }}>
                                {packLabel} — {t.invoiceDomiciliation} ({periodLabel})
                              </td>
                              <td style={{ textAlign: "right", padding: 10, borderBottom: "1px solid var(--color-border)" }}>
                                {fmtFCFA(total)}
                              </td>
                            </tr>
                            <tr style={{ background: "var(--color-bg-alt)", fontWeight: 700 }}>
                              <td style={{ padding: "12px 10px" }}>{t.invoiceTotal}</td>
                              <td style={{ textAlign: "right", padding: "12px 10px" }}>
                                {fmtFCFA(total)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: 10 }}>
                          {t.invoiceFooter} {total.toLocaleString("fr-FR")} {t.invoiceFooterEnd}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ width: "100%", marginBottom: 14 }}
                        onClick={() => goToStep(5)}
                      >
                        {t.btnBack}
                      </button>
                      <button
                        type="button"
                        id="invoicePayBtn"
                        className="btn btn-primary btn-block"
                        onClick={() => setShowPayModal(true)}
                      >
                        {t.btnPay} ({total.toLocaleString("fr-FR")} FCFA)
                      </button>
                    </section>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* ============== SIDEBAR RÉCAP ============== */}
          {!showSuccess && (
            <aside className="order-summary">
              <div className="summary-header">
                <h3>{t.sumTitle}</h3>
              </div>
              <div id="summaryItems">
                <div className="summary-item">
                  <span className="sum-label">{t.sumPack}</span>
                  <span className="sum-value">{currentPack?.label ?? "—"}</span>
                </div>
                <div className="summary-item">
                  <span className="sum-label">{t.sumPeriodicite}</span>
                  <span className="sum-value">{t[PERIODICITES[form.periodicite].key] ?? "—"}</span>
                </div>
                <div className="summary-item">
                  <span className="sum-label">{t.sumMonthly}</span>
                  <span className="sum-value">
                    {currentPack ? fmtFCFA(currentPack.price) : "—"}
                  </span>
                </div>
              </div>
              <div className="summary-divider" />
              <div id="summaryOptions">
                {form.options.map((o) => (
                  <div className="summary-item" key={o}>
                    <span className="sum-label">{t.sumOption}</span>
                    <span className="sum-value">{o}</span>
                  </div>
                ))}
              </div>
              <div className="summary-total">
                <span id="sum-total-label">
                  {months === 1
                    ? t.sumTotalMonth
                    : `${t.sumTotalMonths}${months}${t.sumTotalMonthsEnd}`}
                </span>
                <span id="summaryTotal">{fmtFCFA(total)}</span>
              </div>
              <div className="summary-secure-badge">
                <svg
                  viewBox="0 0 24 24"
                  width={16}
                  height={16}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>{" "}
                {t.sumBadge}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* ============== MODALE SMART-DETECTION (persistante) ============== */}
      {smartModal !== "closed" && (
        <div
          id="smart-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(8,12,24,0.55)",
            backdropFilter: "blur(2px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            id="smart-modal"
            role="dialog"
            aria-modal="true"
            style={{
              background: "var(--color-bg-main)",
              borderRadius: 14,
              maxWidth: 520,
              width: "100%",
              padding: 28,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              border: "1px solid var(--color-border)",
            }}
          >
            <h3 style={{ marginBottom: 10 }}>{t.smartTitle}</h3>
            <p style={{ fontSize: "0.92rem", color: "var(--color-text-muted)", lineHeight: 1.55, marginBottom: 22 }}>
              {smartModal === "open" ? t.smartText : t.smartNoText}
            </p>
            <div style={{ display: "grid", gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={() => (window.location.href = routes.creationEntreprise)}
              >
                {t.smartYes}
              </button>
              {smartModal === "open" ? (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: "100%" }}
                  onClick={() => setSmartModal("blocked")}
                >
                  {t.smartNo}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: 10 }}
                  onClick={() => (window.location.href = routes.creationEntreprise)}
                >
                  {t.smartUnderstood}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============== PAYMODAL (fedpawa-pay répliqué) ============== */}
      {showPayModal && (
        <PayModal
          config={{
            label:
              (currentPack?.label ?? t.invoiceDomiciliation) +
              " — " +
              (t[PERIODICITES[form.periodicite].key] ?? ""),
            priceFCFA: total,
            contract: true,
            onSubmit: submitSouscription,
            onSuccessCloseUrl: routes.espaceClient,
            labels: t,
          }}
          onClose={() => setShowPayModal(false)}
        />
      )}
    </>
  );
}
