// ==========================================================
// FEDPAWA — Publications (Phase 1) : client API contrat §3
// + données de démonstration (repli si l'API ne répond pas
// encore — endpoints publications pas encore déployés côté
// backend au 31/10/2026 ; l'orchestrateur re-vérifie après
// livraison du backend).
//
// Contrat API (préfixe /api/v1) :
//   public  GET /publications?page=&par_page= → {data, meta}
//           GET /publications/{id}             → détail + médias
//   client  GET /publications/non-lues         → {nombre, ids}
//           POST /publications/{id}/lu         → {lu:true} (idempotent)
//           POST /publications/tout-lu
//   admin   GET/POST /admin/publications, PUT /admin/publications/{id}
//           POST /admin/publications/{id}/medias (multipart)
//           DELETE /admin/publications/{id}/medias/{mediaId}
//           POST /admin/publications/{id}/publier · /depublier
//           DELETE /admin/publications/{id}
// ==========================================================

import { apiGet } from "@/lib/api";
import {
  apiAuthGet,
  apiAuthPost,
  apiAuthPut,
  apiAuthDelete,
  apiAuthPostForm,
} from "@/lib/auth";

// ---------- Types (contrat §1/§3) ----------

export type PublicationType =
  | "texte"
  | "texte_image"
  | "texte_video"
  | "galerie";

export type PublicationStatut =
  | "brouillon"
  | "programme"
  | "publie"
  | "depublie";

export interface PublicationMedia {
  id?: number;
  type: "image" | "video";
  url: string;
  ordre: number;
  nom_origine?: string;
  mime?: string;
  taille_octets?: number;
}

export interface PublicationSummary {
  id: number;
  titre: string;
  chapeau: string | null;
  type: PublicationType;
  /** Liste publique : publish date ; admin : date de programmation si programmee. */
  publie_le: string | null;
  medias: PublicationMedia[];
}

export interface PublicationDetail extends PublicationSummary {
  contenu: string | null;
  statut: PublicationStatut;
  vues: number;
  created_at?: string;
  updated_at?: string;
}

export interface PublicationsPage<T> {
  data: T[];
  meta: {
    page: number;
    par_page: number;
    total: number;
    derniere_page: number;
  };
  /** true = repli sur les données de démonstration (API indisponible). */
  demo?: boolean;
}

export interface NonLues {
  nombre: number;
  ids: number[];
  demo?: boolean;
}

export const PUBLICATIONS_PAR_PAGE = 6;

// ---------- Public ----------

/** GET /publications?page=&par_page= — repli démo si l'API ne répond pas. */
export function fetchPublicationsPage(
  page = 1,
  parPage = PUBLICATIONS_PAR_PAGE,
): Promise<PublicationsPage<PublicationSummary>> {
  return apiGet<PublicationsPage<PublicationSummary>>(
    `/api/v1/publications?page=${page}&par_page=${parPage}`,
  ).catch(() => demoPage(page, parPage));
}

/** GET /publications/{id} — 404 si non publiée. Repli démo. */
export function fetchPublicationDetail(
  id: number,
): Promise<PublicationDetail> {
  return apiGet<PublicationDetail>(`/api/v1/publications/${id}`).catch(
    () => demoDetail(id),
  );
}

// ---------- Client (auth) ----------

/** GET /publications/non-lues → {nombre, ids}. Repli démo si non connecté/API HS. */
export function fetchNonLues(): Promise<NonLues> {
  return apiAuthGet<NonLues>("/api/v1/publications/non-lues").catch(
    () => DEMO_NON_LUES,
  );
}

/** POST /publications/{id}/lu — idempotent. Best-effort côté front. */
export function marquerPublicationLue(id: number): Promise<unknown> {
  return apiAuthPost(`/api/v1/publications/${id}/lu`).catch(() => ({
    lu: true,
    demo: true,
  }));
}

/** POST /publications/tout-lu — marque toutes les publiées comme lues. */
export function marquerToutesLues(): Promise<unknown> {
  return apiAuthPost("/api/v1/publications/tout-lu").catch(() => ({
    lu: true,
    demo: true,
  }));
}

// ---------- Admin (auth admin) ----------

export interface AdminPublication extends PublicationDetail {}

export interface AdminPublicationsQuery {
  statut?: PublicationStatut | "";
  page?: number;
  par_page?: number;
}

export function adminFetchPublications(
  q: AdminPublicationsQuery = {},
): Promise<PublicationsPage<AdminPublication>> {
  const params = new URLSearchParams();
  if (q.statut) params.set("statut", q.statut);
  params.set("page", String(q.page ?? 1));
  params.set("par_page", String(q.par_page ?? PUBLICATIONS_PAR_PAGE));
  return apiAuthGet<PublicationsPage<AdminPublication>>(
    `/api/v1/admin/publications?${params.toString()}`,
  );
}

