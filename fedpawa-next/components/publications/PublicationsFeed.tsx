// ==========================================================
// FEDPAWA — Publications : flux public paginé (Phase 1).
// Client component : lit GET /api/v1/publications?page=&par_page=
// (repli démo si l'API ne répond pas encore), rend les 4 types
// (texte, texte+image, texte+vidéo, galerie), pagination, et
// marquage automatique à l'ouverture via POST /publications/{id}/lu
// quand le visiteur est connecté (?ouvrir=<id> depuis la cloche).
// useSearchParams → wrapper <Suspense> dans la page (cacheComponents).
// ==========================================================

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { type Locale, getPageDictionary } from "@/lib/i18n";
import { routesFor } from "@/lib/routes";
import { getToken } from "@/lib/auth";
import {
  fetchPublicationsPage,
  fetchPublicationDetail,
  fetchNonLues,
  marquerPublicationLue,
  PUBLICATIONS_PAR_PAGE,
  type PublicationDetail,
  type PublicationMedia,
  type PublicationSummary,
  type PublicationsPage,
} from "@/lib/publications";

export interface PublicationsFeedProps {
  locale?: Locale;
}

function fmtDate(iso: string | null, locale: Locale): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(d);
}

function mediaImage(medias: PublicationMedia[]): PublicationMedia | undefined {
  return [...medias].sort((a, b) => a.ordre - b.ordre).find((m) => m.type === "image");
}

function mediaVideo(medias: PublicationMedia[]): PublicationMedia | undefined {
  return [...medias].sort((a, b) => a.ordre - b.ordre).find((m) => m.type === "video");
}

function galleryImages(medias: PublicationMedia[]): PublicationMedia[] {
  return medias.filter((m) => m.type === "image").sort((a, b) => a.ordre - b.ordre);
}

/** Aperçu média selon le type (contrat §4 : rendu des 4 types). */
function MediaPreview({
  pub,
  t,
}: {
  pub: PublicationSummary;
  t: Record<string, string>;
}) {
  if (pub.type === "texte_image") {
    const img = mediaImage(pub.medias);
    if (!img) return null;
    return (
      <img
        className="pub-media-img"
        src={img.url}
        alt={pub.titre}
        loading="lazy"
      />
    );
  }
  if (pub.type === "texte_video") {
    const vid = mediaVideo(pub.medias);
    if (!vid) return null;
    const poster = mediaImage(pub.medias)?.url;
    return (
      <video
        className="pub-media-video"
        src={vid.url}
        poster={poster}
        controls
        preload="metadata"
        aria-label={`${t.videoLabel} — ${pub.titre}`}
      />
    );
  }
  if (pub.type === "galerie") {
    const imgs = galleryImages(pub.medias);
    if (imgs.length === 0) return null;
    return (
      <div className="pub-gallery" aria-label={t.galleryOpen}>
        {imgs.slice(0, 4).map((m) => (
          <img key={m.id ?? m.url} src={m.url} alt={pub.titre} loading="lazy" />
        ))}
      </div>
    );
  }
  return null; // texte seul
}

