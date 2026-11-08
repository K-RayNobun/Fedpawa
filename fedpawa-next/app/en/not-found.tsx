// 404 EN (audit SEO) — miroir de app/(site)/not-found.tsx, rendu
// dans le layout EN (Header/Footer anglais).

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  description:
    "The page you are looking for does not exist. Return to the FEDPAWA CORPORATE SOLUTIONS homepage.",
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
          Error 404
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", margin: "16px 0 8px" }}>
          Page not found
        </h1>
        <p style={{ margin: "0 0 32px" }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link className="btn btn-primary" href="/en">
          Back to homepage
        </Link>
      </div>
    </section>
  );
}
