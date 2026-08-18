import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface StoryCategoryData {
  id: string;
  slug: string;
  name: string;
  icon_name?: string | null;
  icon_url?: string | null;
  bg_color: string;
  sort_order: number;
}

interface DynamicStoriesCircleProps {
  category: StoryCategoryData;
  hasUnread: boolean;
  onClick: () => void;
  className?: string;
}

// Convert HSL string "142 76% 36%" to "hsl(142, 76%, 36%)"
const toHslColor = (hslString: string): string => {
  if (!hslString) return "hsl(0, 0%, 50%)";
  if (hslString.startsWith("hsl(") || hslString.startsWith("#")) {
    return hslString;
  }
  const parts = hslString.trim().split(/\s+/);
  if (parts.length === 3) {
    return `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`;
  }
  return hslString;
};

// Dynamically get Lucide icon by name
const getLucideIcon = (iconName: string): LucideIcon | null => {
  // Try exact match first
  if ((LucideIcons as Record<string, unknown>)[iconName]) {
    return (LucideIcons as Record<string, unknown>)[iconName] as LucideIcon;
  }
  
  // Try PascalCase conversion (e.g., "trophy" -> "Trophy")
  const pascalCase = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  if ((LucideIcons as Record<string, unknown>)[pascalCase]) {
    return (LucideIcons as Record<string, unknown>)[pascalCase] as LucideIcon;
  }
  
  return null;
};

export const DynamicStoriesCircle = ({
  category,
  hasUnread,
  onClick,
  className,
}: DynamicStoriesCircleProps) => {
  const bgColor = toHslColor(category.bg_color);
  
  // Create gradient from the category color
  const gradientStyle = hasUnread
    ? { background: `linear-gradient(135deg, ${bgColor}, ${bgColor})` }
    : undefined;

  // Render icon - either custom URL or Lucide icon
  const renderIcon = () => {
    if (category.icon_url) {
      return (
        <img
          src={category.icon_url}
          alt={category.name}
          className="w-6 h-6 md:w-7 md:h-7 object-contain"
        />
      );
    }

    const iconName = category.icon_name || "Trophy";
    const IconComponent = getLucideIcon(iconName);
    
    if (IconComponent) {
      return <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-foreground" />;
    }

    // Fallback to Trophy
    return <LucideIcons.Trophy className="w-6 h-6 md:w-7 md:h-7 text-foreground" />;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 group story-item flex-shrink-0",
        className
      )}
    >
      {/* Circle with gradient ring */}
      <div
        className={cn(
          "relative p-[3px] rounded-full stories-circle-hover",
          !hasUnread && "bg-muted-foreground/30"
        )}
        style={gradientStyle}
      >
        {/* Inner white ring */}
        <div className="bg-background rounded-full p-[2px]">
          {/* Icon container */}
          <div
            className={cn(
              "w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-muted to-muted/50"
            )}
          >
            {renderIcon()}
          </div>
        </div>
      </div>

      {/* Label */}
      <span className="text-xs text-muted-foreground truncate max-w-[70px]">
        {category.name}
      </span>
    </button>
  );
};
