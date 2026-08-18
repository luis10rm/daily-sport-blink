import { useNavigate } from "@/lib/router-compat";
import { Radio, ChevronRight } from "lucide-react";
import { useWorldCupMatches, type FDMatch } from "@/hooks/useWorldCupData";
import { useTournamentMode } from "@/hooks/useTournamentMode";
import { useCountdown, formatCountdown } from "@/hooks/useCountdown";

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });


const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Pick best match to show: live > next today > nearest upcoming (within 48h). */
const pickMatch = (matches: FDMatch[]): FDMatch | null => {
  if (!matches?.length) return null;
  const now = new Date();
  const live = matches.find((m) => ["IN_PLAY", "PAUSED"].includes(m.status));
  if (live) return live;
  const upcoming = matches
    .filter((m) => ["SCHEDULED", "TIMED"].includes(m.status) && new Date(m.utcDate) > now)
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
  const todayNext = upcoming.find((m) => isSameDay(new Date(m.utcDate), now));
  if (todayNext) return todayNext;
  const next = upcoming[0];
  if (!next) return null;
  const diffH = (new Date(next.utcDate).getTime() - now.getTime()) / 36e5;
  return diffH <= 48 ? next : null;
};

const TeamLabel = ({ team }: { team: FDMatch["homeTeam"] }) => (
  <span className="inline-flex items-center gap-1.5 min-w-0">
    {team.crest && (
      <img src={team.crest} alt="" className="h-4 w-4 object-contain shrink-0" loading="lazy" />
    )}
    <span className="font-semibold truncate">
      {team.tla || team.shortName || team.name}
    </span>
  </span>
);

export const MatchTicker = () => {
  const navigate = useNavigate();
  const { isWorldCup } = useTournamentMode();
  const { data } = useWorldCupMatches();
  const match = pickMatch(data?.data?.matches || []);
  const countdownMs = useCountdown(match?.utcDate);

  if (!isWorldCup) return null;
  if (!match) return null;

  const live = ["IN_PLAY", "PAUSED"].includes(match.status);
  const finished = match.status === "FINISHED";
  const ft = match.score?.fullTime;
  const ht = match.score?.halfTime;
  const scoreH = ft?.home ?? ht?.home ?? (live ? 0 : null);
  const scoreA = ft?.away ?? ht?.away ?? (live ? 0 : null);
  const hasScore = scoreH !== null && scoreA !== null && scoreH !== undefined && scoreA !== undefined;
  const showCountdown = !live && !finished && !hasScore;

  const go = () => navigate("/mistrzostwa-swiata-2026");


  return (
    <a
      href="/mistrzostwa-swiata-2026"
      role="link"
      onClick={(e) => { e.preventDefault(); go(); }}
      onTouchEnd={(e) => { e.preventDefault(); go(); }}
      className="block border-b border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 hover:from-amber-500/20 hover:to-amber-500/20 transition-colors cursor-pointer"
      aria-label="Strefa Mistrzostw Świata 2026"
    >
      <div className="container flex h-9 md:h-10 items-center gap-3 text-xs md:text-sm">
        {live ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2 py-0.5 font-bold uppercase tracking-wider text-red-500 shrink-0">
            <Radio className="h-3 w-3 animate-pulse" />
            <span className="hidden sm:inline">Na żywo</span>
            <span className="sm:hidden">Live</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 shrink-0">
            MŚ 2026
          </span>
        )}

        <div className="flex items-center gap-2 min-w-0 flex-1 text-foreground">
          <TeamLabel team={match.homeTeam} />
          <span className="text-muted-foreground shrink-0">
            {hasScore ? (
              <span className="font-bold tabular-nums">{scoreH} : {scoreA}</span>
            ) : (
              <span className="tabular-nums">{fmtTime(match.utcDate)}</span>
            )}
          </span>
          <TeamLabel team={match.awayTeam} />
          {showCountdown && (
            <span className="ml-1 rounded-full bg-amber-500/15 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] md:text-xs font-semibold text-amber-700 dark:text-amber-300 tabular-nums whitespace-nowrap shrink-0">
              {formatCountdown(countdownMs)}
            </span>
          )}
          {live && match.minute != null && (
            <span className="hidden sm:inline text-red-500 font-semibold tabular-nums">
              {match.minute}'
            </span>
          )}
          {finished && (
            <span className="hidden sm:inline text-muted-foreground uppercase text-[10px] tracking-wider">
              koniec
            </span>
          )}
        </div>

        <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
      </div>
    </a>
  );
};
