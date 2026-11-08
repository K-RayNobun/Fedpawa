// ==========================================================
// FEDPAWA — Boîte de réception admin (CONTRAT-MAIL.md §2/§3) :
// client API du préfixe /api/v1/admin/mails + données de
// démonstration EXPLICITES (repli UNIQUEMENT si l'API répond
// 404 « route non déployée » ou est injoignable — les endpoints
// mails n'étaient pas encore déployés sur l'API de test au
// 31/10/2026 ; voir RAPPORT-MAIL-FRONTEND.md pour la liste
// des endpoints non vérifiés).
//
// Contrat API (auth admin, préfixe /api/v1) :
//   GET  /admin/mails?lu=&recherche=&page=&par_page= → {data, meta}
//   GET  /admin/mails/count                          → {total, non_lus}
//   GET  /admin/mails/{id}                           → détail
//   POST /admin/mails/{id}/lu                        → {lu:true}
//   POST /admin/mails/tout-lu                        → tout marqué lu
// ==========================================================

import { ApiError } from "@/lib/api";
import { apiAuthGet, apiAuthPost } from "@/lib/auth";

// ---------- Types (contrat §2, table mails_recus) ----------

export interface MailAttachment {
  nom: string;
  type?: string | null;
  /** Taille en octets. */
  taille?: number | null;
  url?: string | null;
}

export interface MailSummary {
  id: number;
  resend_email_id?: string;
  expediteur: string;
  destinataires?: string[];
  sujet: string;
  recu_le: string;
  lu: boolean;
}

export interface MailDetail extends MailSummary {
  copie?: string[];
  corps_texte?: string | null;
  corps_html?: string | null;
  pieces_jointes?: MailAttachment[];
  message_id?: string | null;
  cree_le?: string;
  modifie_le?: string;
}

export interface MailsPage<T> {
  data: T[];
  meta: {
    page: number;
    par_page: number;
    total: number;
    derniere_page: number;
  };
  /** true = repli sur les données de démonstration (API 404/réseau). */
  demo?: boolean;
}

export interface MailsCount {
  total: number;
  non_lus: number;
  demo?: boolean;
}

export const MAILS_PAR_PAGE = 10;

// ---------- Repli démo uniquement sur 404 / réseau (0) ----------

function isNotDeployed(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 404 || e.status === 0);
}

// ---------- Admin (auth admin) ----------

export interface AdminMailsQuery {
  /** "" = tous, "non_lus" = filtre lu=0. */
  lu?: "" | "non_lus";
  recherche?: string;
  page?: number;
  par_page?: number;
}

/** GET /admin/mails?lu=&recherche=&page=&par_page= — repli démo si 404. */
export function adminFetchMails(
  q: AdminMailsQuery = {},
): Promise<MailsPage<MailSummary>> {
  const params = new URLSearchParams();
  if (q.lu === "non_lus") params.set("lu", "0");
  if (q.recherche) params.set("recherche", q.recherche);
  params.set("page", String(q.page ?? 1));
  params.set("par_page", String(q.par_page ?? MAILS_PAR_PAGE));
  return apiAuthGet<MailsPage<MailSummary>>(
    `/api/v1/admin/mails?${params.toString()}`,
  ).catch((e) => {
    if (isNotDeployed(e)) return demoMailsPage(q);
    throw e;
  });
}

/** GET /admin/mails/count → {total, non_lus} (badge). Repli démo si 404. */
export function adminFetchMailsCount(): Promise<MailsCount> {
  return apiAuthGet<MailsCount>("/api/v1/admin/mails/count").catch((e) => {
    if (isNotDeployed(e)) return demoCount();
    throw e;
  });
}

/** GET /admin/mails/{id} — détail (corps texte + HTML, pièces jointes). */
export function adminFetchMail(id: number): Promise<MailDetail> {
  return apiAuthGet<MailDetail | { mail: MailDetail }>(
    `/api/v1/admin/mails/${id}`,
  ).then((r) => {
    // L'API enveloppe le détail dans {"mail": {...}} ; on normalise.
    if (r && typeof r === "object" && "mail" in r) return r.mail;
    return r as MailDetail;
  }).catch((e) => {
    if (isNotDeployed(e)) return demoDetail(id);
    throw e;
  });
}

