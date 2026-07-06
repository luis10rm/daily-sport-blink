import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PatronBar } from "@/components/PatronBar";
import { useSEOMeta } from "@/hooks/useSEOMeta";
import { usePublicAuthors } from "@/hooks/useAuthors";
import { AuthorProfileCard } from "@/components/AuthorProfileCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Fetch posts count for each author
const useAuthorsPostsCounts = (authorIds: string[]) => {
  return useQuery({
    queryKey: ["authors-posts-counts", authorIds],
    queryFn: async () => {
      if (authorIds.length === 0) return {};

      const counts: Record<string, number> = {};
      
      for (const authorId of authorIds) {
        const { count, error } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("author_id", authorId)
          .eq("is_hidden" as never, false as never)
          .lte("published_at", new Date().toISOString());

        if (!error && count !== null) {
          counts[authorId] = count;
        }
      }

      return counts;
    },
    enabled: authorIds.length > 0,
  });
};

const AuthorsPage = () => {
  useSEOMeta({ title: "Nasi autorzy", description: "Poznaj zespół twórców Szortsy, którzy dostarczają Ci najświeższe wiadomości sportowe każdego dnia." });
  
  const { data: authors, isLoading } = usePublicAuthors();
  const authorIds = authors?.map((a) => a.id) || [];
  const { data: postsCounts } = useAuthorsPostsCounts(authorIds);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PatronBar />
      
      <main className="container py-8 md:py-12">
        {/* Page Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Nasi Autorzy
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Poznaj zespół twórców, którzy dostarczają Ci najświeższe wiadomości sportowe każdego dnia.
          </p>
        </div>

        {/* Authors Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <div className="flex flex-col items-center gap-2 px-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : authors && authors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {authors.map((author) => (
              <AuthorProfileCard
                key={author.id}
                author={author}
                postsCount={postsCounts?.[author.id]}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Brak publicznych autorów
            </h2>
            <p className="text-muted-foreground">
              Aktualnie nie ma żadnych publicznych profili autorów do wyświetlenia.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AuthorsPage;
