// ==========================================================
// FEDPAWA — accueil (index) : Hero + Services (tabs) + Profile
// + Specialties + Stats + Testimonials. Conversion de index.php.
// Interactivité : tabs expertise → "use client".
// SSR INTÉGRAL des 5 panneaux services (data-service 01–05) :
// le HTML servi contient les 5 contenus (SEO + no-JS), le CSS
// masque les inactifs (.expertise-content sans .active),
// l'état React ne pilote que les classes.
// Sections absentes du source EN rendues conditionnellement.
// ==========================================================

"use client";

import Link from "next/link";
import { useState } from "react";
import { type Locale, getPageDictionary } from "@/lib/i18n";
import { routesFor } from "@/lib/routes";

export interface HomeProps {
  locale?: Locale;
}

type ServiceTab = "01" | "02" | "03" | "04" | "05";

const SERVICES: {
  id: ServiceTab;
  img: string;
  imgAlt: string;
  routeKey:
    | "domiciliation"
    | "creationEntreprise"
    | "fiscalite"
    | "oapi"
    | "contrats";
  keys: {
    kicker: string;
    title: string;
    text: string;
    features: [string, string, string, string];
    link: string;
    nav: string;
  };
}[] = [
  {
    id: "01",
    img: "/assets/images/home_domiciliation",
    imgAlt: "Domiciliation",
    routeKey: "domiciliation",
    keys: {
      kicker: "service01Kicker",
      title: "service01Title",
      text: "service01Text",
      features: [
        "service01Feature1",
        "service01Feature2",
        "service01Feature3",
        "service01Feature4",
      ],
      link: "service01Link",
      nav: "navService01",
    },
  },
  {
    id: "02",
    img: "/assets/images/home_creation",
    imgAlt: "Création entreprise",
    routeKey: "creationEntreprise",
    keys: {
      kicker: "service02Kicker",
      title: "service02Title",
      text: "service02Text",
      features: [
        "service02Feature1",
        "service02Feature2",
        "service02Feature3",
        "service02Feature4",
      ],
      link: "service02Link",
      nav: "navService02",
    },
  },
  {
    id: "03",
    img: "/assets/images/home_fiscalite",
    imgAlt: "Fiscalité",
    routeKey: "fiscalite",
    keys: {
      kicker: "service03Kicker",
      title: "service03Title",
      text: "service03Text",
      features: [
        "service03Feature1",
        "service03Feature2",
        "service03Feature3",
        "service03Feature4",
      ],
      link: "service03Link",
      nav: "navService03",
    },
  },
  {
    id: "04",
    img: "/assets/images/home_oapi",
    imgAlt: "OAPI — Marques et dessins",
    routeKey: "oapi",
    keys: {
      kicker: "service04Kicker",
      title: "service04Title",
      text: "service04Text",
      features: [
        "service04Feature1",
        "service04Feature2",
        "service04Feature3",
        "service04Feature4",
      ],
      link: "service04Link",
      nav: "navService04",
    },
  },
  {
    id: "05",
    img: "/assets/images/home_contrats",
    imgAlt: "Contrats — Juridique",
    routeKey: "contrats",
    keys: {
      kicker: "service05Kicker",
      title: "service05Title",
      text: "service05Text",
      features: [
        "service05Feature1",
        "service05Feature2",
        "service05Feature3",
        "service05Feature4",
      ],
      link: "service05Link",
      nav: "navService05",
    },
  },
];

