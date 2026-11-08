// ==========================================================
// FEDPAWA — garde « user » (audit #2, P0)
// Parité auth-guard.js source data-auth="user" : page réservée
// à tout utilisateur connecté (client OU admin). Anonyme →
// redirection vers /authentification?next=<page courante>.
// CLIENT-SIDE uniquement (JS redirect comme le source) : le
// prérendu statique reste intact, la page générée est rendue
// puis remplacée au navigateur — pas de server redirect.
// Token Bearer via fetchMe (lib/auth.ts) ; dégradation gracieuse :
// API injoignable → page visible (cohérent source statique).
// ==========================================================

"use client";

import { useEffect, useState } from "react";
import { fetchMe } from "@/lib/auth";
import { routesFor } from "@/lib/routes";
import type { Locale } from "@/lib/i18n";

export type UserGuardStatus = "checking" | "denied" | "allowed";

/**
 * Garde data-auth="user" : tout utilisateur connecté passe
 * (client ou admin), l'anonyme est expulsé vers l'authentification
 * avec ?next= pour revenir après connexion (parité redirectTo
 * du source : pathname + search préservés).
 */
export function useUserPageGuard(locale: Locale = "fr"): UserGuardStatus {
  const [status, setStatus] = useState<UserGuardStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    fetchMe()
      .then((me) => {
        if (cancelled) return;
        if (me.authenticated) {
          setStatus("allowed");
          return;
        }
        // Anonyme : expulsion vers l'authentification avec ?next=
        // (window.location.replace = parité source auth-guard.js).
        // next = pathname+search courant : forcément interne, mais la
        // garde isSafeNextPath est appliquée par le consommateur
        // (Auth.tsx) — ici on n'introduit jamais d'URL externe.
        setStatus("denied");
        const routes = routesFor(locale);
        const next = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        window.location.replace(`${routes.auth}?next=${next}`);
      })
      .catch(() => {
        // API injoignable : laisser la page visible (dégradation
        // gracieuse, cohérent avec le site statique source).
        if (!cancelled) setStatus("allowed");
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  return status;
}
