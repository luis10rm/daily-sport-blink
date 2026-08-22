import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavLink } from "@/hooks/useNavLink";
import { isTapGesture } from "@/lib/tapGuard";

interface WorldCupBadgeProps {
  className?: string;
  size?: "sm" | "md";
  /** When true, renders as a link to /mistrzostwa-swiata-2026 (default true). */
  asLink?: boolean;
}

const HUB_PATH = "/mistrzostwa-swiata-2026";

/**
 * Golden badge for posts in the FIFA World Cup 2026 category.
 * Used on news cards and hero (News of the Day).
 * Clicking the badge navigates to the dedicated tournament hub.
 */
export const WorldCupBadge = ({ className, size = "sm", asLink = true }: WorldCupBadgeProps) => {
  const navLink = useNavLink();
  const isSm = size === "sm";
  const classes = cn(
    "inline-flex items-center gap-1 rounded-full bg-amber-500/95 font-semibold text-amber-950 shadow-lg shadow-amber-500/30 ring-1 ring-amber-300/60",
    isSm ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
    asLink && "transition-transform hover:scale-105",
    className,
  );

  const inner = (
    <>
      <Trophy className={isSm ? "h-3 w-3" : "h-4 w-4"} />
      MŚ 2026
    </>
  );

  if (!asLink) {
    return <div className={classes}>{inner}</div>;
  }

  const linkProps = navLink(HUB_PATH);

  return (
    <a
      {...linkProps}
      onClick={(e) => {
        e.stopPropagation();
        linkProps.onClick(e);
      }}
      onTouchEnd={(e) => {
        if (!isTapGesture()) return;
        e.stopPropagation();
        linkProps.onTouchEnd(e);
      }}
      aria-label="Strefa Mistrzostw Świata 2026"
      className={classes}
    >
      {inner}
    </a>
  );
};
