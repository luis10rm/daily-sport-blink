import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PozytywneHeader } from "@/components/pozytywne/PozytywneHeader";
import { PozytywneFooter } from "@/components/pozytywne/PozytywneFooter";
import { NewsCard } from "@/components/NewsCard";
import { SponsorBanner } from "@/components/SponsorBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { Archive, Sun, Sparkles, Quote } from "lucide-react";
import {
  usePositivePostsFeed,
  usePositivePostsByCategory,
  useTodaysPositivePosts,
} from "@/hooks/usePositivePosts";
import { usePositiveCategories, usePositiveCategoryBySlug } from "@/hooks/usePositiveCategories";
import { useActiveBannerForDevice } from "@/hooks/useBanners";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSEOMeta } from "@/hooks/useSEOMeta";
import { getGreeting, getQuoteOfDay } from "@/lib/positiveQuotes";
import { burstConfetti, prefersReducedMotion } from "@/lib/confetti";

const PozytywneHome = () => {
  const { slug: categorySlug } = useParams<{ slug?: string }>();
  const inCategory = !!categorySlug;

  const isMobile = useIsMobile();
  const device = isMobile ? "mobile" : "desktop";

  const { data: categories = [] } = usePositiveCategories();
  const { data: category } = usePositiveCategoryBySlug(categorySlug);

  const feedQuery = usePositivePostsFeed();
  const catQuery = usePositivePostsByCategory(categorySlug);
  const { data: posts = [], isLoading } = inCategory ? catQuery : feedQuery;
  const { data: todaysPosts = [] } = useTodaysPositivePosts();

  const { data: topBanner } = useActiveBannerForDevice("home_top", device, "positive");
  const { data: middleBanner } = useActiveBannerForDevice("home_middle", device, "positive");
  const { data: bottomBanner } = useActiveBannerForDevice("home_bottom", device, "positive");

  useEffect(() => {
    document.documentElement.classList.add("mode-pozytywne");
    return () => document.documentElement.classList.remove("mode-pozytywne");
  }, []);

  // A1 + A2 — computed once per mount
  const greeting = useMemo(() => getGreeting(), []);
  const quoteOfDay = useMemo(() => getQuoteOfDay(), []);

  // A3 — confetti tap on today's counter
  const counterRef = useRef<HTMLButtonElement>(null);
  const [showBadge, setShowBadge] = useState(false);
  const handleCounterTap = () => {
    const el = counterRef.current;
    if (!el) return;
    const alreadyPopped = typeof window !== "undefined" && sessionStorage.getItem("pozytywne-confetti") === "1";
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    if (!alreadyPopped && !prefersReducedMotion()) {
      burstConfetti(cx, cy);
      sessionStorage.setItem("pozytywne-confetti", "1");
    }
    // wiggle every time
    el.classList.remove("animate-wiggle");
    // force reflow so re-adding the class restarts the animation
    void el.offsetWidth;
    el.classList.add("animate-wiggle");

    if (prefersReducedMotion()) {
      setShowBadge(true);
      window.setTimeout(() => setShowBadge(false), 1500);
    }
  };


  useSEOMeta({
    title: inCategory && category
      ? `${category.name} – Pozytywne wiadomości | Szortsy`
      : "Pozytywne – dobre wiadomości z kraju i ze świata | Szortsy",
    description: inCategory && category
      ? `Pozytywne wiadomości z kategorii ${category.name}. 60 sekund, lepszy dzień.`
      : "Tylko dobre wiadomości. Nauka, ludzie, natura, miasta, zdrowie i świat — 60 sekund, lepszy dzień.",
    canonical: inCategory
      ? `https://szortsy.pl/pozytywne/kategoria/${categorySlug}`
      : "https://szortsy.pl/pozytywne",
  });

  return (
    <div className="min-h-screen flex flex-col">
      <PozytywneHeader />

      <main className="flex-1">
        <div className="container py-6 md:py-10">
          {/* Hero heading */}
          <section className="mb-8 rounded-2xl border border-lime-500/20 bg-gradient-to-br from-lime-50 via-lime-50/60 to-transparent dark:from-lime-950/40 dark:via-lime-950/20 dark:to-transparent p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-lime-500 to-lime-600 text-white shadow-md">
                <Sun className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  {inCategory && category ? category.name : (
                    <>
                      <span className="pozytywne-gradient-text">Pozytywne</span> — dobre wiadomości
                    </>
                  )}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {inCategory && category
                    ? `Pozytywne wiadomości z kategorii ${category.name.toLowerCase()}.`
                    : "Publikujemy tylko to, co dodaje energii. 60 sekund. Lepszy dzień."}
                </p>
                {!inCategory && todaysPosts.length > 0 && (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-lime-500/15 px-3 py-1 text-xs font-semibold text-lime-700 dark:text-lime-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Dziś w Pozytywnych: {todaysPosts.length}{" "}
                    {todaysPosts.length === 1 ? "dobra wiadomość" : "dobrych wiadomości"}
                  </p>
                )}
              </div>
            </div>

            {categories.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  to="/pozytywne"
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    !inCategory
                      ? "border-lime-500 bg-lime-500 text-white"
                      : "border-border bg-card text-muted-foreground hover:border-lime-500 hover:text-lime-700 dark:hover:text-lime-300"
                  }`}
                >
                  Wszystkie
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/pozytywne/kategoria/${c.slug}`}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      categorySlug === c.slug
                        ? "border-lime-500 bg-lime-500 text-white"
                        : "border-border bg-card text-muted-foreground hover:border-lime-500 hover:text-lime-700 dark:hover:text-lime-300"
                    }`}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Top Banner */}
          {topBanner && (
            <SponsorBanner
              title={topBanner.title}
              description={topBanner.description}
              ctaText={topBanner.cta_text}
              ctaUrl={topBanner.click_tag}
              imageDesktopUrl={topBanner.image_desktop_url || undefined}
              imageMobileUrl={topBanner.image_mobile_url || undefined}
              impressionTag={topBanner.impression_tag || undefined}
              bannerId={topBanner.id}
              className="mb-8"
            />
          )}

          {/* Middle Banner — from database or placeholder */}
          {middleBanner ? (
            <SponsorBanner
              title={middleBanner.title}
              description={middleBanner.description}
              ctaText={middleBanner.cta_text}
              ctaUrl={middleBanner.click_tag}
              imageDesktopUrl={middleBanner.image_desktop_url || undefined}
              imageMobileUrl={middleBanner.image_mobile_url || undefined}
              impressionTag={middleBanner.impression_tag || undefined}
              bannerId={middleBanner.id}
              className="mb-8"
            />
          ) : (
            <SponsorBanner
              title="Partner Pozytywnych"
              description="To miejsce może być Twoje — wesprzyj dobre wiadomości"
              ctaText="Zostań partnerem"
              ctaUrl="mailto:reklama@szortsy.pl"
              isPlaceholder={true}
              className="mb-8"
            />
          )}


          {isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[340px] rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && posts.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
              Zbieramy dobre wiadomości. Wróć za chwilę.
            </div>
          )}

          {!isLoading && posts.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <NewsCard
                  key={post.id}
                  id={post.id}
                  slug={post.slug}
                  title={post.title}
                  excerpt={post.excerpt}
                  content={post.content}
                  categorySlug={post.positive_category?.slug}
                  sportCategory={null}
                  publishedAt={post.published_at}
                  sourceUrl={post.source_url}
                  imageUrl={post.image_url || undefined}
                  isSponsored={post.is_sponsored}
                  tags={post.tags || []}
                  author={post.author}
                  delay={index === 0 ? 0 : index * 80}
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  disableAnimation={index === 0}
                />
              ))}
            </div>
          )}

          {posts.length > 0 && (
            <div className="text-center mt-10">
              <Link
                to="/pozytywne/archiwum"
                className="inline-flex items-center gap-2 text-lime-700 hover:text-lime-800 dark:text-lime-300 dark:hover:text-lime-200 hover:underline transition-colors"
              >
                <Archive className="h-4 w-4" />
                Zobacz starsze pozytywne wiadomości
              </Link>
            </div>
          )}

          {/* Bottom Banner */}
          {bottomBanner && (
            <SponsorBanner
              title={bottomBanner.title}
              description={bottomBanner.description}
              ctaText={bottomBanner.cta_text}
              ctaUrl={bottomBanner.click_tag}
              imageDesktopUrl={bottomBanner.image_desktop_url || undefined}
              imageMobileUrl={bottomBanner.image_mobile_url || undefined}
              impressionTag={bottomBanner.impression_tag || undefined}
              bannerId={bottomBanner.id}
              className="mt-10"
            />
          )}
        </div>
      </main>


      <PozytywneFooter />
    </div>
  );
};

export default PozytywneHome;