export interface PublicationPayload {
  titre: string;
  chapeau?: string | null;
  contenu?: string | null;
  type: PublicationType;
  publie_le?: string | null;
}

/** POST /admin/publications — statut brouillon par défaut. */
export function adminCreatePublication(
  payload: PublicationPayload,
): Promise<AdminPublication> {
  return apiAuthPost<AdminPublication>("/api/v1/admin/publications", payload);
}

/** PUT /admin/publications/{id} — édition (titre, chapeau, contenu, type, publie_le). */
export function adminUpdatePublication(
  id: number,
  payload: PublicationPayload,
): Promise<AdminPublication> {
  return apiAuthPut<AdminPublication>(
    `/api/v1/admin/publications/${id}`,
    payload,
  );
}

/** POST /admin/publications/{id}/medias — multipart : fichier + type + ordre. */
export function adminUploadMedia(
  id: number,
  fichier: File,
  type: "image" | "video",
  ordre: number,
): Promise<PublicationMedia> {
  const form = new FormData();
  form.append("fichier", fichier);
  form.append("type", type);
  form.append("ordre", String(ordre));
  return apiAuthPostForm<PublicationMedia>(
    `/api/v1/admin/publications/${id}/medias`,
    form,
  );
}

/** DELETE /admin/publications/{id}/medias/{mediaId}. */
export function adminDeleteMedia(
  id: number,
  mediaId: number,
): Promise<unknown> {
  return apiAuthDelete(
    `/api/v1/admin/publications/${id}/medias/${mediaId}`,
  );
}

/** POST /admin/publications/{id}/publier. */
export function adminPublier(id: number): Promise<AdminPublication> {
  return apiAuthPost<AdminPublication>(
    `/api/v1/admin/publications/${id}/publier`,
  );
}

/** POST /admin/publications/{id}/depublier. */
export function adminDepublier(id: number): Promise<AdminPublication> {
  return apiAuthPost<AdminPublication>(
    `/api/v1/admin/publications/${id}/depublier`,
  );
}

/** DELETE /admin/publications/{id}. */
export function adminDeletePublication(id: number): Promise<unknown> {
  return apiAuthDelete(`/api/v1/admin/publications/${id}`);
}

// ==========================================================
// Données de démonstration — utilisées UNIQUEMENT si l'API
// ne répond pas (404 route non déployée / réseau). Elles
// couvrent les 4 types de rendu : texte, texte+image,
// texte+vidéo, galerie multi-images.
// ==========================================================

const DEMO_MEDIAS_GALERIE: PublicationMedia[] = [
  { id: 41, type: "image", url: "/assets/images/domi_bureau_1.jpg", ordre: 0 },
  { id: 42, type: "image", url: "/assets/images/domi_reunion_1.jpg", ordre: 1 },
  { id: 43, type: "image", url: "/assets/images/home_contrats.jpg", ordre: 2 },
  { id: 44, type: "image", url: "/assets/images/photo_6.jpg", ordre: 3 },
];

