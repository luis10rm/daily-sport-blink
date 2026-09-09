import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type Row = {
  ad_type: string;
  variant: string | null;
  device: string | null;
  created_at: string;
};

const DAYS = 14;

/**
 * Our own count of sponsored clicks, so partner-reported numbers can be
 * verified instead of guessed.
 */
export const AdClicksStats = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["ad_clicks", "stats", DAYS],
    queryFn: async () => {
      const since = new Date(Date.now() - DAYS * 86400000).toISOString();
      const { data, error } = await supabase
        .from("ad_clicks")
        .select("ad_type, variant, device, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  const rows = data ?? [];
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Brak zapisanych kliknięć z ostatnich {DAYS} dni. Liczenie startuje od teraz.
      </p>
    );
  }

  const byDay = new Map<string, number>();
  const byVariant = new Map<string, number>();
  const byDevice = new Map<string, number>();
  let patron = 0;
  let banner = 0;

  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
    if (r.ad_type === "patron") {
      patron += 1;
      const v = r.variant ?? "—";
      byVariant.set(v, (byVariant.get(v) ?? 0) + 1);
    } else {
      banner += 1;
    }
    const d = r.device ?? "—";
    byDevice.set(d, (byDevice.get(d) ?? 0) + 1);
  }

  const days = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 7);
  const max = Math.max(...days.map(([, n]) => n), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pasek patrona" value={patron} />
        <Stat label="Banery" value={banner} />
        <Stat label="Mobile" value={byDevice.get("mobile") ?? 0} />
        <Stat label="Desktop" value={byDevice.get("desktop") ?? 0} />
      </div>

      <div className="space-y-1.5">
        {days.map(([day, n]) => (
          <div key={day} className="flex items-center gap-2 text-xs">
            <span className="w-20 shrink-0 text-muted-foreground">{day}</span>
            <div className="h-2 flex-1 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${(n / max) * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right font-medium">{n}</span>
          </div>
        ))}
      </div>

      {byVariant.size > 0 && (
        <p className="text-xs text-muted-foreground">
          Pasek — podział wersji:{" "}
          {[...byVariant.entries()].map(([v, n]) => `${v}: ${n}`).join(" · ")}
        </p>
      )}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border p-3">
    <div className="text-xl font-bold">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);
