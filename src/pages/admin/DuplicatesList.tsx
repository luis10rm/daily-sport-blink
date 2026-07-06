import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";

interface GroupPost {
  id: string;
  slug: string;
  title: string;
  published_at: string;
  updated_at: string;
  image_url: string | null;
  content_length: number;
  is_news_of_day: boolean;
  channel: string;
  category_id: string | null;
  author_id: string | null;
}

interface DuplicateGroup {
  normalized_key: string;
  posts: GroupPost[];
  suggested_canonical_id: string;
  tie_breaker_hints: {
    oldest_id: string;
    longest_content_id: string;
    newest_updated_id: string;
  };
}

interface ScanResponse {
  groups: DuplicateGroup[];
  params: { days: number; min_similarity: number; channel: string };
}

interface RedirectRow {
  from_slug: string;
  to_slug: string;
  from_url: string;
  to_url: string;
  reason: string;
  hits: number;
  created_at: string;
  updated_at: string;
}

const invokeFn = async <T,>(name: string, body: unknown): Promise<T> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Musisz być zalogowany");
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || `Błąd (${res.status})`);
  return json as T;
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const DuplicatesList = () => {
  const [days, setDays] = useState(30);
  const [minSimilarity, setMinSimilarity] = useState(0.85);
  const [channel, setChannel] = useState<"all" | "sport" | "positive">("all");
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [dismissedGroups, setDismissedGroups] = useState<Record<string, { count: number; canonical: string; rechained: number }>>({});
  const [selection, setSelection] = useState<Record<string, string>>({}); // groupKey → canonicalId
  const [googleUrls, setGoogleUrls] = useState<Record<string, string>>({});
  const [pendingMerge, setPendingMerge] = useState<DuplicateGroup | null>(null);

  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: (payload: { days: number; min_similarity: number; channel: string }) =>
      invokeFn<ScanResponse>("scan-duplicates", payload),
    onSuccess: (data) => {
      setScanResult(data);
      setDismissedGroups({});
      const nextSelection: Record<string, string> = {};
      for (const g of data.groups) nextSelection[g.normalized_key] = g.suggested_canonical_id;
      setSelection(nextSelection);
      toast.success(`Znaleziono ${data.groups.length} grup duplikatów`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Błąd skanu"),
  });

  const mergeMutation = useMutation({
    mutationFn: (payload: { canonical_id: string; duplicate_ids: string[]; google_canonical_url?: string }) =>
      invokeFn<{
        effective_canonical_slug: string;
        canonical_was_redirected: boolean;
        redirected: number;
        rechained_count: number;
        hidden_duplicates: number;
      }>("merge-duplicates", payload),
    onSuccess: (data, variables) => {
      const group = pendingMerge!;
      setDismissedGroups((prev) => ({
        ...prev,
        [group.normalized_key]: {
          count: data.hidden_duplicates,
          canonical: data.effective_canonical_slug,
          rechained: data.rechained_count,
        },
      }));
      setPendingMerge(null);
      queryClient.invalidateQueries({ queryKey: ["post-redirects"] });
      toast.success(
        `Scalono ${data.hidden_duplicates}→1. Redirect aktywny za ≤60s.${
          data.canonical_was_redirected ? " (Canonical rozwiązany do finalnego celu)" : ""
        }`,
      );
    },
    onError: (err) => {
      setPendingMerge(null);
      toast.error(err instanceof Error ? err.message : "Błąd scalania");
    },
  });

  const redirectsQuery = useQuery({
    queryKey: ["post-redirects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_redirects" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as RedirectRow[];
    },
  });

  const canonicalSlugSet = useMemo(() => {
    const s = new Set<string>();
    (redirectsQuery.data ?? []).forEach((r) => s.add(r.from_slug));
    return s;
  }, [redirectsQuery.data]);

  const runScan = () => {
    scanMutation.mutate({ days, min_similarity: minSimilarity, channel });
  };

  const confirmMerge = (group: DuplicateGroup) => {
    setPendingMerge(group);
  };

  const performMerge = () => {
    if (!pendingMerge) return;
    const canonicalId = selection[pendingMerge.normalized_key];
    const duplicateIds = pendingMerge.posts.map((p) => p.id).filter((id) => id !== canonicalId);
    const googleUrl = googleUrls[pendingMerge.normalized_key]?.trim() || undefined;
    mergeMutation.mutate({
      canonical_id: canonicalId,
      duplicate_ids: duplicateIds,
      google_canonical_url: googleUrl,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Copy className="h-7 w-7 text-primary" />
              Duplikaty
            </h1>
            <p className="text-muted-foreground mt-1">
              Znajdź i scal artykuły opublikowane pod różnymi URL-ami. Redirect 301 jest serwowany
              przez Cloudflare Workera i staje się aktywny w ≤60 sekund od scalenia.
            </p>
          </div>
        </div>

        {/* Filtry */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skanuj bazę</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">Okres</Label>
                <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Ostatnie 7 dni</SelectItem>
                    <SelectItem value="14">Ostatnie 14 dni</SelectItem>
                    <SelectItem value="30">Ostatnie 30 dni</SelectItem>
                    <SelectItem value="90">Ostatnie 90 dni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Kanał</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie</SelectItem>
                    <SelectItem value="sport">Sport</SelectItem>
                    <SelectItem value="positive">Pozytywne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">
                  Próg podobieństwa tytułów: <span className="font-mono">{Math.round(minSimilarity * 100)}%</span>
                </Label>
                <div className="pt-3">
                  <Slider
                    value={[minSimilarity * 100]}
                    onValueChange={([v]) => setMinSimilarity(v / 100)}
                    min={70}
                    max={99}
                    step={1}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={runScan} disabled={scanMutation.isPending}>
                {scanMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Skanuj
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grupy */}
        {scanMutation.isPending && (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {scanResult && scanResult.groups.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <Check className="mx-auto h-10 w-10 text-emerald-500 mb-3" />
              Nie znaleziono grup duplikatów dla zadanych parametrów.
            </CardContent>
          </Card>
        )}

        {scanResult?.groups.map((group) => {
          const dismissed = dismissedGroups[group.normalized_key];
          if (dismissed) {
            return (
              <Card key={group.normalized_key} className="border-emerald-500/50 bg-emerald-500/5">
                <CardContent className="py-4 flex items-center gap-3">
                  <Check className="h-5 w-5 text-emerald-500" />
                  <div className="text-sm">
                    <div className="font-semibold">
                      Scalono {dismissed.count} → 1 (canonical: <span className="font-mono">{dismissed.canonical}</span>)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Redirect aktywny za ≤60s. Przepiętych starszych redirectów: {dismissed.rechained}.
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          const selectedId = selection[group.normalized_key];
          const selectedPost = group.posts.find((p) => p.id === selectedId);
          const canonicalWillBeRedirected =
            selectedPost && canonicalSlugSet.has(selectedPost.slug);
          const dates = group.posts.map((p) => new Date(p.published_at).getTime());
          const rangeStart = new Date(Math.min(...dates));
          const rangeEnd = new Date(Math.max(...dates));

          return (
            <Card key={group.normalized_key}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-mono break-all">
                      {group.normalized_key}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground mt-1">
                      {group.posts.length} duplikatów • {formatDateTime(rangeStart.toISOString())}
                      {" — "}
                      {formatDateTime(rangeEnd.toISOString())}
                    </div>
                  </div>
                  <Badge variant="outline">{group.posts[0]?.channel ?? "sport"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.posts.map((p) => {
                    const isSelected = selectedId === p.id;
                    const hints: string[] = [];
                    if (group.tie_breaker_hints.newest_updated_id === p.id) hints.push("najnowsza edycja");
                    if (group.tie_breaker_hints.longest_content_id === p.id) hints.push("najdłuższa treść");
                    if (group.tie_breaker_hints.oldest_id === p.id) hints.push("najstarsza publikacja");
                    return (
                      <label
                        key={p.id}
                        className={`block cursor-pointer rounded-lg border p-3 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            name={`canonical-${group.normalized_key}`}
                            className="mt-1"
                            checked={isSelected}
                            onChange={() =>
                              setSelection((prev) => ({ ...prev, [group.normalized_key]: p.id }))
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {isSelected ? "Kanoniczny" : "Duplikat"}
                              </span>
                              {p.is_news_of_day && (
                                <Badge variant="secondary" className="text-[10px]">
                                  News dnia
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-sm font-semibold mt-1 line-clamp-2">{p.title}</h3>
                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              <div>Opub.: {formatDateTime(p.published_at)}</div>
                              <div>Edyt.: {formatDateTime(p.updated_at)}</div>
                              <div>Treść: {p.content_length.toLocaleString("pl-PL")} zn.</div>
                            </div>
                            <a
                              href={`/blink/${p.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" /> /blink/{p.slug}
                            </a>
                            {hints.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {hints.map((h) => (
                                  <Badge key={h} variant="outline" className="text-[10px]">
                                    {h}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div>
                  <Label className="text-xs">
                    Google canonical URL (opcjonalnie — jeśli GSC wskazał inny slug w tej grupie)
                  </Label>
                  <Input
                    value={googleUrls[group.normalized_key] ?? ""}
                    placeholder="https://szortsy.pl/blink/..."
                    onChange={(e) =>
                      setGoogleUrls((prev) => ({ ...prev, [group.normalized_key]: e.target.value }))
                    }
                  />
                </div>

                {canonicalWillBeRedirected && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      Wybrany kanoniczny (<span className="font-mono">{selectedPost?.slug}</span>) był
                      wcześniej scalony do innego postu. Redirecty zostaną utworzone bezpośrednio do
                      finalnego celu, żeby nie tworzyć łańcuchów.
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={() => confirmMerge(group)}
                    disabled={mergeMutation.isPending}
                  >
                    Scal grupę ({group.posts.length - 1} → redirect)
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Log przekierowań */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Log przekierowań</CardTitle>
          </CardHeader>
          <CardContent>
            {redirectsQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (redirectsQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak utworzonych redirectów.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-2 pr-4">Z</th>
                      <th className="py-2 pr-4">Do</th>
                      <th className="py-2 pr-4">Powód</th>
                      <th className="py-2 pr-4">Hits</th>
                      <th className="py-2 pr-4">Utworzono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(redirectsQuery.data ?? []).map((r) => (
                      <tr key={r.from_slug} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-xs">{r.from_slug}</td>
                        <td className="py-2 pr-4 font-mono text-xs">{r.to_slug}</td>
                        <td className="py-2 pr-4">
                          <Badge variant="outline" className="text-[10px]">{r.reason}</Badge>
                        </td>
                        <td className="py-2 pr-4 text-xs">{r.hits}</td>
                        <td className="py-2 pr-4 text-xs text-muted-foreground">
                          {formatDateTime(r.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Merge confirmation */}
        <AlertDialog open={!!pendingMerge} onOpenChange={(open) => !open && setPendingMerge(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Scalić grupę duplikatów?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm">
                  {pendingMerge && (
                    <>
                      <p>
                        Utworzę <strong>{pendingMerge.posts.length - 1}</strong> przekierowań 301,
                        ukryję <strong>{pendingMerge.posts.length - 1}</strong> postów i usunę je z
                        sitemapy.
                      </p>
                      <p className="text-muted-foreground">
                        Operacja jest odwracalna z poziomu bazy. Redirect stanie się aktywny w ciągu
                        ≤60 sekund (cache Cloudflare Workera).
                      </p>
                    </>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction onClick={performMerge} disabled={mergeMutation.isPending}>
                {mergeMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Scal
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default DuplicatesList;
