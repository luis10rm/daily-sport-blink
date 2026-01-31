import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PatronBar } from "@/components/PatronBar";
import { NewsCard } from "@/components/NewsCard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { SEO, getRichItemListSEO } from "@/components/SEO";
import { useSportCategoryBySlug } from "@/hooks/useSportCategories";
import { usePostsByCategory } from "@/hooks/usePostsByCategory";
import { Skeleton } from "@/components/ui/skeleton";
import { DynamicSportIcon } from "@/components/DynamicSportIcon";
import { Archive, ArrowLeft } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: category, isLoading: categoryLoading } = useSportCategoryBySlug(slug);
  const { data: posts = [], isLoading: postsLoading } = usePostsByCategory(slug);

  useDocumentTitle(category?.name || "Kategoria");

  // Rich SEO with full NewsArticle schema including isBasedOn for E-E-A-T
  const seoData = getRichItemListSEO(
    `Wiadomości - ${category?.name || "Sport"}`,
    posts
  );

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PatronBar />
        <main className="container py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PatronBar />
        <main className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Kategoria nie znaleziona
          </h1>
          <p className="text-muted-foreground mb-6">
            Nie udało się znaleźć kategorii o podanej nazwie.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Wróć na stronę główną
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO {...seoData} />
      <Header />
      <PatronBar />

      <main className="container py-8 md:py-12">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Strona główna</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{category.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Category Header */}
        <div className="flex items-center gap-4 mb-8">
          <DynamicSportIcon
            sportCategory={category}
            fallbackSlug={slug}
            className="h-12 w-12"
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {category.name}
            </h1>
            <p className="text-muted-foreground">
              Najnowsze wiadomości z ostatnich 7 dni
            </p>
          </div>
        </div>

        {/* Posts Grid */}
        {postsLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <NewsCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  excerpt={post.excerpt}
                  content={post.content}
                  categorySlug={post.sport_category?.slug}
                  sportCategory={post.sport_category}
                  publishedAt={post.published_at}
                  sourceUrl={post.source_url}
                  imageUrl={post.image_url || undefined}
                  isSponsored={post.is_sponsored}
                  tags={post.tags || undefined}
                  author={post.author}
                  delay={index === 0 ? 0 : index * 50}
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  disableAnimation={index === 0}
                />
              ))}
            </div>

            {/* Link to archive */}
            <div className="mt-10 text-center">
              <Link
                to={`/archiwum?kategoria=${slug}`}
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                <Archive className="h-4 w-4" />
                Zobacz starsze artykuły z kategorii {category.name}
              </Link>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-border bg-muted/50 py-16 text-center">
            <DynamicSportIcon
              sportCategory={category}
              fallbackSlug={slug}
              className="h-16 w-16 mx-auto mb-4 opacity-50"
            />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Brak artykułów
            </h2>
            <p className="text-muted-foreground mb-6">
              W tej kategorii nie ma jeszcze żadnych artykułów z ostatnich 7 dni.
            </p>
            <Link
              to={`/archiwum?kategoria=${slug}`}
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Archive className="h-4 w-4" />
              Sprawdź archiwum
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
