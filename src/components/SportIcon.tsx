import { Dribbble, Bike, Trophy, Swords, CircleDot, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

export type SportCategory = "football" | "basketball" | "tennis" | "f1" | "mma" | "other";

interface SportIconProps {
  category: SportCategory;
  className?: string;
}

const sportConfig: Record<SportCategory, { icon: React.ElementType; bgClass: string }> = {
  football: { icon: Dribbble, bgClass: "bg-sport-football" },
  basketball: { icon: Dribbble, bgClass: "bg-sport-basketball" },
  tennis: { icon: CircleDot, bgClass: "bg-sport-tennis" },
  f1: { icon: Bike, bgClass: "bg-sport-f1" },
  mma: { icon: Swords, bgClass: "bg-sport-mma" },
  other: { icon: Trophy, bgClass: "bg-sport-other" },
};

const sportLabels: Record<SportCategory, string> = {
  football: "Piłka nożna",
  basketball: "Koszykówka",
  tennis: "Tenis",
  f1: "F1",
  mma: "MMA",
  other: "Inne",
};

export const getSportLabel = (category: SportCategory) => sportLabels[category];

export const SportIcon = ({ category, className }: SportIconProps) => {
  const config = sportConfig[category];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground",
        config.bgClass,
        className
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
};
