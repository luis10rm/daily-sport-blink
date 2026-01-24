export const categoryDefaultImages: Record<string, string> = {
  football: "/images/categories/football.webp",
  basketball: "/images/categories/basketball.webp",
  tennis: "/images/categories/tennis.webp",
  f1: "/images/categories/f1.webp",
  mma: "/images/categories/mma.webp",
  other: "/images/categories/other.webp",
};

export const getCategoryImage = (
  category?: string | null,
  customImageUrl?: string | null,
  sportCategorySlug?: string | null
): string => {
  if (customImageUrl) return customImageUrl;
  
  // Priority for dynamic sport_category slug
  const slug = sportCategorySlug || category || "other";
  return categoryDefaultImages[slug] || categoryDefaultImages.other;
};
