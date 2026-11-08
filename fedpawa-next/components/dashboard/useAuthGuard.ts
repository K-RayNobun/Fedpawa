// ==========================================================
// FEDPAWA — garde d'accès vague D (parité auth-guard.js source)
// data-auth="client" : clients uniquement (admin → dashboard admin,
// anonyme → authentification) ; data-auth="admin" : admins uniquement
// (client → espace client, anonyme → authentification).
// Rôle depuis GET /api/v1/auth/me (toujours 200). Dégradation
// gracieuse : API injoignable → page visible (cohérent source).
// Token Bearer : lib/auth.ts (localStorage "fedpawa_token").
// ==========================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, type UserRole } from "@/lib/auth";
import { routesFor } from "@/lib/routes";
import type { Locale } from "@/lib/i18n";

export type GuardStatus = "checking" | "denied" | "allowed";

export interface GuardResult {
  status: GuardStatus;
  role: UserRole | null;
}

/**
 * Vérifie le rôle via /api/v1/auth/me et redirige si nécessaire.
 * - "checking" tant que la vérification court (rendu vide, parité
 *   auth-guard.js qui redirige avant tout affichage).
 * - API injoignable : page visible (dégradation gracieuse).
 */
export function useAuthGuard(
  required: "client" | "admin",
  locale: Locale = "fr",
): GuardResult {
  const router = useRouter();
  const routes = routesFor(locale);
  const [result, setResult] = useState<GuardResult>({
    status: "checking",
    role: null,
  });

  useEffect(() => {
    let cancelled = false;

    const apply = (role: UserRole | null) => {
      if (cancelled) return;
      if (required === "client") {
        if (!role) {
          setResult({ status: "denied", role: null });
          router.replace(routes.auth);
          return;
        }
        if (role === "admin") {
          setResult({ status: "denied", role });
          router.replace(routes.adminDashboard);
          return;
        }
      } else if (required === "admin") {
        if (!role) {
          setResult({ status: "denied", role: null });
          router.replace(routes.auth);
          return;
        }
        if (role !== "admin") {
          setResult({ status: "denied", role });
          router.replace(routes.espaceClient);
          return;
        }
      }
      setResult({ status: "allowed", role });
    };

    fetchMe()
      .then((me) => {
        const role = me.authenticated ? (me.role ?? "client") : null;
        if (!cancelled) apply(role);
      })
      .catch(() => {
        // API injoignable : laisser la page visible (dégradation gracieuse)
        if (!cancelled) setResult({ status: "allowed", role: null });
      });

    return () => {
      cancelled = true;
    };
  }, [required, locale, router, routes.auth, routes.adminDashboard, routes.espaceClient]);

  return result;
}
