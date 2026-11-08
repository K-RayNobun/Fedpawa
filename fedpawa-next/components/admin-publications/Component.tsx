// ==========================================================
// FEDPAWA — Admin Publications (Phase 1) : écran admin minimal.
// Liste (tous statuts, filtre), création/édition (titre, chapeau,
// contenu, type, programmation publie_le), upload médias
// (POST multipart /admin/publications/{id}/medias), publier /
// dépublier / supprimer. Contrat API §3. Rôle admin requis (Guarded).
// ==========================================================

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { type Locale, getPageDictionary } from "@/lib/i18n";
import { routesFor } from "@/lib/routes";
import {
  adminFetchPublications,
  adminCreatePublication,
  adminUpdatePublication,
  adminUploadMedia,
  adminDeleteMedia,
  adminPublier,
  adminDepublier,
  adminDeletePublication,
  PUBLICATIONS_PAR_PAGE,
  type AdminPublication,
  type PublicationMedia,
  type PublicationStatut,
  type PublicationType,
  type PublicationsPage,
} from "@/lib/publications";

export interface AdminPublicationsProps {
  locale?: Locale;
}

const TYPES: PublicationType[] = [
  "texte",
  "texte_image",
  "texte_video",
  "galerie",
];

const STATUTS: (PublicationStatut | "")[] = [
  "",
  "brouillon",
  "programme",
  "publie",
  "depublie",
];

