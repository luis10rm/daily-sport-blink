import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  useNewsSources,
  useCreateNewsSource,
  useUpdateNewsSource,
  useDeleteNewsSource,
  useScanNewsSources,
} from "@/hooks/useNewsDiscovery";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, RefreshCw, Trash2, Filter, Rss } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

export default function SourcesList() {
  const { data: sources, isLoading } = useNewsSources();
  const create = useCreateNewsSource();
  const update = useUpdateNewsSource();
  const remove = useDeleteNewsSource();
  const scan = useScanNewsSources();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selector, setSelector] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [pathIncludes, setPathIncludes] = useState("");
  const [maxPerSource, setMaxPerSource] = useState(5);
  const [todayOnly, setTodayOnly] = useState(true);
  const [useSemanticDedup, setUseSemanticDedup] = useState(true);

  const parsePathRules = (raw: string): string[] | null => {
    const rules = raw
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (rules.length === 0) return null;
    return rules;
  };

  const handleAdd = async () => {
    if (!name || !url) return;
    const rules = parsePathRules(pathIncludes);
    if (rules && rules.some((r) => !r.startsWith("/"))) {
      alert("Każda ścieżka musi zaczynać się od '/' (np. /wiadomosci/)");
      return;
    }
    await create.mutateAsync({
      name,
      url,
      list_selector: selector || undefined,
      feed_url: feedUrl.trim() || null,
      url_path_includes: rules,
    });
    setName(""); setUrl(""); setSelector(""); setFeedUrl(""); setPathIncludes(""); setOpen(false);
  };

  const handleEditFeed = (s: { id: string; name: string; feed_url: string | null }) => {
    const next = prompt(
      `RSS / Atom feed URL dla "${s.name}"\n\nGdy podany, skan używa feeda zamiast scrapowania strony głównej.\nPuste = wyłącz RSS.`,
      s.feed_url || "",
    );
    if (next === null) return;
    update.mutate({ id: s.id, feed_url: next.trim() || null });
  };

  const handleEditPaths = (s: { id: string; name: string; url_path_includes: string[] | null }) => {
    const current = (s.url_path_includes || []).join(", ");
    const next = prompt(
      `Filtr ścieżek URL dla "${s.name}"\n\nPodaj fragmenty pathname (po przecinku), które muszą wystąpić w linku.\nNp. /wiadomosci/, /news/\nPuste = bez filtra.`,
      current,
    );
    if (next === null) return;
    const rules = parsePathRules(next);
    if (rules && rules.some((r) => !r.startsWith("/"))) {
      alert("Każda ścieżka musi zaczynać się od '/'");
      return;
    }
    update.mutate({ id: s.id, url_path_includes: rules });
  };


  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Źródła newsów</h1>
            <p className="text-muted-foreground">Strony skanowane przez AI w poszukiwaniu propozycji.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Dodaj źródło</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nowe źródło</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Nazwa</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Sport.pl" />
                </div>
                <div>
                  <Label>URL strony głównej / sekcji</Label>
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.sport.pl" />
                </div>
                <div>
                  <Label>RSS / Atom feed URL (opcjonalnie, zalecane)</Label>
                  <Input value={feedUrl} onChange={(e) => setFeedUrl(e.target.value)} placeholder="https://www.sport.pl/rss.xml" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Gdy podany, skan użyje feeda zamiast scrapowania – pewna data publikacji, dużo mniej wywołań Firecrawl.
                  </p>
                </div>
                <div>
                  <Label>Selektor CSS listy (opcjonalnie)</Label>
                  <Input value={selector} onChange={(e) => setSelector(e.target.value)} placeholder=".article-list a" />
                </div>
                <div>
                  <Label>Filtr ścieżek URL (opcjonalnie)</Label>
                  <Input
                    value={pathIncludes}
                    onChange={(e) => setPathIncludes(e.target.value)}
                    placeholder="/wiadomosci/, /news/"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Linki muszą zawierać przynajmniej jeden z tych fragmentów. Każdy musi zaczynać się od „/". Puste = bez filtra.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleAdd} disabled={!name || !url || create.isPending}>Dodaj</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-end gap-4 p-4">
            <div className="space-y-1">
              <Label htmlFor="max-per-source">Max propozycji na źródło</Label>
              <Input
                id="max-per-source"
                type="number"
                min={1}
                max={20}
                value={maxPerSource}
                onChange={(e) => setMaxPerSource(Math.max(1, Math.min(20, Number(e.target.value) || 5)))}
                className="w-32"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="today-only" checked={todayOnly} onCheckedChange={setTodayOnly} />
              <Label htmlFor="today-only" className="cursor-pointer">Tylko z dzisiaj (24h)</Label>
            </div>
            <div className="flex items-center gap-2" title="Gdy fingerprint tekstowy zasugeruje, że to ten sam news z innego źródła, AI dodatkowo to potwierdza. Włącz, jeśli widzisz dublujące się tematy.">
              <Switch id="semantic-dedup" checked={useSemanticDedup} onCheckedChange={setUseSemanticDedup} />
              <Label htmlFor="semantic-dedup" className="cursor-pointer">Wykrywaj ten sam temat (AI)</Label>
            </div>
            <Button
              className="ml-auto"
              onClick={() => scan.mutate({ maxPerSource, todayOnly, useSemanticDedup })}
              disabled={scan.isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${scan.isPending ? "animate-spin" : ""}`} />
              Skanuj wszystkie
            </Button>
          </CardContent>
        </Card>

        <Card>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Aktywne</TableHead>
                  <TableHead>Ostatni skan</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Ładowanie…</TableCell></TableRow>
                ) : !sources || sources.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Brak źródeł. Dodaj pierwsze.</TableCell></TableRow>
                ) : (
                  sources.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {s.url}
                        </a>
                        {s.feed_url && (
                          <div className="text-xs text-emerald-500 mt-0.5 flex items-center gap-1">
                            <Rss className="h-3 w-3" /> RSS
                          </div>
                        )}
                        {s.url_path_includes && s.url_path_includes.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            filtr: {s.url_path_includes.join(", ")}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <Switch
                          checked={s.is_active}
                          onCheckedChange={(v) => update.mutate({ id: s.id, is_active: v })}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.last_scanned_at
                          ? formatDistanceToNow(new Date(s.last_scanned_at), { addSuffix: true, locale: pl })
                          : "nigdy"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => scan.mutate({ sourceId: s.id, maxPerSource, todayOnly, useSemanticDedup })}
                          disabled={scan.isPending}
                          title="Skanuj to źródło"
                        >
                          <RefreshCw className={`h-4 w-4 ${scan.isPending ? "animate-spin" : ""}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditFeed(s)}
                          title="Edytuj RSS / Atom feed URL"
                        >
                          <Rss className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditPaths(s)}
                          title="Edytuj filtr ścieżek URL"
                        >
                          <Filter className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Usunąć źródło "${s.name}"?`)) remove.mutate(s.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
