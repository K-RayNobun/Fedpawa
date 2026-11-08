// ==========================================================
// FEDPAWA — Gestion unifiée des erreurs frontend
// Ton voulu (directive K Ray) : ni alarmant, ni mensonger.
// - Jamais « erreur interne », jamais « équipe alertée ».
// - Le client sait si l'erreur vient de lui ou de nous,
//   et ce qu'il a à faire (réessayer / vérifier / contacter
//   le support si ça persiste).
// ==========================================================

import { ApiError } from "./api";

export type PageContext =
  | "auth"
  | "souscription"
  | "espace-client"
  | "dashboard-admin"
  | "default";

/**
 * Messages quand l'erreur vient du CLIENT (action : vérifier ses saisies).
 * 400 = requête mal formée ; 422 = validation Laravel.
 */
const CLIENT_SIDE_MESSAGES: Record<PageContext, string> = {
  auth: "Votre tentative de connexion a échoué. Vérifiez votre email et votre mot de passe, puis réessayez.",
  souscription:
    "Certaines informations saisies sont incorrectes ou incomplètes. Vérifiez les champs signalés, puis réessayez.",
  "espace-client":
    "Votre demande n'a pas pu être traitée. Vérifiez les informations saisies, puis réessayez.",
  "dashboard-admin":
    "Votre demande n'a pas pu être traitée. Vérifiez les informations saisies, puis réessayez.",
  default:
    "Certaines informations saisies sont incorrectes ou incomplètes. Vérifiez-les, puis réessayez.",
};

/**
 * Messages quand l'erreur vient de NOUS (5xx) : réassurant, action claire,
 * sans jargon technique ni promesse non tenue (pas de « équipe alertée »).
 */
const SERVER_SIDE_MESSAGE =
  "Votre demande n'a pas pu être traitée pour le moment. Réessayez dans quelques minutes. Si le problème persiste, contactez notre support.";

const MESSAGES: Record<number, string | Record<PageContext, string>> = {
  // Erreur réseau (API injoignable) : peut venir du client OU de nous —
  // on donne honnêtement les deux vérifications.
  0: "Votre requête n'a pas pu aboutir. Vérifiez votre connexion internet et réessayez. Si le problème persiste, contactez notre support.",
  400: CLIENT_SIDE_MESSAGES,
  401: "Votre session a expiré. Veuillez vous reconnecter pour continuer.",
  403: "Cette section n'est pas accessible avec votre compte actuel. Si vous pensez qu'il s'agit d'une erreur, contactez notre support.",
  404: "La page demandée n'existe pas ou a été déplacée. Vérifiez l'adresse ou retournez à l'accueil.",
  422: CLIENT_SIDE_MESSAGES,
};

/**
 * Traduit une ApiError en message utilisateur apaisant, adapté à la page.
 * 5xx (500, 502, 503, 504…) → message « vient de nous » unifié.
 */
export function getFriendlyErrorMessage(
  error: unknown,
  context: PageContext = "default",
): string {
  if (error instanceof ApiError) {
    if (error.status >= 500) return SERVER_SIDE_MESSAGE;

    const mapping = MESSAGES[error.status];
    if (typeof mapping === "string") return mapping;
    if (mapping && typeof mapping === "object") {
      return mapping[context] ?? mapping.default;
    }
    // Statut inconnu (ex. 409, 429) : neutre, orienté réessai.
    return "Votre demande n'a pas abouti. Réessayez dans quelques instants. Si le problème persiste, contactez notre support.";
  }

  return "Une difficulté technique est survenue. Veuillez réessayer dans quelques instants. Si le problème persiste, contactez notre support.";
}
