// 404 RACINE — catch global. Multi-root layouts Next 16 : les 404
// hors (site) et hors /en (ex: /page-inexistante) ne traversent
// AUCUN layout (pas de app/layout.tsx racine) → Next rendrait son
// 404 nu. Ce fichier est le seul not-found.tsx appelé sans layout
// parent : il porte donc son propre <html> + Header + Footer FR.
// Les 404 SOUS (site) et sous /en passent par leurs layouts
// respectifs et rendent app/(site)/not-found.tsx / app/en/not-found.tsx.

import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 — Page introuvable",
  description:
    "La page demandée n'existe pas. Retournez à l'accueil FEDPAWA CORPORATE SOLUTIONS.",
  robots: { index: false },
};

export default function RootNotFound() {
  return (
    <html lang="fr" data-theme="navy" data-mode="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header locale="fr" />
        <main>
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
        </main>
        <Footer locale="fr" />
      </body>
    </html>
  );
}
