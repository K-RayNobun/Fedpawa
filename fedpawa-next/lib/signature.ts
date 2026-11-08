// ==========================================================
// FEDPAWA — client API chaîne de signature électronique
// (POST /api/v1/signature/* sur la pile Laravel, auth:sanctum
//  via Bearer — helpers lib/auth.ts).
// Formes des réponses = miroir de SignatureController +
// SignatureService (copie de test /root/fedpawa-api-test) et
// des artefacts réels /root/fedpawa-campagne/signature/tests/http-*.txt.
// ==========================================================

import { apiAuthGet, apiAuthGetBlob, apiAuthPost } from "@/lib/auth";

// ---------- POST /api/v1/signature/dossier ----------
export interface SignatureDossierResume {
  id: number;
  statut: string;
  contrat_id: number | null;
  abonnement_id: number | null;
  client_id: number;
}

export interface DossierCreeResponse {
  message: string;
  dossier: SignatureDossierResume;
  etape_suivante: string;
}

/** Crée un dossier de signature (201) — 403 si KYC non approuvé. */
export function creerDossierSignature(
  body: { contrat_id?: number } | { abonnement_id?: number },
): Promise<DossierCreeResponse> {
  return apiAuthPost<DossierCreeResponse>("/api/v1/signature/dossier", body);
}

// ---------- POST /api/v1/signature/otp ----------
export interface OtpEnvoyeResponse {
  message: string;
  delivered: boolean;
  dossier_id: number;
  statut: string;
}

/** Envoie le code à 6 chiffres par e-mail (valable 10 min). Le code n'est jamais dans la réponse. */
export function envoyerOtpSignature(dossierId: number): Promise<OtpEnvoyeResponse> {
  return apiAuthPost<OtpEnvoyeResponse>("/api/v1/signature/otp", {
    dossier_id: dossierId,
  });
}

// ---------- POST /api/v1/signature/signer ----------
export interface SignatureSigneeResponse {
  dossier_id: number;
  statut: string;
  contrat_id?: number | null;
  sha256_source?: string;
  sha256_signe?: string;
  certificat_empreinte?: string;
  certificat_sujet?: string;
  scelle_le?: string;
  pdf_url?: string;
  preuve_url?: string;
}

export interface SignerPayload {
  dossier_id: number;
  otp: string;
  consentement: boolean;
  signature_image_base64: string;
}

/** Signe : 200 statut=scelle, 400 OTP invalide/consentement requis, 403 dossier d'autrui. */
export function signerContrat(payload: SignerPayload): Promise<SignatureSigneeResponse> {
  return apiAuthPost<SignatureSigneeResponse>("/api/v1/signature/signer", payload);
}

// ---------- GET /api/v1/signature/dossier/{id} ----------
export interface SignatureDossierEtat {
  id: number;
  contrat_id: number | null;
  client_id: number;
  abonnement_id: number | null;
  statut: string;
  sha256_source?: string | null;
  sha256_signe?: string | null;
  certificat_empreinte?: string | null;
  scelle_le?: string | null;
  otp_verifie_le?: string | null;
  consentement_le?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SignatureEvenement {
  id: number;
  evenement: string;
  acteur_type?: string | null;
  acteur_id?: number | null;
  ip?: string | null;
  user_agent?: string | null;
  empreinte_sha256?: string | null;
  details?: Record<string, unknown> | null;
  cree_le?: string;
}

export interface DossierEtatResponse {
  dossier: SignatureDossierEtat;
  evenements: SignatureEvenement[];
}

export function etatDossierSignature(dossierId: number): Promise<DossierEtatResponse> {
  return apiAuthGet<DossierEtatResponse>(`/api/v1/signature/dossier/${dossierId}`);
}

// ---------- PDF scellés (Bearer obligatoire, cloisonnés par client) ----------

export function contratScellePath(dossierId: number): string {
  return `/api/v1/signature/dossier/${dossierId}/contrat.pdf`;
}

export function preuvePath(dossierId: number): string {
  return `/api/v1/signature/dossier/${dossierId}/preuve.pdf`;
}

export function telechargerContratScelle(dossierId: number): Promise<Blob> {
  return apiAuthGetBlob(contratScellePath(dossierId));
}

export function telechargerPreuve(dossierId: number): Promise<Blob> {
  return apiAuthGetBlob(preuvePath(dossierId));
}
