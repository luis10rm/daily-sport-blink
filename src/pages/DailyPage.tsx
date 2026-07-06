import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { format, subDays, addDays, isAfter, startOfDay, isValid, parse } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ExternalLink, Newspaper, ArrowLeft, Trophy } from "lucide-react";
import { usePostsByDate } from "@/hooks/usePosts";
import { useSEOMeta } from "@/hooks/useSEOMeta";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DynamicSportIcon } from "@/components/DynamicSportIcon";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const formatDatePl = (d: Date) => {
  const raw = format(d, "EEEE, d MMMM yyyy", { locale: pl });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

const getNewsLabel = (count: number) => {
  if (count === 1) return "news";
  if (count >= 2 && count <= 4) return "newsy";
  return "newsów";
};

export default function DailyPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Validate date
  const parsedDate = date ? parse(date, "yyyy-MM-dd", new Date()) : null;
  const isValidDate = parsedDate && isValid(parsedDate);
  const today = startOfDay(new Date());

  useEffect(() => {
    if (!isValidDate || isAfter(startOfDay(parsedDate!), today)) {
      navigate(`/dzien/${format(today, "yyyy-MM-dd")}`, { replace: true });
    }
  }, [isValidDate, date]);

  const safeDate = isValidDate && !isAfter(startOfDay(parsedDate!), today) ? parsedDate! : today;
  const dateStr = format(safeDate, "yyyy-MM-dd");
  const { data: posts = [], isLoading } = usePostsByDate(dateStr);

  const formattedDate = formatDatePl(safeDate);
  useSEOMeta({ title: `Briefing sportowy — ${formattedDate}`, canonical: `https://szortsy.pl/dzien/${dateStr}`, robots: "noindex, follow" });

  const prevDate = format(subDays(safeDate, 1), "yyyy-MM-dd");
  const nextDate = addDays(safeDate, 1);
  const canGoNext = !isAfter(startOfDay(nextDate), today);
  const nextDateStr = format(nextDate, "yyyy-MM-dd");

  // Progress tracking
  const [progress, setProgress] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!timelineRef.current || posts.length === 0) return;
    const el = timelineRef.current;
    const rect = el.getBoundingClientRect();
    const windowH = window.innerHeight;
    const totalH = el.scrollHeight;
    const scrolled = Math.max(0, windowH - rect.top);
    const pct = Math.min(100, Math.round((scrolled / totalH) * 100));
    setProgress(pct);
  }, [posts.length]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="container flex-1 py-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-40 mb-6" />
          <Skeleton className="h-3 w-full mb-8 rounded-full" />
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main id="main-content" className="container flex-1 py-6 md:py-10">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Strona główna
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            Briefing sportowy
          </h1>
          <p className="text-lg text-muted-foreground">{formattedDate}</p>
          {posts.length > 0 && (
            <p className="text-sm text-primary font-semibold mt-1">
              {posts.length} {getNewsLabel(posts.length)}
            </p>
          )}
        </div>

        {/* Day navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to={`/dzien/${prevDate}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Wczoraj</span>
          </Link>
          {canGoNext ? (
            <Link
              to={`/dzien/${nextDateStr}`}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="hidden sm:inline">Jutro</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground/50 inline-flex items-center gap-1">
              <span className="hidden sm:inline">Dziś</span>
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </div>

        {/* Progress bar */}
        {posts.length > 0 && (
          <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm py-2 mb-6 -mx-1 px-1">
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Empty state */}
        {posts.length === 0 && (
          <section className="text-center py-16 animate-fade-in">
            <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Brak newsów z tego dnia
            </h2>
            <p className="text-muted-foreground mb-6">
              Tego dnia nie opublikowaliśmy żadnych wiadomości.
            </p>
            <Link
              to={`/dzien/${prevDate}`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Sprawdź poprzedni dzień
            </Link>
          </section>
        )}

        {/* Timeline */}
        {posts.length > 0 && (
          <div ref={timelineRef} className="relative">
            {/* Timeline line - desktop only */}
            <div className="hidden md:block absolute left-[68px] top-0 bottom-0 w-px bg-border" />

            <div className="space-y-1">
              {posts.map((post, idx) => {
                const time = format(new Date(post.published_at), "HH:mm");
                const hasContent = Boolean(post.content);
                const href = hasContent ? `/blink/${post.slug}` : post.source_url;
                const isLast = idx === posts.length - 1;

                return (
                  <article
                    key={post.id}
                    className="group relative flex gap-3 md:gap-6 animate-fade-in"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    {/* Time column */}
                    <div className="flex-shrink-0 w-12 md:w-16 pt-4 text-right">
                      <span className="text-xs md:text-sm font-mono text-muted-foreground">
                        {time}
                      </span>
                    </div>

                    {/* Dot on timeline - desktop */}
                    <div className="hidden md:flex flex-shrink-0 items-start pt-5">
                      <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-background z-10" />
                    </div>

                    {/* Card */}
                    <div
                      className={cn(
                        "flex-1 rounded-xl border border-border bg-card p-4 md:p-5 transition-colors hover:border-primary/30",
                        !isLast && "mb-2"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Category icon */}
                        <DynamicSportIcon
                          sportCategory={post.sport_category}
                          fallbackSlug={post.sport_category?.slug}
                          className="h-9 w-9 flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          {/* Category name */}
                          <span className="text-[11px] font-medium uppercase tracking-wider text-primary">
                            {post.sport_category?.name || "Inne"}
                          </span>

                          {/* Title */}
                          <h2 className="text-base md:text-lg font-semibold text-foreground leading-tight mt-0.5 line-clamp-2">
                            {post.title}
                          </h2>

                          {/* Excerpt */}
                          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                            {post.excerpt}
                          </p>

                          {/* CTA */}
                          <div className="mt-3 flex items-center gap-3">
                            {hasContent ? (
                              <Link
                                to={href}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                              >
                                Czytaj więcej
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            ) : (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                              >
                                Czytaj więcej
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Thumbnail on desktop */}
                        {post.image_url && !isMobile && (
                          <div className="hidden lg:block flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden bg-muted">
                            <img
                              src={post.image_url}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Celebration */}
            {progress >= 90 && (
              <div className="relative flex flex-col items-center py-14 overflow-hidden">
                {/* Confetti particles */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <span
                    key={i}
                    className={`absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full animate-confetti-${i}`}
                    style={{
                      backgroundColor: [
                        "hsl(var(--primary))",
                        "#facc15",
                        "#f97316",
                        "#22d3ee",
                        "#a78bfa",
                        "#34d399",
                      ][i - 1],
                    }}
                  />
                ))}

                {/* Trophy */}
                <div className="animate-celebration-pop">
                  <Trophy className="h-14 w-14 text-yellow-500 drop-shadow-lg" />
                </div>

                {/* Text */}
                <p
                  className="text-lg font-semibold text-foreground mt-4 opacity-0 animate-celebration-text"
                  style={{ animationDelay: "0.3s" }}
                >
                  Przeczytałeś wszystkie newsy z tego dnia!
                </p>
                <p
                  className="text-sm text-muted-foreground mt-1 opacity-0 animate-celebration-text"
                  style={{ animationDelay: "0.5s" }}
                >
                  Wróć jutro po nową dawkę sportu 🏆
                </p>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
