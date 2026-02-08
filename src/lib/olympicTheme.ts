/**
 * Olympic Winter Theme utilities
 * Adds subtle winter accents for Olympic category posts
 */

const OLYMPIC_SLUGS = ["igrzyska-olimpijskie", "zimowe-igrzyska-olimpijskie"];

export const isOlympicCategory = (categorySlug?: string | null): boolean => {
  if (!categorySlug) return false;
  return OLYMPIC_SLUGS.includes(categorySlug);
};
