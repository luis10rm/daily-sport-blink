import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Trophy, Radio, MapPin, ArrowRight } from "lucide-react";
import { useWorldCupMatches, type FDMatch } from "@/hooks/useWorldCupData";
import { useTournamentMode } from "@/hooks/useTournamentMode";
import { cn } from "@/lib/utils";

const POLAND_TLAS = ["POL"];
const TOP_TLAS = new Set([
  "BRA", "ARG", "FRA", "ESP", "GER", "ENG", "ITA", "POR", "NED", "BEL", "URU", "CRO", "MEX", "USA",
]);

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const scoreMatch = (m: FDMatch): number => {
  const home = m.homeTeam.tla || "";
  const away = m.awayTeam.tla || "";
  let s = 0;
  if (POLAND_TLAS.includes(home) || POLAND_TLAS.includes(away)) s += 1000;
  if (TOP_TLAS.has(home)) s += 50;
  if (TOP_TLAS.has(away)) s += 50;
  // Prefer knockout stages
  if (m.stage && /FINAL|SEMI|QUARTER|ROUND_OF/i.test(m.stage)) s += 200;
  if (["IN_PLAY", "PAUSED"].includes(m.status)) s += 300;
  return s;
};

interface Props {
  className?: string;
}

export const MatchOfTheDay = ({ className }: Props) => {
  const { isWorldCup } = useTournamentMode();
  const { data, isLoading } = useWorldCupMatches();

  const pick = useMemo<FDMatch | null>(() => {
    const matches = data?.data?.matches || [];
    if (!matches.length) return null;
    const now = new Date();
    // Today's matches first
    const today = matches.filter((m) => isSameDay(new Date(m.utcDate), now));
    const pool = today.length ? today : matches
      .filter((m) => new Date(m.utcDate).getTime() >= now.getTime() - 3 * 3600 * 1000)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
      .slice(0, 6);
    if (!pool.length) return null;
    return [...pool].sort((a, b) => scoreMatch(b) - scoreMatch(a))[0];
  }, [data]);

  if (!isWorldCup) return null;
  if (isLoading) {
    return <div className={cn("rounded-2xl border border-amber-500/30 bg-card/40 h-[180px] animate-pulse", className)} />;
  }
  if (!pick) return null;

  const live = ["IN_PLAY", "PAUSED"].includes(pick.status);
  const finished = pick.status === "FINISHED";
  const h = pick.score?.fullTime?.home;
  const a = pick.score?.fullTime?.away;
  const hasScore = h !== null && a !== null && h !== undefined && a !== undefined;
  const isPolMatch = POLAND_TLAS.includes(pick.homeTeam.tla || "") || POLAND_TLAS.includes(pick.awayTeam.tla || "");

  return (
    <section className={cn("relative mb-8", className)} aria-label="Mecz dnia">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          Mecz dnia {isPolMatch && "🇵🇱"}
        </h2>
      </div>
      <Link
        to="/mistrzostwa-swiata-2026"
        className={cn(
          "block rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-emerald-900/10 p-5 md:p-6",
          "hover:border-amber-500/70 transition-colors"
        )}
      >
        <div className="flex items-center justify-between mb-4 text-xs uppercase tracking-wider text-muted-foreground">
          <span>{pick.group || pick.stage?.replace(/_/g, " ") || "Mecz"}</span>
          {live ? (
            <span className="inline-flex items-center gap-1 text-red-500 font-bold">
              <Radio className="h-3 w-3 animate-pulse" />
              {pick.minute != null ? `${pick.minute}'` : "Live"}
            </span>
          ) : finished ? (
            <span>Po meczu</span>
          ) : (
            <span className="tabular-nums">{fmtTime(pick.utcDate)}</span>
          )}
        </div>

        <div className="flex items-center justify-around gap-4">
          {/* Home */}
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            {pick.homeTeam.crest ? (
              <img src={pick.homeTeam.crest} alt="" className="h-14 w-14 md:h-16 md:w-16 object-contain" loading="lazy" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-muted" />
            )}
            <div className="text-sm md:text-base font-bold text-center truncate w-full">
              {pick.homeTeam.shortName || pick.homeTeam.name}
            </div>
          </div>

          {/* Score / VS */}
          <div className="text-2xl md:text-3xl font-bold tabular-nums shrink-0 px-2">
            {hasScore ? `${h} : ${a}` : "vs"}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            {pick.awayTeam.crest ? (
              <img src={pick.awayTeam.crest} alt="" className="h-14 w-14 md:h-16 md:w-16 object-contain" loading="lazy" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-muted" />
            )}
            <div className="text-sm md:text-base font-bold text-center truncate w-full">
              {pick.awayTeam.shortName || pick.awayTeam.name}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-amber-500/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>MŚ 2026 · USA / Kanada / Meksyk</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
            Hub MŚ <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </Link>
    </section>
  );
};
