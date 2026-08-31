export interface PracticalInfo {
  address?: string;
  map_url?: string;
  price_from?: string;
  parking?: string;
  season?: string;
  best_for?: string;
  travel?: string;
  website?: string;
  amenities?: string[];
}

const STRING_KEYS: (keyof PracticalInfo)[] = [
  "address",
  "map_url",
  "price_from",
  "parking",
  "season",
  "best_for",
  "travel",
  "website",
];

/** Safely coerce the JSONB column into a typed object. */
export const normalizePracticalInfo = (raw: unknown): PracticalInfo => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of STRING_KEYS) {
    const v = src[key];
    if (typeof v === "string" && v.trim()) out[key] = v.trim();
  }
  const amenities = src.amenities;
  if (Array.isArray(amenities)) {
    const list = amenities
      .filter((a): a is string => typeof a === "string")
      .map((a) => a.trim())
      .filter(Boolean);
    if (list.length) out.amenities = list;
  }
  return out as PracticalInfo;
};

export const hasPracticalInfo = (info: PracticalInfo) =>
  STRING_KEYS.some((k) => !!(info as Record<string, unknown>)[k]) || !!info.amenities?.length;

/** Drop empty values before saving so `{}` stays the "not filled in" state. */
export const cleanPracticalInfo = (info: PracticalInfo): PracticalInfo =>
  normalizePracticalInfo(info);

export const normalizeCaptions = (raw: unknown): string[] =>
  Array.isArray(raw) ? raw.map((c) => (typeof c === "string" ? c : "")) : [];
