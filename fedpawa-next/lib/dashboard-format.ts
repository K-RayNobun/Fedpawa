// ==========================================================
// FEDPAWA — helpers formatage dashboards (vague D)
// Répliques exactes des formatters de dashboard.js / admin-dashboard.js :
// dates fr-FR (« 20/09/2026 »), montants FCFA localisés, badges de statut.
// ==========================================================

/** new Date('2026-09-20 14:30'.replace(' ', 'T')) — parité source. */
function parseSourceDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date courte fr-FR — fmtDate admin-dashboard.js. */
export function fmtDate(value: string | null | undefined): string {
  const d = parseSourceDate(value);
  return d ? d.toLocaleDateString("fr-FR") : "—";
}

/** Date+heure fr-FR — format messages administration (dashboard.js). */
export function fmtDateTime(value: string | null | undefined): string {
  const d = parseSourceDate(value);
  if (!d) return "";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Montant FCFA localisé fr-FR — fmtFCFA admin-dashboard.js. */
export function fmtFCFA(value: number | null | undefined): string {
  return `${Number(value ?? 0).toLocaleString("fr-FR")} FCFA`;
}

/** Taille de fichier lisible — fmtSize admin_document.html. */
export function fmtSize(n: number | null | undefined): string {
  const num = Number(n);
  if (!Number.isFinite(num) || num < 0) return "—";
  if (num < 1024) return `${num} o`;
  if (num < 1048576) return `${(num / 1024).toFixed(1)} Ko`;
  return `${(num / 1048576).toFixed(2)} Mo`;
}

export type BadgeVariant = "success" | "warning" | "danger" | "muted";

/** Variante de badge selon le statut métier — statutBadge admin-dashboard.js. */
export function statutBadgeVariant(statut: string | null | undefined): BadgeVariant {
  const s = statut ?? "";
  if (["actif", "recu", "approuvé", "scanné", "scanné & archivé", "closed", "resolved"].includes(s)) {
    return "success";
  }
  if (["en_attente", "en_cours", "non_lu", "open", "expire bientôt", "suspendu", "répondu", "repondu", "in_progress"].includes(s)) {
    return "warning";
  }
  if (["rejeté", "rejete", "résilié", "resilie"].includes(s)) return "danger";
  return "muted";
}

/** Initiales avatar (2 premières lettres des mots du nom) — dashboard.js. */
export function initials(nom: string | null | undefined): string {
  return (nom ?? "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
