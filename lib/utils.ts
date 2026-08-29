// Plage d'années raisonnable pour les filtres temporels (17) — évite une requête dédiée sur un
// jeu de données pilote de petite taille ; à remplacer par une requête "années distinctes" si le
// volume de données grandit significativement.
export function yearOptions(spanBefore = 4, spanAfter = 1): { value: string; label: string }[] {
  const current = new Date().getFullYear();
  const years: { value: string; label: string }[] = [];
  for (let y = current + spanAfter; y >= current - spanBefore; y--) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}
