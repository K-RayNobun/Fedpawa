// ==========================================================
// FEDPAWA — page de signature d'un dossier (route par dossier
// /espace-client/signature/[id]).
// Parcours : aperçu du contrat → consentement explicite → code
// OTP à 6 chiffres (e-mail) → pavé de signature (canvas PNG base64,
// repli dactylographié) → POST /api/v1/signature/signer → résultat
// (empreinte SHA-256, certificat) + téléchargements contrat scellé
// et dossier de preuve. Les refus serveur (403/400…) sont affichés
// tels quels (message + statut HTTP), jamais masqués.
// ==========================================================

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { apiAuthGet, apiAuthGetBlob } from "@/lib/auth";
import type { ApiContrat, ApiSubscription, DashboardData } from "@/lib/dashboard-types";
import { fmtDate, fmtFCFA } from "@/lib/dashboard-format";
import {
  contratScellePath,
  etatDossierSignature,
  envoyerOtpSignature,
  preuvePath,
  signerContrat,
  telechargerContratScelle,
  telechargerPreuve,
  type DossierEtatResponse,
  type SignatureSigneeResponse,
} from "@/lib/signature";
import SignaturePad, { type PadMode, type SignaturePadHandle } from "./SignaturePad";

const TEXTE_CONSENTEMENT = `Je consens à signer électroniquement le présent document. La signature électronique a la même valeur juridique que la signature manuscrite (loi n° 2010/012 du 21 décembre 2010 relative à la cybersécurité et à la cybercriminalité au Cameroun). J'accepte que mon identité vérifiée (dossier KYC approuvé), mon adresse IP et mon navigateur (user-agent) soient enregistrés dans le dossier de preuve de cette signature.`;

interface Props {
  dossierId: number;
}

type Phase = "chargement" | "formulaire" | "signe";

