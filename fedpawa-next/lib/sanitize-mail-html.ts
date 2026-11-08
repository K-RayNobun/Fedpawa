// ==========================================================
// FEDPAWA — Assainissement du corps HTML d'un mail reçu
// (CONTRAT-MAIL.md §4 : retirer scripts et iframes embarqués,
// risque d'exécution dans l'espace admin — JAMAIS d'assainir
// « à la légère »).
// Client-only (DOMParser) : renvoie "" côté serveur.
// ==========================================================

/** Balises supprimées en bloc (vecteurs d'exécution / exfiltration). */
const REMOVED_TAGS =
  "script,iframe,frame,frameset,object,embed,applet,base,link,meta," +
  "form,input,button,textarea,select,option,svg,math,video,audio,source,track";

/**
 * Assainit un corps HTML de mail :
 * - supprime les balises dangereuses (script, iframe, object, form…),
 * - supprime tout attribut gestionnaire d'événement (on*),
 * - neutralise les URL javascript:/vbscript:/data:text/html,
 * - supprime les style contenant expression()/javascript:.
 * Retourne le HTML assaini (à rendre via dangerouslySetInnerHTML).
 */
export function sanitizeMailHtml(html: string | null | undefined): string {
  if (typeof window === "undefined" || !html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");

  doc.querySelectorAll(REMOVED_TAGS).forEach((el) => el.remove());

  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.replace(/[\s-]+/g, "").toLowerCase();
      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
      } else if (
        (name === "href" ||
          name === "src" ||
          name === "xlink:href" ||
          name === "action" ||
          name === "formaction" ||
          name === "poster") &&
        (value.startsWith("javascript:") ||
          value.startsWith("vbscript:") ||
          value.startsWith("data:text/html"))
      ) {
        el.removeAttribute(attr.name);
      } else if (
        name === "style" &&
        (value.includes("expression(") || value.includes("javascript:"))
      ) {
        el.removeAttribute(attr.name);
      }
    }
  });

  return doc.body.innerHTML;
}
