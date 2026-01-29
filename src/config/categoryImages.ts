// Default images for known sport categories
export const categoryDefaultImages: Record<string, string> = {
  football: "/images/categories/football.webp",
  basketball: "/images/categories/basketball.webp",
  tennis: "/images/categories/tennis.webp",
  f1: "/images/categories/f1.webp",
  mma: "/images/categories/mma.webp",
  "daily-summary": "/images/categories/daily-summary.webp",
  other: "/images/categories/other.webp",
  // Fallback used for any dynamic categories not listed above
  default: "/images/categories/other.webp",
};

// Legacy function for backwards compatibility
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

// New function that handles daily summary detection
export const getPostImage = (post: {
  image_url?: string | null;
  source_url?: string;
  tags?: string[] | null;
  sport_category?: { slug: string } | null;
}): string => {
  // 1. If post has custom image - use it
  if (post.image_url) return post.image_url;
  
  // 2. Check if this is a daily summary post
  const isSummary = 
    post.source_url?.includes("/podsumowanie") ||
    post.tags?.includes("podsumowanie dnia");
  
  if (isSummary) {
    return categoryDefaultImages["daily-summary"];
  }
  
  // 3. Default to category image
  const slug = post.sport_category?.slug || "other";
  return categoryDefaultImages[slug] || categoryDefaultImages.other;
};
