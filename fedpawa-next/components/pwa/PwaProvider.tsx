// ==========================================================
// FEDPAWA — PwaProvider (PWA vague E)
// Doc Next 16 : guides progressive-web-apps.md + manifest.md.
// 'use client' — monté dans les DEUX layouts racines
// (app/(site)/layout.tsx et app/en/layout.tsx), pattern
// RevealOnScroll : composant client sans rendu.
//
// 1. Enregistre /sw.js (scope /, updateViaCache none).
// 2. Bouton « Activer les notifications » rendu PAR le Header
//    via pushNotificationsEnabled — ce provider fournit la
//    logique + l'API contextuelle :
//    - masqué si permission != "default" ou refus persistant
//      (localStorage "fedpawa-push-dismissed") ;
//    - clic → GET /api/v1/push/vapid (public) →
//      sw.pushManager.subscribe({ userVisibleOnly, applicationServerKey })
//      → POST /api/v1/push/subscribe { endpoint, keys:{p256dh,auth} }
//      en Bearer (lib/auth.ts apiAuthPost) → toast ;
//    - refus → flag localStorage, plus jamais redemandé.
// 3. Écoute le message PUSH_RESUBSCRIBE du SW
//    (pushsubscriptionchange) → re-POST /push/subscribe en Bearer.
// Toast maison .fp-toast* (classes déjà dans globals.css) —
// parité fedpawa-ui.js : un seul toast, 4 s, aria-live.
// ==========================================================

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiAuthPost } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

/** Flag localStorage : l'utilisateur a refusé — ne plus jamais demander. */
export const PUSH_DISMISSED_KEY = "fedpawa-push-dismissed";

interface PwaTexts {
  /** Libellé du bouton (i18n FR/EN). */
  activate: string;
  ariaLabel: string;
  toastSuccess: string;
  toastDenied: string;
  toastError: string;
  toastUnauthenticated: string;
}

const TEXTS: Record<Locale, PwaTexts> = {
  fr: {
    activate: "Activer les notifications",
    ariaLabel: "Activer les notifications push",
    toastSuccess: "Notifications activées.",
    toastDenied: "Notifications refusées.",
    toastError: "Impossible d'activer les notifications.",
    toastUnauthenticated: "Connectez-vous pour activer les notifications.",
  },
  en: {
    activate: "Enable notifications",
    ariaLabel: "Enable push notifications",
    toastSuccess: "Notifications enabled.",
    toastDenied: "Notifications declined.",
    toastError: "Could not enable notifications.",
    toastUnauthenticated: "Sign in to enable notifications.",
  },
};

interface PushSubscribePayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

interface PwaContextValue {
  /** true si le bouton doit s'afficher (permission default, pas de refus, SW prêt). */
  canAsk: boolean;
  /** Clic sur « Activer les notifications ». */
  enableNotifications: () => Promise<void>;
  texts: PwaTexts;
  busy: boolean;
}

const PwaContext = createContext<PwaContextValue>({
  canAsk: false,
  enableNotifications: async () => {},
  texts: TEXTS.fr,
  busy: false,
});

/** Hook consommé par le Header pour rendre le bouton. */
export function usePwaNotifications(): PwaContextValue {
  return useContext(PwaContext);
}

/** VAPID base64url → Uint8Array (guide PWA Next 16). */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** GET /api/v1/push/vapid (public, sans auth) — PushController Laravel. */
async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const data = await apiGet<{ publicKey?: string }>("/api/v1/push/vapid");
    return data?.publicKey || null;
  } catch {
    return null;
  }
}

/** Extrait { endpoint, keys } d'une PushSubscription. */
function serializeSubscription(
  sub: PushSubscription,
): PushSubscribePayload & { endpoint: string } {
  const raw = sub.toJSON() as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  return {
    endpoint: raw.endpoint ?? "",
    keys: {
      p256dh: raw.keys?.p256dh ?? "",
      auth: raw.keys?.auth ?? "",
    },
  };
}

export default function PwaProvider({
  locale = "fr",
  children,
}: {
  locale?: Locale;
  children?: ReactNode;
}) {
  const texts = TEXTS[locale] ?? TEXTS.fr;
  const [canAsk, setCanAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);
  const toastTimer = useRef<number>(0);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "warning" | "info") => {
      setToast({ message, type });
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 4000);
    },
    [],
  );

  // --- 1. Enregistrement du SW + état initial de la permission ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncCanAsk = () => {
      const dismissed =
        window.localStorage.getItem(PUSH_DISMISSED_KEY) === "1";
      setCanAsk(
        typeof Notification !== "undefined" &&
          Notification.permission === "default" &&
          !dismissed &&
          "serviceWorker" in navigator &&
          "PushManager" in window,
      );
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          // Enregistrement best-effort (le site reste 100 % fonctionnel).
        });
    }

    syncCanAsk();

    // Le SW relaie le réabonnement pushsubscriptionchange.
    const onMessage = (event: MessageEvent) => {
      const data = event.data as {
        type?: string;
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      } | null;
      if (!data || data.type !== "PUSH_RESUBSCRIBE") return;
      if (!data.endpoint || !data.keys?.p256dh || !data.keys?.auth) return;
      apiAuthPost("/api/v1/push/subscribe", {
        endpoint: data.endpoint,
        keys: { p256dh: data.keys.p256dh, auth: data.keys.auth },
      }).catch(() => {
        // Token expiré : la prochaine souscription manuelle repartira propre.
      });
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, []);

  // --- 2. Clic « Activer les notifications » ---
  const enableNotifications = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (typeof Notification === "undefined") {
        showToast(texts.toastError, "error");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        // Refus → flag : plus jamais demandé.
        window.localStorage.setItem(PUSH_DISMISSED_KEY, "1");
        showToast(texts.toastDenied, "warning");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapid = await fetchVapidPublicKey();
      if (!vapid) {
        showToast(texts.toastError, "error");
        return;
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
      const payload = serializeSubscription(sub);

      await apiAuthPost("/api/v1/push/subscribe", payload);
      showToast(texts.toastSuccess, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.toLowerCase().includes("auth") || message.includes("401")) {
        showToast(texts.toastUnauthenticated, "warning");
      } else {
        showToast(texts.toastError, "error");
      }
    } finally {
      setCanAsk(
        typeof Notification !== "undefined" &&
          Notification.permission === "default" &&
          window.localStorage.getItem(PUSH_DISMISSED_KEY) !== "1",
      );
      setBusy(false);
    }
  }, [busy, texts, showToast]);

  const value = { canAsk, enableNotifications, texts, busy };

  return (
    <PwaContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fp-toast-container" role="status" aria-live="polite">
          <div
            className={`fp-toast fp-toast-${toast.type} show`}
            onClick={() => setToast(null)}
          >
            <div className="fp-toast-body">{toast.message}</div>
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
}
