import { Link, useLocation } from "react-router-dom";
import { Cpu, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toggles between Sport (default) and Tech sub-brands.
 */
export const ModeSwitcher = () => {
  const location = useLocation();
  const inTech =
    location.pathname.startsWith("/tech") || location.pathname.startsWith("/recki");

  if (inTech) {
    return (
      <Link
        to="/"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors",
          "@media(hover:hover) { hover:bg-emerald-500/20 }"
        )}
        aria-label="Przełącz na Sport"
      >
        <Trophy className="h-3.5 w-3.5" />
        <span>Sport</span>
      </Link>
    );
  }

  return (
    <Link
      to="/tech"
      className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-600/40 bg-fuchsia-600/10 px-3 py-1.5 text-xs font-semibold text-fuchsia-600 transition-colors dark:text-fuchsia-300"
      aria-label="Przełącz na Tech"
    >
      <Cpu className="h-3.5 w-3.5" />
      <span>Tech</span>
    </Link>
  );
};
