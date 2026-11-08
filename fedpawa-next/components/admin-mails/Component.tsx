// ==========================================================
// FEDPAWA — Boîte de réception admin (CONTRAT-MAIL.md §3) :
// liste antichronologique paginée (expéditeur, sujet, date,
// lu/non lu), filtre « non lus », recherche, badge de non-lus
// (GET /api/v1/admin/mails/count), vue détail avec corps HTML
// ASSAINI (scripts/iframes/gestionnaires d'événements/liens
// javascript: retirés — lib/sanitize-mail-html) et pièces
// jointes listées (nom/type/taille, téléchargement via URL
// temporaire uniquement, jamais insérées en direct), actions
// « tout marquer comme lu ». Repli sur données de démonstration
// EXPLICITEMENT signalées si l'API répond 404 (endpoints non
// déployés). Rôle admin requis (Guarded).
// ==========================================================

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type Locale, getPageDictionary } from "@/lib/i18n";
import { routesFor } from "@/lib/routes";
import { sanitizeMailHtml } from "@/lib/sanitize-mail-html";
import {
  MAILS_PAR_PAGE,
  adminFetchMail,
  adminFetchMails,
  adminFetchMailsCount,
  adminMarquerMailLu,
  adminMarquerToutLu,
  type MailDetail,
  type MailsCount,
  type MailsPage,
  type MailSummary,
} from "@/lib/mails";

export interface AdminMailsProps {
  locale?: Locale;
}

