// Composants SEO (BRIEF-S) — JSON-LD par page publique (NOUVEAU fichier).
// Données réelles reprises des pages (PHP source + miroirs EN) — ne rien inventer.
// Le layout (site) injecte déjà Organization + WebSite sur toutes les pages ;
// ce composant ajoute le JSON-LD "Service" sur chaque page de service.

import React from "react";

export type ServiceKey =
  | "domiciliation"
  | "creation-entreprise"
  | "fiscalite"
  | "oapi"
  | "contrats";

type Locale = "fr" | "en";

interface ServiceDef {
  name: string;
  description: string;
  serviceType: string;
  url: string; // URL canonique (www, .php — URLs réellement servies aujourd'hui)
}

const WWW = "https://www.fedpawa.com";

const SERVICES: Record<ServiceKey, Record<Locale, ServiceDef>> = {
  domiciliation: {
    fr: {
      name: "Domiciliation d'entreprises à Douala (Logpom)",
      description:
        "Domiciliation d'entreprises à Douala Logpom : adresse commerciale prestigieuse, gestion du courrier, salles de réunion. Dès 35 000 FCFA/mois HT.",
      serviceType: "Domiciliation d'entreprises",
      url: `${WWW}/domiciliation.php`,
    },
    en: {
      name: "Business domiciliation in Douala (Logpom)",
      description:
        "Business domiciliation in Douala Logpom: prestigious business address, mail handling, meeting rooms. From 35,000 FCFA/month.",
      serviceType: "Business domiciliation",
      url: `${WWW}/en/domiciliation.php`,
    },
  },
  "creation-entreprise": {
    fr: {
      name: "Création, transformation et légalisation d'entreprises au Cameroun",
      description:
        "Création, transformation, restructuration et légalisation d'entreprises au Cameroun. Conformité OHADA par des juristes expérimentés.",
      serviceType: "Création d'entreprise",
      url: `${WWW}/creation_entreprise.php`,
    },
    en: {
      name: "Company formation, transformation, restructuring and legalization in Cameroon",
      description:
        "Company formation, transformation, restructuring and legalization in Cameroon with OHADA compliance by experienced legal experts.",
      serviceType: "Company formation",
      url: `${WWW}/en/creation_entreprise.php`,
    },
  },
  fiscalite: {
    fr: {
      name: "Conseil et suivi juridique & fiscal des entreprises",
      description:
        "Conseil et suivi juridique et fiscal des entreprises au Cameroun : télé-déclarations DGI, liasse fiscale, optimisation et représentation.",
      serviceType: "Conseil fiscal",
      url: `${WWW}/fiscalite.php`,
    },
    en: {
      name: "Legal and tax advisory for companies in Cameroon",
      description:
        "Legal and tax advisory and monitoring for companies in Cameroon. DGI e-filings, annual tax return (DSF), Tax Compliance Certificate (ACF) and administrative representation before the DGI.",
      serviceType: "Tax advisory",
      url: `${WWW}/en/fiscalite.php`,
    },
  },
  oapi: {
    fr: {
      name: "Enregistrement de marques, logos, applications et logiciels auprès de l'OAPI",
      description:
        "Enregistrement de vos marques, logos, applications et logiciels auprès de l'OAPI. Protection de votre propriété intellectuelle en zone francophone.",
      serviceType: "Protection de la propriété intellectuelle (OAPI)",
      url: `${WWW}/oapi.php`,
    },
    en: {
      name: "Trademark, logo, application and software registration with OAPI",
      description:
        "Trademark, logo, application and software registration with OAPI. Protect your intellectual property across francophone Africa.",
      serviceType: "Intellectual property protection (OAPI)",
      url: `${WWW}/en/oapi.php`,
    },
  },
  contrats: {
    fr: {
      name: "Rédaction de contrats juridiques (sociaux, commerciaux, de travail, NDAs)",
      description:
        "Rédaction de contrats sociaux, commerciaux, de travail, NDAs et conventionnels par des juristes FEDPAWA. Souscription en ligne dès 100 000 FCFA HT.",
      serviceType: "Rédaction de contrats",
      url: `${WWW}/contrats.php`,
    },
    en: {
      name: "Contract drafting (corporate, commercial, employment, NDA)",
      description:
        "Corporate, commercial, employment, service and confidentiality (NDA) contract drafting by FEDPAWA legal experts. From 100,000 FCFA.",
      serviceType: "Contract drafting",
      url: `${WWW}/en/contrats.php`,
    },
  },
};

export function ServiceJsonLd({
  service,
  locale,
}: {
  service: ServiceKey;
  locale: Locale;
}) {
  const def = SERVICES[service][locale];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${def.url}#service`,
    name: def.name,
    description: def.description,
    url: def.url,
    serviceType: def.serviceType,
    inLanguage: locale,
    provider: { "@id": `${WWW}/#organization` },
    areaServed: [
      { "@type": "Country", name: "Cameroun" },
      { "@type": "City", name: "Douala" },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
