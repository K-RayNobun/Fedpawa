// ==========================================================
// FEDPAWA — Qui sommes-nous : Hero, Histoire & Vision, Galerie
// (lightbox), Chiffres (compteurs animés), 4 Piliers, Pôles,
// Comparaison, CTA, Modale RDV. Conversion de qui-sommes-nous.php.
// Interactivité : lightbox (gallery.js), compteurs (about.js),
// modale RDV (about.js) → "use client".
// ==========================================================

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { type Locale, getPageDictionary } from "@/lib/i18n";
import { routesFor } from "@/lib/routes";
import Carousel from "./Carousel";

export interface AboutProps {
  locale?: Locale;
}

/** Item de galerie source : image + classe taille + légende. */
// 12 images uniformisées 736×736 extraites de QUI_final.zip (crop centré équitable).
const GALLERY: {
  img: string;
  cls: string;
  captionFr: string;
  captionEn: string;
  altFr: string;
  altEn: string;
}[] = [
  { img: "qui_1", cls: "", captionFr: "Découverte FEDPAWA", captionEn: "Discover FEDPAWA", altFr: "Image FEDPAWA 1", altEn: "FEDPAWA image 1" },
  { img: "qui_2", cls: "", captionFr: "Espace FEDPAWA", captionEn: "FEDPAWA Space", altFr: "Image FEDPAWA 2", altEn: "FEDPAWA image 2" },
  { img: "qui_3", cls: "", captionFr: "Univers FEDPAWA", captionEn: "FEDPAWA Universe", altFr: "Image FEDPAWA 3", altEn: "FEDPAWA image 3" },
  { img: "qui_4", cls: "", captionFr: "Médias & Vidéos", captionEn: "Media & Videos", altFr: "Médias et vidéos verticales", altEn: "Vertical media and videos" },
  { img: "qui_5", cls: "", captionFr: "Stratégie d'Entreprise", captionEn: "Corporate Strategy", altFr: "Stratégie d'entreprise", altEn: "Corporate strategy" },
  { img: "qui_6", cls: "", captionFr: "Numérisation & Digitalisation", captionEn: "Digitization & Digitalization", altFr: "Numérisation et digitalisation", altEn: "Digitization and digitalization" },
  { img: "qui_7", cls: "", captionFr: "Formalités en Ligne", captionEn: "Online Formalities", altFr: "Formalités administratives en ligne", altEn: "Online administrative formalities" },
  { img: "qui_8", cls: "", captionFr: "Bien-être & Ergonomie", captionEn: "Wellness & Ergonomics", altFr: "Bien-être et ergonomie au travail", altEn: "Wellness and ergonomics at work" },
  { img: "qui_9", cls: "", captionFr: "Services aux Talents", captionEn: "Talent Services", altFr: "Services aux talents", altEn: "Talent services" },
  { img: "qui_10", cls: "", captionFr: "Cession d'Entreprise", captionEn: "Business Exit", altFr: "Raisons de cession d'entreprise", altEn: "Business owners selling reasons" },
  { img: "qui_11", cls: "", captionFr: "Transition 5.0", captionEn: "Transition 5.0", altFr: "Transition industrielle 5.0", altEn: "Industry transition 5.0" },
  { img: "qui_12", cls: "", captionFr: "Téléphonie d'Entreprise", captionEn: "Business Phone Systems", altFr: "Système téléphonique d'entreprise", altEn: "Business phone systems" },
];

