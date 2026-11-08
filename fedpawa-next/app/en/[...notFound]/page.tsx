// Catch-all EN — toute URL /en/* inconnue déclenche notFound(),
// rendu par app/en/not-found.tsx DANS le layout EN (Header/Footer
// anglais). Mécanisme officiel Next 16 pour 404 par préfixe avec
// multi-root layouts (plus spécifique que (site)/[...notFound]
// grâce au segment statique « en »).

import { notFound } from "next/navigation";

export default function EnCatchAllNotFound() {
  notFound();
}
