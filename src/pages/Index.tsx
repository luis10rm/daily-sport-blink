import { Header } from "@/components/Header";
import { NewsCard } from "@/components/NewsCard";
import { SponsorBanner } from "@/components/SponsorBanner";
import { getPostsWithSponsored } from "@/data/samplePosts";

const Index = () => {
  const posts = getPostsWithSponsored();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 md:py-12">
        <section className="mb-10">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Dzisiejsze wiadomości
          </h1>
          <p className="mt-2 text-muted-foreground">
            Najważniejsze wydarzenia sportowe z ostatnich 24 godzin
          </p>
        </section>

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
              delay={index * 100}
            />
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © 2024 Szortsy. Wszystkie prawa zastrzeżone.
        </div>
      </footer>
    </div>
  );
};

export default Index;
