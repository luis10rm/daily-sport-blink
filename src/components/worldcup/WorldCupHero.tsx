import { Trophy } from "lucide-react";
import { getWorldCupPhase, getDaysUntilWorldCup, WORLD_CUP_START, WORLD_CUP_END } from "@/lib/worldCupTheme";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

export const WorldCupHero = () => {
  const phase = getWorldCupPhase();
  const days = getDaysUntilWorldCup();

  return (
    <header className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-background to-background p-6 md:p-10 mb-10">
      {/* decorative glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" aria-hidden />

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/95 px-3 py-1 text-xs font-semibold text-amber-950 shadow-lg shadow-amber-500/30 ring-1 ring-amber-300/60">
          <Trophy className="h-3.5 w-3.5" /> FIFA World Cup 2026
        </div>

        <h1 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-foreground">
          Mistrzostwa Świata <span className="text-amber-500">2026</span>
        </h1>

        <p className="mt-3 max-w-2xl text-base md:text-lg text-muted-foreground">
          Wszystko o turnieju FIFA w jednym miejscu: terminarz, tabele, najlepsi strzelcy
          i nasze najnowsze artykuły o mundialu.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {phase === "pre" && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-3">
              <div className="text-[11px] uppercase tracking-wider text-amber-500/80">Start turnieju</div>
              <div className="mt-0.5 text-2xl font-bold text-amber-500">
                za {days} {days === 1 ? "dzień" : "dni"}
              </div>
              <div className="text-xs text-muted-foreground">{fmtDate(WORLD_CUP_START)} · USA · Kanada · Meksyk</div>
            </div>
          )}
          {phase === "live" && (
            <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-5 py-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-red-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                Trwa turniej
              </div>
              <div className="mt-0.5 text-2xl font-bold text-red-500">NA ŻYWO</div>
              <div className="text-xs text-muted-foreground">Wyniki aktualizowane co minutę</div>
            </div>
          )}
          {phase === "post" && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-3">
              <div className="text-[11px] uppercase tracking-wider text-amber-500/80">Turniej zakończony</div>
              <div className="mt-0.5 text-2xl font-bold text-amber-500">Podsumowanie</div>
              <div className="text-xs text-muted-foreground">Mistrzostwa Świata 2026 · {fmtDate(WORLD_CUP_END)}</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
