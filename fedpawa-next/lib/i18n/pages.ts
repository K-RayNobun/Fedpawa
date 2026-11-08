// ==========================================================
// FEDPAWA — i18n : registre des dictionnaires par page.
// Chaque vague ajoute son module lib/i18n/pages/<slug>.ts ici.
// FEUILLE : n'importe jamais lib/i18n.ts (anti-cycle).
// ==========================================================

import type { PageSlugs } from "./types";
import { indexFr, indexEn } from "./pages/index";
import { aboutFr, aboutEn } from "./pages/qui-sommes-nous";
import { fiscaliteFr, fiscaliteEn } from "./pages/fiscalite";
import { domiciliationFr, domiciliationEn } from "./pages/domiciliation";
import { creationFr, creationEn } from "./pages/creation_entreprise";
import { cguFr, cguEn, privacyFr, privacyEn } from "./pages/legal";
import { contactFr, contactEn } from "./pages/contact";
import { authFr, authEn } from "./pages/authentification";
import { resetFr, resetEn } from "./pages/mot-de-passe-oublie";
import { souscriptionFr, souscriptionEn } from "./pages/souscription-domiciliation";
import { tunnelFr, tunnelEn } from "./pages/tunnel-souscription";
import { oapiFr, oapiEn } from "./pages/oapi";
import { contratsFr, contratsEn } from "./pages/contrats";
import { publicationsFr, publicationsEn } from "./pages/publications";
import { adminPublicationsFr, adminPublicationsEn } from "./pages/publications";
import { adminMailsFr, adminMailsEn } from "./pages/admin-mails";

/** Dictionnaires FR par page — remplis vague par vague. */
export const frPageDicts: PageSlugs = {
  index: indexFr,
  "qui-sommes-nous": aboutFr,
  fiscalite: fiscaliteFr,
  domiciliation: domiciliationFr,
  creation_entreprise: creationFr,
  cgu: cguFr,
  "politique-confidentialite": privacyFr,
  contact: contactFr,
  authentification: authFr,
  mot_de_passe_oublie: resetFr,
  souscription_domiciliation: souscriptionFr,
  tunnel_souscription: tunnelFr,
  oapi: oapiFr,
  contrats: contratsFr,
  publications: publicationsFr,
  admin_publications: adminPublicationsFr,
  admin_mails: adminMailsFr,
};

/** Dictionnaires EN par page — remplis vague par vague. */
export const enPageDicts: PageSlugs = {
  index: indexEn,
  "qui-sommes-nous": aboutEn,
  fiscalite: fiscaliteEn,
  domiciliation: domiciliationEn,
  creation_entreprise: creationEn,
  cgu: cguEn,
  "politique-confidentialite": privacyEn,
  contact: contactEn,
  authentification: authEn,
  mot_de_passe_oublie: resetEn,
  souscription_domiciliation: souscriptionEn,
  tunnel_souscription: tunnelEn,
  oapi: oapiEn,
  contrats: contratsEn,
  publications: publicationsEn,
  admin_publications: adminPublicationsEn,
  admin_mails: adminMailsEn,
};
