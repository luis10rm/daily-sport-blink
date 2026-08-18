import { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAllReviewsAdmin, useDeleteReview } from "@/hooks/useReviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Pencil, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const ReviewsList = () => {
  const { data: reviews, isLoading } = useAllReviewsAdmin();
  const del = useDeleteReview();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "review" | "news" | "comparison">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const matchesSearch = (r: { title: string; product_name: string | null; product_brand: string | null }) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.product_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (r.product_brand ?? "").toLowerCase().includes(search.toLowerCase());

  const filtered = reviews?.filter(
    (r) => matchesSearch(r) && (typeFilter === "all" || r.content_type === typeFilter),
  );

  const counts = {
    all: reviews?.length ?? 0,
    review: reviews?.filter((r) => r.content_type === "review").length ?? 0,
    news: reviews?.filter((r) => r.content_type === "news").length ?? 0,
    comparison: reviews?.filter((r) => r.content_type === "comparison").length ?? 0,
  };

  const TYPE_TABS = [
    { value: "all" as const, label: "Wszystkie" },
    { value: "review" as const, label: "Recenzje" },
    { value: "news" as const, label: "Newsy" },
    { value: "comparison" as const, label: "Porównania" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">Tech</h1>
            <p className="text-muted-foreground">Recenzje, newsy i porównania technologiczne</p>
          </div>
          <Link to="/admin/recki/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nowy wpis
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-muted p-1 w-fit">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setTypeFilter(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                typeFilter === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label} ({counts[tab.value]})
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po tytule, produkcie lub marce..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>


        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tytuł</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead>Ocena</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Brak wpisów
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered?.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{r.title}</span>
                          {r.is_topic_of_day && (
                            <Badge className="bg-fuchsia-600 hover:bg-fuchsia-600 text-white">
                              Temat dnia
                            </Badge>
                          )}
                        </div>
                        {(r.product_brand || r.product_name) && (
                          <div className="text-xs text-muted-foreground">
                            {[r.product_brand, r.product_name].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.content_type === "news"
                              ? "outline"
                              : r.content_type === "comparison"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {r.content_type === "news"
                            ? "News"
                            : r.content_type === "comparison"
                              ? "Porównanie"
                              : "Recenzja"}
                        </Badge>
                      </TableCell>

                      <TableCell>{r.category?.name ?? "—"}</TableCell>
                      <TableCell>
                        {r.score !== null ? (
                          <Badge variant="secondary">{Number(r.score).toFixed(1)}/10</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === "published" ? "default" : "outline"}>
                          {r.status === "published" ? "Opublikowana" : "Szkic"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.published_at
                          ? format(new Date(r.published_at), "d MMM yyyy", { locale: pl })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {r.status === "published" && (
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            title="Otwórz publicznie"
                          >
                            <a
                              href={`/tech/${r.category?.slug ?? "wszystkie"}/${r.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/recki/${r.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć recenzję?</AlertDialogTitle>
            <AlertDialogDescription>Tej operacji nie można cofnąć.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) del.mutate(deleteId);
                setDeleteId(null);
              }}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default ReviewsList;
