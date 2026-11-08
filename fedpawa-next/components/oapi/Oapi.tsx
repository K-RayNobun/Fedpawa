// ==========================================================
// FEDPAWA — OAPI : Hero, Risque & Stratégie (premier déposant),
// 4 Pôles d'Expertise, Couverture 17 pays (Accord de Bangui),
// Tarifs (3 cartes). Conversion de oapi.php.
// Page vitrine sans interactivité → server component.
// ==========================================================

import Link from "next/link";
import { type Locale, getPageDictionary } from "@/lib/i18n";
import { routesFor } from "@/lib/routes";

export interface OapiProps {
  locale?: Locale;
}

/** Icônes SVG source (oapi.php — stroke 2, fill none). */
const icons = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
};

export default function Oapi({ locale = "fr" }: OapiProps) {
  const t = getPageDictionary(locale, "oapi");
  const routes = routesFor(locale);
  const countries = Array.from({ length: 17 }, (_, i) => t[`country${i + 1}`]);

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
                href={`${routes.tunnel}?service=oapi&pack=protect_brand`}
              >
                {t.heroCtaPrimary}
              </Link>
              <Link className="btn btn-outline" href="#pricing">
                {t.heroCtaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============== RISQUE & STRATEGIE ============== */}
      <section className="oapi-risk-section" id="poles">
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
                <span>⚠️</span> {t.alertTitle.replace("⚠️ ", "")}
              </h3>
              <p>{t.alertText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============== 4 PÔLES D'EXPERTISE ============== */}
      <section className="section-padding section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-kicker">{t.polesKicker}</span>
            <h2>{t.polesTitle}</h2>
            <p>{t.polesIntro}</p>
          </div>
          <div className="solutions-grid">
            <div className="solution-card">
              <div className="solution-icon">{icons.search}</div>
              <h3>{t.pole1Title}</h3>
              <span className="obj">{t.pole1Obj}</span>
              <ul className="solution-list">
                <li>{t.pole1Item1}</li>
                <li>{t.pole1Item2}</li>
                <li>{t.pole1Item3}</li>
              </ul>
            </div>
            <div className="solution-card">
              <div className="solution-icon">{icons.layers}</div>
              <h3>{t.pole2Title}</h3>
              <span className="obj">{t.pole2Obj}</span>
              <ul className="solution-list">
                <li>{t.pole2Item1}</li>
                <li>{t.pole2Item2}</li>
                <li>{t.pole2Item3}</li>
              </ul>
            </div>
            <div className="solution-card">
              <div className="solution-icon">{icons.code}</div>
              <h3>{t.pole3Title}</h3>
              <span className="obj">{t.pole3Obj}</span>
              <ul className="solution-list">
                <li>{t.pole3Item1}</li>
                <li>{t.pole3Item2}</li>
              </ul>
            </div>
            <div className="solution-card">
              <div className="solution-icon">{icons.shield}</div>
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

      {/* ============== COUVERTURE REGIONALE ============== */}
      <section className="oapi-map-section">
        <div className="container">
          <div className="oapi-map-wrapper">
            <span className="section-kicker" style={{ color: "#F9A825" }}>
              {t.mapKicker}
            </span>
            <h2>{t.mapTitle}</h2>
            <p>{t.mapText}</p>
            <div className="oapi-countries-grid">
              {countries.map((c) => {
                const flag = c.slice(0, c.indexOf(" ") + 1);
                const name = c.slice(c.indexOf(" ") + 1);
                return (
                  <div key={name} className="oapi-country-item">
                    <span>{flag.trim()}</span> {name}
                  </div>
                );
              })}
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
              </ul>
              <Link
                className="btn btn-outline btn-block"
                href={`${routes.contact}?service=oapi-recherche`}
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
                href={`${routes.tunnel}?service=oapi&pack=protect_brand`}
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
              </ul>
              <Link
                className="btn btn-outline btn-block"
                href={`${routes.contact}?service=oapi-brevet`}
              >
                {t.plan3Cta}
              </Link>
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
