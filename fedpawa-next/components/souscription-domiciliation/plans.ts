// ==========================================================
// FEDPAWA — Souscription domiciliation : données partagées
// (packs, prix, options, pays). Reproduit PACKS/PACK_DETAILS
// de souscription_domiciliation.js. PAS de composant React :
// constantes pures importables côté client.
// ==========================================================

export interface PackOption {
  value: string;
  price: number;
  label: string;
}

export const PACKS: Record<"nationale" | "internationale", PackOption[]> = {
  nationale: [
    { value: "national-essential", price: 25000, label: "Pack ESSENTIAL — 25 000 FCFA / mois" },
    { value: "national-business", price: 45000, label: "Pack BUSINESS — 45 000 FCFA / mois" },
    { value: "national-premium", price: 70000, label: "Pack PREMIUM — 70 000 FCFA / mois" },
  ],
  internationale: [
    { value: "international-essential", price: 50000, label: "ESSENTIAL DIGITAL — 50 000 FCFA (~88 $) / mois" },
    { value: "international-business", price: 110000, label: "BUSINESS VIRTUAL — 110 000 FCFA (~180 $) / mois" },
    { value: "international-premium", price: 175000, label: "PREMIUM EXECUTIVE — 175 000 FCFA (~290 $) / mois" },
  ],
};

export interface PackDetail {
  badge: string;
  name: string;
  usd: string | null;
  features: { fr: string[]; en: string[] };
}

