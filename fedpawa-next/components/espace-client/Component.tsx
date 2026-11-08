// ==========================================================
// FEDPAWA — Espace Client (vague D) — conversion de espace_client.html
// Dashboard client data-driven : les données viennent de l'API Laravel
// (GET /api/v1/dashboard, /api/v1/mail/thread, /api/v1/support/tickets).
// Onglets (db-tabs.js) : dashboard, abonnement, factures, contrats,
// documents (KYC upload réel), courriers, profil, support.
// Le Header/Footer sont fournis par le layout (site). Ici : db-layout seul.
// ==========================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  apiAuthGet,
  apiAuthGetBlob,
  apiAuthPost,
  apiAuthPostForm,
  getToken,
} from "@/lib/auth";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { markNotificationsRead } from "@/lib/notifications";
import {
  fetchNonLues,
  fetchPublicationsPage,
  fetchPublicationDetail,
  marquerPublicationLue,
  marquerToutesLues,
  PUBLICATIONS_PAR_PAGE,
  type PublicationDetail,
  type PublicationSummary,
  type PublicationsPage,
} from "@/lib/publications";
import type {
  ApiCourrier,
  ApiFacture,
  ApiKyc,
  ApiMailMessage,
  ApiTicket,
  DashboardData,
} from "@/lib/dashboard-types";
import {
  fmtDate,
  fmtDateTime,
  fmtFCFA,
  initials,
  statutBadgeVariant,
} from "@/lib/dashboard-format";
import { DashboardUIProvider, useToast } from "@/components/dashboard/UI";
import { routesFor } from "@/lib/routes";
import type { Locale } from "@/lib/i18n";

// ---------- Catalogue packs (tunnel.js = source de vérité) ----------
const PACK2SERVICE: Record<string, string> = {
  standard: "creation",
  protect_brand: "oapi",
  anteriorite: "oapi",
  brevets: "oapi",
  simplifie: "fiscalite",
  reel: "fiscalite",
  complexe: "contrats",
  integral: "contrats",
};

const SERVICE_NAMES: Record<string, string> = {
  creation: "Création d'entreprise",
  oapi: "Protection OAPI",
  fiscalite: "Fiscalité",
  contrats: "Contrats",
  domiciliation: "Domiciliation",
};

const PLANS: Record<
  string,
  Record<string, { label: string; price: number; unit: string; range?: string }>
> = {
  creation: {
    standard: { label: "Formule Totale OHADA — Création & Légalisation", price: 100000, unit: "" },
  },
  oapi: {
    protect_brand: { label: "Forfait Protect Brand & Tech", price: 200000, unit: "", range: "200 000 – 900 000 FCFA" },
    anteriorite: { label: "Recherche d'Antériorité", price: 50000, unit: "", range: "50 000 – 100 000 FCFA" },
    brevets: { label: "Brevets d'Invention", price: 0, unit: "", range: "Sur devis" },
  },
  fiscalite: {
    simplifie: { label: "Forfait Régime Simplifié", price: 35000, unit: "/ mois" },
    reel: { label: "Régime du Réel / Corporate", price: 0, unit: "", range: "Sur devis" },
  },
  contrats: {
    standard: { label: "Forfait Acte Standard", price: 50000, unit: "", range: "50 000 – 150 000 FCFA" },
    complexe: { label: "Forfait Acte Complexe", price: 150000, unit: "", range: "150 000 – 500 000 FCFA" },
    audit: { label: "Audit Juridique Tiers", price: 0, unit: "", range: "Sur devis" },
  },
  domiciliation: {
    "national-essential": { label: "Pack Essential (Nationale)", price: 25000, unit: "/ mois" },
    "national-business": { label: "Pack Business (Nationale)", price: 45000, unit: "/ mois" },
    "national-premium": { label: "Pack Premium (Nationale)", price: 70000, unit: "/ mois" },
    "international-essential": { label: "Essential Digital (Internationale)", price: 50000, unit: "/ mois" },
    "international-business": { label: "Business Virtual (Internationale)", price: 110000, unit: "/ mois" },
    "international-premium": { label: "Premium Executive (Internationale)", price: 175000, unit: "/ mois" },
  },
  recouvrement: {
    succes: { label: "Commission sur créances recouvrées", price: 0, unit: "", range: "Sur devis" },
  },
};

interface EspaceClientProps {
  locale?: Locale;
}

type TabId =
  | "dashboard"
  | "abonnement"
  | "factures"
  | "contrats"
  | "documents"
  | "courriers"
  | "publications"
  | "profil"
  | "support";

// ---------- Notifications (vague E) ----------
// Marquage auto best-effort : visiter un onglet marque lues les
// notifications du type correspondant (?tab=courriers → type
// courrier, POST /notifications/read {types:[…]}).
const TAB_TO_NOTIF_TYPE: Partial<Record<TabId, string>> = {
  courriers: "courrier",
  factures: "facture",
  documents: "kyc",
  abonnement: "abonnement",
  // "ticket" est le type réel en base (PushService::TYPES) ; l'onglet s'appelle
  // "support" côté UI — envoyer "support" faisait répondre 400 à l'API.
  support: "ticket",
};

