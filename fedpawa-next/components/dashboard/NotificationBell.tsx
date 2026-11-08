// ==========================================================
// FEDPAWA — Cloche de notifications du Header (vague E).
// Desktop : dans .nav-actions ; mobile : item du menu mobile.
// Badge non-lues, dropdown 10 dernières, marquage lu au clic +
// navigation, "Tout marquer comme lu", polling 60 s onglet
// visible uniquement (pause si masqué via visibilitychange).
// Rendu seulement si connecté (getToken() truthy).
// ==========================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getToken } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";
import {
  fetchNotifications,
  markNotificationsRead,
  timeAgo,
  type NotificationEvent,
} from "@/lib/notifications";

export interface NotificationBellProps {
  locale?: Locale;
  /** "desktop" : bouton rond .nav-actions ; "mobile" : menu mobile. */
  variant?: "desktop" | "mobile";
}

/** Textes cloche FR/EN (i18n — aucun équivalent page PHP source). */
const DICT = {
  fr: {
    ariaLabel: "Notifications",
    markAll: "Tout marquer comme lu",
    empty: "Aucune notification",
  },
  en: {
    ariaLabel: "Notifications",
    markAll: "Mark all as read",
    empty: "No notifications",
  },
} as const;

/** Intervalle de polling (ms) — onglet visible uniquement. */
const POLL_MS = 60_000;

/** Le dropdown liste les 10 dernières notifications. */
const DROPDOWN_LIMIT = 10;

/**
 * Icône par type — même pattern SVG stroke-2 que les icônes du
 * Header (courrier, facture, kyc, abonnement, support, système).
 */
function NotifIcon({ type }: { type: string }) {
  const svg = {
    courrier: (
      <>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22 6 12 13 2 6" />
      </>
    ),
    facture: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M12 18v-6" />
        <path d="M9 15h6" />
      </>
    ),
    kyc: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="13" y2="17" />
      </>
    ),
    abonnement: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    support: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
    system: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </>
    ),
  }[type] ?? (
    // type inconnu : cloche pleine
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {svg}
    </svg>
  );
}

export default function NotificationBell({
  locale = "fr",
  variant = "desktop",
}: NotificationBellProps) {
  const t = DICT[locale];
  const [mounted, setMounted] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationEvent[]>([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Client-only : évite tout mismatch d'hydratation (token localStorage).
  // Rendu seulement si connecté.
  useEffect(() => {
    setMounted(Boolean(getToken()));
  }, []);

  // Polling 60 s du compte non-lues — actif uniquement si l'onglet
  // est visible ; pause à visibilitychange:hidden, reprise à
  // :visible ; cleanup complet (timer + listener) au démontage.
  useEffect(() => {
    if (!mounted) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => {
      fetchNotifications(true)
        .then((res) => setUnread(res.unread_count ?? res.data?.length ?? 0))
        .catch(() => {
          /* best-effort : silencieux (401/logout, réseau…) */
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

  // Liste complète (10 dernières) au moment de l'ouverture.
  const loadAll = useCallback(() => {
    fetchNotifications()
      .then((res) => setItems((res.data ?? []).slice(0, DROPDOWN_LIMIT)))
      .catch(() => {
        /* best-effort */
      });
  }, []);

  const toggle = () => {
    setOpen((v) => {
      if (!v) void loadAll();
      return !v;
    });
  };

  // Clic-extérieur + Escape ferment le dropdown (parité menu Header).
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

  if (!mounted) return null;

  const markAllRead = () => {
    setUnread(0);
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
    markNotificationsRead({ all: true }).catch(() => {
      /* best-effort */
    });
  };

  /** Clic item : marque lu (optimiste) puis navigue vers n.url. */
  const onItemClick = (n: NotificationEvent) => {
    setOpen(false);
    if (!n.read_at) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read_at: nowISO() } : x)),
      );
      setUnread((u) => Math.max(0, u - 1));
      markNotificationsRead({ ids: [n.id] }).catch(() => {
        /* best-effort */
      });
    }
    if (n.url) window.location.href = n.url;
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
            <button
              type="button"
              className="notif-mark-all"
              onClick={markAllRead}
            >
              {t.markAll}
            </button>
          </div>
          <div className="notif-list">
            {items.length === 0 ? (
              <p className="notif-empty">{t.empty}</p>
            ) : (
              items.map((n) => (
                <button
                  type="button"
                  key={n.id}
                  role="menuitem"
                  className={`notif-item${n.read_at ? "" : " unread"}`}
                  onClick={() => onItemClick(n)}
                >
                  <span className="notif-item-icon" aria-hidden="true">
                    <NotifIcon type={n.type} />
                  </span>
                  <span className="notif-item-copy">
                    <strong>{n.title}</strong>
                    <span className="notif-item-body">{n.body}</span>
                    <small>{timeAgo(n.created_at, locale)}</small>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** ISO now — helper isolé (testabilité). */
function nowISO(): string {
  return new Date().toISOString();
}