export const PACK_DETAILS: Record<string, PackDetail> = {
  "national-essential": {
    badge: "Nationale",
    name: "Pack ESSENTIAL",
    usd: null,
    features: {
      fr: [
        "Adresse de siège social à Logpom, Douala",
        "Réception du courrier",
        "Scan systématique de chaque courrier",
        "Archivage numérique (1 mois)",
        "Notification par email et WhatsApp à chaque réception",
        "6 heures de bureau privé par mois incluses",
      ],
      en: [
        "Registered office address in Logpom, Douala",
        "Mail reception",
        "Systematic scanning of every mail item",
        "Digital archiving (1 month)",
        "Email and WhatsApp notification on every receipt",
        "6 private office hours per month included",
      ],
    },
  },
  "national-business": {
    badge: "Nationale",
    name: "Pack BUSINESS",
    usd: null,
    features: {
      fr: [
        "Adresse de siège social à Logpom, Douala",
        "Réception du courrier",
        "Scan systématique de chaque courrier",
        "Archivage numérique (1 mois)",
        "Notification par email et WhatsApp à chaque réception",
        "Réexpédition physique mensuelle du courrier",
        "10 heures de bureau privé par mois incluses (WiFi haute performance)",
      ],
      en: [
        "Registered office address in Logpom, Douala",
        "Mail reception",
        "Systematic scanning of every mail item",
        "Digital archiving (1 month)",
        "Email and WhatsApp notification on every receipt",
        "Monthly physical mail forwarding",
        "10 private office hours per month included (high-performance WiFi)",
      ],
    },
  },
  "national-premium": {
    badge: "Populaire",
    name: "Pack PREMIUM",
    usd: null,
    features: {
      fr: [
        "Adresse de siège social à Logpom, Douala",
        "Réception du courrier",
        "Scan systématique de chaque courrier",
        "Archivage numérique (1 mois)",
        "Notification par email et WhatsApp à chaque réception",
        "Réexpédition physique instantanée du courrier",
        "Réceptionniste dédiée bilingue au nom de votre entreprise + ligne téléphonique locale",
        "15 heures de bureau privé par mois incluses (WiFi haute performance)",
      ],
      en: [
        "Registered office address in Logpom, Douala",
        "Mail reception",
        "Systematic scanning of every mail item",
        "Digital archiving (1 month)",
        "Email and WhatsApp notification on every receipt",
        "Instant physical mail forwarding",
        "Dedicated bilingual receptionist in your company's name + local phone line",
        "15 private office hours per month included (high-performance WiFi)",
      ],
    },
  },
  "international-essential": {
    badge: "Internationale",
    name: "ESSENTIAL DIGITAL",
    usd: "~88 USD",
    features: {
      fr: [
        "Adresse officielle du siège social à Logpom",
        "Réception physique des plis et colis à l'accueil",
        "Numérisation et scan instantané de chaque courrier",
        "Envoi immédiat des documents scannés par e-mail ou WhatsApp",
        "Réexpédition physique des colis vers l'étranger (frais de port au réel)",
      ],
      en: [
        "Official registered office address in Logpom",
        "Physical reception of letters and parcels at the front desk",
        "Instant digitisation and scanning of every mail item",
        "Immediate sending of scanned documents by email or WhatsApp",
        "Physical parcel forwarding abroad (shipping at cost)",
      ],
    },
  },
  "international-business": {
    badge: "Internationale",
    name: "BUSINESS VIRTUAL",
    usd: "~180 USD",
    features: {
      fr: [
        "Adresse officielle du siège social à Logpom",
        "Réception physique des plis et colis à l'accueil",
        "Numérisation et scan instantané de chaque courrier",
        "Envoi immédiat des documents scannés par e-mail ou WhatsApp",
        "Réexpédition physique des colis vers l'étranger (frais de port au réel)",
        "Numéro de téléphone local camerounais dédié",
        "Réponse téléphonique personnalisée (réceptionniste bilingue)",
        "Prise de message et transmission immédiate par WhatsApp ou e-mail",
      ],
      en: [
        "Official registered office address in Logpom",
        "Physical reception of letters and parcels at the front desk",
        "Instant digitisation and scanning of every mail item",
        "Immediate sending of scanned documents by email or WhatsApp",
        "Physical parcel forwarding abroad (shipping at cost)",
        "Dedicated local Cameroonian phone number",
        "Personalised phone answering (bilingual receptionist)",
        "Message taking and immediate forwarding by WhatsApp or email",
      ],
    },
  },
  "international-premium": {
    badge: "Prestige",
    name: "PREMIUM EXECUTIVE",
    usd: "~290 USD",
    features: {
      fr: [
        "Adresse officielle du siège social à Logpom",
        "Réception physique des plis et colis à l'accueil",
        "Numérisation et scan instantané de chaque courrier",
        "Envoi immédiat des documents scannés par e-mail ou WhatsApp",
        "Réexpédition physique des colis vers l'étranger (frais de port au réel)",
        "Numéro de téléphone local camerounais dédié",
        "Réponse téléphonique personnalisée (réceptionniste bilingue)",
        "Prise de message et transmission immédiate par WhatsApp ou e-mail",
        "20 heures/mois en bureau privé climatisé haut standing (sur réservation)",
        "Connexion Internet haut débit pendant vos sessions",
        "Accueil de prestige de vos délégations d'affaires",
        "Café inclus à volonté pour toute l'équipe",
      ],
      en: [
        "Official registered office address in Logpom",
        "Physical reception of letters and parcels at the front desk",
        "Instant digitisation and scanning of every mail item",
        "Immediate sending of scanned documents by email or WhatsApp",
        "Physical parcel forwarding abroad (shipping at cost)",
        "Dedicated local Cameroonian phone number",
        "Personalised phone answering (bilingual receptionist)",
        "Message taking and immediate forwarding by WhatsApp or email",
        "20 hours/month in a high-end air-conditioned private office (by booking)",
        "High-speed Internet connection during your sessions",
        "Prestige welcome for your business delegations",
        "Unlimited coffee included for the whole team",
      ],
    },
  },
};

/** Options complémentaires (checkbox name="options"). */
export const EXTRA_OPTIONS = ["opt1", "opt2", "opt3", "opt4"] as const;

/** Périodicités → nombre de mois (data-months). */
export const PERIODICITES: Record<string, { months: number; key: string }> = {
  mensuel: { months: 1, key: "perMonth" },
  semestriel: { months: 6, key: "perSemestre" },
  annuel: { months: 12, key: "perAnnee" },
};

/** Format FCFA. */
export function fmtFCFA(n: number): string {
  return n.toLocaleString("fr-FR") + " FCFA";
}

