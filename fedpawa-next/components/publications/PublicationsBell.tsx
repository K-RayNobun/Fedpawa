// ==========================================================
// FEDPAWA — Cloche « Publications » de la barre supérieure
// (Phase 1, décision Q1.10-B : la cloche couvre UNIQUEMENT
// les publications). Badge = nombre de non-lues
// (GET /api/v1/publications/non-lues), panneau = liste des
// publications non lues, clic = navigation vers
// /publications?ouvrir=<id> (le marquage POST /publications/{id}/lu
// est fait à l'ouverture sur la page). « Tout marquer comme lu »
// → POST /publications/tout-lu. Polling 60 s onglet visible.
// Remplace NotificationBell dans le Header (les événements de
// compte gardent leurs canaux existants : espace client, push).
// ==========================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";
import { routesFor } from "@/lib/routes";
import { timeAgo } from "@/lib/notifications";
import {
  fetchNonLues,
  fetchPublicationsPage,
  marquerToutesLues,
  type PublicationSummary,
} from "@/lib/publications";

export interface PublicationsBellProps {
  locale?: Locale;
  /** "desktop" : bouton rond .nav-actions ; "mobile" : menu mobile. */
  variant?: "desktop" | "mobile";
}

const DICT = {
  fr: {
    ariaLabel: "Publications non lues",
    markAll: "Tout marquer comme lu",
    empty: "Aucune publication non lue",
    viewAll: "Voir toutes les publications",
  },
  en: {
    ariaLabel: "Unread publications",
    markAll: "Mark all as read",
    empty: "No unread publications",
    viewAll: "View all publications",
  },
} as const;

const POLL_MS = 60_000;

export default function PublicationsBell({
  locale = "fr",
  variant = "desktop",
}: PublicationsBellProps) {
  const t = DICT[locale];
  const routes = routesFor(locale);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [unread, setUnread] = useState(0);
  const [unreadIds, setUnreadIds] = useState<number[]>([]);
  const [items, setItems] = useState<PublicationSummary[]>([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Client-only : rendu seulement si connecté (token localStorage).
  useEffect(() => {
    setMounted(Boolean(getToken()));
  }, []);

  // Polling 60 s du compteur de non-lues (onglet visible uniquement).
  useEffect(() => {
    if (!mounted) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => {
      fetchNonLues()
        .then((res) => {
          setUnread(res.nombre ?? res.ids?.length ?? 0);
          setUnreadIds(res.ids ?? []);
        })
        .catch(() => {
          /* best-effort */
        });
    };
    const start = () => {
      if (!timer) {
        tick();
        timer = setInterval(tick, POLL_MS);
      }
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [mounted]);

  // Liste des non lues à l'ouverture : titres via la liste publique.
  const loadAll = useCallback(() => {
    fetchPublicationsPage(1, 100)
      .then((res) => {
        const byId = new Map(res.data.map((p) => [p.id, p]));
        setItems(
          unreadIds
            .map((id) => byId.get(id))
            .filter((p): p is PublicationSummary => Boolean(p))
            .sort(
              (a, b) =>
                new Date(b.publie_le ?? 0).getTime() -
                new Date(a.publie_le ?? 0).getTime(),
            ),
        );
      })
      .catch(() => {
        /* best-effort */
      });
  }, [unreadIds]);

  const toggle = () => {
    setOpen((v) => {
      if (!v) void loadAll();
      return !v;
    });
  };

  // Clic-extérieur + Escape ferment le panneau (parité menu Header).
  useEffect(() => {
    if (!open) return;
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("click", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("click", onClickOutside);
    };
  }, [open]);

  // Une publication ouverte sur /publications (POST /lu) décrémente
  // le badge immédiatement (événement émis par PublicationsFeed).
  useEffect(() => {
    if (!mounted) return;
    const onLu = (e: Event) => {
      const id = (e as CustomEvent<{ id: number }>).detail?.id;
      setUnread((u) => Math.max(0, u - 1));
      setUnreadIds((prev) => prev.filter((x) => x !== id));
      setItems((prev) => prev.filter((p) => p.id !== id));
    };
    window.addEventListener("fedpawa:publication-lue", onLu);
    return () => window.removeEventListener("fedpawa:publication-lue", onLu);
  }, [mounted]);

  if (!mounted) return null;

  const markAllRead = () => {
    setUnread(0);
    setUnreadIds([]);
    setItems([]);
    marquerToutesLues().catch(() => {
      /* best-effort */
    });
  };

  /** Clic item : ouvre la publication sur la page publique (?ouvrir=<id>)
      — le POST /publications/{id}/lu est déclenché à l'ouverture. */
  const onItemClick = (id: number) => {
    setOpen(false);
    router.push(`${routes.publications}?ouvrir=${id}`);
  };

  return (
    <div
      className={`notif-bell${variant === "mobile" ? " notif-bell-mobile" : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        className={
          variant === "desktop"
            ? "notif-bell-btn"
            : "lang-toggle mobile-lang-toggle notif-bell-btn"
        }
        aria-label={t.ariaLabel}
        aria-expanded={open}
        aria-haspopup="true"
        title={t.ariaLabel}
        onClick={toggle}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="notif-badge" aria-hidden="true">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown" role="menu">
          <div className="notif-dropdown-head">
            <strong>{t.ariaLabel}</strong>
            <button type="button" className="notif-mark-all" onClick={markAllRead}>
              {t.markAll}
            </button>
          </div>
          <div className="notif-list">
            {items.length === 0 ? (
              <p className="notif-empty">{t.empty}</p>
            ) : (
              items.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  role="menuitem"
                  className="notif-item unread"
                  onClick={() => onItemClick(p.id)}
                >
                  <span className="notif-item-icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22 6 12 13 2 6" />
                    </svg>
                  </span>
                  <span className="notif-item-copy">
                    <strong>{p.titre}</strong>
                    {p.chapeau && (
                      <span className="notif-item-body">{p.chapeau}</span>
                    )}
                    <small>{timeAgo(p.publie_le ?? new Date().toISOString(), locale)}</small>
                  </span>
                </button>
              ))
            )}
          </div>
          <div className="notif-dropdown-foot">
            <Link href={routes.publications} onClick={() => setOpen(false)}>
              {t.viewAll}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
