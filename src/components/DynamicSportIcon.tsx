import { optimizeImageUrl } from "@/lib/imageUrl";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { PostCategory } from "@/hooks/usePosts";

interface DynamicSportIconProps {
  sportCategory?: PostCategory | null;
  fallbackSlug?: string;
  className?: string;
}

const fallbackConfig: Record<string, { icon: string; bgColor: string }> = {
  football: { icon: "Circle", bgColor: "142 76% 36%" },
  basketball: { icon: "Dribbble", bgColor: "25 95% 53%" },
  tennis: { icon: "CircleDot", bgColor: "48 96% 53%" },
  f1: { icon: "Car", bgColor: "0 84% 60%" },
  mma: { icon: "Swords", bgColor: "263 70% 50%" },
  other: { icon: "Trophy", bgColor: "239 84% 67%" },
};

// Convert HSL string to CSS format
const toHslColor = (hslString: string): string => {
  // If already has hsl() wrapper or is hex, return as-is
  if (hslString.startsWith("hsl") || hslString.startsWith("#") || hslString.startsWith("rgb")) {
    return hslString;
  }
  // Convert "142 76% 36%" to "hsl(142, 76%, 36%)"
  const parts = hslString.trim().split(/\s+/);
  if (parts.length >= 3) {
    return `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`;
  }
  return hslString;
};

export const DynamicSportIcon = ({ sportCategory, fallbackSlug, className }: DynamicSportIconProps) => {
  // Use sport_category data if available, otherwise fallback
  const iconName = sportCategory?.icon_name || fallbackConfig[fallbackSlug || "other"]?.icon || "Trophy";
  const rawBgColor = sportCategory?.bg_color || fallbackConfig[fallbackSlug || "other"]?.bgColor || "239 84% 67%";
  const bgColor = toHslColor(rawBgColor);
  const iconUrl = sportCategory?.icon_url;

  // If there's a custom icon URL, use it
  if (iconUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg text-primary-foreground overflow-hidden",
          className
        )}
        style={{ backgroundColor: bgColor }}
      >
        <img
          src={optimizeImageUrl(iconUrl, { width: 96, quality: 80, resize: "contain" })}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-5 w-5 object-contain"
        />
      </div>
    );
  }

  // Use Lucide icon - capitalize first letter for Lucide component lookup
  const formattedIconName = iconName
    .split("-")
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[formattedIconName] || LucideIcons.Trophy;

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg text-primary-foreground",
        className
      )}
      style={{ backgroundColor: bgColor }}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
};
