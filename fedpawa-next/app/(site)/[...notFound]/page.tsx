// Catch-all FR — toute URL inconnue hors /en déclenche notFound(),
// rendu par app/(site)/not-found.tsx DANS le layout FR (Header/Footer
// brandés). Mécanisme officiel Next 16 pour 404 par préfixe avec
// multi-root layouts (le not-found racine seul ne peut pas router
// /en/* vers app/en/not-found.tsx — cf. file-conventions/not-found).
// Les routes statiques existantes gardent la priorité sur le catch-all.

import { notFound } from "next/navigation";

export default function CatchAllNotFound() {
  notFound();
}
