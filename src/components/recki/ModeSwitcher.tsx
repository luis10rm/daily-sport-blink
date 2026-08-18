import { useLocation, useNavigate } from "@/lib/router-compat";
import { Cpu, Trophy } from "lucide-react";

/**
 * Toggles between Sport (default) and Tech sub-brands.
 * Uses <a> + onClick + navigate() pattern to avoid iOS Safari
 * double-tap (first tap = focus, second = click) on React Router <Link>.
 */
export const ModeSwitcher = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const inTech =
    location.pathname.startsWith("/tech") || location.pathname.startsWith("/recki");

  const target = inTech ? "/" : "/tech";

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    navigate(target);
  };

  if (inTech) {
    return (
      <a
        href="/"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors"
        aria-label="Przełącz na Sport"
      >
        <Trophy className="h-3.5 w-3.5" />
        <span>Sport</span>
      </a>
    );
  }

  return (
    <a
      href="/tech"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-600/40 bg-fuchsia-600/10 px-3 py-1.5 text-xs font-semibold text-fuchsia-600 transition-colors dark:text-fuchsia-300"
      aria-label="Przełącz na Tech"
    >
      <Cpu className="h-3.5 w-3.5" />
      <span>Tech</span>
    </a>
  );
};
