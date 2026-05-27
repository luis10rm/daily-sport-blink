/**
 * FIFA World Cup 2026 Theme utilities
 * Adds golden accents and countdown for World Cup category posts
 */

const WORLD_CUP_SLUGS = ["mistrzostwa-swiata-w-pilce-noznej-2026"];

// Official FIFA World Cup 2026 start date
export const WORLD_CUP_START = new Date("2026-06-11T00:00:00Z");
// Approximate end (final ~ July 19, 2026); used to detect "post" phase
export const WORLD_CUP_END = new Date("2026-07-20T00:00:00Z");

export const isWorldCupCategory = (categorySlug?: string | null): boolean => {
  if (!categorySlug) return false;
  return WORLD_CUP_SLUGS.includes(categorySlug);
};

export type WorldCupPhase = "pre" | "live" | "post";

export const getWorldCupPhase = (now: Date = new Date()): WorldCupPhase => {
  if (now < WORLD_CUP_START) return "pre";
  if (now > WORLD_CUP_END) return "post";
  return "live";
};

export const getDaysUntilWorldCup = (now: Date = new Date()): number => {
  const diffMs = WORLD_CUP_START.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};
