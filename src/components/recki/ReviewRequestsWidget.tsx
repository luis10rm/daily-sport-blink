import { useMemo, useState } from "react";
import { Lightbulb, Plus, ThumbsUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { titleSimilarity } from "@/lib/titleSimilarity";
import {
  useReviewRequests,
  useSubmitReviewRequest,
  useVoteReviewRequest,
  type ReviewRequest,
} from "@/hooks/useReviewRequests";

const SIMILARITY_THRESHOLD = 0.7;

interface ReviewRequestsWidgetProps {
  className?: string;
}

export const ReviewRequestsWidget = ({ className }: ReviewRequestsWidgetProps) => {
  const [value, setValue] = useState("");
  const { data: requests = [], isLoading } = useReviewRequests();
  const submit = useSubmitReviewRequest();
  const vote = useVoteReviewRequest();

  const top = useMemo(() => requests.slice(0, 4), [requests]);

  const suggestions = useMemo<ReviewRequest[]>(() => {
    const q = value.trim();
    if (q.length < 3) return [];
    return requests
      .map((r) => ({ r, score: titleSimilarity(q, r.title) }))
      .filter(({ score }) => score >= SIMILARITY_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ r }) => r);
  }, [value, requests]);

  const handleVote = (item: ReviewRequest) => {
    vote.mutate(item.id, {
      onSuccess: () => {
        setValue("");
        toast({ title: "Dzięki!", description: `Zapisaliśmy Twój głos: ${item.title}` });
      },
    });
  };

  const handleSubmit = () => {
    const title = value.trim();
    if (title.length < 3) {
      toast({
        title: "Za krótka nazwa",
        description: "Wpisz co najmniej 3 znaki.",
        variant: "destructive",
      });
      return;
    }
    submit.mutate(title, {
      onSuccess: (row) => {
        setValue("");
        toast({
          title: row?.is_new ? "Dodane do listy" : "Dzięki!",
          description: row?.is_new
            ? "Twoja propozycja jest już widoczna dla innych."
            : "Ten temat już był — dorzuciliśmy Twój głos.",
        });
      },
    });
  };

  const isBusy = submit.isPending || vote.isPending;

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-5 sm:p-6",
        className,
      )}
      aria-labelledby="review-requests-heading"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Lightbulb className="h-5 w-5" />
        </span>
        <div>
          <h2 id="review-requests-heading" className="text-lg font-bold sm:text-xl">
            Jakiej recenzji szukasz?
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Napisz, co mamy przetestować. Możesz też zagłosować na propozycje innych.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          maxLength={120}
          placeholder="np. Robot sprzątający do 2000 zł"
          aria-label="Nazwa recenzji, której szukasz"
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isBusy}
          className="touch-manipulation sm:w-auto"
        >
          {submit.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Zgłoś
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Czy chodzi Ci o…
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleVote(s)}
                disabled={isBusy}
                className="inline-flex touch-manipulation items-center gap-2 rounded-full border border-primary/30 bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors active:scale-95 hover:[@media(hover:hover)]:border-primary hover:[@media(hover:hover)]:text-primary"
              >
                <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                {s.title}
                <span className="text-xs text-muted-foreground">{s.votes}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Nie o to? Kliknij „Zgłoś”, dodamy Twoją propozycję jako nową.
          </p>
        </div>
      )}

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Najczęściej wybierane
        </p>

        {isLoading ? (
          <div className="mt-2 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : top.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nikt jeszcze nic nie zgłosił — bądź pierwszy!
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {top.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="w-5 shrink-0 text-sm font-bold text-primary">{index + 1}.</span>
                  <span className="truncate text-sm font-medium">{item.title}</span>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleVote(item)}
                  disabled={isBusy}
                  className="shrink-0 touch-manipulation gap-1.5"
                  aria-label={`Zagłosuj na ${item.title}`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {item.votes}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