export default function About({ locale = "fr" }: AboutProps) {
  const t = getPageDictionary(locale, "qui-sommes-nous");
  const routes = routesFor(locale);

  // Lightbox (gallery.js) : image haute résolution + overflow bloqué.
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  useEffect(() => {
    document.body.style.overflow = lightboxSrc ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxSrc]);

  // Compteurs animés (about.js) : IntersectionObserver + incrément 10ms.
  const counters: { target: number; decimals: number; suffix: string }[] = [
    { target: 300, decimals: 0, suffix: t.stat1Suffix },
    { target: 17, decimals: 0, suffix: t.stat2Suffix },
    { target: 99.8, decimals: 1, suffix: "%" },
    { target: 100, decimals: 0, suffix: t.stat4Suffix },
  ];
  const [counterValues, setCounterValues] = useState<number[]>(
    counters.map(() => 0),
  );
  const statsRef = useRef<HTMLDivElement | null>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || animated.current) return;
        animated.current = true;
        // Réplique about.js : durée 2000ms, tick 10ms.
        const speed = 2000;
        counters.forEach((c, i) => {
          const increment = c.target / (speed / 10);
          let current = 0;
          const tick = () => {
            current += increment;
            if (current < c.target) {
              setCounterValues((v) => {
                const next = [...v];
                next[i] = current;
                return next;
              });
              setTimeout(tick, 10);
            } else {
              setCounterValues((v) => {
                const next = [...v];
                next[i] = c.target;
                return next;
              });
            }
          };
          tick();
        });
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modale Rendez-vous (about.js) : trigger data-modal-trigger + overlay.
  const [rdvOpen, setRdvOpen] = useState(false);
  const [rdvSent, setRdvSent] = useState(false);
  useEffect(() => {
    document.body.style.overflow = rdvOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [rdvOpen]);

  const openLightbox = (img: string) => {
    setLightboxSrc(`/assets/images/${img}.jpg`);
  };

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
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link href={routes.domiciliation} className="btn btn-gold">
                {t.heroCtaPrimary}
              </Link>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setRdvOpen(true)}
              >
                {t.heroCtaModal}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============== HISTOIRE & VISION ============== */}
      <section className="oapi-risk-section">
        <div className="container">
          <div className="oapi-risk-grid">
            <div className="oapi-risk-text">
              <span className="section-kicker">{t.historyKicker}</span>
              <h2>{t.historyTitle}</h2>
              <p>{t.historyText1}</p>
              <p>{t.historyText2}</p>
            </div>
            <div className="about-vision-box">
              <div className="about-vision-photo">
                <picture>
                  <source
                    type="image/webp"
                    srcSet="/assets/images/qui_6.webp"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/images/qui_6.jpg"
                    alt={t.visionImgAlt}
                    loading="lazy"
                  />
                </picture>
              </div>
              <h3>
                <span>🎯</span> {t.visionTitle.replace("🎯 ", "")}
              </h3>
              <p>{t.visionText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============== GALERIE PHOTOS ============== */}
      <section className="section-padding">
        <div className="container">
          <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {GALLERY.map((item, index) => (
              <div key={index} style={{ height: '300px', overflow: 'hidden', borderRadius: '8px', cursor: 'pointer' }} onClick={() => openLightbox(item.img)}>
                <img 
                  src={`/assets/images/${item.img}.jpg`} 
                  alt={item.altFr} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ============== CHIFFRES CLÉS (compteurs animés) ============== */}
      <section className="stats-section">
        <div className="container">
          <div className="section-header" style={{ marginBottom: 40 }}>
            <span
              className="section-kicker"
              style={{ color: "var(--color-gold)", justifyContent: "center" }}
            >
              {t.statsKicker}
            </span>
            <h2 style={{ color: "#fff" }}>{t.statsTitle}</h2>
          </div>
          <div className="stats-wrap" ref={statsRef}>
            <div className="stat-item">
              <span className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 21h18" />
                  <path d="M5 21V7l7-4 7 4v14" />
                  <path d="M9 21v-5h6v5" />
                </svg>
              </span>
              <strong className="stat-counter">
                {counterValues[0].toFixed(0)}
                {t.stat1Suffix}
              </strong>
              <span>{t.stat1Label}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </span>
              <strong className="stat-counter">
                {counterValues[1].toFixed(0)}
                {t.stat2Suffix}
              </strong>
              <span>{t.stat2Label}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </span>
              <strong className="stat-counter">
                {counterValues[2].toFixed(1)}%
              </strong>
              <span>{t.stat3Label}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <strong className="stat-counter">
                {counterValues[3].toFixed(0)}
                {t.stat4Suffix}
              </strong>
              <span>{t.stat4Label}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============== 4 PILIERS D'EXCELLENCE ============== */}
      <section className="section-padding section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-kicker">{t.pillarsKicker}</span>
            <h2>{t.pillarsTitle}</h2>
            <p>{t.pillarsIntro}</p>
          </div>
          <div className="forms-grid">
            <div className="form-card">
              <h4>{t.pillar1Title}</h4>
              <p>{t.pillar1Text}</p>
            </div>
            <div className="form-card">
              <h4>{t.pillar2Title}</h4>
              <p>{t.pillar2Text}</p>
            </div>
            <div className="form-card">
              <h4>{t.pillar3Title}</h4>
              <p>{t.pillar3Text}</p>
            </div>
            <div className="form-card">
              <h4>{t.pillar4Title}</h4>
              <p>{t.pillar4Text}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============== PÔLES D'EXPERTISE ============== */}
      <section className="section-padding">
        <div className="container">
          <div className="section-header">
            <span className="section-kicker">{t.expertiseKicker}</span>
            <h2>{t.expertiseTitle}</h2>
          </div>
          <div className="solutions-grid">
            <div className="solution-card">
              <div className="solution-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
              </div>
              <h3>{t.pole1Title}</h3>
              <span className="obj">{t.pole1Obj}</span>
              <ul className="solution-list">
                <li>{t.pole1Item1}</li>
                <li>{t.pole1Item2}</li>
                <li>{t.pole1Item3}</li>
              </ul>
            </div>
            <div className="solution-card">
              <div className="solution-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
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
                  <path d="M3 21h18" />
                  <path d="M5 21V8l7-5 7 5v13" />
                  <path d="M9 21v-5h6v5" />
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

      {/* ============== POURQUOI CHOISIR FEDPAWA ============== */}
      <section className="comparison-section">
        <div className="container">
          <div className="section-header">
            <span className="section-kicker">{t.compareKicker}</span>
            <h2>{t.compareTitle}</h2>
            <p>{t.compareIntro}</p>
          </div>
          <table className="comparison-table">
            <thead>
              <tr>
                <th className="col-criteria">{t.compareHeadCriteria}</th>
                <th className="col-tradition">{t.compareHeadTradition}</th>
                <th className="col-fedpawa">{t.compareHeadFedpawa}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="col-criteria">{t.row1Criteria}</td>
                <td>{t.row1Tradition}</td>
                <td className="col-fedpawa">{t.row1Fedpawa}</td>
              </tr>
              <tr>
                <td className="col-criteria">{t.row2Criteria}</td>
                <td>{t.row2Tradition}</td>
                <td className="col-fedpawa">{t.row2Fedpawa}</td>
              </tr>
              <tr>
                <td className="col-criteria">{t.row3Criteria}</td>
                <td>{t.row3Tradition}</td>
                <td className="col-fedpawa">{t.row3Fedpawa}</td>
              </tr>
              <tr>
                <td className="col-criteria">{t.row4Criteria}</td>
                <td>{t.row4Tradition}</td>
                <td className="col-fedpawa">{t.row4Fedpawa}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ============== CTA FINAL ============== */}
      <section className="cta-banner-section">
        <div className="container">
          <h2>{t.ctaTitle}</h2>
          <p>{t.ctaText}</p>
          <Link href={routes.contact} className="btn btn-gold">
            {t.ctaButton}
          </Link>
        </div>
      </section>

      {/* ============== LIGHTBOX ============== */}
      <div
        className={`lightbox${lightboxSrc ? " open" : ""}`}
        id="lightbox"
        onClick={(e) => {
          if (
            e.target === e.currentTarget ||
            (e.target as HTMLElement).classList.contains("lightbox-close")
          ) {
            setLightboxSrc(null);
          }
        }}
      >
        <span className="lightbox-close">&times;</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            lightboxSrc ??
            "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
          }
          id="lightboxImg"
          alt={t.galleryLightboxAlt}
        />
      </div>

      {/* ============== MODALE RENDEZ-VOUS ============== */}
      <div
        className={`modal-overlay${rdvOpen ? " open" : ""}`}
        id="appointmentModal"
        onClick={(e) => {
          if (e.target === e.currentTarget) setRdvOpen(false);
        }}
      >
        <div className="modal-box">
          <button
            type="button"
            className="modal-close"
            aria-label={t.modalCloseLabel}
            onClick={() => setRdvOpen(false)}
          >
            &times;
          </button>
          <div className="modal-header">
            <h3>{t.modalTitle}</h3>
            <p>{t.modalIntro}</p>
          </div>
          <form
            onSubmit={(e) => {
              // Comportement source (about.js) : alert + fermeture.
              e.preventDefault();
              window.alert(t.modalSuccess);
              setRdvSent(true);
              setRdvOpen(false);
            }}
          >
            <div className="form-group">
              <label>{t.modalReasonLabel}</label>
              <select className="form-control" required>
                <option value="">{t.modalReasonPlaceholder}</option>
                <option>{t.modalReason1}</option>
                <option>{t.modalReason2}</option>
                <option>{t.modalReason3}</option>
                <option>{t.modalReason4}</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t.modalNameLabel}</label>
              <input type="text" className="form-control" required />
            </div>
            <div className="form-group">
              <label>{t.modalPhoneLabel}</label>
              <input type="tel" className="form-control" required />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              {t.modalSubmit}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
