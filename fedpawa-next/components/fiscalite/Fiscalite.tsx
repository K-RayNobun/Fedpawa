// ==========================================================
// FEDPAWA — Fiscalité : Hero, Risque & Stratégie, 4 Pôles,
// Bouclier Fiscal, Tarifs. Conversion de fiscalite.php.
// Page vitrine sans interactivité → server component.
// ==========================================================

import Link from "next/link";
import { type Locale, getPageDictionary } from "@/lib/i18n";
import { routesFor } from "@/lib/routes";

export interface FiscaliteProps {
  locale?: Locale;
}

export default function Fiscalite({ locale = "fr" }: FiscaliteProps) {
  const t = getPageDictionary(locale, "fiscalite");
  const routes = routesFor(locale);

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
              <Link
                className="btn btn-gold"
                href={`${routes.tunnel}?service=fiscalite&pack=simplifie`}
              >
                {t.heroCtaPrimary}
              </Link>
              <Link
                className="btn btn-outline"
                href={`${routes.contact}?service=fiscalite-devis`}
              >
                {t.heroCtaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============== RISQUE & STRATEGIE ============== */}
      <section className="oapi-risk-section">
        <div className="container">
          <div className="oapi-risk-grid">
            <div className="oapi-risk-text">
              <span className="section-kicker">{t.riskKicker}</span>
              <h2>{t.riskTitle}</h2>
              <p>{t.riskText1}</p>
              <p>{t.riskText2}</p>
            </div>
            <div className="oapi-alert-box">
              <h3>
                <span>⚠️</span>{" "}
                {t.alertTitle.replace("⚠️ ", "")}
              </h3>
              {/* Texte source contient un <strong> inline (autorisé: HTML source). */}
              <p
                dangerouslySetInnerHTML={{ __html: t.alertText }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============== 4 PÔLES D'INTERVENTION ============== */}
      <section className="section-padding section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-kicker">{t.polesKicker}</span>
            <h2>{t.polesTitle}</h2>
          </div>
          <div className="solutions-grid">
            <div className="solution-card">
              <div className="solution-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
                </svg>
              </div>
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
              <div className="solution-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="16" y2="17" />
                </svg>
              </div>
              <h3>{t.pole2Title}</h3>
              <span className="obj">{t.pole2Obj}</span>
              <ul className="solution-list">
                <li>{t.pole2Item1}</li>
                <li>{t.pole2Item2}</li>
                <li>{t.pole2Item3}</li>
              </ul>
            </div>
            <div className="solution-card">
              <div className="solution-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3>{t.pole3Title}</h3>
              <span className="obj">{t.pole3Obj}</span>
              <ul className="solution-list">
                <li>{t.pole3Item1}</li>
                <li>{t.pole3Item2}</li>
                <li>{t.pole3Item3}</li>
              </ul>
            </div>
            <div className="solution-card">
              <div className="solution-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3>{t.pole4Title}</h3>
              <span className="obj">{t.pole4Obj}</span>
              <ul className="solution-list">
                <li>{t.pole4Item1}</li>
                <li>{t.pole4Item2}</li>
                <li>{t.pole4Item3}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============== BOUCLIER FISCAL ============== */}
      <section className="safe-section">
        <div className="container">
          <div className="safe-wrapper">
            <div className="safe-content">
              <h2>{t.safeTitle}</h2>
              <p>{t.safeText}</p>
              <div className="safe-features">
                {["safeFeature1", "safeFeature2", "safeFeature3"].map((k) => (
                  <div key={k} className="safe-feature">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>{" "}
                    {t[k]}
                  </div>
                ))}
              </div>
            </div>
            <div className="safe-visual">
              <div className="safe-icon-container">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== TARIFS ============== */}
      <section className="section-padding" id="pricing">
        <div className="container">
          <div className="pricing-intro">
            <span className="section-kicker">{t.pricingKicker}</span>
            <h2>{t.pricingTitle}</h2>
            <p>{t.pricingIntro}</p>
          </div>
          <div
            className="pricing-grid"
            style={{
              gridTemplateColumns: "1fr 1fr",
              maxWidth: 800,
              margin: "0 auto",
            }}
          >
            <div className="pricing-card popular">
              <div className="popular-badge">{t.planPopularBadge}</div>
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
              </ul>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginTop: 10 }}>
                {t.plan1Note}
              </p>
              <Link
                className="btn btn-primary btn-block"
                href={`${routes.tunnel}?service=fiscalite&pack=simplifie`}
              >
                {t.plan1Cta}
              </Link>
            </div>
            <div className="pricing-card">
              <div className="card-header">
                <h3>{t.plan2Title}</h3>
                <div className="price">{t.plan2Price}</div>
              </div>
              <ul className="features-list">
                <li>{t.plan2Feature1}</li>
                <li>{t.plan2Feature2}</li>
                <li>{t.plan2Feature3}</li>
              </ul>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginTop: 10 }}>
                {t.plan2Note}
              </p>
              <Link
                className="btn btn-outline btn-block"
                href={`${routes.contact}?service=fiscalite-reel`}
              >
                {t.plan2Cta}
              </Link>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: 16 }}>
                <em>{t.plan2Nb}</em>
              </p>
            </div>
          </div>
          <div
            className="oapi-pricing-note"
            dangerouslySetInnerHTML={{ __html: t.pricingNote }}
          />
        </div>
      </section>
    </>
  );
}
