// ==========================================================
// FEDPAWA — Tunnel de souscription : catalogue PLANS
// (source de vérité tunnel.js, exposé aussi via window.FP_PLANS).
// price = 0 => « Sur devis » (pas de total numérique).
// ==========================================================

export type ServiceId =
  | "creation"
  | "oapi"
  | "fiscalite"
  | "contrats"
  | "domiciliation"
  | "recouvrement";

export interface Plan {
  labelKey: string;
  labelFr: string;
  labelEn: string;
  price: number;
  unit?: string;
  range?: string;
}

export const PLANS: Record<ServiceId, Record<string, Plan>> = {
  creation: {
    standard: {
      labelKey: "planCreationStandard",
      labelFr: "Formule Totale OHADA — Création & Légalisation",
      labelEn: "OHADA Full Package — Formation & Legalization",
      price: 100000,
    },
  },
  oapi: {
    protect_brand: {
      labelKey: "planOapiBrand",
      labelFr: "Forfait Protect Brand & Tech",
      labelEn: "Protect Brand & Tech Package",
      price: 200000,
      range: "200 000 – 900 000 FCFA",
    },
    anteriorite: {
      labelKey: "planOapiAnteriorite",
      labelFr: "Recherche d'Antériorité",
      labelEn: "Prior-Art Search",
      price: 50000,
      range: "50 000 – 100 000 FCFA",
    },
    brevets: {
      labelKey: "planOapiBrevets",
      labelFr: "Brevets d'Invention",
      labelEn: "Invention Patents",
      price: 0,
      range: "Sur devis",
    },
  },
  fiscalite: {
    simplifie: {
      labelKey: "planFiscaliteSimplifie",
      labelFr: "Forfait Régime Simplifié",
      labelEn: "Simplified Regime Package",
      price: 35000,
      unit: "/ mois",
    },
    reel: {
      labelKey: "planFiscaliteReel",
      labelFr: "Régime du Réel / Corporate",
      labelEn: "Real Regime / Corporate",
      price: 0,
      range: "Sur devis",
    },
  },
  contrats: {
    standard: {
      labelKey: "planContratsStandard",
      labelFr: "Forfait Acte Standard",
      labelEn: "Standard Deed Package",
      price: 50000,
      range: "50 000 – 150 000 FCFA",
    },
    complexe: {
      labelKey: "planContratsComplexe",
      labelFr: "Forfait Acte Complexe",
      labelEn: "Complex Deed Package",
      price: 150000,
      range: "150 000 – 500 000 FCFA",
    },
    audit: {
      labelKey: "planContratsAudit",
      labelFr: "Audit Juridique Tiers",
      labelEn: "Third-Party Legal Audit",
      price: 0,
      range: "Sur devis",
    },
  },
  domiciliation: {
    "national-essential": { labelKey: "", labelFr: "Pack Essential (Nationale)", labelEn: "Essential Plan (National)", price: 25000, unit: "/ mois" },
    "national-business": { labelKey: "", labelFr: "Pack Business (Nationale)", labelEn: "Business Plan (National)", price: 45000, unit: "/ mois" },
    "national-premium": { labelKey: "", labelFr: "Pack Premium (Nationale)", labelEn: "Premium Plan (National)", price: 70000, unit: "/ mois" },
    "international-essential": { labelKey: "", labelFr: "Essential Digital (Internationale)", labelEn: "Essential Digital (International)", price: 50000, unit: "/ mois" },
    "international-business": { labelKey: "", labelFr: "Business Virtual (Internationale)", labelEn: "Business Virtual (International)", price: 110000, unit: "/ mois" },
    "international-premium": { labelKey: "", labelFr: "Premium Executive (Internationale)", labelEn: "Premium Executive (International)", price: 175000, unit: "/ mois" },
  },
  recouvrement: {
    succes: {
      labelKey: "planRecouvrementSucces",
      labelFr: "Commission sur créances recouvrées",
      labelEn: "Commission on recovered receivables",
      price: 0,
      range: "Sur devis",
    },
  },
};

/** Noms de services (SERVICE_NAMES). */
export const SERVICE_NAME_KEYS: Record<ServiceId, string> = {
  creation: "snCreation",
  oapi: "snOapi",
  fiscalite: "snFiscalite",
  contrats: "snContrats",
  domiciliation: "sumTitle",
  recouvrement: "snRecouvrement",
};

/** Options complémentaires étape 2 (data-name / data-price 0). */
export const OPTION_CARDS = [
  { nameFr: "Heures de bureau privé supplémentaires", nameEn: "Additional private office hours", titleKey: "optBureauT", descKey: "optBureauD" },
  { nameFr: "Attribution de ligne téléphonique / Standard dédié", nameEn: "Phone line allocation / Dedicated switchboard", titleKey: "optLigneT", descKey: "optLigneD" },
  { nameFr: "Réservation de salle de réunion / Conférence", nameEn: "Meeting / conference room booking", titleKey: "optSalleT", descKey: "optSalleD" },
  { nameFr: "Assistance à la création / Immatriculation d'entreprise", nameEn: "Company formation / registration assistance", titleKey: "optAssistanceT", descKey: "optAssistanceD" },
];
