import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Trophy, X, ArrowRight } from "lucide-react";
import { getWorldCupPhase, getDaysUntilWorldCup } from "@/lib/worldCupTheme";
import { cn } from "@/lib/utils";

const HUB_PATH = "/mistrzostwa-swiata-2026";

interface Props {
  className?: string;
}

export const WorldCupHomeBanner = ({ className }: Props) => {
  const navigate = useNavigate();
  const phase = getWorldCupPhase();
  const days = getDaysUntilWorldCup();
  const storageKey = `wc-banner-dismissed-${phase}`;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(storageKey) === "1");
    } catch { /* no-op */ }
  }, [storageKey]);

  if (phase === "post" || dismissed) return null;

  const isLive = phase === "live";
  const label = isLive
    ? "MŚ 2026 LIVE — zobacz wyniki dnia"
    : `MŚ 2026 — start za ${days} ${days === 1 ? "dzień" : "dni"}. Zobacz strefę turnieju`;

  const go = () => navigate(HUB_PATH);

  const handleDismiss = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try { localStorage.setItem(storageKey, "1"); } catch { /* no-op */ }
    setDismissed(true);
  };

  return (
    <a
      href={HUB_PATH}
      role="link"
      onClick={(e) => { e.preventDefault(); go(); }}
      className={cn(
        "group relative flex items-center gap-3 overflow-hidden rounded-xl border border-amber-500/40",
        "bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent",
        "px-4 py-3 md:px-5 md:py-3.5 transition-colors hover:border-amber-500/60 cursor-pointer",
        className,
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/95 text-amber-950 shadow-lg shadow-amber-500/20 ring-1 ring-amber-300/60">
        <Trophy className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm md:text-base font-semibold text-foreground">
          {isLive && (
            <span className="relative inline-flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
          )}
          <span className="truncate">{label}</span>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-amber-500 transition-transform group-hover:translate-x-0.5" />
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Ukryj baner"
        className="ml-1 hidden sm:inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </a>
  );
};
