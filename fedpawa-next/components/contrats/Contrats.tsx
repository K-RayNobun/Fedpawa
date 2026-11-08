// ==========================================================
// FEDPAWA — Contrats : Hero, Legal Alert (OHADA), 5 Solutions,
// Coffre-Fort Numérique, Tarifs (3 forfaits).
// Conversion de contrats.php.
// Page vitrine sans interactivité → server component.
// ==========================================================

import Link from "next/link";
import { type Locale, getPageDictionary } from "@/lib/i18n";
import { routesFor } from "@/lib/routes";

export interface ContratsProps {
  locale?: Locale;
}

/** Icônes SVG source (contrats.php — stroke 2, fill none). */
const icons = {
  clipboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  shieldCheck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  safe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
};

export default function Contrats({ locale = "fr" }: ContratsProps) {
  const t = getPageDictionary(locale, "contrats");
  const routes = routesFor(locale);
  const safeFeatures = ["safeFeature1", "safeFeature2", "safeFeature3", "safeFeature4"];

  return (
    <>
      {/* ============== HERO ============== */}
      <section className="page-hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">{t.heroBadge}</div>
            <h1>{t.heroTitle}</h1>
            <p className="subtitle">{t.heroSubtitle}</p>
            <p>{t.heroText1}</p>
            <p>{t.heroText2}</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link className="btn btn-primary" href="#pricing">
                {t.heroCtaPrimary}
              </Link>
              <Link className="btn btn-outline" href={routes.contact}>
                {t.heroCtaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============== LEGAL ALERT ============== */}
      <section className="legal-section">
        <div className="container">
          <div className="legal-alert">
            <div className="legal-icon">{icons.shield}</div>
            <div className="legal-content">
              <h3>{t.alertTitle}</h3>
              {/* Texte source contient des <strong> inline (autorisé: HTML source). */}
              <p dangerouslySetInnerHTML={{ __html: t.alertText }} />
            </div>
          </div>
        </div>
      </section>

      {/* ============== SOLUTIONS GRID (5 cartes) ============== */}
      <section className="section-padding section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-kicker">{t.polesKicker}</span>
            <h2>{t.polesTitle}</h2>
          </div>
          <div className="solutions-grid">
            <div className="solution-card">
              <div className="solution-icon">{icons.clipboard}</div>
              <h3>{t.pole1Title}</h3>
              <span className="obj">{t.pole1Obj}</span>
              <ul className="solution-list">
                <li>{t.pole1Item1}</li>
                <li>{t.pole1Item2}</li>
                <li>{t.pole1Item3}</li>
                <li>{t.pole1Item4}</li>
              </ul>
            </div>
            <div className="solution-card">
              <div className="solution-icon">{icons.users}</div>
              <h3>{t.pole2Title}</h3>
              <span className="obj">{t.pole2Obj}</span>
              <ul className="solution-list">
                <li>{t.pole2Item1}</li>
                <li>{t.pole2Item2}</li>
                <li>{t.pole2Item3}</li>
              </ul>
            </div>
            <div className="solution-card">
              <div className="solution-icon">{icons.lock}</div>
              <h3>{t.pole3Title}</h3>
              <span className="obj">{t.pole3Obj}</span>
              <ul className="solution-list">
                <li>{t.pole3Item1}</li>
              </ul>
            </div>
            <div className="solution-card">
              <div className="solution-icon">{icons.search}</div>
              <h3>{t.pole4Title}</h3>
              <span className="obj">{t.pole4Obj}</span>
              <ul className="solution-list">
                <li>{t.pole4Item1}</li>
                <li>{t.pole4Item2}</li>
                <li>{t.pole4Item3}</li>
              </ul>
            </div>
            <div className="solution-card">
              <div className="solution-icon">{icons.lock}</div>
              <h3>{t.pole5Title}</h3>
              <span className="obj">{t.pole5Obj}</span>
              <ul className="solution-list">
                <li>{t.pole5Item1}</li>
                <li>{t.pole5Item2}</li>
                <li>{t.pole5Item3}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============== DIGITAL SAFE BANNER ============== */}
      <section className="safe-section">
        <div className="container">
          <div className="safe-wrapper">
            <div className="safe-content">
              <h2>{t.safeTitle}</h2>
              <p>{t.safeText}</p>
              <div className="safe-features">
                {safeFeatures.map((k) => (
                  <div key={k} className="safe-feature">
                    {icons.shieldCheck} {t[k]}
                  </div>
                ))}
              </div>
            </div>
            <div className="safe-visual">
              <div className="safe-icon-container">{icons.safe}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== PRICING ============== */}
      <section className="section-padding" id="pricing">
        <div className="container">
          <div className="pricing-intro">
            <span className="section-kicker">{t.pricingKicker}</span>
            <h2>{t.pricingTitle}</h2>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="card-header">
                <h3>{t.plan1Title}</h3>
                <div className="price">
                  {t.plan1Price}
                  <span>{t.plan1PriceSuffix}</span>
                </div>
              </div>
              <ul className="features-list">
                <li>{t.plan1Feature1}</li>
                <li>{t.plan1Feature2}</li>
                <li>{t.plan1Feature3}</li>
                <li>{t.plan1Feature4}</li>
              </ul>
              <Link
                className="btn btn-outline btn-block"
                href={`${routes.tunnel}?service=contrats&pack=standard`}
              >
                {t.plan1Cta}
              </Link>
            </div>
            <div className="pricing-card popular">
              <div className="popular-badge">{t.plan2Badge}</div>
              <div className="card-header">
                <h3>{t.plan2Title}</h3>
                <div className="price">
                  {t.plan2Price}
                  <span>{t.plan2PriceSuffix}</span>
                </div>
              </div>
              <ul className="features-list">
                <li>{t.plan2Feature1}</li>
                <li>{t.plan2Feature2}</li>
                <li>{t.plan2Feature3}</li>
                <li>{t.plan2Feature4}</li>
              </ul>
              <Link
                className="btn btn-primary btn-block"
                href={`${routes.tunnel}?service=contrats&pack=complexe`}
              >
                {t.plan2Cta}
              </Link>
            </div>
            <div className="pricing-card">
              <div className="card-header">
                <h3>{t.plan3Title}</h3>
                <div className="price">{t.plan3Price}</div>
              </div>
              <ul className="features-list">
                <li>{t.plan3Feature1}</li>
                <li>{t.plan3Feature2}</li>
                <li>{t.plan3Feature3}</li>
                <li>{t.plan3Feature4}</li>
              </ul>
              <Link
                className="btn btn-outline btn-block"
                href={`${routes.contact}?service=audit-juridique`}
              >
                {t.plan3Cta}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
