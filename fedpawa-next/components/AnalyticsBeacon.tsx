"use client";

import Script from "next/script";

/**
 * Mesure d'audience côté navigateur — interrupteur de mise en service.
 *
 * Le script public/analytics-collect.js n'est injecté dans les pages que si la
 * valeur de build NEXT_PUBLIC_ANALYTICS_ENABLED vaut exactement "true".
 * Défaut "false" (Dockerfile) : aucune mesure, aucune donnée ne quitte le
 * navigateur. Même pattern que NEXT_PUBLIC_SIGNATURE_ENABLED
 * (voir lib/README-signature.md et lib/README-analytics.md).
 */
export default function AnalyticsBeacon() {
  const enabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";
  if (!enabled) return null;
  return <Script src="/analytics-collect.js" strategy="afterInteractive" />;
}
