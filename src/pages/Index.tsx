import { Link } from "react-router-dom";
import { Archive } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PatronBar } from "@/components/PatronBar";
import { HomeNewsFeed } from "@/components/HomeNewsFeed";
import { HomeDayBlock } from "@/components/HomeDayBlock";
import { SponsorBanner } from "@/components/SponsorBanner";
import { StoriesRow } from "@/components/StoriesRow";
import { WorldCupHomeBanner } from "@/components/WorldCupHomeBanner";
import { CrossChannelStrip } from "@/components/CrossChannelStrip";
import { TodaysMatchesBanner } from "@/components/TodaysMatchesBanner";
import { MatchOfTheDay } from "@/components/MatchOfTheDay";
import { MultiSEO, getWebsiteSEO, getRichItemListSEO } from "@/components/SEO";
import { useSEOMeta } from "@/hooks/useSEOMeta";
import { usePostsFeed, useNewsOfTheDay, useTodaysPosts } from "@/hooks/usePosts";
import { useActiveBannerForDevice } from "@/hooks/useBanners";
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
  const { data: todaysPosts = [], isLoading: todaysLoading } = useTodaysPosts();
  const { data: topBanner } = useActiveBannerForDevice("home_top", device);
  const { data: middleBanner } = useActiveBannerForDevice("home_middle", device);
  const { data: bottomBanner } = useActiveBannerForDevice("home_bottom", device);

  // SEO schemas - Website + ItemList with full NewsArticle data
  const websiteSEO = getWebsiteSEO();
  const itemListSEO = getRichItemListSEO("Najnowsze wiadomości sportowe", posts);

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

        {/* World Cup 2026 Banner */}
        <WorldCupHomeBanner className="mb-6" />

        <HomeDayBlock posts={posts} todaysPosts={todaysPosts} featured={newsOfTheDay}
          isLoading={newsLoading || postsLoading || todaysLoading} className="mb-8" />

        {isMobile && topBannerBlock}


        {/* World Cup Match of the Day (only in tournament mode) */}
        <MatchOfTheDay />

        {/* Sponsor Banner - from database */}
        {middleBanner && (
          <SponsorBanner
            title={middleBanner.title}
            description={middleBanner.description}
            ctaText={middleBanner.cta_text}
            ctaUrl={middleBanner.click_tag}
            imageDesktopUrl={middleBanner.image_desktop_url || undefined}
            imageMobileUrl={middleBanner.image_mobile_url || undefined}
            impressionTag={middleBanner.impression_tag || undefined}
            bannerId={middleBanner.id}
            className="mb-10 mt-10"
          />
        )}

        <HomeNewsFeed posts={posts} isLoading={postsLoading} lastTodayRef={lastTodayRef} />

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

        {/* Latest from Tech + Pozytywne, below the news list */}
        <CrossChannelStrip className="mt-10" />

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
