import { useRef } from "react";
import { Link } from "react-router-dom";
import { Archive } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PatronBar } from "@/components/PatronBar";
import { NewsCard } from "@/components/NewsCard";
import { NewsOfTheDay } from "@/components/NewsOfTheDay";
import { SponsorBanner } from "@/components/SponsorBanner";
import { ScrollProgress } from "@/components/ScrollProgress";
import { StoriesRow } from "@/components/StoriesRow";
import { TodaysNewsBanner } from "@/components/TodaysNewsBanner";
import { FeedbackBox } from "@/components/FeedbackBox";
import { WorldCupHomeBanner } from "@/components/WorldCupHomeBanner";
import { CrossChannelStrip } from "@/components/CrossChannelStrip";
import { TodaysMatchesBanner } from "@/components/TodaysMatchesBanner";
import { MatchOfTheDay } from "@/components/MatchOfTheDay";
import { MultiSEO, getWebsiteSEO, getRichItemListSEO } from "@/components/SEO";
import { useSEOMeta } from "@/hooks/useSEOMeta";
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
  
  // SEO meta tags
  useSEOMeta({
    canonical: "https://szortsy.pl",
  });
  const { data: posts = [], isLoading: postsLoading } = usePostsFeed();
  const { data: newsOfTheDay, isLoading: newsLoading } = useNewsOfTheDay();
  const { data: todaysPosts = [] } = useTodaysPosts();
  const { data: topBanner } = useActiveBannerForDevice("home_top", device);
  const { data: middleBanner } = useActiveBannerForDevice("home_middle", device);
  const { data: bottomBanner } = useActiveBannerForDevice("home_bottom", device);

  // SEO schemas - Website + ItemList with full NewsArticle data
  const websiteSEO = getWebsiteSEO();
  const itemListSEO = getRichItemListSEO("Najnowsze wiadomości sportowe", posts);

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

  // Rendered once: above the fold on desktop, under News of the Day on mobile.
  const topBannerBlock = topBanner ? (
    <SponsorBanner
      bannerId={topBanner.id}
      title={topBanner.title}
      description={topBanner.description}
      ctaText={topBanner.cta_text}
      ctaUrl={topBanner.click_tag}
      imageDesktopUrl={topBanner.image_desktop_url || undefined}
      imageMobileUrl={topBanner.image_mobile_url || undefined}
      impressionTag={topBanner.impression_tag || undefined}
      className="mb-8"
    />
  ) : null;


  return (
    <div className={cn(
      "min-h-screen relative z-10",
      !isTakeoverActive && "bg-background"
    )}>
      <MultiSEO schemas={[websiteSEO, itemListSEO]} />
      <Header />
      <PatronBar />
      
      <main id="main-content" className="container py-6 md:py-10">
        {/* Stories Row */}
        <section className="mb-8">
          <StoriesRow />
        </section>

        {/* Top Banner — on desktop above the fold, on mobile under News of the Day */}
        {!isMobile && topBannerBlock}


        {/* Today's World Cup matches (only in tournament mode) */}
        <TodaysMatchesBanner />

        {/* Todays News Banner */}
        <TodaysNewsBanner count={todaysPosts.length} isLoading={postsLoading} />

        {/* World Cup 2026 Banner */}
        <WorldCupHomeBanner className="mb-6" />

        {/* News of the Day */}
        {newsLoading ? (
          <div className="mb-10">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        ) : newsOfTheDay && (
          <NewsOfTheDay 
            post={newsOfTheDay} 
            className="mb-8" 
          />
        )}

        {isMobile && topBannerBlock}


        {/* Cross-channel strip: latest from Tech + Pozytywne */}
        <CrossChannelStrip className="mb-10" />

        {/* World Cup Match of the Day (only in tournament mode) */}
        <MatchOfTheDay />


        {/* Feedback Box */}
        <FeedbackBox className="mb-10" />

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
                id={post.id}
                slug={post.slug}
                title={post.title}
                excerpt={post.excerpt}
                content={post.content}
                categorySlug={post.sport_category?.slug}
                sportCategory={post.sport_category}
                publishedAt={post.published_at}
                sourceUrl={post.source_url}
                imageUrl={post.image_url || undefined}
                isSponsored={post.is_sponsored}
                tags={post.tags || []}
                author={post.author}
                delay={index === 0 ? 0 : index * 100}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                disableAnimation={index === 0}
              />
            ))}
          </div>
        )}

        {/* Link to Archive */}
        {posts.length > 0 && (
          <div className="text-center mt-10">
            <Link
              to="/archiwum"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 hover:underline transition-colors"
            >
              <Archive className="h-4 w-4" />
              Zobacz starsze artykuły w Archiwum
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
            className="mt-10"
          />
        )}
      </main>

      {/* Scroll Progress Indicator */}
      <ScrollProgress todaysCount={todaysPosts.length} lastTodayRef={lastTodayRef} />

      <Footer />
    </div>
  );
};

export default Index;
