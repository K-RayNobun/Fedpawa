// ==========================================================
// FEDPAWA — liste des documents en attente de signature
// (/espace-client/signature). Source : GET /api/v1/dashboard
// (abonnement actif + pastSubscriptions + contrats sans
// date_signature). « Signer » crée le dossier via
// POST /api/v1/signature/dossier puis ouvre la route par dossier.
// ==========================================================

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { apiAuthGet } from "@/lib/auth";
import type { ApiContrat, ApiSubscription, DashboardData } from "@/lib/dashboard-types";
import { fmtDate, fmtFCFA } from "@/lib/dashboard-format";
import { creerDossierSignature } from "@/lib/signature";

export default function SignatureListe() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<{ status: number; message: string } | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    apiAuthGet<DashboardData>("/api/v1/dashboard")
      .then((d) => {
        if (!annule) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (annule) return;
        const e = err as ApiError;
        setErreur({ status: e.status ?? 0, message: e.message ?? "Erreur de chargement." });
        setLoading(false);
      });
    return () => {
      annule = true;
    };
  }, []);

  const abonnements: ApiSubscription[] = [
    ...(data?.subscription ? [data.subscription] : []),
    ...(data?.pastSubscriptions ?? []).filter((s) => s.id !== data?.subscription?.id),
  ];
  const contratsEnAttente: ApiContrat[] = (data?.contrats ?? []).filter((c) => !c.date_signature);

  const kycApprouve = data?.kyc?.statuts === "approuvé";

  const creerDossier = useCallback(
    async (kind: "contrat" | "abonnement", id: number) => {
      const cle = `${kind}-${id}`;
      setErreur(null);
      setEnCours(cle);
      try {
        const body = kind === "contrat" ? { contrat_id: id } : { abonnement_id: id };
        const r = await creerDossierSignature(body);
        router.push(`/espace-client/signature/${r.dossier.id}`);
      } catch (err) {
        // 403 « Vérification d'identité requise avant signature » etc. — affiché tel quel.
        const e = err as ApiError;
        setErreur({ status: e.status ?? 0, message: e.message ?? "Erreur inconnue" });
        setEnCours(null);
      }
    },
    [router],
  );

  return (
    <div className="db-tab-content active sig-page">
      <div className="db-welcome">
        <div>
          <h1>Signer un contrat</h1>
          <p>
            Choisissez le document à signer électroniquement.{" "}
            <Link href="/espace-client">Retour à mon espace client</Link>
          </p>
        </div>
        {data?.kyc && (
          <span className={`badge ${kycApprouve ? "badge-success" : "badge-warning"}`}>
            KYC : {data.kyc.statuts ?? "—"}
          </span>
        )}
      </div>

      {!kycApprouve && (
        <div className="sig-alert sig-alert-erreur" role="alert">
          Votre identité n&apos;est pas encore vérifiée (KYC « {data?.kyc?.statuts ?? "en attente"} »). Le serveur refusera
          la création du dossier de signature (HTTP 403). Renseignez vos documents dans l&apos;onglet{" "}
          <Link href="/espace-client?tab=documents">Mes documents (KYC)</Link>.
        </div>
      )}

      {erreur && (
        <div className="sig-alert sig-alert-erreur" role="alert" data-testid="sig-erreur">
          <strong>Refus du serveur{erreur.status ? ` (HTTP ${erreur.status})` : ""} :</strong> {erreur.message}
        </div>
      )}

      <section className="db-section sig-section">
        <div className="db-section-header"><h2>Abonnements</h2></div>
        {loading ? (
          <p style={{ color: "var(--color-text-muted)" }}>Chargement…</p>
        ) : abonnements.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>Aucun abonnement sur votre compte.</p>
        ) : (
          <div className="db-table-wrap">
            <table className="db-table sig-table">
              <thead>
                <tr><th>Abonnement</th><th>Pack</th><th>Prix</th><th>Début</th><th>Statut</th><th>Action</th></tr>
              </thead>
              <tbody>
                {abonnements.map((a) => (
                  <tr key={a.id}>
                    <td>n°{a.id}</td>
                    <td>{a.pack ?? "—"}</td>
                    <td>{fmtFCFA(Number(a.prix ?? 0))}</td>
                    <td>{fmtDate(a.date_debut)}</td>
                    <td><span className="badge badge-info">{a.statut ?? "—"}</span></td>
                    <td>
                      <button
                        type="button"
                        className="action-link"
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }}
                        disabled={enCours !== null}
                        onClick={() => creerDossier("abonnement", Number(a.id))}
                        data-testid={`sig-creer-abonnement-${a.id}`}
                      >
                        {enCours === `abonnement-${a.id}` ? "Création du dossier…" : "Signer"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="db-section sig-section">
        <div className="db-section-header"><h2>Contrats en attente de signature</h2></div>
        {loading ? (
          <p style={{ color: "var(--color-text-muted)" }}>Chargement…</p>
        ) : contratsEnAttente.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>
            Aucun contrat en attente. Les contrats signés apparaissent dans{" "}
            <Link href="/espace-client?tab=contrats">Mes contrats</Link>.
          </p>
        ) : (
          <div className="db-table-wrap">
            <table className="db-table sig-table">
              <thead>
                <tr><th>Contrat</th><th>Type</th><th>Action</th></tr>
              </thead>
              <tbody>
                {contratsEnAttente.map((c) => (
                  <tr key={c.id}>
                    <td>n°{c.id}</td>
                    <td>{c.type ?? "—"}</td>
                    <td>
                      <button
                        type="button"
                        className="action-link"
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }}
                        disabled={enCours !== null}
                        onClick={() => creerDossier("contrat", c.id)}
                        data-testid={`sig-creer-contrat-${c.id}`}
                      >
                        {enCours === `contrat-${c.id}` ? "Création du dossier…" : "Signer"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
