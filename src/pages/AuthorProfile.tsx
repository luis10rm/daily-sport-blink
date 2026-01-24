import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { AuthorHero } from "@/components/AuthorHero";
import { AuthorStats } from "@/components/AuthorStats";
import { NewsCard } from "@/components/NewsCard";
import { useAuthor, useAuthorPosts, useAuthorStats } from "@/hooks/useAuthors";
import { Skeleton } from "@/components/ui/skeleton";
import { FileX } from "lucide-react";

const AuthorProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: author, isLoading: authorLoading } = useAuthor(slug || "");
  const { data: posts, isLoading: postsLoading } = useAuthorPosts(author?.id || "");
  const { data: stats, isLoading: statsLoading } = useAuthorStats(author?.id || "");

  if (authorLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="relative">
          <Skeleton className="h-48 w-full md:h-72" />
          <div className="mx-auto max-w-4xl px-4">
            <Skeleton className="mx-auto -mt-16 h-32 w-32 rounded-full md:-mt-20 md:h-40 md:w-40" />
            <div className="mt-6 space-y-4 text-center">
              <Skeleton className="mx-auto h-10 w-48" />
              <Skeleton className="mx-auto h-6 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
          <FileX className="mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Autor nie znaleziony
          </h1>
          <p className="mt-2 text-muted-foreground">
            Nie udało się znaleźć profilu autora.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero section */}
      <AuthorHero author={author} />

      {/* Stats */}
      {statsLoading ? (
        <div className="mx-auto max-w-2xl px-4 py-8">
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : stats ? (
        <AuthorStats
          postsCount={stats.postsCount}
          topCategory={stats.topCategory}
          firstPostDate={stats.firstPostDate}
        />
      ) : null}

      {/* Author's posts */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 font-heading text-xl font-bold text-foreground md:text-2xl">
          Artykuły autora
        </h2>

        {postsLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <NewsCard
                key={post.id}
                title={post.title}
                excerpt={post.excerpt}
                categorySlug={post.sport_category?.slug}
                sportCategory={post.sport_category as any}
                publishedAt={post.published_at}
                sourceUrl={post.source_url}
                imageUrl={post.image_url || undefined}
                tags={post.tags || undefined}
                delay={index * 100}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-muted/50 py-12 text-center">
            <p className="text-muted-foreground">
              Ten autor nie opublikował jeszcze żadnych artykułów.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default AuthorProfile;
