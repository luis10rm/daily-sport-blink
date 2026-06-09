import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Radio, Calendar, Trophy } from "lucide-react";
import { useWorldCupMatches, type FDMatch } from "@/hooks/useWorldCupData";
import { cn } from "@/lib/utils";

const normalize = (s: string) =>
  s.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");

const teamMatchesTag = (team: { name: string; shortName?: string; tla?: string }, tag: string) => {
  const t = normalize(tag);
  if (!t) return false;
  return (
    normalize(team.name).includes(t) ||
    (team.shortName && normalize(team.shortName).includes(t)) ||
    (team.tla && normalize(team.tla) === t)
  );
};

interface Props {
  tags?: string[];
  className?: string;
}

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pl-PL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export const WorldCupMatchCenter = ({ tags = [], className }: Props) => {
  const { data } = useWorldCupMatches();

  const match = useMemo<FDMatch | null>(() => {
    const all = data?.data?.matches || [];
    if (!all.length || !tags.length) return null;
    const candidates = all.filter((m) =>
      tags.some((tg) => teamMatchesTag(m.homeTeam, tg) || teamMatchesTag(m.awayTeam, tg))
    );
    if (!candidates.length) return null;
    const now = Date.now();
    // Prefer live, then next upcoming, then last finished
    const live = candidates.find((m) => ["IN_PLAY", "PAUSED"].includes(m.status));
    if (live) return live;
    const upcoming = candidates
      .filter((m) => new Date(m.utcDate).getTime() >= now - 2 * 3600 * 1000 && m.status !== "FINISHED")
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0];
    if (upcoming) return upcoming;
    return [...candidates]
      .filter((m) => m.status === "FINISHED")
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())[0] || null;
  }, [data, tags]);

  if (!match) return null;

  const live = ["IN_PLAY", "PAUSED"].includes(match.status);
  const finished = match.status === "FINISHED";
  const h = match.score?.fullTime?.home;
  const a = match.score?.fullTime?.away;
  const hasScore = h !== null && a !== null && h !== undefined && a !== undefined;

  return (
    <aside
      className={cn(
        "not-prose my-8 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-emerald-900/10 p-5",
        className
      )}
      aria-label="Match Center MŚ"
    >
      <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
        <Trophy className="h-4 w-4" />
        <span>Match Center</span>
        {live && (
          <span className="ml-auto inline-flex items-center gap-1 text-red-500">
            <Radio className="h-3 w-3 animate-pulse" />
            {match.minute != null ? `${match.minute}'` : "Live"}
          </span>
        )}
        {finished && <span className="ml-auto text-muted-foreground">Po meczu</span>}
        {!live && !finished && (
          <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {fmtDateTime(match.utcDate)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-around gap-4">
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          {match.homeTeam.crest && (
            <img src={match.homeTeam.crest} alt="" className="h-12 w-12 object-contain" loading="lazy" />
          )}
          <div className="text-sm font-bold text-center truncate w-full">
            {match.homeTeam.shortName || match.homeTeam.name}
          </div>
        </div>
        <div className="text-2xl font-bold tabular-nums px-2">
          {hasScore ? `${h} : ${a}` : "vs"}
        </div>
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          {match.awayTeam.crest && (
            <img src={match.awayTeam.crest} alt="" className="h-12 w-12 object-contain" loading="lazy" />
          )}
          <div className="text-sm font-bold text-center truncate w-full">
            {match.awayTeam.shortName || match.awayTeam.name}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs text-muted-foreground">
        <span>{match.group || match.stage?.replace(/_/g, " ")}</span>
        <Link to="/mistrzostwa-swiata-2026" className="font-semibold text-amber-600 dark:text-amber-400 hover:underline">
          Pełny terminarz →
        </Link>
      </div>
    </aside>
  );
};
