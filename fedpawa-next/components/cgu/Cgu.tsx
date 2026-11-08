// ==========================================================
// FEDPAWA — CGU/CGV : Hero, Éditeur, sections 1-8.
// Conversion de cgu.php. Server component (zéro interactivité).
// ==========================================================

import { type Locale, getPageDictionary } from "@/lib/i18n";

export interface CguProps {
  locale?: Locale;
}

const SECTIONS_A = [
  { title: "s1Title", obj: "s1Obj", items: ["s1Item1", "s1Item2", "s1Item3"], icon: (
    <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
  ) },
  { title: "s2Title", obj: "s2Obj", items: ["s2Item1", "s2Item2", "s2Item3", "s2Item4"], icon: (
    <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>
  ) },
  { title: "s3Title", obj: "s3Obj", items: ["s3Item1", "s3Item2", "s3Item3", "s3Item4"], icon: (
    <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 12h6M9 16h6" /></>
  ) },
  { title: "s4Title", obj: "s4Obj", items: ["s4Item1", "s4Item2", "s4Item3", "s4Item4"], icon: (
    <><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20" /></>
  ) },
];

const SECTIONS_B = [
  { title: "s5Title", obj: "s5Obj", items: ["s5Item1", "s5Item2"], icon: (
    <><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></>
  ) },
  { title: "s6Title", obj: "s6Obj", items: ["s6Item1", "s6Item2", "s6Item3", "s6Item4"], icon: (
    <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>
  ) },
  { title: "s7Title", obj: "s7Obj", items: ["s7Item1", "s7Item2", "s7Item3", "s7Item4"], icon: (
    <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>
  ) },
  { title: "s8Title", obj: "s8Obj", items: ["s8Item1", "s8Item2", "s8Item3", "s8Item4", "s8Item5"], icon: (
    <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>
  ) },
];

export default function Cgu({ locale = "fr" }: CguProps) {
  const t = getPageDictionary(locale, "cgu");

  return (
    <>
      {/* ============== HERO ============== */}
      <section className="page-hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">{t.heroBadge}</div>
            <h1>{t.heroTitle}</h1>
            <p className="subtitle">{t.heroSubtitle}</p>
            <p>{t.heroText}</p>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              {t.heroUpdated}
            </p>
          </div>
        </div>
      </section>

      {/* ============== LEGAL ALERT : EDITEUR ============== */}
      <section className="legal-section">
        <div className="container">
          <div className="legal-alert">
            <div className="legal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="legal-content">
              <h3>{t.legalTitle}</h3>
              <p>{t.legalText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============== 1-4 : OBJET, COMPTES, SOUSCRIPTION, PAIEMENT ============== */}
      <section className="section-padding legal-page">
        <div className="container">
          <div className="solutions-grid">
            {SECTIONS_A.map((s) => (
              <div key={s.title} className="solution-card">
                <div className="solution-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {s.icon}
                  </svg>
                </div>
                <h3>{t[s.title]}</h3>
                <span className="obj">{t[s.obj]}</span>
                <ul className="solution-list">
                  {s.items.map((k) => (
                    <li key={k} dangerouslySetInnerHTML={{ __html: t[k] }} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== 5-8 : ENGAGEMENTS, RESILIATION, RESPONSABILITE, DROIT ============== */}
      <section className="section-padding section-alt legal-page">
        <div className="container">
          <div className="solutions-grid">
            {SECTIONS_B.map((s) => (
              <div key={s.title} className="solution-card">
                <div className="solution-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {s.icon}
                  </svg>
                </div>
                <h3>{t[s.title]}</h3>
                <span className="obj">{t[s.obj]}</span>
                <ul className="solution-list">
                  {s.items.map((k) => (
                    <li key={k} dangerouslySetInnerHTML={{ __html: t[k] }} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
