// Année courante dans le footer (réplique <span id="currentYear"> de main.js).
// Client component minimal : valeur calculée uniquement côté client (useEffect)
// pour rester compatible avec le prérendu statique (Cache Components).

"use client";

import { useEffect, useState } from "react";

export default function CurrentYear() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return <span id="currentYear">{year}</span>;
}
