import { OptimizedImage } from "@/components/OptimizedImage";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Cpu, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StripItem {
  id: string;
  title: string;
  href: string;
  image_url: string | null;
  published_at: string;
  category_name?: string | null;
}

const formatDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(
      new Date(iso),
    );
  } catch {
    return "";
  }
};

const useLatestTech = () =>
  useQuery({
    queryKey: ["cross-channel", "tech"],
    staleTime: 60_000,
    queryFn: async (): Promise<StripItem[]> => {
      const { data, error } = await (supabase as any)
        .from("reviews")
        .select(
          "id, title, slug, cover_image_url, published_at, category:review_categories(slug, name)",
        )
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(2);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        href: `/tech/${r.category?.slug ?? "wszystkie"}/${r.slug}`,
        image_url: r.cover_image_url ?? null,
        published_at: r.published_at,
        category_name: r.category?.name ?? null,
      }));
    },
  });

const useLatestPositive = () =>
  useQuery({
    queryKey: ["cross-channel", "positive"],
    staleTime: 60_000,
    queryFn: async (): Promise<StripItem[]> => {
      const { data, error } = await (supabase as any)
        .from("posts")
        .select(
          "id, title, slug, image_url, published_at, positive_category:positive_categories!posts_positive_category_id_fkey(name)",
        )
        .eq("channel", "positive")
        .eq("is_hidden", false)
        .order("published_at", { ascending: false })
        .limit(2);
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        id: p.id,
        title: p.title,
        href: `/blink/${p.slug}`,
        image_url: p.image_url ?? null,
        published_at: p.published_at,
        category_name: p.positive_category?.name ?? null,
      }));
    },
  });

/**
 * Channel colour is used only on the "Zobacz wszystko" link. Everything else
 * is a plain bordered card: neutral border, card surface, foreground text.
 */
const channelStyles = {
  tech: {
    Icon: Cpu,
    label: "Świeżo w Tech",
    href: "/tech",
    cta: "Zobacz wszystko",
    ctaColor: "text-fuchsia-700 hover:text-fuchsia-800 dark:text-fuchsia-300 dark:hover:text-fuchsia-200",
  },
  positive: {
    Icon: Sun,
    label: "Świeżo w Pozytywnych",
    href: "/pozytywne",
    cta: "Zobacz wszystko",
    ctaColor: "text-lime-700 hover:text-lime-800 dark:text-lime-300 dark:hover:text-lime-200",
  },
} as const;

type ChannelKey = keyof typeof channelStyles;

interface ColumnProps {
  channel: ChannelKey;
  items: StripItem[];
  loading: boolean;
}

const ChannelColumn = ({ channel, items, loading }: ColumnProps) => {
  const s = channelStyles[channel];
  const { Icon } = s;

  return (
    <section
      className="rounded-card border border-border bg-card p-4 sm:p-5"
      aria-label={s.label}
    >
      <header className="flex items-center justify-between mb-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
          {s.label}
        </h2>
        <Link
          to={s.href}
          className={cn(
            "inline-flex items-center gap-1 text-xs font-semibold transition-colors",
            s.ctaColor,
          )}
        >
          {s.cta}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      <ul className="grid gap-3">
        {loading &&
          Array.from({ length: 2 }).map((_, i) => (
            <li key={i} className="flex gap-3">
              <Skeleton className="h-16 w-24 rounded-control shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </li>
          ))}

        {!loading &&
          items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.href}
                className="group flex gap-3 items-start rounded-control -mx-1 px-1 py-1 hover:bg-muted/50 transition-colors"
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-control bg-muted">
                  {item.image_url ? (
                    <OptimizedImage
                      src={item.image_url}
                      alt=""
                      sizes="(min-width: 1024px) 320px, 45vw"
                      widths={[320, 400, 640]}
                      fallbackWidth={400}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground opacity-60" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-foreground transition-colors group-hover:text-primary">
                    {item.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    {item.category_name && (
                      <span className="px-1.5 py-0.5 rounded-chip bg-muted font-medium text-muted-foreground">
                        {item.category_name}
                      </span>
                    )}
                    <time dateTime={item.published_at}>{formatDate(item.published_at)}</time>
                  </div>
                </div>
              </Link>
            </li>
          ))}
      </ul>
    </section>
  );
};

interface CrossChannelStripProps {
  className?: string;
}

/**
 * Two-column cross-promotion strip surfacing the latest content from the
 * Tech and Pozytywne channels on the Sport homepage. Hides itself entirely
 * when both channels return no items.
 */
export const CrossChannelStrip = ({ className }: CrossChannelStripProps) => {
  const tech = useLatestTech();
  const positive = useLatestPositive();

  const techItems = tech.data ?? [];
  const positiveItems = positive.data ?? [];
  const loading = tech.isLoading || positive.isLoading;

  if (!loading && techItems.length === 0 && positiveItems.length === 0) {
    return null;
  }

  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      <ChannelColumn channel="tech" items={techItems} loading={tech.isLoading} />
      <ChannelColumn channel="positive" items={positiveItems} loading={positive.isLoading} />
    </div>
  );
};

export default CrossChannelStrip;
