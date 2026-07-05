import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorldCupMatches, type FDMatch } from "@/hooks/useWorldCupData";
import { Trophy } from "lucide-react";

type RoundKey = "LAST_16" | "QUARTER_FINALS" | "SEMI_FINALS" | "THIRD_PLACE" | "FINAL";
// FIFA 2026 wprowadza rundę 1/16 (LAST_32). Zachowujemy 6 kolumn dla kompletności.
type BracketRoundKey = "LAST_32" | RoundKey;

const ROUND_META: { key: BracketRoundKey; label: string; slots: number }[] = [
  { key: "LAST_32", label: "1/16 finału", slots: 16 },
  { key: "LAST_16", label: "1/8 finału", slots: 8 },
  { key: "QUARTER_FINALS", label: "Ćwierćfinały", slots: 4 },
  { key: "SEMI_FINALS", label: "Półfinały", slots: 2 },
  { key: "THIRD_PLACE", label: "Mecz o 3. miejsce", slots: 1 },
  { key: "FINAL", label: "Finał", slots: 1 },
];

const KNOCKOUT_STAGES = new Set<string>([
  "LAST_32",
  "LAST_16",
  "QUARTER_FINALS",
  "QUARTERFINALS",
  "SEMI_FINALS",
  "SEMIFINALS",
  "THIRD_PLACE",
  "FINAL",
]);

const normalizeStage = (raw?: string | null): BracketRoundKey | null => {
  if (!raw) return null;
  const s = raw.toUpperCase().replace(/-/g, "_");
  if (s === "LAST_32" || s === "ROUND_OF_32") return "LAST_32";
  if (s === "LAST_16" || s === "ROUND_OF_16") return "LAST_16";
  if (s === "QUARTER_FINALS" || s === "QUARTERFINALS") return "QUARTER_FINALS";
  if (s === "SEMI_FINALS" || s === "SEMIFINALS") return "SEMI_FINALS";
  if (s === "THIRD_PLACE" || s === "THIRD_PLACE_FINAL" || s === "3RD_PLACE_FINAL") return "THIRD_PLACE";
  if (s === "FINAL") return "FINAL";
  return null;
};

const fmtKickoff = (iso: string) =>
  new Date(iso).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const TeamLine = ({
  team,
  score,
  winner,
}: {
  team: FDMatch["homeTeam"] | null;
  score: number | null;
  winner: boolean;
}) => (
  <div
    className={`flex items-center justify-between gap-2 py-1 ${
      winner ? "text-foreground" : "text-muted-foreground"
    }`}
  >
    <div className="flex min-w-0 items-center gap-1.5">
      {team?.crest ? (
        <img src={team.crest} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" />
      ) : (
        <span className="h-4 w-4 shrink-0 rounded-sm bg-muted/60" />
      )}
      <span className={`truncate text-xs ${winner ? "font-semibold" : ""}`}>
        {team ? team.tla || team.shortName || team.name : "TBD"}
      </span>
    </div>
    <span className="tabular-nums text-sm font-bold">{score ?? "–"}</span>
  </div>
);

const BracketMatchCard = ({ m }: { m: FDMatch | null }) => {
  if (!m) {
    return (
      <div className="h-full min-h-[86px] rounded-lg border border-dashed border-border/60 bg-card/30 p-2.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">
        TBD
      </div>
    );
  }
  const live = m.status === "IN_PLAY" || m.status === "PAUSED";
  const finished = m.status === "FINISHED";
  const winner = m.score?.winner;
  return (
    <article
      className={`rounded-lg border bg-card/60 p-2.5 transition-colors ${
        live
          ? "border-amber-500/60 shadow-[0_0_0_1px_hsl(45_100%_50%/0.45)]"
          : finished
            ? "border-border/70"
            : "border-border hover:border-amber-500/40"
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{fmtKickoff(m.utcDate)}</span>
        {live && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-1.5 py-0.5 text-red-500">
            <span className="h-1 w-1 animate-pulse rounded-full bg-red-500" />
            LIVE {m.minute ? `${m.minute}'` : ""}
          </span>
        )}
        {finished && <span className="text-emerald-500">KONIEC</span>}
      </div>
      <TeamLine team={m.homeTeam} score={m.score.fullTime.home} winner={winner === "HOME_TEAM"} />
      <TeamLine team={m.awayTeam} score={m.score.fullTime.away} winner={winner === "AWAY_TEAM"} />
    </article>
  );
};

export const WorldCupBracket = () => {
  const { data, isLoading, error } = useWorldCupMatches();

  const byRound = useMemo(() => {
    const map: Record<BracketRoundKey, FDMatch[]> = {
      LAST_32: [],
      LAST_16: [],
      QUARTER_FINALS: [],
      SEMI_FINALS: [],
      THIRD_PLACE: [],
      FINAL: [],
    };
    const all = data?.data?.matches ?? [];
    for (const m of all) {
      const key = normalizeStage(m.stage);
      if (!key) continue;
      if (!KNOCKOUT_STAGES.has(key)) continue;
      map[key].push(m);
    }
    (Object.keys(map) as BracketRoundKey[]).forEach((k) => {
      map[k].sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate));
    });
    return map;
  }, [data]);

  const totalKnockoutMatches = useMemo(
    () => Object.values(byRound).reduce((n, arr) => n + arr.length, 0),
    [byRound]
  );

  if (isLoading) {
    return (
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold text-foreground">Drabinka pucharowa</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[420px] w-[240px] shrink-0 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (error) return null;

  if (totalKnockoutMatches === 0) {
    return (
      <section className="mb-12 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 className="mb-1 text-lg font-bold text-foreground">Drabinka pucharowa</h2>
            <p className="text-sm text-muted-foreground">
              Pary fazy pucharowej pojawią się po zakończeniu fazy grupowej. Trzymajcie kciuki za Biało-Czerwonych!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Drabinka pucharowa
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Faza pucharowa Mistrzostw Świata 2026 — od 1/16 do finału. Przesuń w bok, aby zobaczyć wszystkie rundy.
          </p>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-3 snap-x snap-mandatory">
        <div className="flex min-w-max gap-3 md:gap-4">
          {ROUND_META.map((round) => {
            const matches = byRound[round.key];
            // Pad z pustymi slotami żeby zachować układ (tylko dla rund głównej ścieżki)
            const padTo = round.key === "THIRD_PLACE" ? 1 : round.slots;
            const cells: (FDMatch | null)[] = [...matches];
            while (cells.length < padTo) cells.push(null);
            if (cells.length > padTo) cells.length = padTo;

            return (
              <div
                key={round.key}
                className="flex w-[220px] shrink-0 snap-start flex-col md:w-[240px]"
              >
                <div className="mb-2 rounded-md border border-border/60 bg-card/40 px-2.5 py-1.5 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                    {round.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {matches.length}/{padTo} mecz{padTo === 1 ? "" : padTo < 5 ? "e" : "ów"}
                  </div>
                </div>
                <div
                  className={`grid flex-1 gap-2 ${
                    round.key === "THIRD_PLACE" ? "content-end" : "content-around"
                  }`}
                  style={{ gridTemplateRows: `repeat(${padTo}, minmax(86px, 1fr))` }}
                >
                  {cells.map((m, i) => (
                    <BracketMatchCard key={m?.id ?? `${round.key}-empty-${i}`} m={m} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
