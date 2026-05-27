import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorldCupMatches, type FDMatch } from "@/hooks/useWorldCupData";
import { CalendarDays } from "lucide-react";

const fmtKickoff = (iso: string) =>
  new Date(iso).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const TeamRow = ({ t, score }: { t: FDMatch["homeTeam"]; score: number | null }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-2 min-w-0">
      {t.crest && <img src={t.crest} alt="" className="h-5 w-5 object-contain" loading="lazy" />}
      <span className="truncate text-sm font-medium text-foreground">{t.name}</span>
    </div>
    <span className="tabular-nums text-base font-bold text-foreground">{score ?? "–"}</span>
  </div>
);

const MatchCard = ({ m }: { m: FDMatch }) => {
  const live = m.status === "IN_PLAY" || m.status === "PAUSED";
  const finished = m.status === "FINISHED";
  return (
    <article className="rounded-xl border border-border bg-card/50 p-4 transition-colors hover:border-amber-500/40">
      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3" /> {fmtKickoff(m.utcDate)}
        </span>
        {live && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-red-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> LIVE {m.minute ? `${m.minute}'` : ""}
          </span>
        )}
        {finished && <span className="text-emerald-500">KONIEC</span>}
        {!live && !finished && m.group && <span>{m.group}</span>}
      </div>
      <div className="space-y-1.5">
        <TeamRow t={m.homeTeam} score={m.score.fullTime.home} />
        <TeamRow t={m.awayTeam} score={m.score.fullTime.away} />
      </div>
    </article>
  );
};

export const WorldCupMatchesWidget = () => {
  const { data, isLoading, error } = useWorldCupMatches();

  const { upcoming, recent, live } = useMemo(() => {
    const all = data?.data?.matches ?? [];
    const sortedAsc = [...all].sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate));
    const live = sortedAsc.filter((m) => m.status === "IN_PLAY" || m.status === "PAUSED");
    const upcoming = sortedAsc.filter((m) => m.status === "SCHEDULED" || m.status === "TIMED").slice(0, 6);
    const recent = sortedAsc.filter((m) => m.status === "FINISHED").reverse().slice(0, 4);
    return { upcoming, recent, live };
  }, [data]);

  if (isLoading) {
    return (
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold text-foreground">Terminarz i wyniki</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-12 rounded-xl border border-border bg-card/40 p-6 text-sm text-muted-foreground">
        Nie udało się pobrać danych meczowych. Spróbuj odświeżyć stronę.
      </section>
    );
  }

  const isEmpty = !live.length && !upcoming.length && !recent.length;
  if (isEmpty) {
    return (
      <section className="mb-12 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="mb-1 text-lg font-bold text-foreground">Terminarz</h2>
        <p className="text-sm text-muted-foreground">
          Pełny terminarz pojawi się gdy FIFA opublikuje pary meczowe. Wracaj regularnie!
        </p>
      </section>
    );
  }

  return (
    <section className="mb-12">
      {live.length > 0 && (
        <>
          <h2 className="mb-3 text-xl font-bold text-foreground flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Trwają mecze
          </h2>
          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((m) => <MatchCard key={m.id} m={m} />)}
          </div>
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <h2 className="mb-3 text-xl font-bold text-foreground">Najbliższe mecze</h2>
          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((m) => <MatchCard key={m.id} m={m} />)}
          </div>
        </>
      )}

      {recent.length > 0 && (
        <>
          <h2 className="mb-3 text-xl font-bold text-foreground">Ostatnie wyniki</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((m) => <MatchCard key={m.id} m={m} />)}
          </div>
        </>
      )}
    </section>
  );
};
