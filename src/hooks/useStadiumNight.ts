import { useEffect } from "react";
import { useTournamentMode } from "@/hooks/useTournamentMode";

/**
 * Auto-applies the `.stadium-night` class on <html> between 18:00 and 06:00 local time,
 * but only while tournament mode is active. Gives the site a darker, "evening at the stadium"
 * vibe with reflector glow defined in index.css.
 */
export const useStadiumNight = () => {
  const { isWorldCup } = useTournamentMode();

  useEffect(() => {
    if (!isWorldCup) {
      document.documentElement.classList.remove("stadium-night");
      return;
    }
    const apply = () => {
      const h = new Date().getHours();
      const isNight = h >= 18 || h < 6;
      document.documentElement.classList.toggle("stadium-night", isNight);
    };
    apply();
    const id = setInterval(apply, 5 * 60 * 1000); // re-check every 5 min
    return () => {
      clearInterval(id);
      document.documentElement.classList.remove("stadium-night");
    };
  }, [isWorldCup]);
};
