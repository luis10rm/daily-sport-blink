import { useEffect } from "react";
import { ReckiHeader } from "@/components/recki/ReckiHeader";
import { ReckiFooter } from "@/components/recki/ReckiFooter";
import { ReviewCard } from "@/components/recki/ReviewCard";
import { usePublishedReviews, useReviewCategories } from "@/hooks/useReviews";
import { useActiveBannerForDevice } from "@/hooks/useBanners";
import { useIsMobile } from "@/hooks/use-mobile";
import { SponsorBanner } from "@/components/SponsorBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useSEOMeta } from "@/hooks/useSEOMeta";

const ReckiHome = () => {
  const { data: reviews = [], isLoading } = usePublishedReviews();
  const { data: categories = [] } = useReviewCategories();
  const isMobile = useIsMobile();
  const device = isMobile ? "mobile" : "desktop";
  const { data: topBanner } = useActiveBannerForDevice("recki_home_top" as any, device);
  const { data: middleBanner } = useActiveBannerForDevice("recki_home_middle" as any, device);
  const { data: bottomBanner } = useActiveBannerForDevice("recki_home_bottom" as any, device);
  const { data: stickyMobileBanner } = useActiveBannerForDevice("recki_sticky_mobile" as any, "mobile");

  useEffect(() => {
    document.documentElement.classList.add("mode-recki");
    return () => document.documentElement.classList.remove("mode-recki");
  }, []);

  useSEOMeta({
    title: "Tech — recenzje sprzętu i newsy technologiczne",
    description: "Krótkie, konkretne recenzje smartfonów, audio, gamingu, smart home i AI. Bez lania wody.",
    canonical: "https://szortsy.pl/tech",
  });

  const useHeroLayout = reviews.length >= 4;
  const topicOfDay = reviews.find((r) => r.is_topic_of_day) ?? null;
  const hero = useHeroLayout ? topicOfDay ?? reviews[0] : null;
  const withoutHero = hero ? reviews.filter((r) => r.id !== hero.id) : reviews;
  const secondary = useHeroLayout ? withoutHero.slice(0, 3) : [];
  const rest = useHeroLayout ? withoutHero.slice(3) : reviews;

  // On mobile the 300x250 slot sits under the "news of the day" hero;
  // on desktop it stays above it. Rendered once to avoid double impressions.
  const topBannerBlock = topBanner ? (
    <div className={isMobile ? "mb-8" : "mb-6"}>
      <SponsorBanner
        bannerId={topBanner.id}
        title={topBanner.title}
        description={topBanner.description ?? undefined}
        ctaText={topBanner.cta_text}
        ctaUrl={topBanner.click_tag}
        imageDesktopUrl={topBanner.image_desktop_url ?? undefined}
        imageMobileUrl={topBanner.image_mobile_url ?? undefined}
        impressionTag={topBanner.impression_tag ?? undefined}
      />
    </div>
  ) : null;


  return (
    <div className="min-h-screen flex flex-col">
      <ReckiHeader />

      <main className="flex-1">
        <div className="container py-6">
          <section className="mb-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  <span className="recki-gradient-text">Tech</span> — technologie krótko i konkretnie
                </h1>
                <p className="mt-1 text-muted-foreground">
                  Recenzje, newsy i analizy: smartfony, audio, gaming, smart home, AI.
                </p>
              </div>
              {!isLoading && reviews.length > 0 && (
                <span className="hidden sm:inline-flex shrink-0 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                  {reviews.length} {reviews.length === 1 ? "artykuł" : reviews.length < 5 ? "artykuły" : "artykułów"}
                </span>
              )}
            </div>


            {categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/tech/kategoria/${c.slug}`}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {topBannerBlock && !isMobile && topBannerBlock}


          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[16/10] rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && reviews.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
              Jeszcze nic nie opublikowaliśmy w Tech. Zajrzyj wkrótce!
            </div>
          )}

          {hero && (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              <div className="lg:col-span-2">
                <ReviewCard review={hero} variant="hero" />
              </div>
              <aside className="lg:col-span-1 grid grid-cols-1 gap-3">
                {secondary.map((r) => (
                  <ReviewCard key={r.id} review={r} variant="mini" />
                ))}
              </aside>
            </section>
          )}


          {middleBanner && (
            <div className="mb-8">
              <SponsorBanner
                bannerId={middleBanner.id}
                title={middleBanner.title}
                description={middleBanner.description ?? undefined}
                ctaText={middleBanner.cta_text}
                ctaUrl={middleBanner.click_tag}
                imageDesktopUrl={middleBanner.image_desktop_url ?? undefined}
                imageMobileUrl={middleBanner.image_mobile_url ?? undefined}
                impressionTag={middleBanner.impression_tag ?? undefined}
              />
            </div>
          )}

          {rest.length > 0 && (
            <section>
              {useHeroLayout && <h2 className="text-xl font-bold mb-4">Wszystko z Tech</h2>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rest.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            </section>
          )}


          {bottomBanner && (
            <div className="mt-8">
              <SponsorBanner
                bannerId={bottomBanner.id}
                title={bottomBanner.title}
                description={bottomBanner.description ?? undefined}
                ctaText={bottomBanner.cta_text}
                ctaUrl={bottomBanner.click_tag}
                imageDesktopUrl={bottomBanner.image_desktop_url ?? undefined}
                imageMobileUrl={bottomBanner.image_mobile_url ?? undefined}
                impressionTag={bottomBanner.impression_tag ?? undefined}
              />
            </div>
          )}
        </div>
      </main>

      {stickyMobileBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur sm:hidden">
          <div className="container py-2">
            <SponsorBanner
              bannerId={stickyMobileBanner.id}
              title={stickyMobileBanner.title}
              description={stickyMobileBanner.description ?? undefined}
              ctaText={stickyMobileBanner.cta_text}
              ctaUrl={stickyMobileBanner.click_tag}
              imageDesktopUrl={stickyMobileBanner.image_desktop_url ?? undefined}
              imageMobileUrl={stickyMobileBanner.image_mobile_url ?? undefined}
              impressionTag={stickyMobileBanner.impression_tag ?? undefined}
            />
          </div>
        </div>
      )}

      <ReckiFooter />

    </div>
  );
};

export default ReckiHome;
