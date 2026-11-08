// ==========================================================
// FEDPAWA — types API vague D (dashboards client + admin, visionneuse)
// Miroir des réponses Laravel /root/fedpawa-api (routes/api.php).
// Champs exacts des tables : clients, abonnements, factures,
// contrats, courriers, kyc, tickets_support, internal_messages,
// paiements. Clés JSON = colonnes SQL, y compris « statuts » (kyc).
// ==========================================================

// ---------- GET /api/v1/dashboard (DashboardController::index) ----------

export interface ApiClient {
  id?: number;
  civilité?: string | null;
  nom?: string | null;
  entreprise?: string | null;
  forme_juridique?: string | null;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
}

export interface ApiSubscription {
  id?: number;
  client_id?: number;
  pack?: string | null;
  prix?: number | null;
  date_debut?: string | null;
  date_fin?: string | null;
  statut?: string | null;
}

export interface ApiFacture {
  id: number;
  numero?: string | null;
  montant?: number | null;
  date?: string | null;
  lien_pdf?: string | null;
}

export interface ApiContrat {
  id: number;
  type?: string | null;
  date_signature?: string | null;
  fichier?: string | null;
}

export interface ApiCourrier {
  id: number;
  date_reception?: string | null;
  statut?: string | null;
  scan?: string | null;
}

export interface ApiKyc {
  id?: number;
  statuts?: string | null;
  piece_identite?: string | null;
  statuts_entreprise?: string | null;
  justificatif_domicile?: string | null;
  date_soumission?: string | null;
}

export interface DashboardData {
  client: ApiClient | null;
  subscription: ApiSubscription | null;
  factures: ApiFacture[];
  contrats: ApiContrat[];
  courriers: ApiCourrier[];
  kyc: ApiKyc | null;
  pastSubscriptions: ApiSubscription[];
}

// ---------- GET /api/v1/support/tickets (SupportController::myTickets) ----------

export interface ApiTicket {
  id: number;
  sujet?: string | null;
  message?: string | null;
  statut?: string | null;
  created_at?: string | null;
  reponse?: string | null;
  reponse_at?: string | null;
}

// ---------- GET /api/v1/mail/thread (MailController::thread) ----------

export interface ApiMailMessage {
  id?: number;
  sender_type?: string | null;
  sender_id?: number | null;
  client_id?: number | null;
  content?: string | null;
  created_at?: string | null;
  client_nom?: string | null;
}

// ---------- GET /api/v1/courriers (CourrierController::index) ----------

export interface CourriersResponse {
  data: ApiCourrier[];
}

// ---------- GET /api/v1/admin/document-info (StorageController) ----------

export interface DocumentInfo {
  exists: boolean;
  filename?: string | null;
  size?: number | null;
  mime?: string | null;
  date?: string | null;
  client_nom?: string | null;
  entreprise?: string | null;
  type_label?: string | null;
  /** Chemin API relatif : /api/v1/document?type=…&id=… */
  download_url?: string | null;
}

// ---------- Admin : lignes enrichies des listes ----------
// Les listes admin complètes (clients, abonnements, paiements…) sont
// servies par les contrôleurs BE-BUSINESS (routes admin/ lists/overview).
// Shapes ci-dessous = miroir des tables SQL ci-dessus + champs enrichis
// (client_nom, doc_exists) calculés côté serveur.

export interface ApiAdminClient extends ApiClient {
  role?: string | null;
  statut?: string | null;
}

export interface ApiAdminSubscription extends ApiSubscription {
  client_nom?: string | null;
  entreprise?: string | null;
}

export interface ApiAdminPaiement {
  id: number;
  transaction_id?: string | null;
  client_nom?: string | null;
  montant?: number | null;
  mode_paiement?: string | null;
  date?: string | null;
  statut?: string | null;
}

export interface ApiAdminCourrier {
  id: number;
  date_reception?: string | null;
  statut?: string | null;
  client_nom?: string | null;
  /** Enrichi côté serveur : un lien « Consulter » n'est rendu que si true. */
  doc_exists?: boolean;
}

export interface ApiAdminContrat {
  id: number;
  type?: string | null;
  client_nom?: string | null;
  doc_exists?: boolean;
}

export interface ApiAdminKyc extends ApiKyc {
  client_nom?: string | null;
  entreprise?: string | null;
  doc_exists_identite?: boolean;
  doc_exists_justificatif?: boolean;
}

/** GET /api/v1/admin/lists (contrôleurs admin BE) */
export interface AdminLists {
  clients?: ApiAdminClient[];
  abonnements?: ApiAdminSubscription[];
  paiements?: ApiAdminPaiement[];
  courriers?: ApiAdminCourrier[];
  contrats?: ApiAdminContrat[];
  kyc?: ApiAdminKyc[];
  tickets?: ApiTicket[];
  messages?: ApiMailMessage[];
}

/** GET /api/v1/admin/overview (KPI) */
export interface AdminOverview {
  stats?: {
    clients?: number;
    abonnements?: number;
    kyc_en_cours?: number;
  };
}
