import { Trophy, Radio, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getWorldCupPhase, getDaysUntilWorldCup } from "@/lib/worldCupTheme";

interface WorldCupRibbonProps {
  className?: string;
}

const HUB_PATH = "/mistrzostwa-swiata-2026";

/**
 * Full-width ribbon shown above the title on /blink/:slug for posts
 * in the FIFA World Cup 2026 category. Klikalny — prowadzi do hubu MŚ.
 *
 * Phases:
 * - pre: countdown "Start za X dni"
 * - live: pulsujące "NA ŻYWO"
 * - post: ukryty
 *
 * Mobile UX (no double-tap):
 * - `touch-manipulation` — szybsza reakcja na tap
 * - hover efekty TYLKO pod `@media (hover: hover)` — iOS nie „zjada" pierwszego dotknięcia
 */
export const WorldCupRibbon = ({ className }: WorldCupRibbonProps) => {
  const phase = getWorldCupPhase();

  if (phase === "post") return null;

  const daysLeft = getDaysUntilWorldCup();
  const isLive = phase === "live";

  return (
    <Link
      to={HUB_PATH}
      aria-label="Przejdź do strefy Mistrzostw Świata 2026"
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-amber-400/50 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 px-4 py-2.5 mb-6 transition-colors touch-manipulation",
        "dark:border-amber-500/40 dark:from-amber-500/10 dark:via-amber-400/5 dark:to-amber-500/10",
        "[@media(hover:hover)]:hover:border-amber-400/80 [@media(hover:hover)]:hover:from-amber-500/25 [@media(hover:hover)]:hover:via-amber-400/15 [@media(hover:hover)]:hover:to-amber-500/25",
        className,
      )}
    >
      {isLive ? (
        <Radio className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 animate-pulse" />
      ) : (
        <Trophy className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      )}
      <span className="flex-1 min-w-0 text-sm font-semibold text-amber-700 dark:text-amber-300">
        {isLive ? (
          <>
            Mistrzostwa Świata 2026 •{" "}
            <span className="uppercase tracking-wider">Na żywo</span>
          </>
        ) : (
          <>
            Mistrzostwa Świata 2026
            {daysLeft > 0 && (
              <>
                {" • "}
                <span className="font-normal">
                  Start za {daysLeft} {daysLeft === 1 ? "dzień" : "dni"}
                </span>
              </>
            )}
          </>
        )}
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 transition-transform [@media(hover:hover)]:group-hover:translate-x-0.5"
      />
    </Link>
  );
};
