// ==========================================================
// FEDPAWA — Espace Client > Paramètres (vague E)
// Onglet /espace-client/parametres : interrupteur maître +
// un interrupteur par type d'événement (catalogue CONTRAT.md),
// branchés sur GET/PUT /api/v1/notifications/preferences.
// - Permission notifications demandée UNIQUEMENT au clic sur
//   « Activer les notifications » (jamais au chargement).
// - Si l'API renvoie 404 (backend pas encore livré) : message
//   discret + réessai (bouton + auto borné) — la page ne plante pas.
// ==========================================================

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthGuard } from "@/components/dashboard/useAuthGuard";
import { DashboardUIProvider, useToast } from "@/components/dashboard/UI";
import VerificationBanner from "@/components/verification/VerificationBanner";
import { ApiError } from "@/lib/api";
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  NOTIFICATION_EVENT_TYPES,
  type NotificationPreferences,
} from "@/lib/notifications";
import {
  disablePushSubscription,
  enablePushSubscription,
  getPushSubscription,
} from "@/lib/push";

/** Nombre max de réessais auto quand l'API renvoie 404 (backend en cours de livraison). */
const AUTO_RETRY_MAX = 20;
/** Intervalle entre deux réessais auto (ms). */
const AUTO_RETRY_MS = 30_000;

type PushState = "unknown" | "subscribed" | "not-subscribed";

export default function ParametresClient() {
  const guard = useAuthGuard("client", "fr");
  if (guard.status === "checking" || guard.status === "denied") {
    return null;
  }
  return (
    <DashboardUIProvider>
      {/* Bannière vérification e-mail persistante (CONTRAT-VERIF). */}
      <VerificationBanner locale="fr" />
      <ParametresNotifications />
    </DashboardUIProvider>
  );
}

