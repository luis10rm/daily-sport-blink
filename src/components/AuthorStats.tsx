import { FileText, Tag, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

interface AuthorStatsProps {
  postsCount: number;
  topCategory: string | null;
  firstPostDate: string | null;
}

export const AuthorStats = ({
  postsCount,
  topCategory,
  firstPostDate,
}: AuthorStatsProps) => {
  const activeSince = firstPostDate
    ? formatDistanceToNow(new Date(firstPostDate), { locale: pl, addSuffix: false })
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Statystyki autora
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {/* Posts count */}
          <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/50 p-4">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground md:text-3xl">
              {postsCount}
            </span>
            <span className="text-xs text-muted-foreground">
              {postsCount === 1 ? "artykuł" : postsCount < 5 ? "artykuły" : "artykułów"}
            </span>
          </div>

          {/* Top category */}
          <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/50 p-4">
            <Tag className="h-5 w-5 text-primary" />
            <span className="text-center text-base font-bold text-foreground md:text-lg">
              {topCategory || "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              ulubiona kategoria
            </span>
          </div>

          {/* Active since */}
          <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/50 p-4">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-center text-base font-bold text-foreground md:text-lg">
              {activeSince || "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              aktywny od
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
