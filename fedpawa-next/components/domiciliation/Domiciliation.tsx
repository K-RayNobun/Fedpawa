// ==========================================================
// FEDPAWA — Domiciliation : Hero, Galerie filtrable (lightbox),
// Cadre juridique, Gamme Nationale, Gamme Internationale, KYC.
// Conversion de domiciliation.php.
// Interactivité : filtres galerie (gallery.js) + lightbox
// → "use client".
// ==========================================================

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type Locale, getPageDictionary } from "@/lib/i18n";
import { routesFor } from "@/lib/routes";

export interface DomiciliationProps {
  locale?: Locale;
}

type Filter = "all" | "accueil" | "bureau" | "reunion";

const GALLERY: {
  img: string;
  cls: string;
  category: Exclude<Filter, "all">;
  captionFr: string;
  captionEn: string;
  altFr: string;
  altEn: string;
}[] = [
  { img: "domi_accueil_1", cls: "w-2 h-2", category: "accueil", captionFr: "Accueil & Réception", captionEn: "Reception & Welcome", altFr: "Accueil & Réception FEDPAWA", altEn: "Reception & Welcome FEDPAWA" },
  { img: "domi_accueil_2", cls: "", category: "accueil", captionFr: "Accueil & Réception", captionEn: "Reception & Welcome", altFr: "Espace d'accueil et réception", altEn: "Welcome area and reception" },
  { img: "domi_bureau_1", cls: "", category: "bureau", captionFr: "Bureau Privé Executive", captionEn: "Private Executive Office", altFr: "Bureau privé Executive", altEn: "Private Executive Office" },
  { img: "domi_bureau_2", cls: "", category: "bureau", captionFr: "Bureau Privé & Connexion Haut Débit", captionEn: "High-speed workspace", altFr: "Bureau privé équipé", altEn: "Equipped office" },
  { img: "domi_reunion_1", cls: "", category: "reunion", captionFr: "Salle de Réunion & Hub", captionEn: "Meeting Room & Hub", altFr: "Salle de réunion", altEn: "Meeting Room & Hub" },
  { img: "domi_reunion_2", cls: "w-2", category: "reunion", captionFr: "Salle de Réunion Stratégique", captionEn: "Strategic Meeting Room", altFr: "Salle de réunion stratégique", altEn: "Strategic Meeting Room" },
];

/** Pack de domiciliation (ordre source : nationale 3, internationale 3). */
const PACKS: {
  id: string;
  gamme: "nationale" | "internationale";
  popular?: "popular" | "prestige";
  titleKey: string;
  priceKey: string;
  priceSuffixKey: string;
  usdKey?: string;
  features: string[];
}[] = [
  { id: "national-essential", gamme: "nationale", titleKey: "pack1Title", priceKey: "pack1Price", priceSuffixKey: "pack1PriceSuffix", features: ["pack1F1", "pack1F2", "pack1F3", "pack1F4", "pack1F5", "pack1F6"] },
  { id: "national-business", gamme: "nationale", titleKey: "pack2Title", priceKey: "pack2Price", priceSuffixKey: "pack2PriceSuffix", features: ["pack2F1", "pack2F2", "pack2F3", "pack2F4", "pack2F5", "pack2F6", "pack2F7"] },
  { id: "national-premium", gamme: "nationale", popular: "popular", titleKey: "pack3Title", priceKey: "pack3Price", priceSuffixKey: "pack3PriceSuffix", features: ["pack3F1", "pack3F2", "pack3F3", "pack3F4", "pack3F5", "pack3F6", "pack3F7", "pack3F8", "pack3F9"] },
  { id: "international-essential", gamme: "internationale", titleKey: "pack4Title", priceKey: "pack4Price", priceSuffixKey: "pack4PriceSuffix", usdKey: "pack4Usd", features: ["pack4F1", "pack4F2", "pack4F3", "pack4F4", "pack4F5"] },
  { id: "international-business", gamme: "internationale", titleKey: "pack5Title", priceKey: "pack5Price", priceSuffixKey: "pack5PriceSuffix", usdKey: "pack5Usd", features: ["pack5F1", "pack5F2", "pack5F3", "pack5F4", "pack5F5", "pack5F6", "pack5F7", "pack5F8"] },
  { id: "international-premium", gamme: "internationale", popular: "prestige", titleKey: "pack6Title", priceKey: "pack6Price", priceSuffixKey: "pack6PriceSuffix", usdKey: "pack6Usd", features: ["pack6F1", "pack6F2", "pack6F3", "pack6F4", "pack6F5", "pack6F6", "pack6F7", "pack6F8", "pack6F9", "pack6F10", "pack6F11", "pack6F12"] },
];

