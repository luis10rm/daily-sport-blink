import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { PostCategory, SportCategorySlug } from "@/hooks/usePosts";

interface DynamicSportIconProps {
  sportCategory?: PostCategory | null;
  fallbackSlug?: SportCategorySlug;
  className?: string;
}

const fallbackConfig: Record<string, { icon: string; bgColor: string }> = {
  football: { icon: "Circle", bgColor: "#22c55e" },
  basketball: { icon: "Dribbble", bgColor: "#f97316" },
  tennis: { icon: "CircleDot", bgColor: "#eab308" },
  f1: { icon: "Car", bgColor: "#ef4444" },
  mma: { icon: "Swords", bgColor: "#8b5cf6" },
  other: { icon: "Trophy", bgColor: "#6366f1" },
};

export const DynamicSportIcon = ({ sportCategory, fallbackSlug, className }: DynamicSportIconProps) => {
  // Use sport_category data if available, otherwise fallback
  const iconName = sportCategory?.icon_name || fallbackConfig[fallbackSlug || "other"]?.icon || "Trophy";
  const bgColor = sportCategory?.bg_color || fallbackConfig[fallbackSlug || "other"]?.bgColor || "#6366f1";
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
        <img src={iconUrl} alt="" className="h-5 w-5 object-contain" />
      </div>
    );
  }

  // Use Lucide icon
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName] || LucideIcons.Trophy;

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
