import { useRef } from "react";
import { Header } from "@/components/Header";
import { NewsCard } from "@/components/NewsCard";
import { NewsOfTheDay } from "@/components/NewsOfTheDay";
import { SponsorBanner } from "@/components/SponsorBanner";
import { ScrollProgress } from "@/components/ScrollProgress";
import { StoriesRow } from "@/components/StoriesRow";
import { usePostsFeed, useNewsOfTheDay, useTodaysPosts } from "@/hooks/usePosts";
import { useActiveBannerForDevice } from "@/hooks/useBanners";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWallpaperContext } from "@/contexts/WallpaperContext";
import { cn } from "@/lib/utils";

const Index = () => {
  const lastTodayRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  const device = isMobile ? "mobile" : "desktop";
  
  const { data: posts = [], isLoading: postsLoading } = usePostsFeed();
  const { data: newsOfTheDay, isLoading: newsLoading } = useNewsOfTheDay();
  const { data: todaysPosts = [] } = useTodaysPosts();
  const { data: topBanner } = useActiveBannerForDevice("home_top", device);
  const { data: middleBanner } = useActiveBannerForDevice("home_middle", device);
  const { data: bottomBanner } = useActiveBannerForDevice("home_bottom", device);

  // Check if post is from today
  const isToday = (dateString: string) => {
    const postDate = new Date(dateString);
    const today = new Date();
    return postDate.toDateString() === today.toDateString();
  };

  // Find index of last today's post
  const lastTodayIndex = posts.reduce(
    (lastIdx, post, idx) => (isToday(post.published_at) ? idx : lastIdx),
    -1
  );

  const { isTakeoverActive } = useWallpaperContext();

  return (
    <div className={cn(
      "min-h-screen relative z-10",
      !isTakeoverActive && "bg-background"
    )}>
      <Header />
      
      <main className="container py-6 md:py-10">
        {/* Stories Row */}
        <section className="mb-8">
          <StoriesRow />
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
            className="mb-8"
          />
        )}

        <section className="mb-10">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Dzisiejsze wiadomości
          </h1>
          <p className="mt-2 text-muted-foreground">
            Najważniejsze wydarzenia sportowe z ostatnich 24 godzin
          </p>
        </section>

        {/* News of the Day */}
        {newsLoading ? (
          <div className="mb-10">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        ) : newsOfTheDay && (
          <NewsOfTheDay 
            post={{
              id: newsOfTheDay.id,
              title: newsOfTheDay.title,
              excerpt: newsOfTheDay.excerpt,
              category: newsOfTheDay.category,
              publishedAt: newsOfTheDay.published_at,
              sourceUrl: newsOfTheDay.source_url,
              imageUrl: newsOfTheDay.image_url || undefined,
              isNewsOfTheDay: newsOfTheDay.is_news_of_day,
              tags: newsOfTheDay.tags || [],
            }} 
            className="mb-10" 
          />
        )}

        {/* Sponsor Banner - from database or placeholder */}
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
            className="mb-10"
          />
        ) : (
          <SponsorBanner
            title="Partner Szortsy"
            description="To miejsce może być Twoje"
            ctaText="Zostań partnerem"
            ctaUrl="mailto:reklama@szortsy.pl"
            isPlaceholder={true}
            className="mb-10"
          />
        )}

        {postsLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[350px] rounded-xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Brak artykułów do wyświetlenia
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <NewsCard
                key={post.id}
                ref={index === lastTodayIndex ? lastTodayRef : undefined}
                title={post.title}
                excerpt={post.excerpt}
                category={post.category}
                publishedAt={post.published_at}
                sourceUrl={post.source_url}
                imageUrl={post.image_url || undefined}
                isSponsored={post.is_sponsored}
                tags={post.tags || []}
                delay={index * 100}
              />
            ))}
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
            className="mt-10"
          />
        )}
      </main>

      {/* Scroll Progress Indicator */}
      <ScrollProgress todaysCount={todaysPosts.length} lastTodayRef={lastTodayRef} />

      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © 2024 Szortsy. Wszystkie prawa zastrzeżone.
        </div>
      </footer>
    </div>
  );
};

export default Index;