export default function Domiciliation({ locale = "fr" }: DomiciliationProps) {
  const t = getPageDictionary(locale, "domiciliation");
  const routes = routesFor(locale);

  // Filtres galerie (gallery.js).
  const [filter, setFilter] = useState<Filter>("all");
  // Lightbox (gallery.js).
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  useEffect(() => {
    document.body.style.overflow = lightboxSrc ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxSrc]);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t.filterAll },
    { key: "accueil", label: t.filterAccueil },
    { key: "bureau", label: t.filterBureau },
    { key: "reunion", label: t.filterReunion },
  ];

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
            <p>{t.heroText3}</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <a className="btn btn-primary" href="#packs-nationaux">
                {t.heroCtaPrimary}
              </a>
              <Link className="btn btn-outline" href={routes.contact}>
                {t.heroCtaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============== GALERIE (filtres + lightbox) ============== */}
      <section className="section-padding section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-kicker">{t.galleryKicker}</span>
            <h2>{t.galleryTitle}</h2>
            <p>{t.galleryIntro}</p>
          </div>
          <div className="gallery-filters">
            {filters.map((f) => (
              <button
                key={f.key}
                className={`filter-btn${filter === f.key ? " active" : ""}`}
                type="button"
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="gallery-grid">
            {GALLERY.filter(
              (g) => filter === "all" || g.category === filter,
            ).map((g) => (
              <div
                key={g.img}
                className={`gallery-item${g.cls ? ` ${g.cls}` : ""}`}
                data-category={g.category}
                style={{
                  display:
                    filter === "all" || g.category === filter
                      ? "block"
                      : "none",
                }}
              >
                <picture>
                  <source
                    type="image/webp"
                    srcSet={`/assets/images/${g.img}.webp`}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/assets/images/${g.img}.jpg`}
                    alt={locale === "en" ? g.altEn : g.altFr}
                    loading="lazy"
                    onClick={() => setLightboxSrc(`/assets/images/${g.img}.jpg`)}
                  />
                </picture>
                <span className="gallery-caption">
                  {locale === "en" ? g.captionEn : g.captionFr}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== LEGAL ALERT ============== */}
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
              <p dangerouslySetInnerHTML={{ __html: t.legalText1 }} />
              <p>{t.legalText2}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============== GAMME NATIONALE ============== */}
      <section className="section-padding" id="packs-nationaux">
        <div className="container">
          <div className="pricing-intro">
            <span className="section-kicker">{t.nationalKicker}</span>
            <h2>{t.nationalTitle}</h2>
          </div>
          <div className="pricing-grid">
            {PACKS.filter((p) => p.gamme === "nationale").map((p) => (
              <div
                key={p.id}
                className={`pricing-card${p.popular === "popular" ? " popular" : ""}`}
              >
                {p.popular === "popular" && (
                  <div className="popular-badge">{t.packPopularBadge}</div>
                )}
                <div className="card-header">
                  <h3>{t[p.titleKey]}</h3>
                  <div className="price">
                    {t[p.priceKey]}
                    <span>{t[p.priceSuffixKey]}</span>
                  </div>
                </div>
                <ul className="features-list">
                  {p.features.map((k) => (
                    <li key={k} dangerouslySetInnerHTML={{ __html: t[k] }} />
                  ))}
                </ul>
                <Link
                  className={`btn ${p.popular ? "btn-primary" : "btn-outline"} btn-block`}
                  href={`${routes.souscription}?pack=${p.id}`}
                >
                  {t.packCta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== GAMME INTERNATIONALE ============== */}
      <section className="section-padding section-alt">
        <div className="container">
          <div className="pricing-intro">
            <span className="section-kicker">{t.internationalKicker}</span>
            <h2>{t.internationalTitle}</h2>
          </div>
          <div className="pricing-grid">
            {PACKS.filter((p) => p.gamme === "internationale").map((p) => (
              <div
                key={p.id}
                className={`pricing-card${p.popular === "prestige" ? " popular" : ""}`}
              >
                {p.popular === "prestige" && (
                  <div className="popular-badge">{t.packPrestigeBadge}</div>
                )}
                <div className="card-header">
                  <h3>{t[p.titleKey]}</h3>
                  <div className="price">
                    {t[p.priceKey]}
                    <span>{t[p.priceSuffixKey]}</span>
                  </div>
                  {p.usdKey && <div className="price-sub">{t[p.usdKey]}</div>}
                </div>
                <ul className="features-list">
                  {p.features.map((k) => (
                    <li key={k} dangerouslySetInnerHTML={{ __html: t[k] }} />
                  ))}
                </ul>
                <Link
                  className={`btn ${p.popular ? "btn-primary" : "btn-outline"} btn-block`}
                  href={`${routes.souscription}?pack=${p.id}`}
                >
                  {t.packCta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== KYC SECTION ============== */}
      <section className="kyc-section">
        <div className="container">
          <div className="kyc-card">
            <div className="kyc-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 12l2 2 4-4" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
            <div className="kyc-content">
              <h2>{t.kycTitle}</h2>
              <p>{t.kycText}</p>
            </div>
          </div>
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
    </>
  );
}