export const DEMO_PUBLICATIONS: PublicationDetail[] = [
  {
    id: 8,
    titre: "FEDPAWA agrandit son hub de Logpom",
    chapeau:
      "De nouveaux bureaux et salles de réunion sont désormais ouverts à tous nos clients.",
    contenu:
      "<p>Nous avons le plaisir d'annoncer l'ouverture de nouveaux espaces au cœur de l'Immeuble Pharmacie de Logpom : bureaux privatifs, salles de réunion équipées et espace de domiciliation renforcé.</p><p>Ces espaces sont accessibles à tous les clients FEDPAWA, sur réservation depuis l'espace client.</p>",
    type: "texte_image",
    statut: "publie",
    publie_le: "2026-10-28T09:30:00+01:00",
    vues: 41,
    medias: [
      { id: 81, type: "image", url: "/assets/images/domi_accueil_1.jpg", ordre: 0 },
    ],
  },
  {
    id: 7,
    titre: "Guide : préparer son dossier KYC en 5 étapes",
    chapeau: "Toutes les pièces à réunir avant de soumettre votre dossier de vérification.",
    contenu:
      "<p>Un dossier KYC complet accélère la validation de votre compte. Voici la liste des pièces attendues, étape par étape.</p><ol><li>Pièce d'identité en cours de validité.</li><li>Justificatif de domicile de moins de 3 mois.</li><li>Statuts de l'entreprise.</li><li>Justificatif d'adresse du siège.</li><li>Photo de vous tenant votre pièce d'identité.</li></ol>",
    type: "texte",
    statut: "publie",
    publie_le: "2026-10-24T14:00:00+01:00",
    vues: 87,
    medias: [],
  },
  {
    id: 6,
    titre: "Vidéo : visite guidée de nos espaces de domiciliation",
    chapeau: "Deux minutes pour découvrir les bureaux, salles de réunion et services inclus.",
    contenu:
      "<p>Découvrez en vidéo les espaces FEDPAWA de Logpom : accueil, bureaux privatifs, salles de réunion et services de domiciliation inclus dans chaque formule.</p>",
    type: "texte_video",
    statut: "publie",
    publie_le: "2026-10-20T10:15:00+01:00",
    vues: 63,
    medias: [
      {
        id: 61,
        type: "video",
        url: "/assets/medias/demo-video.mp4",
        ordre: 0,
      },
    ],
  },
  {
    id: 5,
    titre: "Galerie : la rentrée des entrepreneurs à Logpom",
    chapeau: "Retour en images sur notre dernier afterwork networking.",
    contenu:
      "<p>Merci à tous les entrepreneurs présents à notre afterwork de rentrée. Quelques images de la soirée.</p>",
    type: "galerie",
    statut: "publie",
    publie_le: "2026-10-15T18:45:00+01:00",
    vues: 129,
    medias: DEMO_MEDIAS_GALERIE,
  },
  {
    id: 4,
    titre: "Nouveau barème fiscal 2027 : ce qui change pour les PME",
    chapeau: "Synthèse des principales mesures applicables aux petites entreprises.",
    contenu:
      "<p>Le nouveau barème apporte plusieurs ajustements pour les PME : seuils de franchise revus et échéancier de déclaration simplifié pour les régimes simplifiés.</p>",
    type: "texte",
    statut: "publie",
    publie_le: "2026-10-10T08:00:00+01:00",
    vues: 210,
    medias: [],
  },
  {
    id: 3,
    titre: "Protection OAPI : les délais de dépôt sont de retour à la normale",
    chapeau: "Nos équipes confirment le traitement accéléré des demandes de marque.",
    contenu:
      "<p>Après plusieurs mois d'attente, les délais de dépôt de marques auprès de l'OAPI sont revenus à la normale. FEDPAWA continue de suivre chaque dossier déposé.</p>",
    type: "texte_image",
    statut: "publie",
    publie_le: "2026-10-05T11:20:00+01:00",
    vues: 95,
    medias: [
      { id: 31, type: "image", url: "/assets/images/home_fiscalite.jpg", ordre: 0 },
    ],
  },
  {
    id: 2,
    titre: "Bienvenue sur le nouveau portail FEDPAWA",
    chapeau: "Espace client 100 % en ligne : contrats, factures, courriers et support.",
    contenu:
      "<p>Le nouveau portail client vous permet de suivre vos contrats, télécharger vos factures, déposer vos pièces KYC et contacter le support, le tout en ligne.</p>",
    type: "galerie",
    statut: "publie",
    publie_le: "2026-09-30T09:00:00+01:00",
    vues: 342,
    medias: [
      { id: 21, type: "image", url: "/assets/images/home_domiciliation.jpg", ordre: 0 },
      { id: 22, type: "image", url: "/assets/images/home_creation.jpg", ordre: 1 },
      { id: 23, type: "image", url: "/assets/images/qui_1.jpg", ordre: 2 },
    ],
  },
  {
    id: 1,
    titre: "FEDPAWA Corporate Solutions — Lancement officiel",
    chapeau: "Infrastructure d'affaires de premier ordre au cœur de Douala, Logpom.",
    contenu:
      "<p>FEDPAWA Corporate Solutions ouvre officiellement ses portes à Logpom, Douala : domiciliation, création d'entreprise, conseil fiscal, protection OAPI et rédaction de contrats.</p>",
    type: "texte",
    statut: "publie",
    publie_le: "2026-09-21T08:00:00+01:00",
    vues: 512,
    medias: [],
  },
];

/** Non-lues de démonstration (sous-ensemble des publications publiées). */
export const DEMO_NON_LUES: NonLues = {
  nombre: 3,
  ids: [8, 7, 6],
  demo: true,
};

function demoPage(
  page: number,
  parPage: number,
): PublicationsPage<PublicationSummary> {
  const sorted = [...DEMO_PUBLICATIONS].sort(
    (a, b) =>
      new Date(b.publie_le ?? 0).getTime() -
      new Date(a.publie_le ?? 0).getTime(),
  );
  const total = sorted.length;
  const derniere_page = Math.max(1, Math.ceil(total / parPage));
  const p = Math.min(Math.max(1, page), derniere_page);
  const slice = sorted.slice((p - 1) * parPage, p * parPage);
  return {
    data: slice.map(({ contenu, statut, vues, ...rest }) => rest),
    meta: { page: p, par_page: parPage, total, derniere_page },
    demo: true,
  };
}

function demoDetail(id: number): PublicationDetail {
  const found = DEMO_PUBLICATIONS.find((p) => p.id === id);
  if (found) return found;
  return {
    id,
    titre: "Publication introuvable",
    chapeau: null,
    contenu: null,
    type: "texte",
    statut: "publie",
    publie_le: null,
    vues: 0,
    medias: [],
  };
}
