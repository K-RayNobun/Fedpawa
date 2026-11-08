// Footer FEDPAWA — conversion de templates/partials/site-footer.php (vague A).
// Server component (aucune interactivité). Textes via lib/i18n.ts (FR/EN du
// partial source), liens via lib/routes.ts. Le <span id="currentYear"> est
// hydraté par un petit composant client (année courante).

import Link from "next/link";
import { getDictionary, type Locale } from "@/lib/i18n";
import { routesFor } from "@/lib/routes";
import CurrentYear from "./CurrentYear";

export interface FooterProps {
  locale?: Locale;
}

export default function Footer({ locale = "fr" }: FooterProps) {
  const { shared } = getDictionary(locale);
  const routes = routesFor(locale);
  const f = shared.footer;

  return (
    <>
      {/* ============== FOOTER ============== */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link className="brand" href={routes.home}>
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
              <p>{f.brandPitch}</p>
            </div>
            <div className="footer-contact">
              <h3 className="footer-col-title">{f.findUs}</h3>
              <p>{f.findUsAddress}</p>
              <p dangerouslySetInnerHTML={{ __html: f.openingHours }} />
              <p>
                <a href="mailto:contact@fedpawa.com">contact@fedpawa.com</a>
                <br />
                <a href="tel:+237691704802">
                  {f.phone} : +237 691 70 48 02
                </a>
                <br />
                <a
                  href="https://wa.me/237691704802"
                  target="_blank"
                  rel="noopener"
                >
                  WhatsApp : +237 691 70 48 02
                </a>
              </p>
            </div>
            <div className="footer-links">
              <h3 className="footer-col-title">{f.navigation}</h3>
              <Link href={routes.home}>{shared.nav.home}</Link>
              <Link href={routes.domiciliation}>
                {shared.nav.domiciliation}
              </Link>
              <Link href={routes.creationEntreprise}>
                {shared.nav.companyFormation}
              </Link>
              <Link href={routes.fiscalite}>
                {shared.nav.taxLegalAdvisory}
              </Link>
              <Link href={routes.oapi}>{shared.nav.oapiProtection}</Link>
              <Link href={routes.contrats}>{shared.nav.contracts}</Link>
              <Link href={routes.contact}>{shared.nav.contact}</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <span>
              © <CurrentYear /> FEDPAWA CORPORATE SOLUTIONS.{" "}
              {f.allRightsReserved}
            </span>
            <span>
              <Link href={routes.cgu} style={{ color: "inherit" }}>
                {f.terms}
              </Link>{" "}
              ·{" "}
              <Link href={routes.privacy} style={{ color: "inherit" }}>
                {f.privacy}
              </Link>
            </span>
            <span>
              Douala · Logpom · {f.cameroon}
            </span>
          </div>
        </div>
      </footer>

      {/* ============== WHATSAPP FLOAT ============== */}
      <a
        className="whatsapp-float"
        href="https://wa.me/237691704802"
        aria-label={f.whatsapp}
        target="_blank"
        rel="noopener"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      </a>
    </>
  );
}
