// Header FEDPAWA — conversion de templates/partials/site-header.php (vague A).
// barres top-bar + navigation + menu mobile. Interactivité = menu burger
// + toggles → "use client" requis. Textes via lib/i18n.ts, liens via lib/routes.ts.

"use client";

import Link from "next/link";
import NavLinks from "./NavLinks";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getDictionary, type Locale } from "@/lib/i18n";
import { mirrorHref, routesFor } from "@/lib/routes";
import { getToken, logout } from "@/lib/auth";
import { usePwaNotifications } from "@/components/pwa/PwaProvider";
import PublicationsBell from "@/components/publications/PublicationsBell";

export interface HeaderProps {
  locale?: Locale;
  /** Section active (réplique $active du PHP) : "" = aucune. */
  active?:
    | ""
    | "index"
    | "domiciliation"
    | "creation"
    | "fiscalite"
    | "oapi"
    | "contrats"
    | "about"
    | "contact";
}

export default function Header({ locale = "fr", active = "" }: HeaderProps) {
  const { shared } = getDictionary(locale);
  const routes = routesFor(locale);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Mode sombre/clair : data-mode sur <html> + localStorage "fedpawa-mode"
  // (parité main.js source : défaut dark, lecture au montage client).
  const [darkMode, setDarkMode] = useState(true);
  const [connected, setConnected] = useState(false);
  // PWA — bouton notifications (masqué si permission != "default"
  // ou refus persistant ; logique dans PwaProvider).
  // Déclencheur réactif : re-exécute quand le token change,
  // afin que le bouton "Se Connecter" disparaisse dès que
  // l'utilisateur est authentifié (token stocké en localStorage).
  const pwa = usePwaNotifications();
  // --- LOGIQUE PROFIL ---
  const profileType = "client"; // défini par défaut ; peut être mis à jour depuis /api/v1/auth/me
  const isAdmin = profileType === "admin";
  // Options admin : visibles seulement si profileType est "admin"
  // Options client : visibles par défaut

  const servicesActive = [
    "services",
    "domiciliation",
    "creation",
    "fiscalite",
    "oapi",
    "contrats",
  ].includes(active);

  // Mode sauvegardé + état de connexion (client-only, après montage
  // pour éviter tout mismatch d'hydratation).
  useEffect(() => {
    const saved = window.localStorage.getItem("fedpawa-mode");
    const mode = saved === "light" ? "light" : "dark";
    setDarkMode(mode === "dark");
    document.documentElement.setAttribute("data-mode", mode);
    setConnected(Boolean(getToken()));
  }, [getToken()]);

  // Fermeture du menu mobile au resize >= desktop (comportement fedpawa-ui.js).
  useEffect(() => {
    if (!mobileOpen) return;
    const onResize = () => {
      if (window.innerWidth >= 993) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileOpen]);

  // FIX: classes CSS réelles attendues par globals.css — .open sur
  // .mobile-nav (l.110) et body.nav-open (l.116), pas is-open/no-scroll.
  // Clic-extérieur (parité main.js l.57) + Escape (A11Y) ferment le menu.
  useEffect(() => {
    document.body.classList.toggle("nav-open", mobileOpen);
    if (!mobileOpen) return;
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest(".mobile-nav") &&
        !target.closest(".menu-toggle")
      ) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKeydown);
    // Délai micro-task : exclure le clic d'ouverture lui-même.
    const timer = setTimeout(() => {
      document.addEventListener("click", onClickOutside);
    }, 0);
    return () => {
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("click", onClickOutside);
      document.body.classList.remove("nav-open");
      clearTimeout(timer);
    };
  }, [mobileOpen]);

  // FIX: toggle sombre/clair branché (parité main.js setMode) —
  // data-mode sur <html> + persistance localStorage "fedpawa-mode".
  function toggleMode() {
    const next = darkMode ? "light" : "dark";
    setDarkMode(!darkMode);
    document.documentElement.setAttribute("data-mode", next);
    window.localStorage.setItem("fedpawa-mode", next);
  }

  const handleLogout = () => {
    setMobileOpen(false);
    void logout(routes.auth);
  };

  // Page jumelle FR↔EN depuis la route courante (parité main.js
  // source l.147-153 switchLanguage : la page est conservée,
  // /fiscalite ↔ /en/fiscalite, / ↔ /en).
  const pathname = usePathname();
  const langHref = mirrorHref(pathname, locale === "en" ? "fr" : "en");

  return (
    <>
      {/* ============== TOP BAR ============== */}
      <div className="top-bar">
        <div className="container">
          <div className="top-bar-info">
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>{" "}
              {shared.topBar.address}
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>{" "}
              {shared.topBar.hours}
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <path d="m22 6-10 7L2 6" />
              </svg>{" "}
              contact@fedpawa.com
            </span>
          </div>
        </div>
      </div>

      {/* ============== HEADER ============== */}
      <header className="site-header" id="siteHeader">
        <div className="container header-inner">
          <Link
            className="brand"
            href={routes.home}
            aria-label="FEDPAWA CORPORATE SOLUTIONS"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- <Image> interdit: dimensions source inconnues en vague A */}
            <img
              className="brand-logo"
              src="/assets/images/logo.jpg"
              alt="Logo FEDPAWA Corporate Solutions"
            />
            <span className="brand-copy">
              <strong>FEDPAWA</strong>
              <small>Corporate Solutions</small>
            </span>
          </Link>
          <NavLinks locale={locale} />
          <button
            className={`menu-toggle${mobileOpen ? " open" : ""}`}
            id="menuToggle"
            aria-label={shared.footer.openMenu}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          {/* nav-actions : état de connexion — token Sanctum (localStorage).
              Cloche notifications (vague E) si connecté, avant le CTA login. */}
          <div className="nav-actions" id="navActions">
            {connected && (
              <PublicationsBell locale={locale} variant="desktop" />
            )}
            {!connected && (
              <Link className="nav-login" href={routes.auth}>
                {locale === "en" ? "Sign in" : "Se Connecter"}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ============== MOBILE NAVIGATION ============== */}
      <div
        className={`mobile-nav${mobileOpen ? " open" : ""}`}
        id="mobileNav"
      >
        <nav>
          <Link href={routes.home} onClick={() => setMobileOpen(false)}>
            {shared.nav.home}
          </Link>
          <Link href={routes.domiciliation} onClick={() => setMobileOpen(false)}>
            {shared.nav.domiciliation}
          </Link>
          <Link
            href={routes.creationEntreprise}
            onClick={() => setMobileOpen(false)}
          >
            {shared.nav.companyFormation}
          </Link>
          <Link href={routes.fiscalite} onClick={() => setMobileOpen(false)}>
            {shared.nav.taxLegalAdvisory}
          </Link>
          <Link href={routes.oapi} onClick={() => setMobileOpen(false)}>
            {shared.nav.oapiProtection}
          </Link>
          <Link href={routes.contrats} onClick={() => setMobileOpen(false)}>
            {shared.nav.contracts}
          </Link>
          <Link
            href={routes.publications}
            onClick={() => setMobileOpen(false)}
          >
            {shared.nav.publications}
          </Link>
          <Link href={routes.aboutUs} onClick={() => setMobileOpen(false)}>
            {shared.nav.aboutUs}
          </Link>
          <Link href={routes.contact} onClick={() => setMobileOpen(false)}>
            {shared.nav.contact}

          {connected && (
            <div className="profile-menu-section" style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column' }}>
              <Link href={isAdmin ? routes.adminDashboard : routes.espaceClient} onClick={() => setMobileOpen(false)}>
                {isAdmin ? "Dashboard" : "Espace Client"}
              </Link>
              <Link href="/parametres" onClick={() => setMobileOpen(false)}>
                Paramètres
              </Link>
            </div>
          )}          </Link>

          {/* CTA mobile : login si déconnecté, déconnexion sinon (F4 source) */}
          {connected ? (
            <button
              type="button"
              className="mobile-cta"
              style={{
                background: "none",
                border: "none",
                color: "#ffd98a",
                cursor: "pointer",
                font: "inherit",
                textAlign: "left",
              }}
              onClick={handleLogout}
            >
              🚪 {locale === "en" ? "Log out" : "Se déconnecter"}
            </button>
          ) : (
            <Link
              className="mobile-cta"
              href={routes.auth}
              onClick={() => setMobileOpen(false)}
            >
              {locale === "en" ? "Sign in" : "Se Connecter"}
            </Link>
          )}

          {/* Cloche notifications mobile (vague E) — item du menu, si connecté. */}
          {connected && (
            <PublicationsBell locale={locale} variant="mobile" />
          )}

          <div className="mobile-nav-toggles">
            {/* PWA — « Activer les notifications » sous le lang-toggle
                (style .lang-toggle existant ; masqué si permission
                != default ou refus persistant). */}
            {pwa.canAsk && (
              <button
                type="button"
                className="lang-toggle mobile-lang-toggle mobile-push-toggle"
                id="mobilePushToggle"
                aria-label={pwa.texts.ariaLabel}
                title={pwa.texts.activate}
                disabled={pwa.busy}
                onClick={() => {
                  void pwa.enableNotifications();
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ width: 16, height: 16 }}
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
            )}
            <button
              className="mode-toggle mobile-mode-toggle"
              id="mobileModeToggle"
              aria-label="Basculer en mode sombre/clair"
              aria-pressed={darkMode}
              title="Light / dark mode"
              onClick={toggleMode}
            >
              <svg
                className="sun-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              <svg
                className="moon-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </button>
            <button
              className="lang-toggle mobile-lang-toggle"
              id="mobileLangToggle"
              aria-label="Switch language / Changer de langue"
              title="FR / EN"
              onClick={() => {
                window.location.href = langHref;
              }}
            >
              {locale === "en" ? "FR" : "EN"}
            </button>
            <button
              className="mobile-close-btn"
              aria-label="Fermer le menu"
              title="Fermer le menu"
              onClick={() => setMobileOpen(false)}
            >
              ×
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