export default function Home({ locale = "fr" }: HomeProps) {
  const t = getPageDictionary(locale, "index");
  const routes = routesFor(locale);
  const [activeService, setActiveService] = useState<ServiceTab>("01");

  const hasSpecialties = Boolean(t.specialty1);
  const hasStats = Boolean(t.statYear);
  const hasTestimonials = Boolean(t.testimonialsKicker);

  return (
    <>
      {/* ============== HERO ============== */}
      <section className="hero" id="accueil">
        <div className="container hero-inner">
          <div className="hero-content">
            <div className={locale === "en" ? "hero-badge" : "hero-eyebrow"}>
              {t.heroEyebrow}
            </div>
            <h1>
              {t.heroTitleA}
              <br />
              {t.heroTitleB} <span>{t.heroTitleSpan}</span>
            </h1>
            <p className="hero-subtitle">{t.heroSubtitle}</p>
            <p className="hero-description">{t.heroDescription}</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href={routes.domiciliation}>
                {t.heroCtaPrimary} <span aria-hidden="true">→</span>
              </Link>
              <Link className="btn btn-outline" href={routes.contact}>
                {t.heroCtaSecondary}
              </Link>
            </div>
            {/* Bandeau preuves : FR uniquement — absent du source EN
                (règle JAMAIS INVENTER : pas de traduction inventée). */}
            {locale === "fr" && (
              <div className="hero-proof">
                <span>
                  <strong>{t.heroProofOnline}</strong>
                  {t.heroProofOnlineLabel}
                </span>
                <span>
                  <strong>{t.heroProofStars}</strong>
                  {t.heroProofStarsLabel}
                </span>
                <span>
                  <strong>{t.heroProof247}</strong>
                  {t.heroProof247Label}
                </span>
              </div>
            )}
          </div>
          {/* Visuel hero + carte flottante : FR uniquement — le hero EN
              du source n'a pas de hero-media (parité index.php EN). */}
          {locale === "fr" && (
            <div className="hero-media">
              <div className="hero-frame-border"></div>
              <div className="hero-image-frame">
                <picture>
                  <source
                    type="image/webp"
                    srcSet="/assets/images/home_hero.webp"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element -- <Image> interdit: dimensions source inconnues */}
                  <img
                    src="/assets/images/home_hero_new.jpg"
                    alt="Professionnels camerounais au bureau à Douala"
                  />
                </picture>
              </div>
              <div className="hero-float-card">
                <div className="float-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M3 21h18" />
                    <path d="M5 21V8l7-5 7 5v13" />
                    <path d="M9 21v-6h6v6" />
                  </svg>
                </div>
                <div>
                  <strong>{t.heroFloatTitle}</strong>
                  <span>{t.heroFloatText}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============== SERVICES (onglets expertise — 5 panneaux SSR) ============== */}
      <section className="expertise-section" id="services">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-kicker">{t.servicesKicker}</span>
            <h2>{t.servicesTitle}</h2>
            {locale === "fr" && <p>{t.servicesIntro}</p>}
          </div>
          <div className="expertise-card reveal">
            {/* Les 5 médias sont rendus côté serveur ; seul l'actif est
                affiché (les autres gardent display:none du CSS source,
                piloté par le style inline comme index.php). */}
            {SERVICES.map((s) => (
              <div
                key={s.id}
                className="expertise-media"
                data-service={s.id}
                style={
                  activeService === s.id ? undefined : { display: "none" }
                }
              >
                <picture>
                  <source type="image/webp" srcSet={`${s.img}.webp`} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${s.img}.jpg`} alt={s.imgAlt} />
                </picture>
              </div>
            ))}
            {/* Les 5 panneaux contenu sont dans le HTML servi (SEO/no-JS) ;
                .expertise-content sans .active est masqué par le CSS. */}
            {SERVICES.map((s) => (
              <div
                key={s.id}
                className={`expertise-body expertise-content${
                  activeService === s.id ? " active" : ""
                }`}
                data-service={s.id}
                id={`service-panel-${s.id}`}
                role="tabpanel"
                aria-hidden={activeService !== s.id}
              >
                <span className="expertise-kicker">{t[s.keys.kicker]}</span>
                <div className="expertise-title-group">
                  <span className="expertise-number-inline">{s.id}</span>
                  <h3 className="expertise-title">{t[s.keys.title]}</h3>
                </div>
                <p className="expertise-text">{t[s.keys.text]}</p>
                <ul className="expertise-features">
                  {s.keys.features.map((k) => (
                    <li key={k}>{t[k]}</li>
                  ))}
                </ul>
                <Link className="text-link" href={routes[s.routeKey]}>
                  {t[s.keys.link]} <span aria-hidden="true">→</span>
                </Link>
              </div>
            ))}
            <div
              className="expertise-nav-vertical"
              role="tablist"
              aria-label={t.servicesAriaLabel}
            >
              {SERVICES.map((s) => (
                <button
                  key={s.id}
                  className={`expertise-nav-item${
                    activeService === s.id ? " active" : ""
                  }`}
                  type="button"
                  role="tab"
                  data-target={s.id}
                  aria-selected={activeService === s.id}
                  aria-controls={`service-panel-${s.id}`}
                  onClick={() => setActiveService(s.id)}
                >
                  {s.id}
                  <small>{t[s.keys.nav]}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============== PROFILE / DIFFERENCE ============== */}
      <section className={locale === "en" ? "section-padding" : "profile-section"} id="difference">
        <div className="container">
          <div className={locale === "en" ? "section-header" : "profile-layout"}>
            {locale === "fr" && (
              <div className="profile-visual reveal">
                <div className="profile-frame-border"></div>
                <picture>
                  <source
                    type="image/webp"
                    srcSet="/assets/images/home_team_new.webp"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/images/home_team_new.jpg"
                    alt={t.profileImgAlt}
                  />
                </picture>
                <div className="profile-visual-badge">
                  <div className="year">{t.profileBadgeYear}</div>
                  <div className="label">{t.profileBadgeLabel}</div>
                </div>
              </div>
            )}
            <div className={locale === "en" ? "" : "profile-content reveal"}>
              <span className="section-kicker">{t.profileKicker}</span>
              <h2>{t.profileTitle}</h2>
              <div className={locale === "en" ? "" : "profile-columns"}>
                <p className={locale === "fr" ? "drop-cap" : undefined}>
                  {t.profileText1}
                </p>
                {locale === "fr" && <p>{t.profileText2}</p>}
              </div>
              {locale === "fr" && (
                <div className="profile-signature">
                  <div>
                    <div className="signature-name">
                      {t.profileSignatureName}
                    </div>
                    <div className="signature-role">
                      {t.profileSignatureRole}
                    </div>
                  </div>
                  <Link className="btn btn-outline" href={routes.contact}>
                    {t.profileCta}
                  </Link>
                </div>
              )}
              {locale === "en" && (
                <div style={{ textAlign: "center" }}>
                  <Link
                    className="btn btn-primary"
                    href={routes.aboutUs}
                  >
                    {t.profileCta} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============== SPECIALTIES (FR uniquement — absent du source EN) ============== */}
      {hasSpecialties && (
        <section className="section-padding section-alt">
          <div className="container">
            <div className="specialties-card reveal">
              <div className="specialties-intro">
                <span className="section-kicker">{t.specialtiesKicker}</span>
                <h2>{t.specialtiesTitle}</h2>
                <p>{t.specialtiesIntro}</p>
                <p className="signature">{t.specialtiesSignature}</p>
              </div>
              <div className="specialties-grid">
                <div className="specialty-item">{t.specialty1}</div>
                <div className="specialty-item">{t.specialty2}</div>
                <div className="specialty-item">{t.specialty3}</div>
                <div className="specialty-item">{t.specialty4}</div>
                <div className="specialty-item">{t.specialty5}</div>
                <div className="specialty-item">{t.specialty6}</div>
                <div className="specialty-item">{t.specialty7}</div>
                <div className="specialty-item">{t.specialty8}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============== STATS (FR uniquement) ============== */}
      {hasStats && (
        <section className="stats-section" id="chiffres">
          <div className="container">
            <div className="stats-wrap reveal">
              <div className="stat-item">
                <span className="stat-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M3 21h18" />
                    <path d="M5 21V7l7-4 7 4v14" />
                    <path d="M9 21v-5h6v5" />
                  </svg>
                </span>
                <strong>{t.statYear}</strong>
                <span>{t.statYearLabel}</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                    <circle cx="10" cy="7" r="4" />
                  </svg>
                </span>
                <strong>{t.statMembers}</strong>
                <span>{t.statMembersLabel}</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
                  </svg>
                </span>
                <strong>{t.statStars}</strong>
                <span>{t.statStarsLabel}</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </span>
                <strong>{t.stat247}</strong>
                <span>{t.stat247Label}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============== TESTIMONIALS (FR uniquement) ============== */}
      {hasTestimonials && (
        <section className="testimonials-section" id="temoignages">
          <div className="container">
            <div className="section-header reveal">
              <span className="section-kicker">{t.testimonialsKicker}</span>
              <h2>{t.testimonialsTitle}</h2>
              <p>{t.testimonialsIntro}</p>
            </div>
            <div className="testimonials-grid">
              <article className="testimonial-card reveal">
                <div className="quote-mark">"</div>
                <div className="stars">★★★★★</div>
                <blockquote>{t.testimonial1Text}</blockquote>
                <div className="testimonial-author">
                  <span className="author-avatar">C</span>
                  <span>
                    <strong>{t.testimonial1Name}</strong>
                    <small>{t.testimonial1Role}</small>
                  </span>
                </div>
              </article>
              <article className="testimonial-card reveal">
                <div className="quote-mark">"</div>
                <div className="stars">★★★★★</div>
                <blockquote>{t.testimonial2Text}</blockquote>
                <div className="testimonial-author">
                  <span className="author-avatar">E</span>
                  <span>
                    <strong>{t.testimonial2Name}</strong>
                    <small>{t.testimonial2Role}</small>
                  </span>
                </div>
              </article>
            </div>
          </div>
        </section>
      )}

      {/* ============== CTA FINAL (EN uniquement — section cta-section du source EN) ============== */}
      {locale === "en" && (
        <section className="cta-section">
          <div className="container">
            <h2>{t.ctaTitle}</h2>
            <p>{t.ctaText}</p>
            <div
              style={{
                display: "flex",
                gap: 16,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                className="btn btn-primary"
                href={`${routes.tunnel}?service=domiciliation&pack=essentiel`}
              >
                {t.ctaPrimary}
              </Link>
              <Link className="btn btn-outline" href={routes.contact}>
                {t.ctaSecondary}
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
