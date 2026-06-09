import { useEffect } from "react";
import { useTournamentMode } from "@/hooks/useTournamentMode";
import { useStadiumNight } from "@/hooks/useStadiumNight";

/**
 * Adds/removes the `tournament-worldcup` class on <html> based on the
 * global tournament_mode setting. All World Cup re-skin CSS lives under
 * that class, so disabling the flag instantly reverts the site to normal.
 */
export const TournamentTheme = () => {
  const { isWorldCup } = useTournamentMode();
  useStadiumNight();

  useEffect(() => {
    const root = document.documentElement;
    if (isWorldCup) {
      root.classList.add("tournament-worldcup");
    } else {
      root.classList.remove("tournament-worldcup");
    }
    return () => {
      root.classList.remove("tournament-worldcup");
    };
  }, [isWorldCup]);

  return null;
};
