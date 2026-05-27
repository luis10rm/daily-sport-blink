import { Trophy, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWorldCupPhase, getDaysUntilWorldCup } from "@/lib/worldCupTheme";

interface WorldCupRibbonProps {
  className?: string;
}

/**
 * Full-width ribbon shown above the title on /blink/:slug for posts
 * in the FIFA World Cup 2026 category.
 *
 * Phases:
 * - pre: shows countdown "Start za X dni"
 * - live: shows "NA ŻYWO" pulse
 * - post: hidden (turniej zakończony — nie zaśmiecamy artykułów)
 */
export const WorldCupRibbon = ({ className }: WorldCupRibbonProps) => {
  const phase = getWorldCupPhase();

  if (phase === "post") return null;

  const daysLeft = getDaysUntilWorldCup();

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-amber-400/50 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 px-4 py-2.5 mb-6 dark:border-amber-500/40 dark:from-amber-500/10 dark:via-amber-400/5 dark:to-amber-500/10",
        className,
      )}
    >
      {phase === "live" ? (
        <>
          <Radio className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            Mistrzostwa Świata 2026 • <span className="uppercase tracking-wider">Na żywo</span>
          </span>
        </>
      ) : (
        <>
          <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            Mistrzostwa Świata 2026
            {daysLeft > 0 && (
              <>
                {" • "}
                <span className="font-normal">
                  Start za {daysLeft} {daysLeft === 1 ? "dzień" : "dni"}
                </span>
              </>
            )}
          </span>
        </>
      )}
    </div>
  );
};
