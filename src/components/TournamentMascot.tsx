import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { X, Sparkles } from "lucide-react";
import { useTournamentMode } from "@/hooks/useTournamentMode";
import { cn } from "@/lib/utils";

const TIPS = [
  { text: "Witaj w Strefie MŚ 2026! Sprawdź mecz dnia na stronie głównej.", cta: { label: "Hub MŚ", to: "/mistrzostwa-swiata-2026" } },
  { text: "Klikaj na złoty bąbel „Strefa MŚ” w Stories — masz tam terminarz, grupę i strzelców.", cta: null },
  { text: "Wieczorem serwis wchodzi w tryb stadion nocą — zauważyłeś reflektory?", cta: null },
  { text: "W artykułach z tagami drużyn znajdziesz Match Center z najbliższym meczem.", cta: null },
];

const STORAGE_KEY = "wc-mascot-dismissed-at";
const COOLDOWN_HOURS = 24;

export const TournamentMascot = () => {
  const { isWorldCup } = useTournamentMode();
  const [visible, setVisible] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!isWorldCup) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const last = Number(raw);
      if (Date.now() - last < COOLDOWN_HOURS * 3600 * 1000) return;
    }
    // Rotate tip per day
    const day = Math.floor(Date.now() / (24 * 3600 * 1000));
    setTipIndex(day % TIPS.length);
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, [isWorldCup]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!isWorldCup || !visible) return null;

  const tip = TIPS[tipIndex];

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-[280px] md:max-w-xs animate-in slide-in-from-bottom-4 fade-in duration-500">
      {expanded ? (
        <div className="relative rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-4 pr-8 shadow-2xl border-2 border-amber-300 text-amber-950">
          <button
            onClick={dismiss}
            aria-label="Zamknij wskazówkę"
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-amber-950/10"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="text-3xl shrink-0" aria-hidden>🦅</div>
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Maskotka MŚ
              </div>
              <p className="text-sm font-medium leading-snug">{tip.text}</p>
              {tip.cta && (
                <Link
                  to={tip.cta.to}
                  onClick={() => setExpanded(false)}
                  className="mt-3 inline-block bg-amber-950 text-amber-100 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-amber-900"
                >
                  {tip.cta.label} →
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          aria-label="Otwórz maskotkę MŚ"
          className={cn(
            "relative h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600",
            "shadow-2xl border-2 border-amber-200 flex items-center justify-center text-2xl",
            "hover:scale-110 transition-transform"
          )}
        >
          <span aria-hidden>🦅</span>
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
        </button>
      )}
    </div>
  );
};
