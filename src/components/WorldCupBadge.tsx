import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorldCupBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

/**
 * Golden badge for posts in the FIFA World Cup 2026 category.
 * Used on news cards and hero (News of the Day).
 */
export const WorldCupBadge = ({ className, size = "sm" }: WorldCupBadgeProps) => {
  const isSm = size === "sm";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-500/95 font-semibold text-amber-950 shadow-lg shadow-amber-500/30 ring-1 ring-amber-300/60",
        isSm ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
        className,
      )}
    >
      <Trophy className={isSm ? "h-3 w-3" : "h-4 w-4"} />
      MŚ 2026
    </div>
  );
};
