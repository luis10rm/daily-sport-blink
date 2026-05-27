import { Skeleton } from "@/components/ui/skeleton";
import { useWorldCupStandings } from "@/hooks/useWorldCupData";

export const WorldCupStandings = () => {
  const { data, isLoading, error } = useWorldCupStandings();

  if (isLoading) {
    return (
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold text-foreground">Tabele grup</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      </section>
    );
  }

  if (error) return null;

  const standings = data?.data?.standings ?? [];
  if (!standings.length) {
    return (
      <section className="mb-12 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="mb-1 text-lg font-bold text-foreground">Tabele grup</h2>
        <p className="text-sm text-muted-foreground">
          Tabele pojawią się po losowaniu grup i pierwszej kolejce spotkań.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <h2 className="mb-4 text-xl font-bold text-foreground">Tabele grup</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {standings.map((g, idx) => (
          <div key={idx} className="rounded-xl border border-border bg-card/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-amber-500">{g.group || g.stage}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="w-6 pb-1.5 text-left">#</th>
                  <th className="pb-1.5 text-left">Drużyna</th>
                  <th className="pb-1.5 text-center">M</th>
                  <th className="pb-1.5 text-center">+/-</th>
                  <th className="pb-1.5 text-right">P</th>
                </tr>
              </thead>
              <tbody>
                {g.table.map((row) => (
                  <tr key={row.team.id} className="border-b border-border/30 last:border-0">
                    <td className="py-1.5 text-muted-foreground">{row.position}</td>
                    <td className="py-1.5">
                      <div className="flex items-center gap-1.5">
                        {row.team.crest && <img src={row.team.crest} alt="" className="h-4 w-4 object-contain" loading="lazy" />}
                        <span className="truncate text-foreground">{row.team.tla || row.team.shortName || row.team.name}</span>
                      </div>
                    </td>
                    <td className="py-1.5 text-center tabular-nums text-muted-foreground">{row.playedGames}</td>
                    <td className="py-1.5 text-center tabular-nums text-muted-foreground">{row.goalDifference > 0 ? "+" : ""}{row.goalDifference}</td>
                    <td className="py-1.5 text-right tabular-nums font-bold text-foreground">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
};
