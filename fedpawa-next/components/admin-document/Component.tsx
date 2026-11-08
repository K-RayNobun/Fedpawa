// ==========================================================
// FEDPAWA — Visionneuse Document Admin (vague D)
// Conversion de admin_document.html (L011) : fiche d'un document
// (type, id, file depuis l'URL) remplie par GET /api/v1/admin/document-info.
// 403 (non-admin) → redirection authentification ; fichier absent →
// état « indisponible » propre (jamais de bouton Télécharger actif).
// Le téléchargement passe par l'API sécurisée (Bearer + blob),
// déclenché côté client — journalisé côté serveur (AuditLogger).
// ==========================================================

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  apiAuthGet,
  apiAuthGetBlob,
} from "@/lib/auth";
import type { DocumentInfo } from "@/lib/dashboard-types";
import { fmtDate, fmtSize } from "@/lib/dashboard-format";
import { routesFor } from "@/lib/routes";
import type { Locale } from "@/lib/i18n";

type DocState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "ready"; info: DocumentInfo };

interface AdminDocumentProps {
  locale?: Locale;
  /** Paramètres d'URL (injectés par la page via useSearchParams). */
  docType: string;
  docId: string;
  docFile: string;
}

export default function AdminDocument({
  locale = "fr",
  docType,
  docId,
  docFile,
}: AdminDocumentProps) {
  const routes = routesFor(locale);
  const [state, setState] = useState<DocState>({ status: "loading" });
  const [downloading, setDownloading] = useState(false);
  const [note, setNote] = useState(
    "Le téléchargement passe par l'API sécurisée (session admin requise, journalisé).",
  );

  useEffect(() => {
    let cancelled = false;

    if (!docType || !docId) {
      setState({ status: "unavailable" });
      return;
    }

    const qs =
      `type=${encodeURIComponent(docType)}&id=${encodeURIComponent(docId)}` +
      (docFile ? `&file=${encodeURIComponent(docFile)}` : "");

    apiAuthGet<DocumentInfo>(`/api/v1/admin/document-info?${qs}`)
      .then((info) => {
        if (cancelled) return;
        if (!info.exists) {
          setState({ status: "unavailable" });
          setNote("Téléchargement indisponible : fichier absent du stockage.");
          return;
        }
        setState({ status: "ready", info });
      })
      .catch((err: Error & { status?: number }) => {
        if (cancelled) return;
        setState({ status: "unavailable" });
        setNote("Téléchargement indisponible : fichier absent du stockage.");
      });

    return () => {
      cancelled = true;
    };
  }, [docType, docId, docFile]);

  // L011 : téléchargement via l'API (Bearer), jamais un href direct —
  // le JSON d'erreur ne doit pas être « téléchargé » comme fichier.
  const handleDownload = async () => {
    if (state.status !== "ready") return;
    const url = state.info.download_url;
    if (!url) return;
    setDownloading(true);
    try {
      const blob = await apiAuthGetBlob(url);
      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = state.info.filename || "";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setNote("Téléchargement impossible (erreur réseau ou session expirée).");
    } finally {
      setDownloading(false);
    }
  };

  const ready = state.status === "ready";
  const title =
    ready && state.info.type_label ? state.info.type_label : "Document";

  return (
    <main className="doc-viewer-main">
      <div className="doc-viewer-card">
        <div className="doc-viewer-head">
          <div>
            <h1 id="docTitle">{title}</h1>
            <p className="doc-subtitle">
              Consultation et téléchargement sécurisés — espace administration
            </p>
          </div>
          <span
            id="docBadge"
            className={`badge badge-${ready ? "success" : "muted"}`}
          >
            {state.status === "loading" ? "Chargement…" : ready ? "Disponible" : "Indisponible"}
          </span>
        </div>

        <div
          className={`doc-viewer-unavailable${state.status === "unavailable" ? " show" : ""}`}
          id="docUnavailable"
          role="alert"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <strong>Ce document n'est pas disponible.</strong>
            <p>
              Le fichier associé à cette ligne est absent du stockage. Le lien « Consulter » ne devrait pas être proposé : l'état affiché dans le dashboard sera corrigé au prochain rechargement.
            </p>
          </div>
        </div>

        <dl className="doc-info-grid" id="docInfo">
          <DocInfoItem label="Client" value={ready ? state.info.client_nom ?? "—" : "—"} />
          <DocInfoItem label="Entreprise" value={ready ? state.info.entreprise ?? "—" : "—"} />
          <DocInfoItem label="Type de document" value={ready ? state.info.type_label ?? "—" : "—"} />
          <DocInfoItem label="Date" value={ready ? fmtDate(state.info.date) : "—"} />
          <DocInfoItem label="Fichier" value={ready ? state.info.filename ?? "—" : "—"} />
          <DocInfoItem label="Taille" value={ready ? fmtSize(state.info.size) : "—"} />
          <DocInfoItem label="Format" value={ready ? state.info.mime ?? "—" : "—"} />
        </dl>

        <div className="doc-viewer-actions">
          <button
            type="button"
            className="btn btn-primary"
            id="docDownload"
            onClick={handleDownload}
            disabled={!ready || downloading}
            aria-disabled={!ready || downloading}
            style={!ready || downloading ? { opacity: 0.5 } : undefined}
          >
            {downloading ? "Téléchargement…" : "Télécharger"}
          </button>
          <Link className="btn btn-outline" href={routes.adminDashboard}>
            Retour au dashboard
          </Link>
        </div>
        <p className="doc-viewer-note" id="docNote">{note}</p>
      </div>
    </main>
  );
}

function DocInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="doc-info-item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
