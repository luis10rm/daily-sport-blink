import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { supabase as sb } from "@/integrations/supabase/client";
import { PozytywneHeader } from "@/components/pozytywne/PozytywneHeader";
import { PozytywneFooter } from "@/components/pozytywne/PozytywneFooter";
import { NewsCard } from "@/components/NewsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Archive as ArchiveIcon, Sun } from "lucide-react";
import { useSEOMeta } from "@/hooks/useSEOMeta";
import type { PositivePost } from "@/hooks/usePositivePosts";

const supabase = sb as any;

const usePositiveArchive = () => {
  return useQuery({
    queryKey: ["positive-posts", "archive"],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data, error } = await supabase
        .from("posts")
        .select(
          "*, positive_category:positive_categories!posts_positive_category_id_fkey(id, slug, name, icon_name, icon_url, bg_color), author:authors(id, display_name, avatar_url, slug, role_title)",
        )
        .eq("channel", "positive")
        .eq("is_hidden", false)
        .lt("published_at", sevenDaysAgo)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data as unknown) as PositivePost[];
    },
  });
};

const PozytywneArchive = () => {
  const { data: posts = [], isLoading } = usePositiveArchive();

  useEffect(() => {
    document.documentElement.classList.add("mode-pozytywne");
    return () => document.documentElement.classList.remove("mode-pozytywne");
  }, []);

  useSEOMeta({
    title: "Archiwum – Pozytywne wiadomości | Szortsy",
    description: "Archiwum pozytywnych wiadomości ze Szortsy. Wszystko, co dobre, dłużej niż tydzień.",
    canonical: "https://szortsy.pl/pozytywne/archiwum",
    robots: "noindex, follow",
  });

  return (
    <div className="min-h-screen flex flex-col">
      <PozytywneHeader />
      <main className="container flex-1 py-6 md:py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-lime-500 to-lime-600 text-white shadow-sm">
            <ArchiveIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Archiwum Pozytywnych</h1>
            <p className="text-sm text-muted-foreground">Dobre wiadomości starsze niż 7 dni</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[340px] rounded-xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <Sun className="h-12 w-12 text-lime-500/60 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Archiwum jest jeszcze puste.</p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              Pozytywne wiadomości pojawią się tu po 7 dniach od publikacji.
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
                categorySlug={post.positive_category?.slug}
                sportCategory={null}
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
      <PozytywneFooter />
    </div>
  );
};

export default PozytywneArchive;
