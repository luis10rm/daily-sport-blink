import { Link } from "@/lib/router-compat";
import { useMemo } from "react";
import { Trophy, Radio, CalendarDays, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorldCupMatches, type FDMatch } from "@/hooks/useWorldCupData";
import { useCountdown, splitCountdown } from "@/hooks/useCountdown";

const fmtKickoff = (iso: string) =>
  new Date(iso).toLocaleString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

const pickMatch = (matches: FDMatch[]): FDMatch | null => {
  if (!matches?.length) return null;
  const now = Date.now();
  const live = matches.find((m) => ["IN_PLAY", "PAUSED"].includes(m.status));
  if (live) return live;
  const upcoming = matches
    .filter((m) => ["SCHEDULED", "TIMED"].includes(m.status) && new Date(m.utcDate).getTime() > now)
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
  return upcoming[0] ?? null;
};

const Team = ({ t, align }: { t: FDMatch["homeTeam"]; align: "left" | "right" }) => (
  <div
    className={`flex items-center gap-2 md:gap-3 min-w-0 flex-1 ${
      align === "right" ? "flex-row-reverse text-right" : "text-left"
    }`}
  >
    {t.crest && (
      <img
        src={t.crest}
        alt=""
        className="h-9 w-9 md:h-12 md:w-12 object-contain shrink-0"
        loading="lazy"
      />
    )}
    <div className="min-w-0">
      <div className="text-sm md:text-base font-bold text-foreground truncate">
        <span className="hidden md:inline">{t.shortName || t.name}</span>
        <span className="md:hidden">{t.tla || t.shortName || t.name}</span>
      </div>
    </div>
  </div>
);

const Cell = ({ value, label }: { value: number; label: string }) => (
  <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 py-3 md:py-4 text-center">
    <div className="text-3xl md:text-4xl font-bold tabular-nums text-amber-500 leading-none">
      {String(value).padStart(2, "0")}
    </div>
    <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
  </div>
);

export const NextMatchCountdown = () => {
  const { data, isLoading } = useWorldCupMatches();
  const match = useMemo(() => pickMatch(data?.data?.matches || []), [data]);
  const ms = useCountdown(match?.utcDate);

  if (isLoading) {
    return <Skeleton className="h-56 rounded-2xl mb-10" />;
  }

  if (!match) return null;

  const live = ["IN_PLAY", "PAUSED"].includes(match.status);
  const ft = match.score?.fullTime;
  const ht = match.score?.halfTime;
  const scoreH = ft?.home ?? ht?.home ?? (live ? 0 : null);
  const scoreA = ft?.away ?? ht?.away ?? (live ? 0 : null);
  const hasScore = scoreH !== null && scoreA !== null && scoreH !== undefined && scoreA !== undefined;
  const { d, h, m, s } = splitCountdown(ms);

  return (
    <section
      aria-label={live ? "Trwa mecz" : "Odliczanie do kolejnego meczu"}
      className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-background p-5 md:p-7 mb-10"
    >
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-amber-500/15 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          {live ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-500">
              <Radio className="h-3 w-3 animate-pulse" /> Na żywo
              {match.minute != null && (
                <span className="ml-1 tabular-nums">· {match.minute}'</span>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-950 ring-1 ring-amber-300/60">
              <Trophy className="h-3 w-3" /> Następny mecz
            </span>
          )}
          {match.group && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {match.group}
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="flex items-center gap-3 md:gap-4">
          <Team t={match.homeTeam} align="left" />
          <div className="shrink-0 text-center px-1 md:px-2">
            {hasScore ? (
              <div className="text-3xl md:text-5xl font-bold tabular-nums text-foreground">
                {scoreH} <span className="text-muted-foreground">:</span> {scoreA}
              </div>
            ) : (
              <div className="text-base md:text-xl font-semibold text-muted-foreground">vs</div>
            )}
          </div>
          <Team t={match.awayTeam} align="right" />
        </div>

        {/* Countdown or Live note */}
        {live ? (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-center text-sm text-red-500 font-semibold">
            Mecz trwa — wynik aktualizowany na żywo
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-4 gap-2 md:gap-3">
            <Cell value={d} label="dni" />
            <Cell value={h} label="godz" />
            <Cell value={m} label="min" />
            <Cell value={s} label="sek" />
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="capitalize">{fmtKickoff(match.utcDate)}</span>
          </span>
          <Link
            to="/mistrzostwa-swiata-2026#terminarz"
            className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400"
          >
            Pełny terminarz <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
};
