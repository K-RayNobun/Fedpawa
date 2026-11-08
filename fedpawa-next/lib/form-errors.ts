// ==========================================================
// FEDPAWA — Résolveur d'erreurs de formulaire (socle système).
//
// Problème traité : les messages actuels sont vagues (« Erreur
// interne », « Non autorisé ») et le frontend affiche le message
// serveur brut tel quel. Ce module normalise une erreur en une
// catégorie compréhensible et produit le message le plus précis
// possible SELON LA PAGE courante (contexte), avec fallback
// hiérarchique :
//
//   1. erreur de validation champ-par-champ (body.errors) → message
//      du champ concerné (422) ;
//   2. message serveur jugé fiable (liste de codes connus, non
//      générique) → traduit localement ;
//   3. message générique honnête par catégorie/status (jamais le
//      brut « Erreur interne ») ;
//   4. dernier recours : message inattendu.
//
// Contrat API attendu (Laravel) :
//   { message?: string, error?: string, errors?: {champ: [msg]}, code?: string }
// Le champ `error` de certains endpoints sert de libellé court.
// ==========================================================

import { ApiError } from "./api";

/** Contexte de page : sert à choisir le bon message par zone. */
export type ErrorContext =
  | "auth"           // connexion, inscription, mot de passe oublié
  | "souscription"   // tunnel + souscription domiciliation
  | "espace-client"  // dashboard client, paramètres, KYC, courriers
  | "admin";         // dashboard admin, publications, mails, documents

/** Catégorie normalisée d'une erreur. */
export type ErrorCategory =
  | "validation"     // 422 / 400 : donnée invalide, champ à corriger
  | "auth"           // 401 : identifiants/session invalides
  | "forbidden"      // 403 : droits insuffisants
  | "not_found"      // 404 : ressource introuvable
  | "conflict"       // 409 : état en conflit (email déjà pris, doublon)
  | "rate_limit"     // 429 : trop de tentatives
  | "payment"        // erreur liée au paiement (Campay, statut)
  | "server"         // 500/502/503 : erreur serveur (message générique honnête)
  | "network"        // 0 : API injoignable, coupure réseau
  | "unknown";       // tout le reste

/** Erreur normalisée (indépendante du transport). */
export interface NormalizedError {
  category: ErrorCategory;
  status: number;
  /** Message serveur brut capturé (jamais affiché tel quel). */
  serverMessage: string;
  /** Code machine serveur si présent (body.code, body.error_code). */
  serverCode?: string;
  /** Erreurs champ-par-champ (validation 422). */
  fieldErrors?: Record<string, string[]>;
  /** Champ concerné si l'appelant le connaît (soumission par champ). */
  field?: string;
}

/** Messages serveur considérés FIABLES (précis, actionnables).
 *  Clés NORMALISÉES (minuscules, sans diacritiques) pour matcher
 *  normalizeKey() — ne pas y mettre d'accents. */
const TRUSTED_SERVER_CODES = new Set([
  "email deja utilise",
  "identifiants invalides",
  "mot de passe incorrect",
  "code otp invalide ou expire",
  "ceci est un compte administrateur",
  "cet e-mail est deja utilise",
  "client introuvable",
  "souscription introuvable",
  "publication introuvable",
  "document introuvable",
  "mail introuvable",
  "code invalide",
  "trop de tentatives. demandez un nouveau code.",
  "paiement non confirme",
  "session de reinitialisation non autorisee",
  "signature invalide",
  "cette souscription appartient a un autre compte",
  "espace client reserve aux comptes clients",
  "dossier kyc introuvable",
  "type de document invalide",
  "fichier invalide",
  "fichier indisponible",
  "media introuvable",
  "modele de contrat introuvable",
  "ticket introuvable",
  "echec de l'enregistrement",
]);

/** Messages serveur GÉNÉRIQUES à ne JAMAIS afficher tels quels.
 *  Même règle : clés normalisées sans accents. */
const VAGUE_SERVER_MESSAGES = new Set([
  "erreur interne",
  "erreur interne lors de la creation du compte",
  "erreur interne lors de la finalisation",
  "erreur lors de la verification du paiement",
  "non autorise",
  "connexion requise",
  "erreur de chargement",
  "erreur api",
  "payload invalide",
  "id invalide",
  "aucun fichier",
  "enregistrement impossible",
]);

