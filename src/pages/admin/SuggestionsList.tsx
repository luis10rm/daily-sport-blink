import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  useNewsSuggestions,
  useUpdateSuggestionStatus,
  useScanNewsSources,
  useNewsSources,
  useExistingPostsByUrls,
} from "@/hooks/useNewsDiscovery";
import { useBulkPrepareSuggestions } from "@/hooks/useBulkPrepareSuggestions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Sparkles, X, RefreshCw, Settings2, FilterX, Trash2, Rocket, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

export default function SuggestionsList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("pending");
  const [sourceId, setSourceId] = useState<string>("all");
  const [minScore, setMinScore] = useState<string>("0");
  const [hidePublished, setHidePublished] = useState(true);

  const { data: sources } = useNewsSources();
  const { data: suggestions, isLoading } = useNewsSuggestions({
    status,
    sourceId: sourceId === "all" ? undefined : sourceId,
    minScore: Number(minScore) || undefined,
  });
  const updateStatus = useUpdateSuggestionStatus();
  const scan = useScanNewsSources();
  const qc = useQueryClient();

  // Map URL → existing published post (instant "already on site" indicator)
  const urlsForCheck = useMemo(
    () => (suggestions ?? []).map((s) => s.article_url),
    [suggestions]
  );
  const { data: existingMap } = useExistingPostsByUrls(urlsForCheck);
  const getExistingPost = (s: { article_url: string; accepted_post_id?: string | null }) =>
    existingMap?.get(s.article_url) ??
    (s.accepted_post_id
      ? { id: s.accepted_post_id, slug: "", title: "" }
      : undefined);

  const visibleSuggestions = useMemo(() => {
    if (!suggestions) return [];
    if (!hidePublished) return suggestions;
    return suggestions.filter((s) => !existingMap?.has(s.article_url));
  }, [suggestions, existingMap, hidePublished]);

  const filtersActive = status !== "pending" || sourceId !== "all" || minScore !== "0" || !hidePublished;
  const resetFilters = () => {
    setStatus("pending");
    setSourceId("all");
    setMinScore("0");
    setHidePublished(true);
  };

  // ===== Bulk selection =====
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const bulkPrepare = useBulkPrepareSuggestions();
  const MAX_BULK = 6;

  const selectableIds = useMemo(
    () =>
      (visibleSuggestions ?? [])
        .filter((s) => s.status === "pending" && !existingMap?.has(s.article_url))
        .map((s) => s.id),
    [visibleSuggestions, existingMap]
  );

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (next.size >= MAX_BULK) {
          toast.warning(`Maksymalnie ${MAX_BULK} naraz`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const selectHighScore = () => {
    const high = (suggestions ?? [])
      .filter((s) => s.status === "pending" && (s.ai_score ?? 0) >= 7 && !existingMap?.has(s.article_url))
      .slice(0, MAX_BULK)
      .map((s) => s.id);
    setSelectedIds(new Set(high));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkPublish = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Opublikujesz ${ids.length} ${ids.length === 1 ? "artykuł" : "artykuły"} od razu na stronie głównej. Kontynuować?`)) return;
    try {
      await bulkPrepare.mutateAsync(ids);
      setSelectedIds(new Set());
    } catch {
      // toast handled by hook
    }
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Odrzucić ${ids.length} ${ids.length === 1 ? "propozycję" : "propozycje"}?`)) return;
    const { error } = await supabase
      .from("news_suggestions")
      .update({ status: "rejected" })
      .in("id", ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`Odrzucono ${ids.length}`);
    setSelectedIds(new Set());
    qc.invalidateQueries({ queryKey: ["news_suggestions"] });
    qc.invalidateQueries({ queryKey: ["news_suggestions_pending_count"] });
  };

  const handleClearSuggestions = async (scope: "rejected" | "all_non_published" | "all") => {
    const label =
      scope === "rejected"
        ? "wszystkie odrzucone"
        : scope === "all"
        ? "WSZYSTKIE propozycje (również opublikowane)"
        : "wszystkie oprócz opublikowanych";
    if (!confirm(`Na pewno usunąć ${label}? Tej operacji nie można cofnąć.`)) return;
    const base = supabase.from("news_suggestions").delete();
    const { error } =
      scope === "rejected"
        ? await base.eq("status", "rejected")
        : scope === "all"
        ? await base.not("id", "is", null)
        : await base.neq("status", "published");
    if (error) { toast.error(error.message); return; }
    toast.success(`Usunięto ${label}`);
    qc.invalidateQueries({ queryKey: ["news_suggestions"] });
    qc.invalidateQueries({ queryKey: ["news_suggestions_pending_count"] });
  };

  const handlePrepare = (id: string, articleUrl: string) => {
    navigate("/admin/posts/new", {
      state: { sourceUrl: articleUrl, suggestionId: id, autoExtract: true },
    });
  };

  const scoreColor = (s: number | null) => {
    if (!s) return "secondary";
    if (s >= 8) return "default";
    if (s >= 5) return "secondary";
    return "outline";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Propozycje newsów</h1>
            <p className="text-muted-foreground">AI sugeruje, ty decydujesz co publikujemy.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/sources")}>
              <Settings2 className="mr-2 h-4 w-4" /> Źródła
            </Button>
            <Button
              variant="outline"
              onClick={() => handleClearSuggestions("rejected")}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Wyczyść odrzucone
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleClearSuggestions("all")}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Wyczyść wszystkie
            </Button>
            <Button onClick={() => scan.mutate({ maxPerSource: 5, todayOnly: true })} disabled={scan.isPending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${scan.isPending ? "animate-spin" : ""}`} />
              Skanuj teraz
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Oczekujące</SelectItem>
                <SelectItem value="duplicate">Duplikaty</SelectItem>
                <SelectItem value="rejected">Odrzucone</SelectItem>
                <SelectItem value="published">Opublikowane</SelectItem>
                <SelectItem value="all">Wszystkie</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Źródło" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie źródła</SelectItem>
                {sources?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={minScore} onValueChange={setMinScore}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Każdy score</SelectItem>
                <SelectItem value="5">Min. 5</SelectItem>
                <SelectItem value="7">Min. 7</SelectItem>
                <SelectItem value="9">Min. 9 🔥</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 px-2">
              <Checkbox
                id="hide-published"
                checked={hidePublished}
                onCheckedChange={(v) => setHidePublished(v === true)}
              />
              <Label htmlFor="hide-published" className="cursor-pointer text-sm font-normal">
                Ukryj już opublikowane
              </Label>
            </div>
            {filtersActive && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <FilterX className="mr-2 h-4 w-4" /> Wyczyść filtry
              </Button>
            )}
            <div className="ml-auto text-xs text-muted-foreground">
              {visibleSuggestions.length} z {suggestions?.length ?? 0} wyników
            </div>
          </CardContent>
        </Card>


        {/* Sticky bulk actions bar */}
        {status === "pending" && selectableIds.length > 0 && (
          <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-lg border bg-background/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="text-sm font-medium">
              Zaznaczono: <span className="text-primary">{selectedIds.size}</span> / {MAX_BULK}
            </div>
            <Button size="sm" variant="ghost" onClick={selectHighScore}>
              Zaznacz top score ≥ 7
            </Button>
            {selectedIds.size > 0 && (
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                Wyczyść zaznaczenie
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkReject}
                disabled={selectedIds.size === 0 || bulkPrepare.isPending}
              >
                <X className="mr-2 h-4 w-4" /> Odrzuć ({selectedIds.size})
              </Button>
              <Button
                size="sm"
                onClick={handleBulkPublish}
                disabled={selectedIds.size === 0 || bulkPrepare.isPending}
              >
                {bulkPrepare.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="mr-2 h-4 w-4" />
                )}
                Opublikuj {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        ) : !suggestions || suggestions.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            Brak propozycji. Kliknij „Skanuj teraz" lub dodaj źródła.
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => (
              <Card key={s.id} className={`overflow-hidden ${selectedIds.has(s.id) ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="flex flex-col gap-4 p-4 md:flex-row">
                  {s.status === "pending" && (
                    <div className="flex md:items-start md:pt-1">
                      <Checkbox
                        checked={selectedIds.has(s.id)}
                        onCheckedChange={() => toggleOne(s.id)}
                        aria-label="Zaznacz do publikacji zbiorczej"
                      />
                    </div>
                  )}
                  {s.image_url && (
                    <img
                      src={s.image_url}
                      alt={s.title || ""}
                      className="h-32 w-full rounded-md object-cover md:w-48"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-start gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant={scoreColor(s.ai_score) as "default" | "secondary" | "outline"}>
                              ⭐ {s.ai_score ?? "?"}/10
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">{s.ai_reasoning || "—"}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {s.status === "duplicate" && (
                        <Badge variant="destructive">Duplikat</Badge>
                      )}
                      {s.status === "published" && (
                        <Badge variant="default">Opublikowano</Badge>
                      )}
                      {s.news_sources?.name && (
                        <Badge variant="outline">{s.news_sources.name}</Badge>
                      )}
                      {s.sport_categories?.name && (
                        <Badge variant="secondary">{s.sport_categories.name}</Badge>
                      )}
                      <div className="ml-auto flex flex-col items-end text-xs text-muted-foreground">
                        {s.published_at && (
                          <span title={new Date(s.published_at).toLocaleString("pl-PL")}>
                            📅 {new Date(s.published_at).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                        <span>wykryto {formatDistanceToNow(new Date(s.discovered_at), { addSuffix: true, locale: pl })}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold leading-tight">{s.title || s.article_url}</h3>
                    {s.excerpt && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{s.excerpt}</p>
                    )}
                    {s.suggested_tags && s.suggested_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {s.suggested_tags.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">#{t}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {s.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => handlePrepare(s.id, s.article_url)}>
                            <Sparkles className="mr-2 h-4 w-4" /> Przygotuj artykuł
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus.mutate({ id: s.id, status: "rejected" })}
                          >
                            <X className="mr-2 h-4 w-4" /> Odrzuć
                          </Button>
                        </>
                      )}
                      {s.status === "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus.mutate({ id: s.id, status: "pending" })}
                        >
                          Przywróć
                        </Button>
                      )}
                      {s.status === "duplicate" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrepare(s.id, s.article_url)}
                          >
                            <Sparkles className="mr-2 h-4 w-4" /> Mimo to przygotuj
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateStatus.mutate({ id: s.id, status: "rejected" })}
                          >
                            <X className="mr-2 h-4 w-4" /> Odrzuć
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" asChild>
                        <a href={s.article_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" /> Otwórz źródło
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