function ParametresNotifications() {
  const { toast } = useToast();

  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  /** true si le backend ne sert pas encore /notifications/preferences (404). */
  const [backendIndisponible, setBackendIndisponible] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  /** Clé de l'interrupteur en cours d'enregistrement ("global" ou "event:<type>"). */
  const [saving, setSaving] = useState<string | null>(null);

  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [pushState, setPushState] = useState<PushState>("unknown");
  const [pushBusy, setPushBusy] = useState(false);
  /** true si le contexte n'autorise pas le push (HTTP non sécurisé, ex. bac à sable test). */
  const [pushIndisponible, setPushIndisponible] = useState(false);

  const retryCount = useRef(0);
  const retryTimer = useRef<number>(0);

  // ---------- Chargement des préférences ----------
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchNotificationPreferences();
      setPrefs(data);
      setBackendIndisponible(false);
      retryCount.current = 0;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Backend pas encore livré : message discret + réessai borné.
        setBackendIndisponible(true);
        setPrefs(null);
      } else {
        setLoadError(
          err instanceof Error ? err.message : "Erreur de chargement des préférences.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // État push lu en lecture seule (aucune demande de permission ici).
    if ("Notification" in window) setPermission(Notification.permission);
    if ("serviceWorker" in navigator && window.isSecureContext && "PushManager" in window) {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setPushState(sub ? "subscribed" : "not-subscribed"))
        .catch(() => setPushState("not-subscribed"));
    } else {
      // Contexte non sécurisé (ex. test en HTTP) : pas de SW/push possible.
      setPushState("not-subscribed");
      setPushIndisponible(true);
    }
    return () => window.clearTimeout(retryTimer.current);
  }, [load]);

  // Réessai automatique borné tant que le backend renvoie 404.
  useEffect(() => {
    if (!backendIndisponible || retryCount.current >= AUTO_RETRY_MAX) return;
    retryCount.current += 1;
    retryTimer.current = window.setTimeout(() => {
      void load();
    }, AUTO_RETRY_MS);
    return () => window.clearTimeout(retryTimer.current);
  }, [backendIndisponible, load]);

  // ---------- Enregistrement d'une préférence ----------
  const save = useCallback(
    async (key: string, update: Parameters<typeof updateNotificationPreferences>[0], apply: (p: NotificationPreferences) => NotificationPreferences) => {
      if (!prefs) return;
      const previous = prefs;
      setPrefs(apply(previous)); // optimiste
      setSaving(key);
      try {
        const updated = await updateNotificationPreferences(update);
        setPrefs(updated);
        toast("Préférence enregistrée.", "success");
      } catch (err) {
        setPrefs(previous); // rollback
        toast(
          err instanceof Error ? err.message : "Enregistrement impossible.",
          "error",
        );
      } finally {
        setSaving(null);
      }
    },
    [prefs, toast],
  );

  const onToggleGlobal = (checked: boolean) => {
    void save(
      "global",
      { global: checked },
      (p) => ({ ...p, global: checked }),
    );
  };

  const onToggleEvent = (type: string, checked: boolean) => {
    void save(
      `event:${type}`,
      { events: { [type]: checked } },
      (p) => ({
        ...p,
        events: p.events.map((e) => (e.type === type ? { ...e, enabled: checked } : e)),
      }),
    );
  };

  // ---------- Activation push (clic utilisateur UNIQUEMENT) ----------
  const onEnablePush = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      const result = await enablePushSubscription();
      if (result.ok) {
        setPermission("granted");
        setPushState("subscribed");
        toast("Notifications activées sur cet appareil.", "success");
      } else if (result.reason === "denied") {
        setPermission("denied");
        toast("Notifications refusées par le navigateur.", "warning");
      } else if (result.reason === "no-vapid") {
        toast("Clé VAPID indisponible (API).", "error");
      } else {
        toast("Impossible d'activer les notifications.", "error");
      }
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Abonnement push impossible.",
        "error",
      );
    } finally {
      setPushBusy(false);
    }
  };

  const onDisablePush = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      await disablePushSubscription();
      setPushState("not-subscribed");
      toast("Notifications désactivées sur cet appareil.", "success");
    } catch {
      toast("Désactivation impossible.", "error");
    } finally {
      setPushBusy(false);
    }
  };

  // ---------- Rendu ----------
  const events = prefs?.events ?? [];
  const eventEnabled = (type: string) =>
    events.find((e) => e.type === type)?.enabled ?? true;
  const eventLabel = (type: string) =>
    events.find((e) => e.type === type)?.label ??
    NOTIFICATION_EVENT_TYPES.find((t) => t.type === type)?.label ??
    type;

  return (
    <div className="db-layout">
      <aside className="db-sidebar">
        <nav className="db-nav" aria-label="Navigation de l'espace client">
          <Link href="/espace-client" className="db-nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            Tableau de bord
          </Link>
          <Link
            href="/espace-client/parametres"
            className="db-nav-item active"
            aria-current="page"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            Paramètres
          </Link>
        </nav>
      </aside>

      <main className="db-main">
        <section className="db-section fp-settings" aria-labelledby="fp-settings-title">
          <h1 id="fp-settings-title" className="fp-settings-title">Paramètres</h1>
          <p className="fp-settings-muted">
            Gérez vos notifications push et vos préférences par type d'événement.
          </p>

          {/* Bloc push : la permission n'est demandée qu'au clic */}
          <div className="fp-settings-block">
            <h2 className="fp-settings-h2">Notifications push de cet appareil</h2>
            {pushState === "unknown" ? (
              <p className="fp-settings-muted">Vérification de l'abonnement…</p>
            ) : pushState === "subscribed" ? (
              <div className="fp-settings-row">
                <span className="fp-status fp-status-on" role="status">
                  Abonnement push actif
                </span>
                <button
                  type="button"
                  className="fp-btn fp-btn-secondary"
                  onClick={onDisablePush}
                  disabled={pushBusy}
                >
                  Désactiver
                </button>
              </div>
            ) : (
              <div className="fp-settings-row">
                <span className="fp-status fp-status-off" role="status">
                  {pushIndisponible
                    ? "Notifications push indisponibles dans ce contexte (HTTP non sécurisé) — elles sont actives sur https://app.fedpawa.com (HTTPS)."
                    : permission === "denied"
                      ? "Notifications bloquées par le navigateur (à autoriser dans les réglages du navigateur)."
                      : "Notifications non activées sur cet appareil."}
                </span>
                {!pushIndisponible && (
                  <button
                    type="button"
                    className="fp-btn fp-btn-primary"
                    onClick={onEnablePush}
                    disabled={pushBusy || permission === "denied"}
                  >
                    {pushBusy ? "Activation…" : "Activer les notifications"}
                  </button>
                )}
              </div>
            )}
            <p className="fp-settings-muted">
              L'autorisation du navigateur est demandée uniquement lorsque vous cliquez sur
              « Activer les notifications ».
            </p>
          </div>

          {/* Préférences par type */}
          <div className="fp-settings-block">
            <h2 className="fp-settings-h2">Préférences de notification</h2>

            {loading && <p className="fp-settings-muted">Chargement des préférences…</p>}

            {loadError && (
              <div className="fp-settings-error" role="alert">
                <p>{loadError}</p>
                <button type="button" className="fp-btn fp-btn-secondary" onClick={() => void load()}>
                  Réessayer
                </button>
              </div>
            )}

            {backendIndisponible && !loading && (
              <div className="fp-settings-notice" role="status">
                <p>
                  Les préférences de notification ne sont pas encore disponibles sur ce
                  serveur. Nouvelle tentative automatique en cours.
                </p>
                <button type="button" className="fp-btn fp-btn-secondary" onClick={() => void load()}>
                  Réessayer maintenant
                </button>
              </div>
            )}

            {prefs && (
              <>
                <div className="fp-settings-row fp-settings-master">
                  <div>
                    <strong>Notifications globales</strong>
                    <p className="fp-settings-muted">
                      Interrupteur maître : tout éteindre éteint aussi chaque type ci-dessous.
                    </p>
                  </div>
                  <Toggle
                    checked={prefs.global}
                    disabled={saving !== null}
                    busy={saving === "global"}
                    onChange={onToggleGlobal}
                    ariaLabel="Activer ou désactiver toutes les notifications"
                  />
                </div>

                <ul className="fp-settings-events">
                  {NOTIFICATION_EVENT_TYPES.map(({ type }) => (
                    <li key={type} className="fp-settings-row">
                      <span>{eventLabel(type)}</span>
                      <Toggle
                        checked={prefs.global && eventEnabled(type)}
                        disabled={!prefs.global || saving !== null}
                        busy={saving === `event:${type}`}
                        onChange={(v) => onToggleEvent(type, v)}
                        ariaLabel={`Notifications : ${eventLabel(type)}`}
                      />
                    </li>
                  ))}
                </ul>
                {!prefs.global && (
                  <p className="fp-settings-muted">
                    Les notifications globales sont désactivées : aucun type ne peut envoyer de
                    notification push.
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

/** Interrupteur accessible (role=switch). */
function Toggle({
  checked,
  disabled,
  busy,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  disabled?: boolean;
  busy?: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-busy={busy || undefined}
      className={`fp-switch${checked ? " on" : ""}`}
      disabled={disabled || busy}
      onClick={() => onChange(!checked)}
    >
      <span className="fp-switch-knob" />
    </button>
  );
}
