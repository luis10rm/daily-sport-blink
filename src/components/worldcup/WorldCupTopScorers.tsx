import { Skeleton } from "@/components/ui/skeleton";
import { useWorldCupScorers } from "@/hooks/useWorldCupData";
import { Target } from "lucide-react";

export const WorldCupTopScorers = () => {
  const { data, isLoading, error } = useWorldCupScorers();

  if (isLoading) {
    return (
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold text-foreground">Król strzelców</h2>
        <Skeleton className="h-72 rounded-xl" />
      </section>
    );
  }

  if (error) return null;

  const scorers = (data?.data?.scorers ?? []).slice(0, 10);
  if (!scorers.length) {
    return (
      <section className="mb-12 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="mb-1 text-lg font-bold text-foreground">Król strzelców</h2>
        <p className="text-sm text-muted-foreground">
          Ranking pojawi się po pierwszych golach turnieju.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <h2 className="mb-4 text-xl font-bold text-foreground flex items-center gap-2">
        <Target className="h-5 w-5 text-amber-500" /> Król strzelców
      </h2>
      <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 bg-muted/30">
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 text-left w-8">#</th>
              <th className="px-3 py-2 text-left">Zawodnik</th>
              <th className="px-3 py-2 text-left">Drużyna</th>
              <th className="px-3 py-2 text-right">Gole</th>
              <th className="hidden sm:table-cell px-3 py-2 text-right">Asysty</th>
            </tr>
          </thead>
          <tbody>
            {scorers.map((s, i) => (
              <tr key={s.player.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                <td className="px-3 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-foreground">{s.player.name}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    {s.team.crest && <img src={s.team.crest} alt="" className="h-4 w-4 object-contain" loading="lazy" />}
                    <span className="truncate">{s.team.tla || s.team.shortName || s.team.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-bold text-amber-500">{s.goals ?? 0}</td>
                <td className="hidden sm:table-cell px-3 py-2 text-right tabular-nums text-muted-foreground">{s.assists ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