/** POST /admin/mails/{id}/lu — idempotent. */
export function adminMarquerMailLu(id: number): Promise<{ lu: boolean; demo?: boolean }> {
  return apiAuthPost<{ lu: boolean }>(`/api/v1/admin/mails/${id}/lu`).catch((e) => {
    if (isNotDeployed(e)) return { lu: true, demo: true };
    throw e;
  });
}

/** POST /admin/mails/tout-lu. */
export function adminMarquerToutLu(): Promise<{ lu: boolean; demo?: boolean }> {
  return apiAuthPost<{ lu: boolean }>(`/api/v1/admin/mails/tout-lu`).catch((e) => {
    if (isNotDeployed(e)) return { lu: true, demo: true };
    throw e;
  });
}

// ==========================================================
// Données de démonstration — utilisées UNIQUEMENT quand l'API
// répond 404 (endpoints non déployés) ou est injoignable.
// Le composant affiche alors une bannière « données de
// démonstration » explicite. Aucune donnée réelle ici.
// ==========================================================

export const DEMO_MAILS: MailDetail[] = [
  {
    id: 7,
    resend_email_id: "demo-0007",
    expediteur: "Me Claire N. (client) <claire.n@example.cm>",
    destinataires: ["mme.law@fedpawa.com"],
    copie: [],
    sujet: "Dossier de création — pièces complémentaires",
    corps_texte:
      "Bonjour, veuillez trouver ci-joint les statuts signés. Cordialement.",
    corps_html:
      "<p>Bonjour,</p><p>Veuillez trouver ci-joint les <strong>statuts signés</strong>.</p><script>alert('xss-script')</script><iframe src=\"https://exemple dangereux.example/\"></iframe><p onclick=\"alert('xss-onclick')\">Paragraphe piégé</p><a href=\"javascript:alert('xss-lien')\">lien piégé</a><p>Cordialement.</p>",
    pieces_jointes: [
      { nom: "statuts_signes.pdf", type: "application/pdf", taille: 184320, url: null },
      { nom: "rc_scan.jpg", type: "image/jpeg", taille: 96211, url: null },
    ],
    message_id: "<demo-0007@example.cm>",
    recu_le: "2026-10-31T09:42:00+01:00",
    lu: false,
    cree_le: "2026-10-31T09:42:05+01:00",
    modifie_le: "2026-10-31T09:42:05+01:00",
  },
  {
    id: 6,
    resend_email_id: "demo-0006",
    expediteur: "support@guce.example.cm",
    destinataires: ["contact@fedpawa.com"],
    copie: ["mme.law@fedpawa.com"],
    sujet: "Accusé de réception — dépôt RC n°2026-4471",
    corps_texte: "Votre dossier a bien été enregistré.",
    corps_html: "<p>Votre dossier <strong>RC n°2026-4471</strong> a bien été enregistré.</p>",
    pieces_jointes: [],
    message_id: "<demo-0006@guce.example.cm>",
    recu_le: "2026-10-30T16:15:00+01:00",
    lu: false,
    cree_le: "2026-10-30T16:15:03+01:00",
    modifie_le: "2026-10-30T16:15:03+01:00",
  },
  {
    id: 5,
    resend_email_id: "demo-0005",
    expediteur: "DGI — guichet Douala <noreply@dgi.example.cm>",
    destinataires: ["contact@fedpawa.com"],
    copie: [],
    sujet: "Échéancier déclaratif — novembre 2026",
    corps_texte: "Rappel : déclarations mensuelles avant le 15.",
    corps_html: "<p>Rappel : <em>déclarations mensuelles</em> avant le <strong>15</strong>.</p>",
    pieces_jointes: [
      { nom: "echeancier_nov2026.pdf", type: "application/pdf", taille: 40112, url: null },
    ],
    message_id: "<demo-0005@dgi.example.cm>",
    recu_le: "2026-10-29T08:03:00+01:00",
    lu: true,
    cree_le: "2026-10-29T08:03:02+01:00",
    modifie_le: "2026-10-30T10:00:00+01:00",
  },
  {
    id: 4,
    resend_email_id: "demo-0004",
    expediteur: "Banque Atlantique <agence.logpom@banque.example.cm>",
    destinataires: ["contact@fedpawa.com"],
    copie: [],
    sujet: "Confirmation de virement — réf. VRT-88213",
    corps_texte: "Virement de 250 000 XAF crédité.",
    corps_html: "<p>Virement de <strong>250 000 XAF</strong> crédité (réf. VRT-88213).</p>",
    pieces_jointes: [],
    message_id: "<demo-0004@banque.example.cm>",
    recu_le: "2026-10-28T14:27:00+01:00",
    lu: true,
    cree_le: "2026-10-28T14:27:01+01:00",
    modifie_le: "2026-10-28T15:02:00+01:00",
  },
  {
    id: 3,
    resend_email_id: "demo-0003",
    expediteur: "OAPI — registre <registre@oapi.example.int>",
    destinataires: ["mme.law@fedpawa.com"],
    copie: [],
    sujet: "Certificat de dépôt de marque — FEDPAWA",
    corps_texte: "Votre marque a été déposée.",
    corps_html: "<p>Votre marque <strong>FEDPAWA</strong> a été déposée (certificat ci-joint).</p>",
    pieces_jointes: [
      { nom: "certificat_marque.pdf", type: "application/pdf", taille: 231040, url: null },
    ],
    message_id: "<demo-0003@oapi.example.int>",
    recu_le: "2026-10-27T11:48:00+01:00",
    lu: false,
    cree_le: "2026-10-27T11:48:04+01:00",
    modifie_le: "2026-10-27T11:48:04+01:00",
  },
  {
    id: 2,
    resend_email_id: "demo-0002",
    expediteur: "Jean K. <jean.k@example.cm>",
    destinataires: ["contact@fedpawa.com"],
    copie: [],
    sujet: "Demande de salle de réunion — jeudi 5 nov.",
    corps_texte: "Bonjour, salle de réunion disponible jeudi ?",
    corps_html: "<p>Bonjour, la <strong>salle de réunion</strong> est-elle disponible jeudi 5 nov. ?</p>",
    pieces_jointes: [],
    message_id: "<demo-0002@example.cm>",
    recu_le: "2026-10-26T17:20:00+01:00",
    lu: true,
    cree_le: "2026-10-26T17:20:02+01:00",
    modifie_le: "2026-10-26T18:00:00+01:00",
  },
  {
    id: 1,
    resend_email_id: "demo-0001",
    expediteur: "Resend <notifications@resend.example>",
    destinataires: ["contact@fedpawa.com"],
    copie: [],
    sujet: "Bienvenue — domaine fedpawa.com vérifié",
    corps_texte: "La réception est activée sur fedpawa.com.",
    corps_html: "<p>La <strong>réception</strong> est activée sur <code>fedpawa.com</code>.</p>",
    pieces_jointes: [],
    message_id: "<demo-0001@resend.example>",
    recu_le: "2026-10-25T10:00:00+01:00",
    lu: true,
    cree_le: "2026-10-25T10:00:01+01:00",
    modifie_le: "2026-10-25T10:05:00+01:00",
  },
];