export default function SignatureDossier({ dossierId }: Props) {
  const [phase, setPhase] = useState<Phase>("chargement");
  const [etat, setEtat] = useState<DossierEtatResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [erreur, setErreur] = useState<{ status: number; message: string } | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Aperçu du contrat (PDF du contrat lié au dossier).
  const [apercuUrl, setApercuUrl] = useState<string | null>(null);
  const [apercuEnCours, setApercuEnCours] = useState(false);

  // Formulaire.
  const [consentement, setConsentement] = useState(false);
  const [otpEnvoye, setOtpEnvoye] = useState(false);
  const [otpEnCours, setOtpEnCours] = useState(false);
  const [otp, setOtp] = useState("");
  const [padMode, setPadMode] = useState<PadMode>("draw");
  const [typed, setTyped] = useState("");
  const [padVide, setPadVide] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const padRef = useRef<SignaturePadHandle>(null);

  // Résultat de signature.
  const [resultat, setResultat] = useState<SignatureSigneeResponse | null>(null);
  const [telechargement, setTelechargement] = useState<string | null>(null);

  const dossier = etat?.dossier ?? null;
  const contratId = dossier?.contrat_id ?? null;
  const abonnementId = dossier?.abonnement_id ?? null;

  const abonnement: ApiSubscription | null =
    dashboard?.subscription?.id === abonnementId
      ? dashboard.subscription
      : (dashboard?.pastSubscriptions ?? []).find((s) => s.id === abonnementId) ?? null;

  const contrat: ApiContrat | null =
    (dashboard?.contrats ?? []).find((c) => c.id === contratId) ?? null;

  // ---------- chargement état du dossier + dashboard ----------
  useEffect(() => {
    let annule = false;
    setPhase("chargement");
    etatDossierSignature(dossierId)
      .then((e) => {
        if (annule) return;
        setEtat(e);
        setPhase(e.dossier.statut === "scelle" || e.dossier.statut === "signe" ? "signe" : "formulaire");
        if (e.dossier.statut === "scelle" || e.dossier.statut === "signe") {
          setResultat({
            dossier_id: e.dossier.id,
            statut: e.dossier.statut,
            contrat_id: e.dossier.contrat_id,
            sha256_signe: e.dossier.sha256_signe ?? undefined,
            certificat_empreinte: e.dossier.certificat_empreinte ?? undefined,
            scelle_le: e.dossier.scelle_le ?? undefined,
          });
        }
      })
      .catch((err: unknown) => {
        if (annule) return;
        const e = err as ApiError;
        setErreur({ status: e.status ?? 0, message: e.message ?? "Erreur inconnue" });
        setPhase("formulaire");
      });
    apiAuthGet<DashboardData>("/api/v1/dashboard")
      .then((d) => !annule && setDashboard(d))
      .catch(() => {
        /* le dashboard n'est pas bloquant pour signer */
      });
    return () => {
      annule = true;
    };
  }, [dossierId]);

  // ---------- aperçu PDF du contrat ----------
  useEffect(() => {
    if (!contratId) return;
    let annule = false;
    let url: string | null = null;
    setApercuEnCours(true);
    apiAuthGetBlob(`/api/v1/document?type=contrat&id=${contratId}`)
      .then((blob) => {
        if (annule) return;
        url = URL.createObjectURL(blob);
        setApercuUrl(url);
      })
      .catch(() => !annule && setApercuUrl(null))
      .finally(() => !annule && setApercuEnCours(false));
    return () => {
      annule = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [contratId]);

  // ---------- actions ----------
  const demanderOtp = useCallback(async () => {
    setErreur(null);
    setInfo(null);
    setOtpEnCours(true);
    try {
      const r = await envoyerOtpSignature(dossierId);
      setOtpEnvoye(true);
      setInfo(
        r.delivered
          ? `${r.message} (dossier #${r.dossier_id}, statut « ${r.statut} »).`
          : `Le serveur a répondu « ${r.message} » mais delivered=false : vérifiez la configuration e-mail.`,
      );
    } catch (err) {
      const e = err as ApiError;
      setErreur({ status: e.status ?? 0, message: e.message ?? "Erreur inconnue" });
    } finally {
      setOtpEnCours(false);
    }
  }, [dossierId]);

  const soumettre = useCallback(async () => {
    setErreur(null);
    setInfo(null);
    const png = padRef.current?.getPngDataUrl() ?? null;
    if (!consentement) {
      setErreur({ status: 0, message: "Veuillez cocher la case de consentement avant de signer." });
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setErreur({ status: 0, message: "Saisissez le code à 6 chiffres reçu par e-mail." });
      return;
    }
    if (!png) {
      setErreur({ status: 0, message: "Dessinez ou saisissez votre signature dans le pavé." });
      return;
    }
    setEnCours(true);
    try {
      const r = await signerContrat({
        dossier_id: dossierId,
        otp: otp.trim(),
        consentement: true,
        signature_image_base64: png,
      });
      setResultat(r);
      setPhase("signe");
      setInfo(`Signature enregistrée — statut « ${r.statut} »`);
    } catch (err) {
      const e = err as ApiError;
      // Message serveur affiché tel quel (403 identité, 400 OTP/consentement…).
      setErreur({ status: e.status ?? 0, message: e.message ?? "Erreur inconnue" });
    } finally {
      setEnCours(false);
    }
  }, [consentement, dossierId, otp]);

  const telecharger = useCallback(
    async (kind: "contrat" | "preuve") => {
      setErreur(null);
      setTelechargement(kind);
      try {
        const blob =
          kind === "contrat" ? await telechargerContratScelle(dossierId) : await telechargerPreuve(dossierId);
        const a = document.createElement("a");
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = kind === "contrat" ? `contrat_signe_dossier_${dossierId}.pdf` : `preuve_signature_dossier_${dossierId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
      } catch (err) {
        const e = err as ApiError;
        setErreur({ status: e.status ?? 0, message: e.message ?? "Téléchargement impossible" });
      } finally {
        setTelechargement(null);
      }
    },
    [dossierId],
  );

  // ---------- rendu ----------
  return (
    <div className="db-tab-content active sig-page">
      <div className="db-welcome">
        <div>
          <h1>Signature électronique</h1>
          <p>
            Dossier de signature n°{dossierId} — <Link href="/espace-client/signature">retour à la liste</Link>
          </p>
        </div>
        {dossier && (
          <span className={`badge ${dossier.statut === "scelle" ? "badge-success" : "badge-warning"}`}>
            {dossier.statut}
          </span>
        )}
      </div>

      {erreur && (
        <div className="sig-alert sig-alert-erreur" role="alert" data-testid="sig-erreur">
          <strong>Refus du serveur{erreur.status ? ` (HTTP ${erreur.status})` : ""} :</strong> {erreur.message}
        </div>
      )}
      {info && (
        <div className="sig-alert sig-alert-info" role="status">
          {info}
        </div>
      )}

      {phase === "chargement" && <div className="db-section" style={{ color: "var(--color-text-muted)" }}>Chargement du dossier…</div>}

      {phase !== "chargement" && (
        <>
          {/* ---- Aperçu du document ---- */}
          <section className="db-section sig-section">
            <div className="db-section-header">
              <h2>1. Aperçu du document à signer</h2>
            </div>
            {contratId && (
              <p className="sig-doc-ligne">
                Contrat n°{contratId}
                {contrat?.type ? ` — ${contrat.type}` : ""}
                {contrat?.date_signature ? ` — signé le ${fmtDate(contrat.date_signature)}` : " — en attente de signature"}
              </p>
            )}
            {!contratId && abonnement && (
              <p className="sig-doc-ligne">
                Abonnement n°{abonnement.id} — pack « {abonnement.pack ?? "—"} », {fmtFCFA(Number(abonnement.prix ?? 0))}
                {abonnement.date_debut ? `, début le ${fmtDate(abonnement.date_debut)}` : ""}, statut « {abonnement.statut ?? "—"} ».
              </p>
            )}
            {!contratId && !abonnement && (
              <p className="sig-doc-ligne">Document lié au dossier n°{dossierId} (abonnement n°{abonnementId ?? "—"}).</p>
            )}
            {contratId && (
              apercuEnCours ? (
                <p style={{ color: "var(--color-text-muted)" }}>Chargement de l&apos;aperçu…</p>
              ) : apercuUrl ? (
                <iframe title="Aperçu du contrat" src={apercuUrl} className="sig-apercu" />
              ) : (
                <p style={{ color: "var(--color-text-muted)" }}>
                  Aperçu PDF indisponible — le contrat sera scellé après signature.
                </p>
              )
            )}
          </section>

          {phase === "signe" && resultat ? (
            /* ---- Résultat ---- */
            <section className="db-section sig-section" data-testid="sig-resultat">
              <div className="db-section-header">
                <h2>Contrat signé et scellé</h2>
                <span className="badge badge-success">{resultat.statut}</span>
              </div>
              <dl className="sig-empreintes">
                <div><dt>Empreinte SHA-256 du PDF scellé</dt><dd className="sig-hash">{resultat.sha256_signe ?? etat?.dossier.sha256_signe ?? "—"}</dd></div>
                <div><dt>Certificat de scellement</dt><dd>{resultat.certificat_sujet ?? "—"}</dd></div>
                <div><dt>Empreinte SHA-256 du certificat</dt><dd className="sig-hash">{resultat.certificat_empreinte ?? etat?.dossier.certificat_empreinte ?? "—"}</dd></div>
                {resultat.scelle_le && (
                  <div><dt>Scellé le</dt><dd>{resultat.scelle_le}</dd></div>
                )}
                {etat?.dossier.ip && (
                  <div><dt>Adresse IP enregistrée</dt><dd>{etat.dossier.ip}</dd></div>
                )}
                {etat?.dossier.user_agent && (
                  <div><dt>Navigateur enregistré</dt><dd className="sig-hash">{etat.dossier.user_agent}</dd></div>
                )}
              </dl>
              <div className="sig-telechargements">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => telecharger("contrat")}
                  disabled={telechargement !== null}
                >
                  {telechargement === "contrat" ? "Téléchargement…" : "Télécharger le contrat scellé (PDF)"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => telecharger("preuve")}
                  disabled={telechargement !== null}
                >
                  {telechargement === "preuve" ? "Téléchargement…" : "Télécharger le dossier de preuve (PDF)"}
                </button>
              </div>
              <p className="sig-note">
                URLs serveur : <code>{contratScellePath(dossierId)}</code> et <code>{preuvePath(dossierId)}</code> (authentifiées, cloisonnées par client).
              </p>
            </section>
          ) : (
            /* ---- Formulaire de signature ---- */
            <>
              <section className="db-section sig-section">
                <div className="db-section-header"><h2>2. Consentement</h2></div>
                <label className="sig-consent" htmlFor="sig-consentement">
                  <input
                    id="sig-consentement"
                    type="checkbox"
                    className="fp-check"
                    checked={consentement}
                    onChange={(e) => setConsentement(e.target.checked)}
                  />
                  <span>{TEXTE_CONSENTEMENT}</span>
                </label>
              </section>

              <section className="db-section sig-section">
                <div className="db-section-header">
                  <h2>3. Code de confirmation (e-mail)</h2>
                  <button type="button" className="btn btn-outline" onClick={demanderOtp} disabled={otpEnCours}>
                    {otpEnvoye ? "Renvoyer le code" : "Envoyer le code par e-mail"}
                  </button>
                </div>
                <p className="sig-note">
                  Un code à 6 chiffres vient d&apos;être envoyé à l&apos;adresse e-mail de votre compte (valable 10 minutes).
                </p>
                <div className="form-group sig-otp-group">
                  <label htmlFor="sig-otp">Code reçu par e-mail</label>
                  <input
                    id="sig-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="form-control sig-otp-input"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>
              </section>

              <section className="db-section sig-section">
                <div className="db-section-header"><h2>4. Votre signature</h2></div>
                <SignaturePad
                  mode={padMode}
                  typedText={typed}
                  onModeChange={setPadMode}
                  onTypedTextChange={setTyped}
                  onContentChange={(v) => setPadVide(!v)}
                  apiRef={padRef}
                />
              </section>

              <div className="sig-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={soumettre}
                  disabled={enCours || padVide || !consentement || otp.trim().length !== 6}
                  data-testid="sig-signer"
                >
                  {enCours ? "Signature en cours…" : "Signer le contrat"}
                </button>
                {!consentement || otp.trim().length !== 6 || padVide ? (
                  <p className="sig-note">
                    Le bouton s&apos;active quand le consentement est coché, le code à 6 chiffres saisi et la signature dessinée.
                  </p>
                ) : null}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
