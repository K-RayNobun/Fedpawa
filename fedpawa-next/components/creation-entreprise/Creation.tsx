// ==========================================================
// FEDPAWA — Création d'entreprise : Hero, Risque & Stratégie,
// Processus 4 étapes, Kit Corporate, Formes juridiques, Tarif.
// Conversion de creation_entreprise.php. Server component (zéro
// interactivité source).
// ==========================================================

import Link from "next/link";
import { type Locale, getPageDictionary } from "@/lib/i18n";
import { routesFor } from "@/lib/routes";

export interface CreationProps {
  locale?: Locale;
}

const STEPS = [
  {
    num: "01",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </>
    ),
    titleKey: "step1Title",
    textKey: "step1Text",
    items: ["step1Item1", "step1Item2", "step1Item3"],
  },
  {
    num: "02",
    icon: (
      <>
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </>
    ),
    titleKey: "step2Title",
    textKey: "step2Text",
    items: ["step2Item1", "step2Item2", "step2Item3"],
  },
  {
    num: "03",
    icon: (
      <>
        <path d="M3 21h18" />
        <path d="M5 21V7l8-4v18" />
        <path d="M19 21V11l-6-4" />
      </>
    ),
    titleKey: "step3Title",
    textKey: "step3Text",
    items: ["step3Item1", "step3Item2"],
  },
  {
    num: "04",
    icon: (
      <>
        <path d="M22 12H2" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        <line x1="6" y1="16" x2="6.01" y2="16" />
        <line x1="10" y1="16" x2="10.01" y2="16" />
      </>
    ),
    titleKey: "step4Title",
    textKey: "step4Text",
    items: ["step4Item1", "step4Item2", "step4Item3"],
  },
];

export default function Creation({ locale = "fr" }: CreationProps) {
  const t = getPageDictionary(locale, "creation_entreprise");
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
                href={`${routes.tunnel}?service=creation&pack=standard`}
              >
                {t.heroCtaPrimary}
              </Link>
              <a className="btn btn-outline" href="#process">
                {t.heroCtaSecondary}
              </a>
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
                <span>⚠️</span> {t.alertTitle.replace("⚠️ ", "")}
              </h3>
              <p dangerouslySetInnerHTML={{ __html: t.alertText }} />
            </div>
          </div>
        </div>
      </section>

      {/* ============== PROCESSUS EN 4 ÉTAPES ============== */}
      <section className="process-section" id="process">
        <div className="container">
          <div className="section-header">
            <span className="section-kicker">{t.processKicker}</span>
            <h2>{t.processTitle}</h2>
            <p>{t.processIntro}</p>
          </div>
          <div className="process-grid">
            {STEPS.map((step) => (
              <div key={step.num} className="process-card">
                <span className="process-num">{step.num}</span>
                <div className="process-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    {step.icon}
                  </svg>
                </div>
                <h3>{t[step.titleKey]}</h3>
                <p>{t[step.textKey]}</p>
                <ul className="process-list">
                  {step.items.map((k) => (
                    <li key={k} dangerouslySetInnerHTML={{ __html: t[k] }} />
                  ))}
                </ul>
                {step.num === "04" && (
                  <p>
                    <em>{t.step4Note}</em>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== KIT CORPORATE ============== */}
      <section className="kit-corporate-section">
        <div className="container">
          <div className="kit-wrapper">
            <div className="kit-visual">
              <div className="kit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3>{t.kitVisualTitle}</h3>
              <p>{t.kitVisualText}</p>
            </div>
            <div className="kit-content">
              <span className="section-kicker">{t.kitKicker}</span>
              <h2>{t.kitTitle}</h2>
              <p>{t.kitText}</p>
              <div className="kit-features">
                {["kitFeature1", "kitFeature2", "kitFeature3", "kitFeature4"].map(
                  (k) => (
                    <div key={k} className="kit-feature">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>{" "}
                      {t[k]}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== FORMES JURIDIQUES ============== */}
      <section className="section-padding section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-kicker">{t.formsKicker}</span>
            <h2>{t.formsTitle}</h2>
            <p>{t.formsIntro}</p>
          </div>
          <div className="forms-grid">
            <div className="form-card">
              <h4>{t.form1Title}</h4>
              <p>{t.form1Text}</p>
            </div>
            <div className="form-card">
              <h4>{t.form2Title}</h4>
              <p>{t.form2Text}</p>
            </div>
            <div className="form-card">
              <h4>{t.form3Title}</h4>
              <p>{t.form3Text}</p>
            </div>
            <div className="form-card">
              <h4>{t.form4Title}</h4>
              <p>{t.form4Text}</p>
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
            style={{ gridTemplateColumns: "1fr", maxWidth: 600, margin: "0 auto" }}
          >
            <div className="pricing-card popular">
              <div className="popular-badge">{t.pricingBadge}</div>
              <div className="card-header">
                <h3>{t.pricingCardTitle}</h3>
                <div className="price">
                  {t.pricingPrice}
                  <span>{t.pricingPriceSuffix}</span>
                </div>
              </div>
              <ul className="features-list">
                <li>{t.pricingFeature1}</li>
                <li>{t.pricingFeature2}</li>
                <li>{t.pricingFeature3}</li>
                <li>{t.pricingFeature4}</li>
              </ul>
              <Link
                className="btn btn-primary btn-block"
                href={`${routes.tunnel}?service=creation&pack=standard`}
              >
                {t.pricingCta}
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
