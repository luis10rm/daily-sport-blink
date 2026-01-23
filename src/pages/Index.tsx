import { Header } from "@/components/Header";
import { NewsCard } from "@/components/NewsCard";
import { NewsOfTheDay } from "@/components/NewsOfTheDay";
import { SponsorBanner } from "@/components/SponsorBanner";
import { ScrollProgress } from "@/components/ScrollProgress";
import { StoriesRow } from "@/components/StoriesRow";
import { usePostsFeed, useNewsOfTheDay } from "@/hooks/usePosts";
import { useActiveBanner } from "@/hooks/useBanners";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { data: posts = [], isLoading: postsLoading } = usePostsFeed();
  const { data: newsOfTheDay, isLoading: newsLoading } = useNewsOfTheDay();
  const { data: topBanner } = useActiveBanner("home_top");
  const { data: middleBanner } = useActiveBanner("home_middle");
  const { data: bottomBanner } = useActiveBanner("home_bottom");

  return (
    <div className="min-h-screen bg-background">
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
            imageDesktopUrl={topBanner.image_desktop_url}
            imageMobileUrl={topBanner.image_mobile_url}
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

        {/* Sponsor Banner - from database or fallback */}
        {middleBanner ? (
          <SponsorBanner
            title={middleBanner.title}
            description={middleBanner.description}
            ctaText={middleBanner.cta_text}
            ctaUrl={middleBanner.click_tag}
            imageDesktopUrl={middleBanner.image_desktop_url}
            imageMobileUrl={middleBanner.image_mobile_url}
            impressionTag={middleBanner.impression_tag || undefined}
            className="mb-10"
          />
        ) : (
          <SponsorBanner
            title="Twoja reklama może być tutaj"
            description="Dotrzyj do tysięcy fanów sportu każdego dnia. Skontaktuj się z nami!"
            ctaText="Zostań partnerem"
            ctaUrl="mailto:reklama@szortsy.pl"
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
            imageDesktopUrl={bottomBanner.image_desktop_url}
            imageMobileUrl={bottomBanner.image_mobile_url}
            impressionTag={bottomBanner.impression_tag || undefined}
            className="mt-10"
          />
        )}
      </main>

      {/* Scroll Progress Indicator */}
      <ScrollProgress totalItems={(posts?.length || 0) + (newsOfTheDay ? 1 : 0)} />

      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © 2024 Szortsy. Wszystkie prawa zastrzeżone.
        </div>
      </footer>
    </div>
  );
};

export default Index;
