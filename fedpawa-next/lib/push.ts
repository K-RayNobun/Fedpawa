// ==========================================================
// FEDPAWA — helpers push navigateur (vague E), partagés entre
// le bouton du Header (PwaProvider) et l'onglet Paramètres.
// Contrat API : GET /api/v1/push/vapid (public),
// POST /api/v1/push/subscribe {endpoint, keys:{p256dh,auth}},
// POST /api/v1/push/unsubscribe {endpoint} — Bearer Sanctum.
// ==========================================================

import { apiAuthPost } from "@/lib/auth";
import { apiGet } from "@/lib/api";

/** VAPID base64url → Uint8Array (applicationServerKey). */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** GET /api/v1/push/vapid (public) → clé publique, ou null. */
export async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const data = await apiGet<{ publicKey?: string }>("/api/v1/push/vapid");
    return data?.publicKey || null;
  } catch {
    return null;
  }
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Sérialise une PushSubscription en payload du contrat. */
export function serializeSubscription(sub: PushSubscription): PushSubscriptionPayload {
  const raw = sub.toJSON() as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  return {
    endpoint: raw.endpoint ?? "",
    keys: { p256dh: raw.keys?.p256dh ?? "", auth: raw.keys?.auth ?? "" },
  };
}

export type EnablePushResult =
  | { ok: true; payload: PushSubscriptionPayload }
  | { ok: false; reason: "no-notification" | "denied" | "no-vapid" | "error" };

/**
 * Demande la permission PUIS s'abonne — à appeler UNIQUEMENT sur un
 * clic utilisateur (jamais au chargement de page).
 * 1. Notification.requestPermission() (demande à ce moment).
 * 2. navigator.serviceWorker.ready → pushManager.subscribe (VAPID).
 * 3. POST /api/v1/push/subscribe (Bearer) avec {endpoint, keys}.
 */
export async function enablePushSubscription(): Promise<EnablePushResult> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { ok: false, reason: "no-notification" };
  }
  let permission: NotificationPermission;
  try {
    permission = await Notification.requestPermission();
  } catch {
    return { ok: false, reason: "error" };
  }
  if (permission !== "granted") {
    return { ok: false, reason: "denied" };
  }
  if (!("serviceWorker" in navigator)) {
    return { ok: false, reason: "error" };
  }
  const registration = await navigator.serviceWorker.ready;
  const vapid = await fetchVapidPublicKey();
  if (!vapid) {
    return { ok: false, reason: "no-vapid" };
  }
  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapid),
  });
  const payload = serializeSubscription(sub);
  await apiAuthPost("/api/v1/push/subscribe", payload);
  return { ok: true, payload };
}

/** Souscription push actuelle (null si aucune). */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

/** Désabonnement : POST /api/v1/push/unsubscribe {endpoint} + unsubscribe local. */
export async function disablePushSubscription(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  if (!sub) return true;
  const endpoint = sub.endpoint;
  await Promise.allSettled([
    apiAuthPost("/api/v1/push/unsubscribe", { endpoint }),
    sub.unsubscribe(),
  ]);
  return true;
}