/** Liste des pays du select (extraction source, ordre conservé). */
export const COUNTRIES: string[] = [
  "Cameroun", "Afghanistan", "Afrique du Sud", "Albanie", "Algérie", "Allemagne", "Andorre", "Angola",
  "Antigua-et-Barbuda", "Arabie saoudite", "Argentine", "Arménie", "Australie", "Autriche",
  "Azerbaïdjan", "Bahamas", "Bahreïn", "Bangladesh", "Barbade", "Belgique", "Belize", "Bénin",
  "Bhoutan", "Biélorussie", "Birmanie", "Bolivie", "Bosnie-Herzégovine", "Botswana", "Brésil",
  "Brunei", "Bulgarie", "Burkina Faso", "Burundi", "Cambodge", "Canada", "Cap-Vert", "Chili",
  "Chine", "Chypre", "Colombie", "Comores", "Congo RDC", "Congo-Brazzaville", "Corée du Nord",
  "Corée du Sud", "Costa Rica", "Côte d'Ivoire", "Croatie", "Cuba", "Danemark", "Djibouti",
  "Dominique", "Égypte", "Émirats arabes unis", "Équateur", "Érythrée", "Espagne", "Estonie",
  "Eswatini", "États-Unis", "Éthiopie", "Fidji", "Finlande", "France", "Gabon", "Gambie",
  "Ghana", "Grèce", "Grenade", "Guinée", "Guinée équatoriale", "Guinée-Bissau", "Guyana",
  "Haïti", "Honduras", "Hongrie", "Îles Marshall", "Îles Salomon", "Inde", "Indonésie", "Irak",
  "Iran", "Irlande", "Islande", "Israël", "Italie", "Jamaïque", "Japon", "Jordanie", "Kazakhstan",
  "Kenya", "Kirghizistan", "Kiribati", "Koweït", "Laos", "Lesotho", "Lettonie", "Liban",
  "Liberia", "Libye", "Liechtenstein", "Lituanie", "Luxembourg", "Macédoine", "Madagascar",
  "Malaisie", "Malawi", "Maldives", "Mali", "Malte", "Maroc", "Maurice", "Mauritanie", "Mexique",
  "Micronésie", "Moldavie", "Monaco", "Mongolie", "Monténégro", "Mozambique", "Namibie", "Nauru",
  "Népal", "Nicaragua", "Niger", "Nigeria", "Norvège", "Nouvelle-Zélande", "Oman",
  "Ouzbékistan", "Pakistan", "Palaos", "Palestine", "Panama", "Papouasie-Nouvelle-Guinée",
  "Paraguay", "Pays-Bas", "Pérou", "Philippines", "Pologne", "Portugal", "Qatar", "Roumanie",
  "Royaume-Uni", "Russie", "Rwanda", "Saint-Kitts-et-Nevis", "Saint-Marin",
  "Saint-Vincent-et-les-Grenadines", "Sainte-Lucie", "Salvador", "Samoa", "São Tomé-et-Principe",
  "Sénégal", "Serbie", "Seychelles", "Sierra Leone", "Singapour", "Slovaquie", "Slovénie",
  "Somalie", "Soudan", "Soudan du Sud", "Sri Lanka", "Suède", "Suisse", "Suriname", "Syrie",
  "Tadjikistan", "Tanzanie", "Tchad", "Tchéquie", "Thaïlande", "Timor oriental", "Togo",
  "Tonga", "Trinité-et-Tobago", "Tunisie", "Turkménistan", "Turquie", "Tuvalu", "Ukraine",
  "Uruguay", "Vanuatu", "Vatican", "Venezuela", "Vietnam", "Yémen", "Zambie", "Zimbabwe",
];

/** Secteurs d'activité (select source). */
export const SECTEURS = [
  "Commerce et distribution",
  "Services aux entreprises / Conseil",
  "Bâtiment et travaux publics (BTP)",
  "Agroalimentaire & Agriculture",
  "Technologie, Numérique & E-commerce",
  "Santé, Pharmacie & Bien-être",
  "Éducation, Formation & Coaching",
  "Transport, Logistique & Import-Export",
  "Finance, Assurance & Immobilier",
  "Autre (précisez)",
];

/** Formes juridiques (select source). */
export const FORMES_JURIDIQUES = [
  "SARL / SARLU",
  "SAS / SASU",
  "SA",
  "Établissement (Nom propre / EI)",
  "GIE (Groupement d'Intérêt Économique)",
  "Succursale / Filiale",
  "Autre (précisez)",
];

/** Fonctions du représentant (select source). */
export const FONCTIONS = [
  "Gérant / Co-gérant",
  "Président / Director",
  "Directeur Général",
  "Fondateur / Promoteur",
  "Mandataire / Fondé de pouvoir",
];

/** Types de pièce d'identité (select source). */
export const TYPES_PIECE = [
  "Carte Nationale d'Identité (CNI)",
  "Passeport",
  "Carte de Séjour / Titre de Résidence",
];
