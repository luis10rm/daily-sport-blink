import { useState } from "react";
import { NewsCard } from "@/components/NewsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useWorldCupPosts } from "@/hooks/useWorldCupPosts";

const PAGE_SIZE = 12;

export const WorldCupNewsAggregator = () => {
  const { data: posts = [], isLoading } = useWorldCupPosts();
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (isLoading) {
    return (
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold text-foreground">Nasze artykuły o MŚ 2026</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[350px] rounded-xl" />)}
        </div>
      </section>
    );
  }

  if (!posts.length) {
    return (
      <section className="mb-12 rounded-xl border border-border bg-card/40 p-6">
        <h2 className="mb-1 text-lg font-bold text-foreground">Nasze artykuły o MŚ 2026</h2>
        <p className="text-sm text-muted-foreground">
          Pierwsze artykuły o mundialu pojawią się wkrótce. Wróć za chwilę.
        </p>
      </section>
    );
  }

  const shown = posts.slice(0, visible);

  return (
    <section className="mb-12">
      <h2 className="mb-4 text-xl font-bold text-foreground">
        Nasze artykuły o MŚ 2026 <span className="text-sm font-normal text-muted-foreground">({posts.length})</span>
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((post, index) => (
          <NewsCard
            key={post.id}
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
            delay={index * 60}
            loading="lazy"
          />
        ))}
      </div>
      {visible < posts.length && (
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            Pokaż więcej ({posts.length - visible})
          </Button>
        </div>
      )}
    </section>
  );
};
