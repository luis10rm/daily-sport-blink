import { SportCategory } from "@/components/SportIcon";

export const categoryDefaultImages: Record<SportCategory, string> = {
  football: "/images/categories/football.webp",
  basketball: "/images/categories/basketball.webp",
  tennis: "/images/categories/tennis.webp",
  f1: "/images/categories/f1.webp",
  mma: "/images/categories/mma.webp",
  other: "/images/categories/other.webp",
};

export const getCategoryImage = (
  category: SportCategory,
  customImageUrl?: string | null
): string => {
  return customImageUrl || categoryDefaultImages[category];
};
