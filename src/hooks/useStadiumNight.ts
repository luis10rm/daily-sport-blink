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
    const root = document.documentElement;
    if (!isWorldCup) {
      root.classList.remove("stadium-night");
      return;
    }
    const apply = () => {
      const h = new Date().getHours();
      const isNight = h >= 18 || h < 6;
      // Only apply the dark stadium overlay when the user is actually in dark mode.
      // In light mode the foreground tokens stay dark, which would make text invisible
      // on the dark stadium background — so we skip it entirely.
      const isDark = root.classList.contains("dark");
      root.classList.toggle("stadium-night", isNight && isDark);
    };
    apply();
    const id = setInterval(apply, 5 * 60 * 1000); // re-check every 5 min

    // React to theme toggle (light/dark) without waiting for the interval
    const observer = new MutationObserver(apply);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      clearInterval(id);
      observer.disconnect();
      root.classList.remove("stadium-night");
    };
  }, [isWorldCup]);
};
