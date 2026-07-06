// Dice-coefficient similarity on character bigrams.
// Robust for short strings and cheap to compute in the browser.
// Returns a value in [0, 1] where 1 means identical (after normalization).

const POLISH_MAP: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
};

export function normalizeTitle(input: string): string {
  const lowered = (input || "").toLowerCase().trim();
  let out = "";
  for (const ch of lowered) out += POLISH_MAP[ch] ?? ch;
  return out
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function bigrams(s: string): Map<string, number> {
  const map = new Map<string, number>();
  const clean = s.replace(/\s+/g, "");
  for (let i = 0; i < clean.length - 1; i++) {
    const b = clean.slice(i, i + 2);
    map.set(b, (map.get(b) ?? 0) + 1);
  }
  return map;
}

export function titleSimilarity(a: string, b: string): number {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;

  const A = bigrams(na);
  const B = bigrams(nb);
  if (A.size === 0 || B.size === 0) return 0;

  let intersection = 0;
  for (const [gram, countA] of A) {
    const countB = B.get(gram);
    if (countB) intersection += Math.min(countA, countB);
  }
  const totalA = Array.from(A.values()).reduce((s, n) => s + n, 0);
  const totalB = Array.from(B.values()).reduce((s, n) => s + n, 0);
  return (2 * intersection) / (totalA + totalB);
}