export default function EspaceClient({ locale = "fr" }: EspaceClientProps) {
  const routes = routesFor(locale);
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  void routes;

  // ?tab=… : ouvre directement l'onglet demandé (ex. ?tab=courriers
  // depuis une notification). Client-only, après montage.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("tab");
    if (wanted && (["dashboard", "abonnement", "factures", "contrats", "documents", "courriers", "publications", "profil", "support"] as TabId[]).includes(wanted as TabId)) {
      setActiveTab(wanted as TabId);
    }
  }, []);

  // Onglet visité → notifications de ce type marquées lues (best-effort,
  // silencieux si l'API échoue / 401).
  useEffect(() => {
    const type = TAB_TO_NOTIF_TYPE[activeTab];
    if (!type || !getToken()) return;
    markNotificationsRead({ types: [type] }).catch(() => {
      /* best-effort */
    });
  }, [activeTab]);

  return (
    <DashboardUIProvider>
      <div className="db-layout">
        <aside className="db-sidebar">
          <nav className="db-nav">
            <TabButton tab="dashboard" label="Tableau de bord" activeTab={activeTab} onSwitch={setActiveTab}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            </TabButton>
            <TabButton tab="abonnement" label="Mon abonnement" activeTab={activeTab} onSwitch={setActiveTab}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            </TabButton>
            <TabButton tab="factures" label="Mes factures" activeTab={activeTab} onSwitch={setActiveTab}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            </TabButton>
            <TabButton tab="contrats" label="Mes contrats" activeTab={activeTab} onSwitch={setActiveTab}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="M9 15h6" /></svg>
            </TabButton>
            {/* Signature électronique : masquée tant que l'interrupteur de mise en service
                n'est pas activé au build (les routes API n'existent pour l'instant que
                sur la pile de test). Voir lib/README-signature.md. */}
            {process.env.NEXT_PUBLIC_SIGNATURE_ENABLED === "true" && (
              <Link
                href="/espace-client/signature"
                className={`db-nav-item${pathname?.startsWith("/espace-client/signature") ? " active" : ""}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                Signer un contrat
              </Link>
            )}
            <TabButton tab="documents" label="Mes documents (KYC)" activeTab={activeTab} onSwitch={setActiveTab}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
            </TabButton>
            <TabButton tab="courriers" label="Mes courriers" activeTab={activeTab} onSwitch={setActiveTab}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
            </TabButton>
            {/* Publications (lane PUBLICATION) : annonces officielles FEDPAWA */}
            <TabButton tab="publications" label="Publications" activeTab={activeTab} onSwitch={setActiveTab}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M8 9h8" /><path d="M8 13h8" /><path d="M8 17h5" /></svg>
            </TabButton>
            <TabButton tab="profil" label="Mon profil" activeTab={activeTab} onSwitch={setActiveTab}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </TabButton>
            <TabButton tab="support" label="Support" activeTab={activeTab} onSwitch={setActiveTab}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            </TabButton>
            {/* Paramètres (vague E) : notifications push + préférences par type */}
            <Link
              href="/espace-client/parametres"
              className={`db-nav-item${pathname?.startsWith("/espace-client/parametres") ? " active" : ""}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              Paramètres
            </Link>
          </nav>
        </aside>
        {/* W-14 : barre d'onglets mobile (chips scrollables) — visible <991px */}
        <nav className="db-tabs-mobile" aria-label="Navigation de l'espace client">
          {([
            ["dashboard", "Tableau de bord"],
            ["abonnement", "Mon abonnement"],
            ["factures", "Mes factures"],
            ["contrats", "Mes contrats"],
            ["documents", "Mes documents (KYC)"],
            ["courriers", "Mes courriers"],
            ["publications", "Publications"],
            ["profil", "Mon profil"],
            ["support", "Support"],
          ] as [TabId, string][]).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              className={`db-tab-chip${activeTab === tab ? " active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {label}
            </button>
          ))}
          {process.env.NEXT_PUBLIC_SIGNATURE_ENABLED === "true" && (
            <Link
              href="/espace-client/signature"
              className={`db-tab-chip${pathname?.startsWith("/espace-client/signature") ? " active" : ""}`}
            >
              Signer un contrat
            </Link>
          )}
          <Link
            href="/espace-client/parametres"
            className={`db-tab-chip${pathname?.startsWith("/espace-client/parametres") ? " active" : ""}`}
          >
            Paramètres
          </Link>
        </nav>

        <main className="db-main">
          {activeTab === "dashboard" && <TabDashboard />}
          {activeTab === "abonnement" && <TabAbonnement routes={routes} />}
          {activeTab === "factures" && <TabFactures />}
          {activeTab === "contrats" && <TabContrats />}
          {activeTab === "documents" && <TabDocuments />}
          {activeTab === "courriers" && <TabCourriers />}
          {activeTab === "publications" && (
            <TabPublications routes={routes} />
          )}
          {activeTab === "profil" && <TabProfil />}
          {activeTab === "support" && <TabSupport />}
        </main>
      </div>
    </DashboardUIProvider>
  );
}

function TabButton({
  tab,
  label,
  activeTab,
  onSwitch,
  children,
}: {
  tab: TabId;
  label: string;
  activeTab: TabId;
  onSwitch: (tab: TabId) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`db-nav-item${activeTab === tab ? " active" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => onSwitch(tab)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSwitch(tab);
      }}
    >
      {children} {label}
    </div>
  );
}

// ==========================================================
// Données partagées : un seul chargement, partagé via un hook
// contextuel simple (chaque onglet re-fetch au montage — parité
// loadDashboardData() appelé à chaque retour de profil).
// ==========================================================

interface LoadState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

function useDashboardData(reloadKey: number): LoadState {
  const [state, setState] = useState<LoadState>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    apiAuthGet<DashboardData>("/api/v1/dashboard")
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: Error & { status?: number }) => {
        if (cancelled) return;
        setState({
          data: null,
          loading: false,
          error: getFriendlyErrorMessage(err as unknown as { status: number }, "espace-client") ?? "Les informations n'ont pas pu être chargées pour le moment. Réessayez dans quelques instants.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return state;
}

function LoadingLine() {
  return (
    <div className="db-section" style={{ color: "var(--color-text-muted)", padding: "28px 12px", textAlign: "center" }}>
      Chargement…
    </div>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <div className="db-section" style={{ color: "var(--color-danger)", padding: "28px 12px", textAlign: "center" }}>
      {message}
    </div>
  );
}

// ==========================================================
// Onglet Dashboard
// ==========================================================

function TabDashboard() {
  const { data, loading, error } = useDashboardData(0);

  if (loading) return <LoadingLine />;
  if (error) return <ErrorLine message={error} />;
  if (!data) return null;

  const sub = data.subscription;
  const kyc = data.kyc;
  const courriers = data.courriers ?? [];

  return (
    <div className="db-tab-content active" id="tab-dashboard">
      <div className="db-welcome">
        <div>
          <h1>{data.client?.nom ? `Bonjour, ${data.client.nom}` : "Bonjour"}</h1>
          <p>Bienvenue dans votre espace client. Voici un résumé de votre compte.</p>
        </div>
      </div>
      <div className="overview-grid">
        <div className="overview-card">
          <h3>Abonnement Actif</h3>
          {sub ? (
            <>
              <div className="value">{sub.pack ?? "Aucun pack"}</div>
              <div className="sub-value">
                {sub.date_fin ? `Prochaine échéance : ${sub.date_fin}` : "Sans engagement"}
              </div>
              <span className={`badge badge-${sub.statut === "actif" ? "success" : "warning"}`}>
                {sub.statut === "actif" ? "Actif" : "En attente"}
              </span>
            </>
          ) : (
            <>
              <div className="value">Aucun abonnement</div>
              <div className="sub-value">Souscrivez à une offre pour activer vos services</div>
              <span className="badge badge-muted">Inactif</span>
            </>
          )}
        </div>
        <div className="overview-card">
          <h3>Conformité (KYC)</h3>
          {kyc ? (
            <>
              <div className="value">{kyc.statuts === "approuvé" ? "Dossier validé" : "Dossier en attente"}</div>
              <div className="sub-value">—</div>
              <span className={`badge badge-${kyc.statuts === "approuvé" ? "success" : "warning"}`}>
                {kyc.statuts === "approuvé" ? "Conforme" : "Action requise"}
              </span>
            </>
          ) : (
            <>
              <div className="value">Aucun dossier</div>
              <div className="sub-value">—</div>
              <span className="badge badge-muted">À soumettre</span>
            </>
          )}
        </div>
        <div className="overview-card">
          <h3>Dernier Courrier Reçu</h3>
          {courriers.length > 0 ? (
            <>
              <div className="value">
                {new Date(String(courriers[0].date_reception).replace(" ", "T")).toLocaleDateString("fr-FR")}
              </div>
              <div className="sub-value">
                {courriers[0].statut === "scanné" ? "Courrier numérisé" : "Réception enregistrée"}
              </div>
              <span className="badge badge-success">Scanné & Archivé</span>
            </>
          ) : (
            <>
              <div className="value">Aucun courrier</div>
              <div className="sub-value">—</div>
              <span className="badge badge-muted">—</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================================
// Onglet Abonnement (+ composant « Changer de pack » F6)
// ==========================================================

function TabAbonnement({ routes }: { routes: ReturnType<typeof routesFor> }) {
  const { data, loading, error } = useDashboardData(0);
  const [showPacks, setShowPacks] = useState(false);
  const sub = data?.subscription;
  const pastSubs = data?.pastSubscriptions ?? [];

  const packHref = (packId: string) => {
    const svc =
      packId.startsWith("national-") || packId.startsWith("international-")
        ? "domiciliation"
        : PACK2SERVICE[packId] ?? "creation";
    if (svc === "domiciliation") {
      return `${routes.souscription}?pack=${encodeURIComponent(packId)}`;
    }
    return `${routes.tunnel}?service=${encodeURIComponent(svc)}&pack=${encodeURIComponent(packId)}`;
  };

  return (
    <div className="db-tab-content active" id="tab-abonnement">
      <div className="db-welcome"><div><h1>Mon Abonnement</h1><p>Gérez votre offre et vos options supplémentaires.</p></div></div>
      <div className="db-section">
        {loading ? <p style={{ color: "var(--color-text-muted)" }}>Chargement…</p> : null}
        {error ? <p style={{ color: "var(--color-danger)" }}>{error}</p> : null}
        {!loading && !error && (
          <div className="db-section-header">
            <div>
              <h2>Détails de l'offre</h2>
              <p id="offerLabel">
                {sub ? sub.pack ?? "Aucun pack" : "Aucun abonnement actif pour le moment."}
              </p>
            </div>
            <span className={`badge badge-${sub && sub.statut === "actif" ? "success" : "muted"}`}>
              {sub ? (sub.statut === "actif" ? "Actif" : "En attente") : "Inactif"}
            </span>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <div id="offerPrice">
            {sub ? (
              <>
                <strong>Tarif :</strong> {Number(sub.prix ?? 0).toLocaleString("fr-FR")} FCFA
              </>
            ) : (
              <>
                <strong>Tarif :</strong> —
              </>
            )}
          </div>
          <div id="offerStart">
            {sub ? (
              <>
                <strong>Date de début :</strong>{" "}
                {sub.date_debut
                  ? new Date(String(sub.date_debut).replace(" ", "T")).toLocaleDateString("fr-FR")
                  : "—"}
              </>
            ) : null}
          </div>
          <div id="offerEnd">
            {sub ? (
              <>
                <strong>Date de fin :</strong>{" "}
                {sub.date_fin
                  ? new Date(String(sub.date_fin).replace(" ", "T")).toLocaleDateString("fr-FR")
                  : "Sans engagement"}
              </>
            ) : null}
          </div>
          <div id="offerHours"></div>
        </div>
        <button className="btn btn-outline" type="button" onClick={() => setShowPacks((v) => !v)}>
          Changer de pack / Ajouter des options
        </button>

        {/* F6b : pas de pack actif + abonnements passés → texte + 2 boutons */}
        {!loading && !error && !sub && pastSubs.length > 0 && (
          <div className="fp-resubscribe-block" style={{ marginTop: 22 }}>
            <p>Vous n'avez pas de pack actif actuellement.</p>
            <div className="fp-resubscribe-actions">
              <button type="button" className="btn btn-primary" onClick={() => setShowPacks(true)}>
                Souscrire à nouveau
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowPacks(true)}>
                Changer de pack
              </button>
            </div>
          </div>
        )}

        {showPacks && (
          <div className="fp-pack-component" style={{ marginTop: 22 }}>
            <div className="fp-pack-head">
              <h3>Choisissez votre offre</h3>
              <button
                type="button"
                className="fp-pack-close"
                aria-label="Fermer"
                onClick={() => setShowPacks(false)}
              >
                &times;
              </button>
            </div>
            {sub && sub.statut === "actif" && (
              <div className="fp-pack-warning">
                <p>⚠️ Vous avez un pack en cours. Vous devez d'abord épuiser votre pack actuel avant de souscrire à un autre. Les packs ci-dessous restent consultables à titre informatif.</p>
              </div>
            )}
            {!sub && pastSubs.length > 0 && (
              <p className="fp-pack-note">Vous n'avez pas de pack actif actuellement.</p>
            )}
            {Object.entries(PLANS).map(([serviceId, servicePlans]) => (
              <div key={serviceId} className="fp-pack-service">
                <strong>{SERVICE_NAMES[serviceId] ?? serviceId}</strong>
                <div className="fp-pack-grid">
                  {Object.entries(servicePlans).map(([packId, plan]) => {
                    const price =
                      plan.price > 0
                        ? `${plan.price.toLocaleString("fr-FR")} FCFA${plan.unit}`
                        : plan.range ?? "Sur devis";
                    return (
                      <Link key={packId} className="fp-pack-card" href={packHref(packId)}>
                        <span className="fp-pack-label">{plan.label}</span>
                        <span className="fp-pack-price">{price}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================================
// Onglet Factures
// ==========================================================

// ==========================================================
// Bouton de téléchargement sécurisé (audit #2 : liens documents)
// Pattern admin-document : JAMAIS de <a href> relatif vers
// /api/v1/document (401 sans Bearer, et le JSON d'erreur serait
// « téléchargé » comme fichier). On passe par apiAuthGetBlob
// (Bearer automatique) puis download via object URL.
// ==========================================================
function DownloadDocButton({
  path,
  label,
}: {
  path: string;
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleDownload = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const blob = await apiAuthGetBlob(path);
      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <span>
      <button
        type="button"
        className="action-link"
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }}
        onClick={handleDownload}
        disabled={busy}
      >
        {busy ? "Téléchargement…" : label}
      </button>
      {failed && (
        <>
          {" "}
          <span className="action-link" style={{ opacity: 0.6, fontSize: "0.8rem" }}>
            (indisponible — session expirée ?)
          </span>
        </>
      )}
    </span>
  );
}

function TabFactures() {
  const { data, loading, error } = useDashboardData(0);
  const factures: ApiFacture[] = data?.factures ?? [];

  return (
    <div className="db-tab-content active" id="tab-factures">
      <div className="db-welcome"><div><h1>Mes Factures</h1><p>Historique de vos paiements et téléchargement de documents comptables.</p></div></div>
      <div className="db-section">
        {loading ? <LoadingLine /> : null}
        {error ? <ErrorLine message={error} /> : null}
        {!loading && !error && (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead><tr><th>Numéro</th><th>Date</th><th>Montant</th><th>Statut</th><th>Action</th></tr></thead>
              <tbody>
                {factures.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "28px 12px", color: "var(--color-text-muted)", fontSize: "0.92rem" }}>Aucune facture pour le moment. Elles apparaîtront ici après votre première souscription payée.</td></tr>
                ) : (
                  factures.map((f) => (
                    <tr key={f.id}>
                      <td>{f.numero ?? "—"}</td>
                      <td>{fmtDate(f.date)}</td>
                      <td>{Number(f.montant ?? 0).toLocaleString("fr-FR")} FCFA</td>
                      <td><span className="badge badge-success">Payée</span></td>
                      <td>
                        <DownloadDocButton
                          path={`/api/v1/document?type=facture&id=${f.id}`}
                          label="Télécharger (PDF)"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================================
// Onglet Contrats
// ==========================================================

function TabContrats() {
  const { data, loading, error } = useDashboardData(0);
  const contrats = data?.contrats ?? [];

  return (
    <div className="db-tab-content active" id="tab-contrats">
      <div className="db-welcome"><div><h1>Mes Contrats</h1><p>Téléchargez vos actes juridiques signés électroniquement.</p></div></div>
      <div className="db-section">
        {loading ? <LoadingLine /> : null}
        {error ? <ErrorLine message={error} /> : null}
        {!loading && !error && (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead><tr><th>Type de Contrat</th><th>Date de Signature</th><th>Méthode de validation</th><th>Action</th></tr></thead>
              <tbody>
                {contrats.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: "center", padding: "28px 12px", color: "var(--color-text-muted)", fontSize: "0.92rem" }}>Aucun contrat pour le moment. Vos actes signés électroniquement apparaîtront ici.</td></tr>
                ) : (
                  contrats.map((c) => (
                    <tr key={c.id}>
                      <td>{c.type ?? "—"}</td>
                      <td>{fmtDate(c.date_signature)}</td>
                      <td>Signature électronique (Doc@uthANTIC)</td>
                      <td>
                        <DownloadDocButton
                          path={`/api/v1/document?type=contrat&id=${c.id}`}
                          label="Télécharger (PDF)"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================================
// Onglet Documents (KYC) — upload réel POST /api/v1/kyc/submit
// ==========================================================

function TabDocuments() {
  const { data, loading, error, } = useDashboardData(0) as LoadState & { reload: undefined };
  const { toast } = useToast();
  const [reloadKey, setReloadKey] = useState(0);
  const { data: liveData } = useDashboardData(reloadKey);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const kyc: ApiKyc | null = liveData?.kyc ?? data?.kyc ?? null;
  const approuve = kyc?.statuts === "approuvé";

  const submitKyc = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;
      // Parité back (KycSubmitRequest/FileUploader) : max 10 Mo par fichier.
      const MAX_BYTES = 10 * 1024 * 1024;
      const tooBig = list.find((f) => f.size > MAX_BYTES);
      if (tooBig) {
        toast(`« ${tooBig.name} » dépasse 10 Mo (maximum autorisé).`, "error");
        return;
      }
      const fd = new FormData();
      // le backend attend exactement ces deux champs (KycService)
      if (list[0]) fd.append("piece_identite", list[0], list[0].name || "identite.pdf");
      if (list[1]) fd.append("justificatif_domicile", list[1], list[1].name || "justificatif.pdf");
      try {
        await apiAuthPostForm("/api/v1/kyc/submit", fd);
        toast("Documents transmis. Validation en cours.", "success");
        setReloadKey((k) => k + 1);
      } catch (err) {
        toast(err instanceof Error ? err.message : "Erreur de téléversement.", "error");
      }
    },
    [toast],
  );

  const docItem = (
    ok: boolean | undefined,
    title: string,
    label: string,
    key: string,
  ) => (
    <div className="doc-item" key={key}>
      <div className={`doc-status ${ok ? "valid" : "pending"}`}>
        {ok ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        )}
      </div>
      <div className="doc-info">
        <h5>{title}</h5>
        <p>{label}</p>
      </div>
    </div>
  );

  return (
    <div className="db-tab-content active" id="tab-documents">
      <div className="db-welcome"><div><h1>Mes Documents (Conformité KYC)</h1><p>Soumettez vos pièces pour valider votre compte.</p></div></div>
      <div className="kyc-alert"><p>Merci de compléter votre dossier en téléchargeant les documents ci-dessous afin d'assurer la conformité légale de votre compte.</p></div>
      <div className="db-section">
        <div
          className={`upload-area${dragOver ? " dragover" : ""}`}
          id="uploadArea"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            submitKyc(e.dataTransfer.files);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          <h4>Glissez-déposez vos fichiers ici</h4>
          <p>ou cliquez pour parcourir. Formats acceptés : PDF, PNG, JPG (Max 10Mo)</p>
          <input
            ref={fileInputRef}
            type="file"
            id="fileInput"
            multiple
            hidden
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => {
              if (e.target.files) submitKyc(e.target.files);
            }}
          />
        </div>
        {loading ? <LoadingLine /> : null}
        {error ? <ErrorLine message={error} /> : null}
        <div className="required-docs">
          {docItem(
            !!kyc?.piece_identite,
            "CNI / Passeport",
            kyc?.piece_identite ? (approuve ? "Validé" : "Téléversé, en validation") : "En attente de téléversement",
            "piece_identite",
          )}
          {docItem(
            !!kyc?.statuts_entreprise,
            "Statuts de l'entreprise",
            kyc?.statuts_entreprise ? (approuve ? "Validé" : "Téléversé, en validation") : "En attente de téléversement",
            "statuts_entreprise",
          )}
          {docItem(
            !!kyc?.justificatif_domicile,
            "Justificatif de domicile",
            kyc?.justificatif_domicile ? (approuve ? "Validé" : "Téléversé, en validation") : "En attente de téléversement",
            "justificatif_domicile",
          )}
          {docItem(
            !!approuve,
            "Description d'activité",
            approuve ? "Validé par l'administration" : "En attente de validation",
            "activite",
          )}
        </div>
        <div style={{ marginTop: 24 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const files = fileInputRef.current?.files;
              if (files && files.length) submitKyc(files);
              else fileInputRef.current?.click();
            }}
          >
            Soumettre mon dossier
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================================
// Onglet Courriers
// ==========================================================

function TabCourriers() {
  const { data, loading, error } = useDashboardData(0);
  const courriers: ApiCourrier[] = data?.courriers ?? [];

  return (
    <div className="db-tab-content active" id="tab-courriers">
      <div className="db-welcome"><div><h1>Mes Courriers</h1><p>Suivi et archivage numérique du courrier reçu à votre adresse de domiciliation.</p></div></div>
      <div className="db-section">
        {loading ? <LoadingLine /> : null}
        {error ? <ErrorLine message={error} /> : null}
        {!loading && !error && (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead><tr><th>Date de Réception</th><th>Expéditeur / Type</th><th>Statut</th><th>Action</th></tr></thead>
              <tbody>
                {courriers.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: "center", padding: "28px 12px", color: "var(--color-text-muted)", fontSize: "0.92rem" }}>Aucun courrier reçu pour le moment. Chaque courrier adressé à votre adresse de domiciliation sera numérisé ici.</td></tr>
                ) : (
                  courriers.map((co) => (
                    <tr key={co.id}>
                      <td>{fmtDate(co.date_reception)}</td>
                      <td>Courrier postal / Administratif</td>
                      <td>
                        <span className={`badge badge-${statutBadgeVariant(co.statut)}`}>{co.statut ?? "—"}</span>
                      </td>
                      <td>
                        {co.scan ? (
                          <DownloadDocButton
                            path={`/api/v1/document?type=courrier&id=${co.id}`}
                            label="Consulter le scan"
                          />
                        ) : (
                          <span className="action-link" style={{ opacity: 0.5 }}>Aucun scan</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================================
// Onglet Profil — POST /api/v1/profil/update
// ==========================================================

interface ProfileForm {
  nom: string;
  entreprise: string;
  email: string;
  telephone: string;
  adresse: string;
}

function TabProfil() {
  const { data, loading, error } = useDashboardData(0);
  const { toast } = useToast();
  const [reloadKey, setReloadKey] = useState(0);
  const [form, setForm] = useState<ProfileForm>({
    nom: "",
    entreprise: "",
    email: "",
    telephone: "",
    adresse: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = data?.client;
    if (c) {
      setForm({
        nom: c.nom ?? "",
        entreprise: c.entreprise ?? "",
        email: c.email ?? "",
        telephone: c.telephone ?? "",
        adresse: c.adresse ?? "",
      });
    }
  }, [data?.client]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiAuthPost("/api/v1/profil/update", form);
      toast("Profil mis à jour.", "success");
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur de mise à jour.", "error");
    } finally {
      setSaving(false);
    }
  };
  void reloadKey;

  return (
    <div className="db-tab-content active" id="tab-profil">
      <div className="db-welcome"><div><h1>Mon Profil</h1><p>Mettez à jour vos informations personnelles et d'entreprise.</p></div></div>
      <div className="db-section">
        {loading ? <LoadingLine /> : null}
        {error ? <ErrorLine message={error} /> : null}
        {!loading && !error && (
          <form id="profilForm" onSubmit={onSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="profil-nom">Nom complet du dirigeant</label>
                <input
                  type="text"
                  id="profil-nom"
                  name="nom"
                  className="form-control"
                  required
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="profil-entreprise">Raison sociale</label>
                <input
                  type="text"
                  id="profil-entreprise"
                  name="entreprise"
                  className="form-control"
                  required
                  value={form.entreprise}
                  onChange={(e) => setForm({ ...form, entreprise: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="profil-email">Adresse e-mail</label>
                <input
                  type="email"
                  id="profil-email"
                  name="email"
                  className="form-control"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="profil-telephone">Numéro de téléphone</label>
                <input
                  type="tel"
                  id="profil-telephone"
                  name="telephone"
                  className="form-control"
                  autoComplete="tel"
                  required
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                />
              </div>
              <div className="form-group full">
                <label htmlFor="profil-adresse">Adresse physique</label>
                <input
                  type="text"
                  id="profil-adresse"
                  name="adresse"
                  className="form-control"
                  autoComplete="street-address"
                  value={form.adresse}
                  onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 10 }} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ==========================================================
// Onglet Support — POST /api/v1/support + historique tickets
// + L020 messages de l'administration (GET /api/v1/mail/thread)
// ==========================================================

function TabSupport() {
  const { toast } = useToast();
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState<ApiTicket[] | null>(null);
  const [ticketsError, setTicketsError] = useState(false);
  const [adminMsgs, setAdminMsgs] = useState<ApiMailMessage[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiAuthGet<{ data: ApiMailMessage[] }>("/api/v1/mail/thread")
      .then((d) => {
        if (cancelled) return;
        const msgs = (d.data ?? []).filter((m) => m.sender_type === "admin").slice(-10).reverse();
        setAdminMsgs(msgs);
      })
      .catch(() => {
        if (!cancelled) setAdminMsgs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reloadTickets = useCallback(() => {
    apiAuthGet<{ tickets: ApiTicket[] }>("/api/v1/support/tickets")
      .then((d) => setTickets(d.tickets ?? []))
      .catch(() => setTicketsError(true));
  }, []);

  useEffect(() => {
    reloadTickets();
  }, [reloadTickets]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sujet.trim() || !message.trim()) return;
    setSending(true);
    try {
      await apiAuthPost("/api/v1/support", { sujet: sujet.trim(), message: message.trim() });
      toast("Message envoyé au support. Réponse sous 24h.", "success");
      setSujet("");
      setMessage("");
      reloadTickets();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur d'envoi.", "error");
    } finally {
      setSending(false);
    }
  };

  const ticketBadge = (st: string | null | undefined) => {
    if (st === "resolved" || st === "closed") return <span className="badge badge-success">Résolu</span>;
    if (st === "répondu" || st === "repondu") return <span className="badge badge-success">Répondu</span>;
    if (st === "in_progress" || st === "en_cours") return <span className="badge badge-warning">En cours</span>;
    return <span className="badge badge-warning">Ouvert</span>;
  };

  return (
    <div className="db-tab-content active" id="tab-support">
      <div className="db-welcome"><div><h1>Support</h1><p>Une question ? Notre équipe est là pour vous aider.</p></div></div>
      <div className="db-section">
        <form id="supportForm" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="support-sujet">Sujet de la demande</label>
            <input
              type="text"
              id="support-sujet"
              name="sujet"
              className="form-control"
              placeholder="Ex: Question sur ma dernière facture"
              maxLength={150}
              required
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="support-message">Message</label>
            <textarea
              id="support-message"
              name="message"
              className="form-control"
              rows={5}
              placeholder="Décrivez votre problème ou question..."
              maxLength={5000}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? "Envoi..." : "Envoyer"}
          </button>
        </form>

        {/* L020: messages directs de l'administration (messagerie interne) */}
        <div id="adminMsgsSection" style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: "1.05rem", marginBottom: 12 }}>Messages de l'administration</h3>
          <div id="adminMessages" style={{ display: "grid", gap: 10 }}>
            {adminMsgs === null && (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Chargement…</p>
            )}
            {adminMsgs !== null && adminMsgs.length === 0 && (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                Aucun message de l'administration pour le moment. Vos échanges apparaîtront ici.
              </p>
            )}
            {adminMsgs?.map((m, i) => (
              <div
                key={m.id ?? i}
                style={{
                  background: "var(--color-bg-alt)",
                  border: "1px solid var(--color-border)",
                  borderLeft: "3px solid var(--color-primary)",
                  borderRadius: 10,
                  padding: "12px 14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <strong style={{ fontSize: "0.82rem", color: "var(--color-primary)" }}>Administration FEDPAWA</strong>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{fmtDateTime(m.created_at)}</span>
                </div>
                <p style={{ fontSize: "0.88rem", margin: "6px 0 0", color: "var(--color-text-main)" }}>{m.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* F7: historique des demandes du client */}
        <div id="ticketsHistory" style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: "1.05rem", marginBottom: 12 }}>Mes demandes précédentes</h3>
          <div id="ticketsList" style={{ display: "grid", gap: 12 }}>
            {ticketsError && (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Historique indisponible.</p>
            )}
            {!ticketsError && tickets === null && (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Chargement…</p>
            )}
            {tickets?.length === 0 && (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                Aucune demande pour le moment. Vos messages au support apparaîtront ici avec leur statut.
              </p>
            )}
            {tickets && tickets.length > 0 && tickets.map((t) => (
              <div key={t.id} style={{ border: "1px solid var(--color-border)", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-heading)" }}>{t.sujet}</strong>
                  {ticketBadge(t.statut)}
                </div>
                <p style={{ fontSize: "0.86rem", color: "var(--color-text-main)", margin: "8px 0 6px" }}>
                  {(t.message ?? "").slice(0, 200)}
                  {(t.message ?? "").length > 200 ? "…" : ""}
                </p>
                {t.reponse ? (
                  <div style={{ background: "var(--color-bg-alt)", borderRadius: 8, padding: "10px 12px", margin: "8px 0" }}>
                    <strong style={{ fontSize: "0.78rem", color: "var(--color-primary)" }}>Réponse du support :</strong>
                    <p style={{ fontSize: "0.86rem", margin: "4px 0 0" }}>{t.reponse}</p>
                    <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)", marginTop: 4 }}>
                      {fmtDate(t.reponse_at)}
                    </div>
                  </div>
                ) : null}
                <div style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
                  Envoyé le {fmtDate(t.created_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================================
// Onglet Publications (lane PUBLICATION) — GET /api/v1/publications
// (publiées uniquement) + suivi des non-lues (GET /publications/non-lues).
// L'ouverture d'une publication marque « lu » (POST /publications/{id}/lu,
// idempotent) et décrémente le badge de la cloche du header via
// l'événement fedpawa:publication-lue.
// ==========================================================

const PUB_TYPE_LABELS: Record<string, string> = {
  texte: "Texte",
  texte_image: "Texte + image",
  texte_video: "Texte + vidéo",
  galerie: "Galerie",
};

function pubFirstImage(
  medias: PublicationSummary["medias"],
): string | null {
  const img = [...medias]
    .sort((a, b) => a.ordre - b.ordre)
    .find((m) => m.type === "image");
  return img?.url ?? null;
}

function pubFirstVideo(
  medias: PublicationSummary["medias"],
): string | null {
  const vid = [...medias]
    .sort((a, b) => a.ordre - b.ordre)
    .find((m) => m.type === "video");
  return vid?.url ?? null;
}

function TabPublications({ routes }: { routes: ReturnType<typeof routesFor> }) {
  const [page, setPage] = useState(1);
  const [resp, setResp] = useState<PublicationsPage<PublicationSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadIds, setUnreadIds] = useState<Set<number>>(new Set());
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, PublicationDetail>>({});

  // Liste paginée (rechargée à chaque changement de page).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPublicationsPage(page, PUBLICATIONS_PAR_PAGE)
      .then((r) => {
        if (!cancelled) {
          setResp(r);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  // Non-lues : une fois à l'entrée dans l'onglet.
  useEffect(() => {
    if (!getToken()) return;
    fetchNonLues()
      .then((n) => setUnreadIds(new Set(n.ids ?? [])))
      .catch(() => {
        /* best-effort */
      });
  }, []);

  const toggle = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    // Détail à l'ouverture (contenu HTML + médias complets).
    fetchPublicationDetail(id)
      .then((d) => setDetails((prev) => ({ ...prev, [id]: d })))
      .catch(() => {
        /* best-effort */
      });
    if (getToken()) {
      marquerPublicationLue(id).catch(() => {
        /* best-effort */
      });
      setUnreadIds((prev) => {
        if (!prev.has(id)) return prev;
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
      // La cloche du header décrémente son badge immédiatement.
      window.dispatchEvent(
        new CustomEvent("fedpawa:publication-lue", { detail: { id } }),
      );
    }
  };

  const markAllRead = () => {
    setUnreadIds(new Set());
    marquerToutesLues().catch(() => {
      /* best-effort */
    });
  };

  const meta = resp?.meta ?? null;

  return (
    <div className="db-tab-content active" id="tab-publications">
      <div className="db-welcome">
        <div>
          <h1>Publications</h1>
          <p>Annonces, guides et actualités officielles de FEDPAWA.</p>
        </div>
      </div>
      <div className="db-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            {unreadIds.size > 0
              ? `${unreadIds.size} publication${unreadIds.size > 1 ? "s" : ""} non lue${unreadIds.size > 1 ? "s" : ""}`
              : "Vous êtes à jour."}
          </p>
          {unreadIds.size > 0 && (
            <button type="button" className="btn btn-outline" onClick={markAllRead}>
              Tout marquer comme lu
            </button>
          )}
        </div>

        {loading && !resp && <LoadingLine />}
        {!loading && resp && resp.data.length === 0 && (
          <p className="pub-empty">Aucune publication pour le moment.</p>
        )}

        <div className="pub-feed">
          {resp?.data.map((pub) => {
            const expanded = expandedId === pub.id;
            const detail = details[pub.id];
            const img = pubFirstImage(pub.medias);
            return (
              <article
                key={pub.id}
                className={`pub-card${expanded ? " expanded" : ""}`}
              >
                <header className="pub-card-head">
                  <span className="badge badge-info">
                    {PUB_TYPE_LABELS[pub.type] ?? pub.type}
                  </span>
                  {pub.publie_le && (
                    <time dateTime={pub.publie_le}>{fmtDateTime(pub.publie_le)}</time>
                  )}
                  {unreadIds.has(pub.id) && (
                    <span className="pub-unread">Non lu</span>
                  )}
                </header>
                <h2 className="pub-card-title">{pub.titre}</h2>
                {pub.chapeau && <p className="pub-card-chapeau">{pub.chapeau}</p>}
                {(pub.type === "texte_image" || pub.type === "galerie") && img && (
                  <img
                    className="pub-media-img"
                    src={img}
                    alt={pub.titre}
                    loading="lazy"
                  />
                )}
                <div className="pub-card-foot">
                  <button
                    type="button"
                    className="btn btn-outline pub-toggle"
                    aria-expanded={expanded}
                    onClick={() => toggle(pub.id)}
                  >
                    {expanded ? "Fermer" : "Lire la publication"}
                  </button>
                </div>
                {expanded && (
                  <div className="pub-card-body">
                    {detail?.contenu ? (
                      <div
                        className="pub-content"
                        dangerouslySetInnerHTML={{ __html: detail.contenu }}
                      />
                    ) : (
                      <p className="pub-empty">Chargement…</p>
                    )}
                    {detail && pub.type === "texte_video" && pubFirstVideo(detail.medias) && (
                      <video
                        className="pub-media-video"
                        src={pubFirstVideo(detail.medias) as string}
                        controls
                        preload="metadata"
                        aria-label={pub.titre}
                      />
                    )}
                    {detail && pub.type === "galerie" && (
                      <div className="pub-gallery pub-gallery-full">
                        {[...detail.medias]
                          .filter((m) => m.type === "image")
                          .sort((a, b) => a.ordre - b.ordre)
                          .map((m) => (
                            <img
                              key={m.id ?? m.url}
                              src={m.url}
                              alt={pub.titre}
                              loading="lazy"
                            />
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {meta && meta.derniere_page > 1 && (
          <div className="pub-pagination">
            <button
              type="button"
              className="btn btn-outline"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Page précédente
            </button>
            <span className="pub-pagination-info">
              Page {meta.page} sur {meta.derniere_page}
            </span>
            <button
              type="button"
              className="btn btn-primary"
              disabled={meta.page >= meta.derniere_page}
              onClick={() => setPage((p) => p + 1)}
            >
              Page suivante →
            </button>
          </div>
        )}

        <div style={{ marginTop: 26 }}>
          <Link className="btn btn-outline" href={routes.publications}>
            Voir toutes les publications
          </Link>
        </div>
      </div>
    </div>
  );
}
