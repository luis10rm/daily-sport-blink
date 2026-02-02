import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PatronBar } from "@/components/PatronBar";
import { NewsCard } from "@/components/NewsCard";
import { useSEOMeta } from "@/hooks/useSEOMeta";
import { useArchivedPosts } from "@/hooks/usePosts";
import { useSportCategories } from "@/hooks/useSportCategories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Archive as ArchiveIcon } from "lucide-react";
import { useWallpaperContext } from "@/contexts/WallpaperContext";
import { cn } from "@/lib/utils";

const Archive = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // SEO meta tags
  useSEOMeta({
    title: "Archiwum",
    description: "Przeglądaj archiwalne artykuły sportowe starsze niż 7 dni. Piłka nożna, tenis, F1, MMA i więcej na Szortsy.",
    canonical: "https://szortsy.pl/archiwum",
  });
  
  const { data: posts = [], isLoading } = useArchivedPosts({
    categoryId: categoryFilter === "all" ? undefined : categoryFilter,
  });
  const { data: categories = [] } = useSportCategories();
  const { isTakeoverActive } = useWallpaperContext();

  return (
    <div
      className={cn(
        "min-h-screen relative z-10",
        !isTakeoverActive && "bg-background"
      )}
    >
      <Header />
      <PatronBar />

      <main className="container py-6 md:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ArchiveIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                Archiwum
              </h1>
              <p className="text-sm text-muted-foreground">
                Artykuły starsze niż 7 dni
              </p>
            </div>
          </div>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Wszystkie kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie kategorie</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[350px] rounded-xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <ArchiveIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              Brak archiwalnych artykułów
            </p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              Artykuły starsze niż 7 dni pojawią się tutaj
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
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
                delay={index * 50}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Archive;
