import { ExternalLink } from "lucide-react";
import { SportIcon, SportCategory, getSportLabel } from "./SportIcon";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  title: string;
  excerpt: string;
  category: SportCategory;
  publishedAt: string;
  sourceUrl: string;
  className?: string;
  delay?: number;
}

export const NewsCard = ({
  title,
  excerpt,
  category,
  publishedAt,
  sourceUrl,
  className,
  delay = 0,
}: NewsCardProps) => {
  const formattedDate = new Date(publishedAt).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 rounded-xl border border-border bg-card p-6 card-hover opacity-0 animate-fade-in",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <SportIcon category={category} />
        <span className="text-sm text-muted-foreground">{formattedDate}</span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-primary">
          {getSportLabel(category)}
        </span>
        <h3 className="font-heading text-lg font-semibold leading-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{excerpt}</p>
      </div>

      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
      >
        Przeczytaj więcej
        <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </a>
    </article>
  );
};