/** Regroupe les statuts HTTP en catégorie. */
export function categorizeStatus(status: number): ErrorCategory {
  if (status === 0) return "network";
  if (status === 401) return "auth";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 422 || status === 400) return "validation";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "server";
  return "unknown";
}

/** Normalise n'importe quelle erreur (ApiError, Error, inconnu). */
export function normalizeError(err: unknown, field?: string): NormalizedError {
  if (err instanceof ApiError) {
    const body = (err.body ?? {}) as {
      message?: string;
      error?: string;
      code?: string;
      error_code?: string;
      errors?: Record<string, string[]>;
    } | null;
    const serverMessage =
      body?.message ||
      body?.error ||
      (err.status > 0
        ? `Erreur API (${err.status}).`
        : "Erreur de connexion au serveur.");
    return {
      category: categorizeStatus(err.status),
      status: err.status,
      serverMessage: String(serverMessage),
      serverCode: body?.error_code || body?.code,
      fieldErrors: body?.errors,
      field,
    };
  }
  if (err instanceof Error) {
    return {
      category: categorizeStatus(0),
      status: 0,
      serverMessage: err.message || "Erreur inconnue.",
      field,
    };
  }
  return {
    category: "unknown",
    status: 0,
    serverMessage: "Erreur inconnue.",
    field,
  };
}

/** Normalise un message serveur : minuscules, diacritiques retirés. */
function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Message pour une erreur de validation 422 : priorité au champ
 * concerné (si connu via body.errors), sinon premier message serveur.
 */
function validationMessage(
  n: NormalizedError,
  dict: Record<string, string>,
): string {
  if (n.fieldErrors) {
    const keys = Object.keys(n.fieldErrors);
    if (keys.length > 0) {
      // Champ explicite demandé ? Sinon premier champ de la liste.
      const cible = n.field && n.fieldErrors[n.field] ? n.field : keys[0];
      const msgs = n.fieldErrors[cible];
      if (msgs && msgs.length > 0 && msgs[0]) {
        const m = normalizeKey(msgs[0]);
        // Les messages Laravel contiennent le nom du champ :
        // "The email field is required." → on garde quand même (lisible).
        return dict[`validation_${m}`] || msgs[0];
      }
    }
  }
  if (n.field && dict[`field_${n.field}_required`]) {
    return dict[`field_${n.field}_required`];
  }
  return dict.validation_generic || "Veuillez vérifier les champs du formulaire.";
}

/** Détecte si un message serveur est fiable et connu (à traduire). */
function trustedServerKey(n: NormalizedError): string | undefined {
  const k = normalizeKey(n.serverMessage);
  if (VAGUE_SERVER_MESSAGES.has(k)) return undefined;
  if (TRUSTED_SERVER_CODES.has(k)) return k;
  return undefined;
}

/**
 * Résout le message utilisateur final pour une erreur, selon la
 * page courante (contexte) et la catégorie.
 *
 * @param err        erreur brute (ApiError, Error, unknown)
 * @param context    page : auth | souscription | espace-client | admin
 * @param dict       dictionnaire d'erreurs FR ou EN (form-errors)
 * @param field      champ concerné (optionnel, pour focus champ)
 */
export function resolveFormError(
  err: unknown,
  context: ErrorContext,
  dict: Record<string, string>,
  field?: string,
): string {
  const n = normalizeError(err, field);

  // 1. Validation champ-par-champ → message du champ.
  if (n.category === "validation") {
    return validationMessage(n, dict);
  }

  // 2. Message serveur fiable → traduction locale si connue,
  //    sinon on garde le libellé serveur (précis, actionnable).
  const serverKey = trustedServerKey(n);
  if (serverKey !== undefined) {
    const localized = dict[serverKey];
    if (localized) return localized;
    return n.serverMessage; // message serveur précis → on le garde
  }

  // 3. Messages par catégorie, contextualisés par page.
  const ctx: string = n.category === "payment" ? "payment" : context;
  const byCat = dict[`cat_${n.category}`];
  const byCtx = dict[`ctx_${ctx}_${n.category}`];
  return byCtx || byCat || dict[`cat_unknown`] || "Une erreur est survenue.";
}