import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ReckiHeader } from "@/components/recki/ReckiHeader";
import { ReckiFooter } from "@/components/recki/ReckiFooter";
import { ReviewCard } from "@/components/recki/ReviewCard";
import { usePublishedReviews, useReviewCategories } from "@/hooks/useReviews";
import { Skeleton } from "@/components/ui/skeleton";

const ReckiCategory = () => {
  const { slug } = useParams();
  const { data: reviews = [], isLoading } = usePublishedReviews(slug);
  const { data: categories = [] } = useReviewCategories();
  const category = categories.find((c) => c.slug === slug);

  useEffect(() => {
    document.documentElement.classList.add("mode-recki");
    return () => document.documentElement.classList.remove("mode-recki");
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <ReckiHeader />
      <main className="flex-1 container py-6">
        <nav className="mb-3 text-sm text-muted-foreground">
          <Link to="/tech" className="hover:text-foreground">Tech</Link> · {category?.name ?? slug}
        </nav>
        <h1 className="text-3xl font-bold mb-6">{category?.name ?? "Kategoria"}</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[16/10] rounded-xl" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-muted-foreground">Brak wpisów w tej kategorii.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}
      </main>
      <ReckiFooter />
    </div>
  );
};

export default ReckiCategory;
