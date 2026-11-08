// ==========================================================
// FEDPAWA — i18n (squelette vague A)
// FR = défaut, EN = miroir via route group /en.
// Textes TOUJOURS extraits des pages source FR/EN existantes — jamais inventés.
// Structure : dictionnaires par page + clés shared (header/footer/metadata).
// Les vagues B/C/D remplissent pageSlugs.<slug> au fur et à mesure.
// ==========================================================

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

/** Préfixe de route pour la locale : "" pour FR (défaut), "/en" pour EN. */
export function localePrefix(locale: Locale): string {
  return locale === "en" ? "/en" : "";
}

// ---------- Shared (header / footer / commun) ----------
export interface SharedDict {
  topBar: { address: string; hours: string };
  nav: {
    home: string;
    services: string;
    aboutUs: string;
    contact: string;
    domiciliation: string;
    companyFormation: string;
    taxLegalAdvisory: string;
    oapiProtection: string;
    contracts: string;
    publications: string;
  };
  footer: {
    brandPitch: string;
    findUs: string;
    findUsAddress: string;
    openingHours: string;
    phone: string;
    navigation: string;
    allRightsReserved: string;
    terms: string;
    privacy: string;
    cameroon: string;
    whatsapp: string;
    openMenu: string;
  };
  meta: {
    siteName: string;
    defaultTitle: string;
    defaultDescription: string;
  };
}

const sharedFr: SharedDict = {
  topBar: {
    address: "Immeuble Pharmacie de Logpom, Douala",
    hours: "Lun–Ven 8h00–18h00 · Sam 9h00–14h00",
  },
  nav: {
    home: "Accueil",
    services: "Services ▾",
    aboutUs: "Qui sommes-nous",
    contact: "Contact",
    domiciliation: "Domiciliation",
    companyFormation: "Création d'entreprise",
    taxLegalAdvisory: "Conseils & Suivi Fiscal",
    oapiProtection: "Protection OAPI",
    contracts: "Contrats",
    publications: "Publications",
  },
  footer: {
    brandPitch:
      "Une infrastructure d'affaires de premier ordre au cœur de Douala, Logpom. Espace pour s'installer, espace pour grandir.",
    findUs: "Nous trouver",
    findUsAddress:
      "Immeuble Pharmacie de Logpom, en bordure de route, Logpom, Douala, Cameroun",
    openingHours: "Lundi–Vendredi 8h00 – 18h00<br>Samedi 9h00 – 14h00",
    phone: "Tél",
    navigation: "Navigation",
    allRightsReserved: "Tous droits réservés.",
    terms: "CGU / CGV",
    privacy: "Politique de Confidentialité",
    cameroon: "Cameroun",
    whatsapp: "Discuter sur WhatsApp",
    openMenu: "Ouvrir le menu / Open menu",
  },
  meta: {
    siteName: "FEDPAWA CORPORATE SOLUTIONS",
    defaultTitle: "FEDPAWA CORPORATE SOLUTIONS",
    defaultDescription:
      "FEDPAWA CORPORATE SOLUTIONS — Infrastructure d'affaires et hub opérationnel à Douala, Logpom : domiciliation, création d'entreprise, fiscalité, OAPI, contrats et espace client 100 % en ligne.",
  },
};

const sharedEn: SharedDict = {
  topBar: {
    address: "Logpom Pharmacy Building, Douala",
    hours: "Mon–Fri 8:00–18:00 · Sat 9:00–14:00",
  },
  nav: {
    home: "Home",
    services: "Services ▾",
    aboutUs: "About Us",
    contact: "Contact",
    domiciliation: "Domiciliation",
    companyFormation: "Company Formation",
    taxLegalAdvisory: "Tax & Legal Advisory",
    oapiProtection: "OAPI Protection",
    contracts: "Contracts",
    publications: "Publications",
  },
  footer: {
    brandPitch:
      "A first-class business infrastructure in the heart of Douala, Logpom. Room to settle in, room to grow.",
    findUs: "Find Us",
    findUsAddress: "Logpom Pharmacy Building, roadside, Logpom, Douala, Cameroon",
    openingHours: "Monday–Friday 8:00 – 18:00<br>Saturday 9:00 – 14:00",
    phone: "Phone",
    navigation: "Navigation",
    allRightsReserved: "All rights reserved.",
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    cameroon: "Cameroon",
    whatsapp: "Chat on WhatsApp",
    openMenu: "Ouvrir le menu / Open menu",
  },
  meta: {
    siteName: "FEDPAWA CORPORATE SOLUTIONS",
    defaultTitle: "FEDPAWA CORPORATE SOLUTIONS",
    defaultDescription:
      "FEDPAWA CORPORATE SOLUTIONS — First-class business infrastructure and operational hub in Douala, Logpom: domiciliation, company formation, tax & legal advisory, OAPI protection, contracts and a 100% online client area.",
  },
};

// ---------- Dictionnaires par page (types dans lib/i18n/types.ts) ----------
export type { PageSlug, PageDict, PageSlugs } from "./i18n/types";
import type { PageSlug, PageDict, PageSlugs } from "./i18n/types";

/** Dictionnaires FR par page — vides en vague A (remplis par vagues B/C/D). */
export const frPages: PageSlugs = {
  index: {},
  "qui-sommes-nous": {},
  fiscalite: {},
  domiciliation: {},
  creation_entreprise: {},
  "politique-confidentialite": {},
  cgu: {},
  contact: {},
  authentification: {},
  mot_de_passe_oublie: {},
  souscription_domiciliation: {},
  tunnel_souscription: {},
  espace_client: {},
  admin_dashboard: {},
  admin_document: {},
  oapi: {},
  contrats: {},
  publications: {},
  admin_publications: {},
  admin_mails: {},
};

/** Dictionnaires EN par page — vides en vague A (remplis par vagues B/C/D). */
export const enPages: PageSlugs = {
  ...frPages,
};

export interface Dictionaries {
  fr: { shared: SharedDict; pages: PageSlugs };
  en: { shared: SharedDict; pages: PageSlugs };
}

// Dictionnaires par page : remplis par les vagues B/C/D via lib/i18n/pages.ts
// (import dynamique de bas niveau pour éviter un cycle i18n → pages → i18n).
import { frPageDicts, enPageDicts } from "./i18n/pages";

export const dictionaries: Dictionaries = {
  fr: { shared: sharedFr, pages: { ...frPages, ...frPageDicts } },
  en: { shared: sharedEn, pages: { ...enPages, ...enPageDicts } },
};

/** Récupère le dictionnaire complet d'une locale (fallback FR). */
export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

/** Récupère le dictionnaire d'une page pour une locale (fallback FR). */
export function getPageDictionary(locale: Locale, slug: PageSlug): PageDict {
  const dict = getDictionary(locale);
  return dict.pages[slug] ?? dictionaries[defaultLocale].pages[slug] ?? {};
}
