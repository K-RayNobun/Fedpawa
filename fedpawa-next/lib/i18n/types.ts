// ==========================================================
// FEDPAWA — types i18n partagés (feuille : aucun import i18n)
// Évite le cycle i18n.ts <-> i18n/pages.ts.
// ==========================================================

/** Slug de page (routes FR/EN + dictionnaires). */
export type PageSlug =
  | "index"
  | "qui-sommes-nous"
  | "fiscalite"
  | "domiciliation"
  | "creation_entreprise"
  | "politique-confidentialite"
  | "cgu"
  | "contact"
  | "authentification"
  | "mot_de_passe_oublie"
  | "souscription_domiciliation"
  | "tunnel_souscription"
  | "espace_client"
  | "admin_dashboard"
  | "admin_document"
  | "oapi"
  | "contrats"
  | "publications"
  | "admin_publications"
  | "admin_mails";

/** Contenu propre à une page (clés libres, valeurs texte). */
export type PageDict = Record<string, string>;

export interface PageSlugs {
  [slug: string]: PageDict;
}
