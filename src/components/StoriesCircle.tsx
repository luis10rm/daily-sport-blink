import { SportCategory, getSportLabel } from "@/components/SportIcon";
import { Dribbble, Bike, CircleDot, Swords, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoriesCircleProps {
  category: SportCategory;
  hasUnread: boolean;
  onClick: () => void;
  className?: string;
}

const sportIcons: Record<SportCategory, React.ElementType> = {
  football: Dribbble,
  basketball: Dribbble,
  tennis: CircleDot,
  f1: Bike,
  mma: Swords,
  other: Trophy,
};

const sportGradients: Record<SportCategory, string> = {
  football: "from-green-500 via-emerald-500 to-teal-500",
  basketball: "from-orange-500 via-amber-500 to-yellow-500",
  tennis: "from-yellow-400 via-lime-500 to-green-500",
  f1: "from-red-500 via-rose-500 to-pink-500",
  mma: "from-red-600 via-red-500 to-orange-500",
  other: "from-purple-500 via-violet-500 to-indigo-500",
};

export const StoriesCircle = ({
  category,
  hasUnread,
  onClick,
  className,
}: StoriesCircleProps) => {
  const Icon = sportIcons[category];
  const label = getSportLabel(category);
  const gradient = sportGradients[category];

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 group",
        className
      )}
    >
      {/* Circle with gradient ring */}
      <div
        className={cn(
          "relative p-[3px] rounded-full stories-circle-hover",
          hasUnread
            ? `bg-gradient-to-tr ${gradient}`
            : "bg-muted-foreground/30"
        )}
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
            <Icon className="w-6 h-6 md:w-7 md:h-7 text-foreground" />
          </div>
        </div>
      </div>

      {/* Label */}
      <span className="text-xs text-muted-foreground truncate max-w-[70px]">
        {label}
      </span>
    </button>
  );
};