function statutVariant(s: string): string {
  switch (s) {
    case "publie":
      return "success";
    case "programme":
      return "warning";
    case "depublie":
      return "danger";
    default:
      return "muted";
  }
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

/** datetime-local "YYYY-MM-DDTHH:mm" → ISO, ou null si vide. */
function toISO(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** ISO → valeur datetime-local. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface FormState {
  titre: string;
  chapeau: string;
  contenu: string;
  type: PublicationType;
  publie_le: string; // datetime-local
}

const EMPTY_FORM: FormState = {
  titre: "",
  chapeau: "",
  contenu: "",
  type: "texte",
  publie_le: "",
};

export default function AdminPublications({
  locale = "fr",
}: AdminPublicationsProps) {
  const t = getPageDictionary(locale, "admin_publications");
  const routes = routesFor(locale);

  const [resp, setResp] = useState<PublicationsPage<AdminPublication> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statut, setStatut] = useState<PublicationStatut | "">(("" as PublicationStatut | ""));
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminPublication | null | "new">(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    adminFetchPublications({ statut, page, par_page: PUBLICATIONS_PAR_PAGE })
      .then((r) => setResp(r))
      .catch(() => setError(t.loadError))
      .finally(() => setLoading(false));
  }, [statut, page, t.loadError]);

  useEffect(() => {
    load();
  }, [load]);

  const startNew = () => {
    setEditing("new");
    setForm(EMPTY_FORM);
    setMessage("");
    setUploadFile(null);
  };

  const startEdit = (pub: AdminPublication) => {
    setEditing(pub);
    setForm({
      titre: pub.titre ?? "",
      chapeau: pub.chapeau ?? "",
      contenu: pub.contenu ?? "",
      type: pub.type,
      publie_le: toLocalInput(pub.publie_le),
    });
    setMessage("");
    setUploadFile(null);
  };

  const closeForm = () => setEditing(null);

  const save = () => {
    if (!editing) return;
    setBusy(true);
    setMessage("");
    const payload = {
      titre: form.titre,
      chapeau: form.chapeau || null,
      contenu: form.contenu || null,
      type: form.type,
      // programme : publie_le futur → statut "programme" côté API.
      publie_le: toISO(form.publie_le),
    };
    const req =
      editing === "new"
        ? adminCreatePublication(payload)
        : adminUpdatePublication(editing.id, payload);
    req
      .then(() => {
        setMessage(t.saved);
        setEditing(null);
        load();
      })
      .catch(() => setMessage(t.errorGeneric))
      .finally(() => setBusy(false));
  };

  const onUpload = () => {
    if (!editing || editing === "new" || !uploadFile) return;
    const type: "image" | "video" = uploadFile.type.startsWith("video/")
      ? "video"
      : "image";
    const ordre = (editing.medias?.length ?? 0);
    setBusy(true);
    setMessage("");
    adminUploadMedia(editing.id, uploadFile, type, ordre)
      .then(() => {
        setUploadFile(null);
        setMessage(t.saved);
        load();
        // Recharge la fiche éditée pour afficher le nouveau média.
        return adminFetchPublications({
          statut,
          page,
          par_page: PUBLICATIONS_PAR_PAGE,
        });
      })
      .then((r) => {
        const found = r.data.find((p) => p.id === editing.id);
        if (found) setEditing(found);
      })
      .catch(() => setMessage(t.errorGeneric))
      .finally(() => setBusy(false));
  };

  const onDeleteMedia = (media: PublicationMedia) => {
    if (!editing || editing === "new" || media.id === undefined) return;
    setBusy(true);
    adminDeleteMedia(editing.id, media.id)
      .then(() => {
        load();
        return adminFetchPublications({
          statut,
          page,
          par_page: PUBLICATIONS_PAR_PAGE,
        });
      })
      .then((r) => {
        const found = r.data.find((p) => p.id === editing.id);
        if (found) setEditing(found);
      })
      .catch(() => setMessage(t.errorGeneric))
      .finally(() => setBusy(false));
  };

  const onPublier = (id: number) => {
    setBusy(true);
    adminPublier(id)
      .then(() => load())
      .catch(() => setMessage(t.errorGeneric))
      .finally(() => setBusy(false));
  };

  const onDepublier = (id: number) => {
    setBusy(true);
    adminDepublier(id)
      .then(() => load())
      .catch(() => setMessage(t.errorGeneric))
      .finally(() => setBusy(false));
  };

  const onSupprimer = (id: number) => {
    if (!window.confirm(t.confirmSupprimer)) return;
    setBusy(true);
    adminDeletePublication(id)
      .then(() => {
        if (editing && editing !== "new" && editing.id === id) setEditing(null);
        load();
      })
      .catch(() => setMessage(t.errorGeneric))
      .finally(() => setBusy(false));
  };

  return (
    <div className="db-main apub-main">
      <div className="db-welcome">
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn btn-outline" href={routes.adminDashboard}>
            {t.backDashboard}
          </Link>
          <button type="button" className="btn btn-primary" onClick={startNew}>
            {t.newPublication}
          </button>
        </div>
      </div>

      {message && (
        <p className="apub-message" role="status">
          {message}
        </p>
      )}

      {/* ============== FORMULAIRE création / édition ============== */}
      {editing !== null && (
        <section className="db-section apub-form">
          <h2>{editing === "new" ? t.formNew : t.formEdit}</h2>
          <div className="apub-grid">
            <label>
              <span>{t.fieldTitre}</span>
              <input
                type="text"
                maxLength={200}
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                required
              />
            </label>
            <label>
              <span>{t.fieldChapeau}</span>
              <input
                type="text"
                maxLength={300}
                value={form.chapeau}
                onChange={(e) => setForm({ ...form, chapeau: e.target.value })}
              />
            </label>
            <label>
              <span>{t.fieldType}</span>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as PublicationType })
                }
              >
                {TYPES.map((ty) => (
                  <option key={ty} value={ty}>
                    {t[`type_${ty}`] ?? ty}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t.fieldPublieLe}</span>
              <input
                type="datetime-local"
                value={form.publie_le}
                onChange={(e) =>
                  setForm({ ...form, publie_le: e.target.value })
                }
              />
            </label>
            <label className="apub-wide">
              <span>{t.fieldContenu}</span>
              <textarea
                rows={8}
                value={form.contenu}
                onChange={(e) => setForm({ ...form, contenu: e.target.value })}
              />
            </label>
          </div>

          {/* Médias : édition d'une publication existante uniquement */}
          {editing !== "new" && (
            <div className="apub-medias">
              <h3>{t.medias}</h3>
              {editing.medias && editing.medias.length > 0 && (
                <ul className="apub-media-list">
                  {[...editing.medias]
                    .sort((a, b) => a.ordre - b.ordre)
                    .map((m) => (
                      <li key={m.id ?? m.url}>
                        {m.type === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.url} alt={m.nom_origine ?? ""} />
                        ) : (
                          <video src={m.url} preload="metadata" />
                        )}
                        <span>
                          {m.type} · #{m.ordre}
                        </span>
                        <button
                          type="button"
                          className="btn btn-outline apub-btn-sm"
                          onClick={() => onDeleteMedia(m)}
                          disabled={busy}
                        >
                          {t.deleteMedia}
                        </button>
                      </li>
                    ))}
                </ul>
              )}
              <div className="apub-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  onChange={(e) =>
                    setUploadFile(e.target.files?.[0] ?? null)
                  }
                />
                <button
                  type="button"
                  className="btn btn-outline apub-btn-sm"
                  onClick={onUpload}
                  disabled={busy || !uploadFile}
                >
                  {busy ? t.uploading : t.uploadMedia}
                </button>
              </div>
              <p className="apub-hint">{t.uploadHint}</p>
            </div>
          )}

          <div className="apub-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={save}
              disabled={busy || !form.titre}
            >
              {busy ? t.saving : editing === "new" ? t.create : t.save}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={closeForm}
              disabled={busy}
            >
              {t.cancel}
            </button>
          </div>
        </section>
      )}

      {/* ============== LISTE ============== */}
      <section className="db-section">
        <div className="apub-toolbar">
          <label>
            <select
              value={statut}
              onChange={(e) => {
                setStatut(e.target.value as PublicationStatut | "");
                setPage(1);
              }}
            >
              <option value="">{t.filterAll}</option>
              {STATUTS.filter((s) => s !== "").map((s) => (
                <option key={s} value={s}>
                  {t[`statut_${s}`]}
                </option>
              ))}
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
                <th>{t.colTitre}</th>
                <th>{t.colType}</th>
                <th>{t.colStatut}</th>
                <th>{t.colDate}</th>
                <th>{t.vues}</th>
                <th>{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {resp.data.map((pub) => (
                <tr key={pub.id}>
                  <td>{pub.titre}</td>
                  <td>{t[`type_${pub.type}`] ?? pub.type}</td>
                  <td>
                    <span className={`badge badge-${statutVariant(pub.statut)}`}>
                      {t[`statut_${pub.statut}`] ?? pub.statut}
                    </span>
                  </td>
                  <td>{fmtDate(pub.publie_le ?? pub.created_at, locale)}</td>
                  <td>{pub.vues ?? 0}</td>
                  <td className="apub-row-actions">
                    <button
                      type="button"
                      className="btn btn-outline apub-btn-sm"
                      onClick={() => startEdit(pub)}
                    >
                      {t.edit}
                    </button>
                    {pub.statut !== "publie" && (
                      <button
                        type="button"
                        className="btn btn-primary apub-btn-sm"
                        onClick={() => onPublier(pub.id)}
                        disabled={busy}
                      >
                        {t.publier}
                      </button>
                    )}
                    {pub.statut === "publie" && (
                      <button
                        type="button"
                        className="btn btn-outline apub-btn-sm"
                        onClick={() => onDepublier(pub.id)}
                        disabled={busy}
                      >
                        {t.depublier}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-outline apub-btn-sm apub-danger"
                      onClick={() => onSupprimer(pub.id)}
                      disabled={busy}
                    >
                      {t.supprimer}
                    </button>
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
              {page} / {resp.meta.derniere_page}
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
    </div>
  );
}
