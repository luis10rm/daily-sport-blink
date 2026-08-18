/**
 * Buduje tytuł SEO, który nie zostanie ucięty w wynikach Google.
 *
 * Google pokazuje ok. 60 znaków tytułu. Średni tytuł artykułu w serwisie ma ~65
 * znaków, więc doklejanie brandu ("| Szortsy") na sztywno powodowało obcinanie
 * właściwego nagłówka i spadek CTR. Brand dodajemy tylko wtedy, gdy się mieści.
 */
export function buildSeoTitle(title: string, brand = "Szortsy", limit = 60): string {
  const clean = title.trim().replace(/\s+/g, " ");
  const withBrand = `${clean} | ${brand}`;
  return withBrand.length <= limit ? withBrand : clean;
}

/**
 * Skraca tekst do meta description na granicy zdania/słowa (Google ~155-160 znaków).
 */
export function buildSeoDescription(
  primary: string | null | undefined,
  fallback?: string | null,
  limit = 160,
): string {
  const source = (primary && primary.trim()) || (fallback && fallback.trim()) || "";
  const plain = source
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= limit) return plain;
  const cut = plain.slice(0, limit);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (lastStop > limit * 0.6) return cut.slice(0, lastStop + 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : limit).trim()}…`;
}
