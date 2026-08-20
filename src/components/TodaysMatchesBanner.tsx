import { useNavLink } from "@/hooks/useNavLink";
import { Trophy, Radio } from "lucide-react";
import { useWorldCupMatches, type FDMatch } from "@/hooks/useWorldCupData";
import { useTournamentMode } from "@/hooks/useTournamentMode";
import { cn } from "@/lib/utils";

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const Team = ({ team, align = "left" }: { team: FDMatch["homeTeam"]; align?: "left" | "right" }) => (
  <div className={cn(
    "flex items-center gap-2 min-w-0 flex-1",
    align === "right" && "flex-row-reverse text-right"
  )}>
    {team.crest ? (
      <img src={team.crest} alt="" className="h-8 w-8 object-contain shrink-0" loading="lazy" />
    ) : (
      <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
    )}
    <div className="min-w-0">
      <div className="text-sm font-semibold truncate">{team.shortName || team.name}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{team.tla}</div>
    </div>
  </div>
);

const MatchCard = ({ match }: { match: FDMatch }) => {
  const live = ["IN_PLAY", "PAUSED"].includes(match.status);
  const finished = match.status === "FINISHED";
  const ft = match.score?.fullTime;
  const ht = match.score?.halfTime;
  const h = ft?.home ?? ht?.home ?? (live ? 0 : null);
  const a = ft?.away ?? ht?.away ?? (live ? 0 : null);
  const hasScore = h !== null && a !== null && h !== undefined && a !== undefined;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-card/60 px-4 py-3 min-w-[260px] flex-1">
      <div className="flex items-center justify-between mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{match.group || match.stage?.replace(/_/g, " ") || ""}</span>
        {live ? (
          <span className="inline-flex items-center gap-1 text-red-500 font-bold">
            <Radio className="h-3 w-3 animate-pulse" />
            {match.minute != null ? `${match.minute}'` : "Live"}
          </span>
        ) : finished ? (
          <span>Koniec</span>
        ) : (
          <span className="tabular-nums">{fmtTime(match.utcDate)}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Team team={match.homeTeam} />
        <div className="text-base font-bold tabular-nums shrink-0">
          {hasScore ? `${h} : ${a}` : "vs"}
        </div>
        <Team team={match.awayTeam} align="right" />
      </div>
    </div>
  );
};

interface Props {
  className?: string;
}

export const TodaysMatchesBanner = ({ className }: Props) => {
  const { isWorldCup } = useTournamentMode();
  const { data, isLoading } = useWorldCupMatches();
  const navLink = useNavLink();

  if (!isWorldCup) return null;

  const matches = data?.data?.matches || [];
  const now = new Date();
  const todays = matches
    .filter((m) => isSameDay(new Date(m.utcDate), now))
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

  if (isLoading) {
    return (
      <div className={cn("rounded-2xl border border-amber-500/30 bg-card/40 p-4 mb-6 animate-pulse h-[120px]", className)} />
    );
  }

  // Brak meczu dziś → nic nie renderujemy. Wejście do strefy MŚ zapewnia
  // WorldCupHomeBanner; pusty pasek tylko dublował CTA i zwiększał szum nad foldem.
  if (!todays.length) return null;


  return (
    <section className={cn("mb-6", className)} aria-label="Mecze dnia – MŚ 2026">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          Dziś gra…
        </h2>
        <a
          {...navLink("/mistrzostwa-swiata-2026")}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground"
        >
          Cały terminarz →
        </a>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x">
        {todays.map((m) => (
          <div key={m.id} className="snap-start">
            <MatchCard match={m} />
          </div>
        ))}
      </div>
    </section>
  );
};