function demoMailsPage(q: AdminMailsQuery): MailsPage<MailSummary> {
  let list = [...DEMO_MAILS].sort(
    (a, b) => new Date(b.recu_le).getTime() - new Date(a.recu_le).getTime(),
  );
  if (q.lu === "non_lus") list = list.filter((m) => !m.lu);
  const r = (q.recherche ?? "").trim().toLowerCase();
  if (r) {
    list = list.filter(
      (m) =>
        m.expediteur.toLowerCase().includes(r) ||
        m.sujet.toLowerCase().includes(r),
    );
  }
  const parPage = q.par_page ?? MAILS_PAR_PAGE;
  const total = list.length;
  const derniere_page = Math.max(1, Math.ceil(total / parPage));
  const p = Math.min(Math.max(1, q.page ?? 1), derniere_page);
  const slice = list.slice((p - 1) * parPage, p * parPage);
  return {
    data: slice.map(({ corps_texte, corps_html, pieces_jointes, copie, ...rest }) => rest),
    meta: { page: p, par_page: parPage, total, derniere_page },
    demo: true,
  };
}

function demoDetail(id: number): MailDetail {
  return (
    DEMO_MAILS.find((m) => m.id === id) ?? {
      id,
      expediteur: "—",
      destinataires: [],
      sujet: "Message introuvable",
      corps_texte: null,
      corps_html: null,
      pieces_jointes: [],
      recu_le: new Date().toISOString(),
      lu: true,
    }
  );
}

function demoCount(): MailsCount {
  return {
    total: DEMO_MAILS.length,
    non_lus: DEMO_MAILS.filter((m) => !m.lu).length,
    demo: true,
  };
}
