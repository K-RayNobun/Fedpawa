// 404 FR (audit SEO) — page brandée entre Header/Footer du
// layout (site). Textes simples, pas de dictionnaire dédié.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 — Page introuvable",
  description:
    "La page demandée n'existe pas. Retournez à l'accueil FEDPAWA CORPORATE SOLUTIONS.",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <section className="page-hero">
      <div className="container" style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Erreur 404
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", margin: "16px 0 8px" }}>
          Page introuvable
        </h1>
        <p style={{ margin: "0 0 32px" }}>
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Link className="btn btn-primary" href="/">
          Retour à l'accueil
        </Link>
      </div>
    </section>
  );
}
