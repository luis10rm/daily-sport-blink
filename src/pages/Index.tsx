import { Header } from "@/components/Header";
import { NewsCard } from "@/components/NewsCard";
import { NewsOfTheDay } from "@/components/NewsOfTheDay";
import { SponsorBanner } from "@/components/SponsorBanner";
import { ScrollProgress } from "@/components/ScrollProgress";
import { StoriesRow } from "@/components/StoriesRow";
import { getPostsWithSponsored, getNewsOfTheDay } from "@/data/samplePosts";

const Index = () => {
  const posts = getPostsWithSponsored();
  const newsOfTheDay = getNewsOfTheDay();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 md:py-10">
        {/* Stories Row */}
        <section className="mb-8">
          <StoriesRow />
        </section>

        <section className="mb-10">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Dzisiejsze wiadomości
          </h1>
          <p className="mt-2 text-muted-foreground">
            Najważniejsze wydarzenia sportowe z ostatnich 24 godzin
          </p>
        </section>

        {/* News of the Day */}
        {newsOfTheDay && (
          <NewsOfTheDay post={newsOfTheDay} className="mb-10" />
        )}

        {/* Sponsor Banner */}
        <SponsorBanner
          title="Twoja reklama może być tutaj"
          description="Dotrzyj do tysięcy fanów sportu każdego dnia. Skontaktuj się z nami!"
          ctaText="Zostań partnerem"
          ctaUrl="mailto:reklama@szortsy.pl"
          className="mb-10"
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <NewsCard
              key={post.id}
              title={post.title}
              excerpt={post.excerpt}
              category={post.category}
              publishedAt={post.publishedAt}
              sourceUrl={post.sourceUrl}
              imageUrl={post.imageUrl}
              isSponsored={post.isSponsored}
              tags={post.tags}
              delay={index * 100}
            />
          ))}
        </div>
      </main>

      {/* Scroll Progress Indicator */}
      <ScrollProgress totalItems={posts.length + (newsOfTheDay ? 1 : 0)} />

      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © 2024 Szortsy. Wszystkie prawa zastrzeżone.
        </div>
      </footer>
    </div>
  );
};

export default Index;
