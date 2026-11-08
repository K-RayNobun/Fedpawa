// ==========================================================
// FEDPAWA — session côté client (vague D)
// Parité auth-guard.js source : le rôle décide de l'espace
// (client → espace client, admin → dashboard admin, anonyme
// → authentification). Token Sanctum (décision verrouillée BE)
// stocké dans localStorage sous "fedpawa_token", envoyé en
// Authorization: Bearer par apiAuthGet/apiAuthPost.
// ==========================================================

import { API_BASE_URL, ApiError } from "@/lib/api";

/** Clé localStorage du token Sanctum (posée par la page login, vague C). */
export const TOKEN_STORAGE_KEY = "fedpawa_token";

export type UserRole = "client" | "admin";

/** Réponse GET /api/v1/auth/me (toujours 200). */
export interface MeResponse {
  authenticated: boolean;
  role?: UserRole;
  name?: string;
  email?: string;
  /** Statut du dernier dossier KYC (null si jamais soumis) — parité /api/me. */
  kyc_status?: string | null;
  /**
   * Contrat VERIF : présent dans login et /me.
   * `false` = e-mail non vérifié (bannière + modal actifs côté front).
   * Absent (backend pas encore déployé) = traité comme vérifié côté front
   * (dégradation gracieuse) : le gating réel reste serveur (403).
   */
  email_verified?: boolean;
}

/** Lit le token Sanctum (null si absent). Client-only. */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

/** Écrit / supprime le token. Client-only. */
export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/** Headers d'authentification si un token existe. */
export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_BASE_URL.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path), init);
  } catch {
    throw new ApiError(0, "Erreur réseau : API inaccessible.");
  }
  if (!response.ok) {
    const parsed = (await response.json().catch(() => null)) as
      | { message?: string; error?: string }
      | null;
    const message =
      parsed?.error ?? parsed?.message ?? `Erreur API (${response.status}).`;
    throw new ApiError(response.status, message, parsed ?? null);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

/** GET authentifié (Bearer automatique si token présent). */
export function apiAuthGet<T>(path: string): Promise<T> {
  return request<T>(path, {
    method: "GET",
    headers: authHeaders(),
    credentials: "include",
  });
}

/**
 * GET authentifié qui renvoie un blob (documents PDF servis par
 * GET /api/v1/document — jamais de JSON). Retourne la réponse brute :
 * le contrôleur stream le PDF avec Content-Disposition inline.
 */
export async function apiAuthGetBlob(path: string): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      method: "GET",
      headers: authHeaders(),
      credentials: "include",
    });
  } catch {
    throw new ApiError(0, "Erreur réseau : API inaccessible.");
  }
  if (!response.ok) {
    throw new ApiError(response.status, `Document indisponible (${response.status}).`);
  }
  return response.blob();
}

/** POST authentifié, corps JSON sérialisé. */
export function apiAuthPost<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/** PUT authentifié, corps JSON sérialisé (préférences notifications, vague E). */
export function apiAuthPut<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * POST authentifié multipart (uploads KYC / courriers).
 * Le Content-Type est posé par le navigateur (boundary FormData).
 */
export function apiAuthPostForm<T>(path: string, form: FormData): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: form,
  });
}

/** Interroge /api/v1/auth/me — toujours 200, jamais throw réseau ? Si, throw. */
export function fetchMe(): Promise<MeResponse> {
  return request<MeResponse>("/api/v1/auth/me", {
    method: "GET",
    headers: authHeaders(),
    credentials: "include",
  });
}

/**
 * Déconnexion (parité main.js source : POST /api/logout en
 * best-effort, puis redirection) : POST /api/v1/auth/logout
 * (auth:sanctum, Bearer automatique) puis suppression du token
 * local AVANT la redirection vers la page d'authentification.
 * Erreurs réseau ignorées — le token local est toujours purgé.
 *
 * PWA : avant la purge, best-effort POST /api/v1/push/unsubscribe
 * {endpoint} pour retirer la souscription push côté API (l'endpoint
 * n'est plus utilisable sans token). Unsubscribe navigateur +
 * purge flag refus : la prochaine session pourra re-souscrire.
 */
export async function logout(authPath: string): Promise<void> {
  // PWA — best-effort : retire la souscription push côté serveur.
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await Promise.allSettled([
          sub.unsubscribe(),
          request<unknown>("/api/v1/push/unsubscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders(),
            },
            credentials: "include",
            body: JSON.stringify({ endpoint: sub.endpoint }),
          }),
        ]);
      }
    }
  } catch {
    // Push = best-effort : ne bloque jamais la déconnexion.
  }
  window.localStorage.removeItem("fedpawa-push-dismissed");
  try {
    await request<unknown>("/api/v1/auth/logout", {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
    });
  } catch {
    // Dégradation gracieuse (parité source) : on purge quand même.
  }
  setToken(null);
  window.location.href = authPath;
}

/** Suppression authentifiée (DELETE). */
export function apiAuthDelete<T>(path: string): Promise<T> {
  return request<T>(path, {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  });
}
