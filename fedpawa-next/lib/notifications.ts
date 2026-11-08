// ==========================================================
// FEDPAWA — Notifications (vague E) : API /api/v1/notifications
// Types + helpers client (polling cloche Header, marquage auto
// espace-client). Aucune route Laravel ici — consommation seule.
// ==========================================================

import { apiAuthGet, apiAuthPost } from "@/lib/auth";

// ---------- Types ----------

/** Événement de notification servi par GET /api/v1/notifications. */
export interface NotificationEvent {
  id: number;
  type: string; // courrier | facture | kyc | abonnement | support | system…
  title: string;
  body: string;
  url: string; // cible de navigation au clic
  read_at: string | null; // ISO 8601, null = non lue
  created_at: string; // ISO 8601
}

/** Réponse GET /api/v1/notifications (les deux variantes 202+ / data). */
export interface NotificationsResponse {
  data?: NotificationEvent[];
  unread_count?: number;
}

/** Réponse POST /api/v1/notifications/read. */
export interface MarkReadResponse {
  read?: number;
}

// ---------- Helpers ----------

/** GET /notifications — ?unread=1 pour le polling du badge. */
export function fetchNotifications(unread = false): Promise<NotificationsResponse> {
  const q = unread ? "?unread=1" : "";
  return apiAuthGet<NotificationsResponse>(`/api/v1/notifications${q}`);
}

/** POST /notifications/read — ids explicites, ou { all: true }. */
export function markNotificationsRead(payload: {
  ids?: number[];
  types?: string[];
  all?: boolean;
}): Promise<MarkReadResponse> {
  return apiAuthPost<MarkReadResponse>("/api/v1/notifications/read", payload);
}

/**
 * "Il y a X" FR/EN — timestamps relatifs de la cloche.
 * Ex : "à l'instant", "il y a 5 min", "2 h ago".
 */
export function timeAgo(iso: string, locale: "fr" | "en"): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return locale === "en" ? "just now" : "à l'instant";
  const h = Math.floor(min / 60);
  const d = Math.floor(h / 24);
  const en = (n: number, unit: string) => `${n} ${unit}${n > 1 ? "s" : ""} ago`;
  if (h < 1) return locale === "en" ? en(min, "min") : `il y a ${min} min`;
  if (d < 1) return locale === "en" ? en(h, "h") : `il y a ${h} h`;
  return locale === "en" ? en(d, "day") : `il y a ${d} j`;
}

/** Icône SVG inline par type (même pattern stroke 2 que le Header). */
export function notificationIconSvg(type: string): string {
  const common = 'fill="none" stroke="currentColor" strokeWidth="2"';
  switch (type) {
    case "courrier":
      return `<svg ${common}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
    case "facture":
      return `<svg ${common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>`;
    case "kyc":
      return `<svg ${common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>`;
    case "abonnement":
      return `<svg ${common}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
    case "support":
      return `<svg ${common}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    default:
      // system & inconnus : cloche pleine
      return `<svg ${common}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
  }
}

// ==========================================================
// Préférences de notification (vague E) — contrat API :
// GET  /api/v1/notifications/preferences
//      → { global: bool, events: [{ type, label, enabled }] }
// PUT  /api/v1/notifications/preferences
//      body { global?: bool, events?: { <type>: bool } } → 200 JSON complet
// ==========================================================

import { apiAuthPut } from "@/lib/auth";

/** Un type d'événement de notification avec son libellé FR. */
export interface NotificationPreferenceEvent {
  type: string;
  label: string;
  enabled: boolean;
}

/** Réponse GET/PUT /api/v1/notifications/preferences (contrat). */
export interface NotificationPreferences {
  global: boolean;
  events: NotificationPreferenceEvent[];
}

/** Corps PUT (partiel accepté par le contrat). */
export interface NotificationPreferencesUpdate {
  global?: boolean;
  events?: Record<string, boolean>;
}

/**
 * Catalogue des types d'événements — source de vérité = CONTRAT.md
 * (repris tel quel ; libellés FR pour l'onglet Paramètres).
 */
export const NOTIFICATION_EVENT_TYPES: ReadonlyArray<{
  type: string;
  label: string;
}> = [
  { type: "contrat_scelle", label: "Contrat scellé" },
  { type: "contrat_signe", label: "Contrat signé" },
  { type: "dossier_statut", label: "Statut du dossier" },
  { type: "facture_emise", label: "Facture émise" },
  { type: "paiement_recu", label: "Paiement reçu" },
  { type: "ticket_reponse", label: "Réponse du support" },
  { type: "courrier_recu", label: "Courrier reçu" },
  { type: "compte_securite", label: "Sécurité du compte (nouvel appareil, mot de passe modifié)" },
];

/** GET /notifications/preferences (Bearer). Rejette ApiError (404 si backend pas prêt). */
export function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  return apiAuthGet<NotificationPreferences>("/api/v1/notifications/preferences");
}

/** PUT /notifications/preferences — renvoie le JSON complet (200). */
export function updateNotificationPreferences(
  update: NotificationPreferencesUpdate,
): Promise<NotificationPreferences> {
  return apiAuthPut<NotificationPreferences>(
    "/api/v1/notifications/preferences",
    update,
  );
}
