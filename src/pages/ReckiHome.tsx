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

const ReckiHome = () => {
  const { data: reviews = [], isLoading } = usePublishedReviews();
  const { data: categories = [] } = useReviewCategories();
  const isMobile = useIsMobile();
  const device = isMobile ? "mobile" : "desktop";
  const { data: topBanner } = useActiveBannerForDevice("recki_home_top" as any, device);
  const { data: middleBanner } = useActiveBannerForDevice("recki_home_middle" as any, device);
  const { data: bottomBanner } = useActiveBannerForDevice("recki_home_bottom" as any, device);

  useEffect(() => {
    document.documentElement.classList.add("mode-recki");
    return () => document.documentElement.classList.remove("mode-recki");
  }, []);

  const hero = reviews[0];
  const secondary = reviews.slice(1, 4);
  const rest = reviews.slice(4);

  return (
    <div className="min-h-screen flex flex-col">
      <ReckiHeader />

      <main className="flex-1">
        <div className="container py-6">
          <section className="mb-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  <span className="recki-gradient-text">Recki</span> — recenzje technologii
                </h1>
                <p className="mt-1 text-muted-foreground">
                  Smartfony, audio, gaming i smart home. Krótko, konkretnie, z oceną.
                </p>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/recki/kategoria/${c.slug}`}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {topBanner && (
            <div className="mb-6">
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
          )}

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[16/10] rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && reviews.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
              Jeszcze nie ma opublikowanych recenzji. Zajrzyj wkrótce!
            </div>
          )}

          {hero && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              <ReviewCard review={hero} variant="hero" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {secondary.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
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
              <h2 className="text-xl font-bold mb-4">Wszystkie recenzje</h2>
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

      <ReckiFooter />
    </div>
  );
};

export default ReckiHome;
