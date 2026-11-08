// ==========================================================
// FEDPAWA — Politique de confidentialité : Hero, Responsable,
// sections 1-10. Conversion de politique-confidentialite.php.
// Server component (zéro interactivité source).
// ==========================================================

import { type Locale, getPageDictionary } from "@/lib/i18n";

export interface PrivacyProps {
  locale?: Locale;
}

const SECTIONS_A = [
  { title: "s1Title", obj: "s1Obj", items: ["s1Item1", "s1Item2", "s1Item3", "s1Item4", "s1Item5", "s1Item6"], icon: (
    <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>
  ) },
  { title: "s2Title", obj: "s2Obj", items: ["s2Item1", "s2Item2", "s2Item3", "s2Item4", "s2Item5", "s2Item6", "s2Item7"], icon: (
    <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
  ) },
  { title: "s3Title", obj: "s3Obj", items: ["s3Item1", "s3Item2", "s3Item3", "s3Item4"], icon: (
    <><path d="M12 3v18M3 12h18" /><rect x="3" y="3" width="18" height="18" rx="2" /></>
  ) },
  { title: "s4Title", obj: "s4Obj", items: ["s4Item1", "s4Item2", "s4Item3", "s4Item4"], icon: (
    <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>
  ) },
  { title: "s5Title", obj: "s5Obj", items: ["s5Item1", "s5Item2", "s5Item3", "s5Item4", "s5Item5"], icon: (
    <><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></>
  ) },
  { title: "s6Title", obj: "s6Obj", items: ["s6Item1", "s6Item2", "s6Item3", "s6Item4"], icon: (
    <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>
  ) },
];

const SECTIONS_B = [
  { title: "s7Title", obj: "s7Obj", items: ["s7Item1", "s7Item2", "s7Item3", "s7Item4"], icon: (
    <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>
  ) },
  { title: "s8Title", obj: "s8Obj", items: ["s8Item1", "s8Item2", "s8Item3", "s8Item4"], icon: (
    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /></>
  ) },
  { title: "s9Title", obj: "s9Obj", items: ["s9Item1", "s9Item2", "s9Item3"], icon: (
    <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>
  ) },
  { title: "s10Title", obj: "s10Obj", items: ["s10Item1", "s10Item2", "s10Item3", "s10Item4", "s10Item5"], icon: (
    <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>
  ) },
];

export default function Privacy({ locale = "fr" }: PrivacyProps) {
  const t = getPageDictionary(locale, "politique-confidentialite");

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

      {/* ============== LEGAL ALERT : RESPONSABLE ============== */}
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
              <p dangerouslySetInnerHTML={{ __html: t.legalText }} />
            </div>
          </div>
        </div>
      </section>

      {/* ============== 1-6 : COLLECTE, FINALITES, BASES, DUREES, DROITS, COOKIES ============== */}
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

      {/* ============== 7-10 : SECURITE, DESTINATAIRES, TRANSFERTS, CONTACT ============== */}
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
