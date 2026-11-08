// ==========================================================
// FEDPAWA — Reveal on scroll (réplique du §4 de main.js source :
// IntersectionObserver qui ajoute .visible aux .reveal — état
// révélé attendu par globals.css `.reveal.visible` — puis unobserve).
// Client component sans rendu, cleanup complet.
// Fallback : sans IntersectionObserver, tout est révélé d'emblée.
// ==========================================================

"use client";

import { useEffect } from "react";

/**
 * Observe tous les .reveal du document et leur ajoute .visible dès
 * qu'ils entrent dans le viewport (threshold 0.12, rootMargin -60px
 * comme main.js source). Un MutationObserver rattache les .reveal
 * montés après coup (navigation client / RSC payload).
 */
export default function RevealOnScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("IntersectionObserver" in window)) {
      // Dégradation gracieuse : tout révéler immédiatement.
      document.querySelectorAll(".reveal").forEach((el) => {
        el.classList.add("visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0.12, // main.js source
        rootMargin: "0px 0px -60px 0px", // main.js source
      }
    );

    const observeAll = () => {
      document
        .querySelectorAll<HTMLElement>(".reveal:not(.visible)")
        .forEach((el) => observer.observe(el));
    };

    observeAll();

    // Nouveaux .reveal montés dynamiquement après navigation client.
    const mutationObserver = new MutationObserver(observeAll);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, []);

  return null;
}