function fmtDate(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function fmtTaille(octets: number | null | undefined): string {
  if (octets === null || octets === undefined) return "";
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(2)} Mo`;
}

export default function AdminMails({ locale = "fr" }: AdminMailsProps) {
  const t = getPageDictionary(locale, "admin_mails");
  const routes = routesFor(locale);

  const [resp, setResp] = useState<MailsPage<MailSummary> | null>(null);
  const [count, setCount] = useState<MailsCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtre, setFiltre] = useState<"" | "non_lus">("");
  const [recherche, setRecherche] = useState("");
  const [rechercheAppliquee, setRechercheAppliquee] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<MailDetail | null>(null);
  const [detailDemo, setDetailDemo] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  // Recherche avec debounce 400 ms.
  useEffect(() => {
    const h = setTimeout(() => {
      setRechercheAppliquee(recherche.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(h);
  }, [recherche]);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    adminFetchMails({
      lu: filtre,
      recherche: rechercheAppliquee,
      page,
      par_page: MAILS_PAR_PAGE,
    })
      .then((r) => setResp(r))
      .catch(() => setError(t.loadError))
      .finally(() => setLoading(false));
    adminFetchMailsCount()
      .then(setCount)
      .catch(() => setCount(null));
  }, [filtre, rechercheAppliquee, page, t.loadError]);

  useEffect(() => {
    load();
  }, [load]);

  const ouvrir = (id: number) => {
    setDetailLoading(true);
    setDetail(null);
    adminFetchMail(id)
      .then((d) => {
        setDetail(d);
        setDetailDemo(Boolean((d as { demo?: boolean }).demo));
      })
      .catch(() => setError(t.loadError))
      .finally(() => setDetailLoading(false));
  };

  const fermerDetail = () => {
    setDetail(null);
    setDetailDemo(false);
  };

  // Mise à jour locale optimiste (fonctionne en réel comme en démo).
  const appliquerLuLocal = (id: number) => {
    setResp((r) =>
      r
        ? {
            ...r,
            data: r.data.map((m) => (m.id === id ? { ...m, lu: true } : m)),
          }
        : r,
    );
    setDetail((d) => (d && d.id === id ? { ...d, lu: true } : d));
    setCount((c) =>
      c ? { ...c, non_lus: Math.max(0, c.non_lus - 1) } : c,
    );
  };

  const marquerLu = (id: number) => {
    setBusy(true);
    setMessage("");
    adminMarquerMailLu(id)
      .then(() => {
        appliquerLuLocal(id);
        setMessage(t.luOk);
      })
      .catch(() => setMessage(t.errorGeneric))
      .finally(() => setBusy(false));
  };

  const marquerToutLu = () => {
    setBusy(true);
    setMessage("");
    adminMarquerToutLu()
      .then(() => {
        setResp((r) =>
          r ? { ...r, data: r.data.map((m) => ({ ...m, lu: true })) } : r,
        );
        setDetail((d) => (d ? { ...d, lu: true } : d));
        setCount((c) => (c ? { ...c, non_lus: 0 } : c));
        setMessage(t.toutLuOk);
      })
      .catch(() => setMessage(t.errorGeneric))
      .finally(() => setBusy(false));
  };

  // Corps HTML assaini mémorisé (DOMParser, client-only).
  const corpsAssaini = useMemo(
    () => (detail ? sanitizeMailHtml(detail.corps_html) : ""),
    [detail],
  );

  return (
    <div className="db-main apub-main amail-main">
      <div className="db-welcome">
        <div>
          <h1>
            {t.title}{" "}
            {count && count.non_lus > 0 && (
              <span className="amail-badge" title={t.nonLus}>
                {count.non_lus} {t.nonLus}
              </span>
            )}
          </h1>
          <p>{t.subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn btn-outline" href={routes.adminDashboard}>
            {t.backDashboard}
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={marquerToutLu}
            disabled={busy || !count || count.non_lus === 0}
          >
            {t.markAllRead}
          </button>
        </div>
      </div>

      {(resp?.demo || detailDemo || count?.demo) && (
        <p className="amail-demo-banner" role="alert">
          {t.demoBanner}
        </p>
      )}

      {message && (
        <p className="apub-message" role="status">
          {message}
        </p>
      )}

      {/* ============== DÉTAIL ============== */}
      {detail && (
        <section className="db-section amail-detail">
          <div className="amail-detail-head">
            <button
              type="button"
              className="btn btn-outline apub-btn-sm"
              onClick={fermerDetail}
            >
              {t.retourListe}
            </button>
            {!detail.lu && (
              <button
                type="button"
                className="btn btn-primary apub-btn-sm"
                onClick={() => marquerLu(detail.id)}
                disabled={busy}
              >
                {t.marquerLu}
              </button>
            )}
          </div>
          <h2>{detail.sujet}</h2>
          <dl className="amail-meta">
            <div>
              <dt>{t.colExpediteur}</dt>
              <dd>{detail.expediteur}</dd>
            </div>
            <div>
              <dt>{t.detailDestinataires}</dt>
              <dd>{(detail.destinataires ?? []).join(", ") || "—"}</dd>
            </div>
            {detail.copie && detail.copie.length > 0 && (
              <div>
                <dt>{t.detailCopie}</dt>
                <dd>{detail.copie.join(", ")}</dd>
              </div>
            )}
            <div>
              <dt>{t.detailRecuLe}</dt>
              <dd>{fmtDate(detail.recu_le, locale)}</dd>
            </div>
            <div>
              <dt>{t.colEtat}</dt>
              <dd>
                <span
                  className={`badge ${detail.lu ? "badge-muted" : "badge-warning"}`}
                >
                  {detail.lu ? t.etatLu : t.etatNonLu}
                </span>
              </dd>
            </div>
          </dl>

          <h3>{t.piecesJointes}</h3>
          {detail.pieces_jointes && detail.pieces_jointes.length > 0 ? (
            <ul className="amail-attachments">
              {detail.pieces_jointes.map((pj, i) => (
                <li key={`${pj.nom}-${i}`}>
                  <span className="amail-att-nom">{pj.nom}</span>
                  <span className="amail-att-meta">
                    {pj.type ?? "—"} · {fmtTaille(pj.taille)}
                  </span>
                  {pj.url && (
                    <a
                      className="btn btn-outline apub-btn-sm"
                      href={pj.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.telecharger}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>{t.aucunePieceJointe}</p>
          )}

          <h3>{t.corpsHtml}</h3>
          {corpsAssaini ? (
            <div
              className="amail-body"
              dangerouslySetInnerHTML={{ __html: corpsAssaini }}
            />
          ) : (
            <p>{detail.corps_texte ?? "—"}</p>
          )}
        </section>
      )}

      {/* ============== LISTE ============== */}
      {!detail && (
        <section className="db-section">
          <div className="apub-toolbar amail-toolbar">
            <label>
              <input
                type="search"
                className="amail-search"
                placeholder={t.searchPlaceholder}
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
              />
            </label>
            <label>
              <select
                value={filtre}
                onChange={(e) => {
                  setFiltre(e.target.value as "" | "non_lus");
                  setPage(1);
                }}
              >
                <option value="">{t.filterAll}</option>
                <option value="non_lus">{t.filterNonLus}</option>
              </select>
            </label>
          </div>

          {loading && !resp && <p>{t.loading}</p>}
          {error && <p className="apub-message">{error}</p>}
          {!loading && resp && resp.data.length === 0 && <p>{t.empty}</p>}

          {resp && resp.data.length > 0 && (
            <table className="apub-table">
              <thead>
                <tr>
                  <th>{t.colExpediteur}</th>
                  <th>{t.colSujet}</th>
                  <th>{t.colDate}</th>
                  <th>{t.colEtat}</th>
                  <th>{t.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {resp.data.map((m) => (
                  <tr
                    key={m.id}
                    className={m.lu ? undefined : "amail-row-unread"}
                  >
                    <td>{m.expediteur}</td>
                    <td>{m.sujet}</td>
                    <td>{fmtDate(m.recu_le, locale)}</td>
                    <td>
                      <span
                        className={`badge ${m.lu ? "badge-muted" : "badge-warning"}`}
                      >
                        {m.lu ? t.etatLu : t.etatNonLu}
                      </span>
                    </td>
                    <td className="apub-row-actions">
                      <button
                        type="button"
                        className="btn btn-outline apub-btn-sm"
                        onClick={() => ouvrir(m.id)}
                      >
                        {t.ouvrir}
                      </button>
                      {!m.lu && (
                        <button
                          type="button"
                          className="btn btn-primary apub-btn-sm"
                          onClick={() => marquerLu(m.id)}
                          disabled={busy}
                        >
                          {t.marquerLu}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {resp && resp.meta.derniere_page > 1 && (
            <div className="apub-pagination">
              <button
                type="button"
                className="btn btn-outline apub-btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ←
              </button>
              <span>
                {t.pageSur} {page} {t.sur} {resp.meta.derniere_page}
              </span>
              <button
                type="button"
                className="btn btn-outline apub-btn-sm"
                disabled={page >= resp.meta.derniere_page}
                onClick={() => setPage((p) => p + 1)}
              >
                →
              </button>
            </div>
          )}
        </section>
      )}

      {detailLoading && <p>{t.loading}</p>}
    </div>
  );
}
