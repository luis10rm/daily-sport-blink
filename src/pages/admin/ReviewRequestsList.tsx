import { useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Eye, EyeOff, Minus, Pin, PinOff, Plus, Save, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useAdminReviewRequests,
  useCreateReviewRequest,
  useDeleteReviewRequest,
  useUpdateReviewRequest,
  type ReviewRequest,
} from "@/hooks/useReviewRequests";

const Row = ({ item }: { item: ReviewRequest }) => {
  const { mutate: update, isPending } = useUpdateReviewRequest();
  const { mutate: remove } = useDeleteReviewRequest();
  const [title, setTitle] = useState(item.title);
  const [votes, setVotes] = useState(String(item.votes));

  const dirty = title !== item.title || Number(votes) !== item.votes;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center",
        item.is_visible ? "border-border bg-card" : "border-dashed border-border bg-muted/40",
      )}
    >
      <div className="flex-1 space-y-1">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        <p className="text-xs text-muted-foreground">
          Dodano {format(new Date(item.created_at), "d MMM yyyy, HH:mm", { locale: pl })}
          {item.is_pinned && " · przypięte"}
          {!item.is_visible && " · ukryte"}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setVotes(String(Math.max(0, Number(votes) - 1)))}
          aria-label="Odejmij głos"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          min={0}
          value={votes}
          onChange={(e) => setVotes(e.target.value)}
          className="w-20 text-center"
          aria-label="Liczba głosów"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setVotes(String(Number(votes) + 1))}
          aria-label="Dodaj głos"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          disabled={!dirty || isPending}
          onClick={() =>
            update({ id: item.id, title: title.trim(), votes: Math.max(0, Number(votes) || 0) })
          }
        >
          <Save className="mr-1.5 h-4 w-4" />
          Zapisz
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => update({ id: item.id, is_pinned: !item.is_pinned })}
          aria-label={item.is_pinned ? "Odepnij" : "Przypnij"}
        >
          {item.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => update({ id: item.id, is_visible: !item.is_visible })}
          aria-label={item.is_visible ? "Ukryj" : "Pokaż"}
        >
          {item.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={() => {
            if (confirm(`Usunąć „${item.title}”?`)) remove(item.id);
          }}
          aria-label="Usuń"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const ReviewRequestsList = () => {
  const [sort, setSort] = useState<"votes" | "created_at">("votes");
  const [newTitle, setNewTitle] = useState("");
  const { data: items = [], isLoading } = useAdminReviewRequests(sort);
  const { mutate: create, isPending: creating } = useCreateReviewRequest();

  const visibleCount = items.filter((i) => i.is_visible).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Życzenia Tech</h1>
            <p className="text-sm text-muted-foreground">
              Czego użytkownicy szukają w recenzjach — Top 4 trafia na stronę Tech.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{visibleCount} widocznych</Badge>
            <Button
              variant={sort === "votes" ? "default" : "outline"}
              size="sm"
              onClick={() => setSort("votes")}
            >
              Po głosach
            </Button>
            <Button
              variant={sort === "created_at" ? "default" : "outline"}
              size="sm"
              onClick={() => setSort("created_at")}
            >
              Najnowsze
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 sm:flex-row">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Dodaj własną pozycję (np. Laptopy do 4000 zł)"
            maxLength={120}
            className="flex-1"
          />
          <Button
            disabled={creating || newTitle.trim().length < 3}
            onClick={() =>
              create(newTitle.trim(), { onSuccess: () => setNewTitle("") })
            }
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Dodaj
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">Brak zgłoszeń</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ReviewRequestsList;
