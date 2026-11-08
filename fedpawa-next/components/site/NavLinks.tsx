"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { routesFor } from "@/lib/routes";

// NavLinks — client component : rend is-active selon la route courante
// (extrait de Header.tsx ; parité site-header.php source : nav-link is-active)
export default function NavLinks({ locale = "fr" }: { locale?: "fr" | "en" }) {
  const pathname = usePathname();
  const routes = routesFor(locale);
  const { shared } = getDictionary(locale);
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  // Le dropdown « services » est actif si l'une de ses sous-pages l'est
  const servicesActive =
    isActive(routes.domiciliation) ||
    isActive(routes.creationEntreprise) ||
    isActive(routes.fiscalite) ||
    isActive(routes.oapi) ||
    isActive(routes.contrats);

  return (
    <nav className="main-nav">
      <ul className="nav-list">
        <li>
          <Link
            className={`nav-link${isActive(routes.home) ? " is-active" : ""}`}
            href={routes.home}
          >
            {shared.nav.home}
          </Link>
        </li>
        <li className="nav-dropdown">
          <a
            className={`nav-link${servicesActive ? " is-active" : ""}`}
            href="#"
          >
            {shared.nav.services}
          </a>
          <ul className="dropdown-menu">
            <li>
              <Link
                className={isActive(routes.domiciliation) ? "is-active" : ""}
                href={routes.domiciliation}
              >
                {shared.nav.domiciliation}
              </Link>
            </li>
            <li>
              <Link
                className={isActive(routes.creationEntreprise) ? "is-active" : ""}
                href={routes.creationEntreprise}
              >
                {shared.nav.companyFormation}
              </Link>
            </li>
            <li>
              <Link
                className={isActive(routes.fiscalite) ? "is-active" : ""}
                href={routes.fiscalite}
              >
                {shared.nav.taxLegalAdvisory}
              </Link>
            </li>
            <li>
              <Link
                className={isActive(routes.oapi) ? "is-active" : ""}
                href={routes.oapi}
              >
                {shared.nav.oapiProtection}
              </Link>
            </li>
            <li>
              <Link
                className={isActive(routes.contrats) ? "is-active" : ""}
                href={routes.contrats}
              >
                {shared.nav.contracts}
              </Link>
            </li>
          </ul>
        </li>
        <li>
          <Link
            className={`nav-link${isActive(routes.publications) ? " is-active" : ""}`}
            href={routes.publications}
          >
            {shared.nav.publications}
          </Link>
        </li>
        <li>
          <Link
            className={`nav-link${isActive(routes.aboutUs) ? " is-active" : ""}`}
            href={routes.aboutUs}
          >
            {shared.nav.aboutUs}
          </Link>
        </li>
        <li>
          <Link
            className={`nav-link${isActive(routes.contact) ? " is-active" : ""}`}
            href={routes.contact}
          >
            {shared.nav.contact}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