export default function PublicationsFeed({ locale = "fr" }: PublicationsFeedProps) {
  const t = getPageDictionary(locale, "publications");
  const routes = routesFor(locale);
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const ouvrirParam = searchParams.get("ouvrir");

  const [resp, setResp] = useState<PublicationsPage<PublicationSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, PublicationDetail>>({});
  const [unreadIds, setUnreadIds] = useState<Set<number>>(new Set());
  const [connected, setConnected] = useState(false);

  // expandedRef miroir de expandedId pour décider ouvrir/fermer sans
  // dépendre de l'état dans le callback (évite la course avec le
  // chargement des non-lues au montage).
  const expandedRef = useRef<number | null>(null);
  // Publications marquées lues pendant cette session : le rechargement
  // des non-lues (polling) ne doit pas les réintroduire.
  const readNowRef = useRef<Set<number>>(new Set());

  // Chargement de la page demandée + non-lues si connecté.
  useEffect(() => {
    setConnected(Boolean(getToken()));
    setLoading(true);
    fetchPublicationsPage(page, PUBLICATIONS_PAR_PAGE)
      .then((r) => {
        setResp(r);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    if (getToken()) {
      fetchNonLues()
        .then((n) =>
          setUnreadIds(
            new Set(
              (n.ids ?? []).filter((id) => !readNowRef.current.has(id)),
            ),
          ),
        )
        .catch(() => {
          /* best-effort */
        });
    }
  }, [page]);

  // Ouverture ciblée (?ouvrir=<id> depuis la cloche) : on ouvre la
  // carte et on marque la publication comme lue (POST /lu).
  useEffect(() => {
    if (!ouvrirParam) return;
    const id = Number(ouvrirParam);
    if (Number.isFinite(id)) toggle(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvrirParam]);

  const toggle = (id: number) => {
    const willExpand = expandedRef.current !== id;
    expandedRef.current = willExpand ? id : null;
    setExpandedId(expandedRef.current);
    if (!willExpand) return;
    // Détail à l'ouverture.
    fetchPublicationDetail(id)
      .then((d) => setDetails((prev) => ({ ...prev, [id]: d })))
      .catch(() => {
        /* best-effort */
      });
    // Marquage automatique à l'ouverture (client connecté) :
    // POST /publications/{id}/lu est idempotent côté API — on le
    // déclenche à chaque ouverture, sans attendre les non-lues.
    if (getToken()) {
      readNowRef.current.add(id);
      setUnreadIds((prev) => {
        if (!prev.has(id)) return prev;
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
      marquerPublicationLue(id).catch(() => {
        /* best-effort */
      });
      // La cloche du header décrémente son badge immédiatement.
      window.dispatchEvent(
        new CustomEvent("fedpawa:publication-lue", { detail: { id } }),
      );
    }
  };

  return (
    <>
      {/* ============== HERO ============== */}
      <section className="page-hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">{t.heroBadge}</div>
            <h1>{t.heroTitle}</h1>
            <p className="subtitle">{t.heroSubtitle}</p>
            <p>{t.heroText}</p>
          </div>
        </div>
      </section>

      {/* ============== LISTE ============== */}
      <section className="section-padding">
        <div className="container">
          {resp?.demo && (
            <p className="pub-demo-notice" role="status">
              {t.demoNotice}
            </p>
          )}

          {loading && !resp && <p className="pub-empty">{t.loading}</p>}

          {!loading && resp && resp.data.length === 0 && (
            <p className="pub-empty">{t.empty}</p>
          )}

          <div className="pub-feed">
            {resp?.data.map((pub) => {
              const expanded = expandedId === pub.id;
              const detail = details[pub.id];
              const unread = unreadIds.has(pub.id);
              return (
                <article
                  key={pub.id}
                  id={`pub-${pub.id}`}
                  className={`pub-card${expanded ? " expanded" : ""}`}
                >
                  <header className="pub-card-head">
                    <span className="badge badge-info">{t[`type_${pub.type}`] ?? pub.type}</span>
                    <time dateTime={pub.publie_le ?? undefined}>
                      {t.publishedOn} {fmtDate(pub.publie_le, locale)}
                    </time>
                    {connected && unread && (
                      <span className="pub-unread">{t.unread}</span>
                    )}
                  </header>

                  <h2 className="pub-card-title">{pub.titre}</h2>
                  {pub.chapeau && <p className="pub-card-chapeau">{pub.chapeau}</p>}

                  <MediaPreview pub={pub} t={t} />

                  <div className="pub-card-foot">
                    <button
                      type="button"
                      className="btn btn-outline pub-toggle"
                      aria-expanded={expanded}
                      onClick={() => toggle(pub.id)}
                    >
                      {expanded ? t.close : t.readMore}
                    </button>
                    {detail && (
                      <span className="pub-vues">
                        {detail.vues} {t.views}
                      </span>
                    )}
                  </div>

                  {expanded && (
                    <div className="pub-card-body">
                      {detail?.contenu ? (
                        <div
                          className="pub-content"
                          dangerouslySetInnerHTML={{ __html: detail.contenu }}
                        />
                      ) : (
                        <p className="pub-empty">{t.loading}</p>
                      )}
                      {pub.type === "galerie" && (
                        <div className="pub-gallery pub-gallery-full">
                          {galleryImages(pub.medias).map((m) => (
                            <img
                              key={m.id ?? m.url}
                              src={m.url}
                              alt={pub.titre}
                              loading="lazy"
                            />
                          ))}
                        </div>
                      )}
                      {pub.type === "texte_video" && mediaVideo(pub.medias) && (
                        <video
                          className="pub-media-video"
                          src={mediaVideo(pub.medias)!.url}
                          controls
                          preload="metadata"
                          aria-label={`${t.videoLabel} — ${pub.titre}`}
                        />
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* ============== PAGINATION ============== */}
          {resp && resp.meta.derniere_page > 1 && (
            <nav className="pub-pagination" aria-label="Pagination">
              {resp.meta.page > 1 && (
                <Link
                  className="btn btn-outline"
                  href={`${routes.publications}?page=${resp.meta.page - 1}`}
                >
                  {t.paginationPrev}
                </Link>
              )}
              <span className="pub-pagination-info">
                {t.paginationPage} {resp.meta.page} {t.paginationOf}{" "}
                {resp.meta.derniere_page}
              </span>
              {resp.meta.page < resp.meta.derniere_page && (
                <Link
                  className="btn btn-primary"
                  href={`${routes.publications}?page=${resp.meta.page + 1}`}
                >
                  {t.paginationNext}
                </Link>
              )}
            </nav>
          )}
        </div>
      </section>
    </>
  );
}
