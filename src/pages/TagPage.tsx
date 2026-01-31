import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PatronBar } from "@/components/PatronBar";
import { NewsCard } from "@/components/NewsCard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { SEO, getRichItemListSEO } from "@/components/SEO";
import { useTagBySlug, usePostsByTagSlug } from "@/hooks/useTags";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, ArrowLeft, Archive } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const TagPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: tag, isLoading: tagLoading } = useTagBySlug(slug);
  // Use optimized hook that fetches posts by slug directly to avoid API cascade
  const { data: posts = [], isLoading: postsLoading } = usePostsByTagSlug(slug);

  useDocumentTitle(tag?.name ? `${tag.name} - Szortsy` : "Tag");

  // Rich SEO with full NewsArticle schema including isBasedOn for E-E-A-T
  const seoData = getRichItemListSEO(
    `Artykuły: ${tag?.name || "Tag"}`,
    posts
  );

  if (tagLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PatronBar />
        <main className="container py-8">
          <Skeleton className="h-6 w-48 mb-6" />
          <Skeleton className="h-12 w-64 mb-2" />
          <Skeleton className="h-5 w-40 mb-8" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PatronBar />
        <main className="container py-16 text-center">
          <Tag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Tag nie znaleziony
          </h1>
          <p className="text-muted-foreground mb-6">
            Nie udało się znaleźć tagu o podanej nazwie.
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
              <BreadcrumbLink asChild>
                <Link to="/tagi">Tagi</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tag.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Tag Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Tag className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {tag.name}
            </h1>
            <p className="text-muted-foreground">
              {tag.post_count} {tag.post_count === 1 ? "artykuł" : tag.post_count < 5 ? "artykuły" : "artykułów"} w serwisie Szortsy
            </p>
          </div>
        </div>

        {/* AI Description */}
        {tag.description && (
          <div className="mb-8 rounded-xl border border-border bg-muted/30 p-5 text-sm leading-relaxed text-muted-foreground">
            {tag.description}
          </div>
        )}

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
                to="/archiwum"
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                <Archive className="h-4 w-4" />
                Przeglądaj archiwum artykułów
              </Link>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-border bg-muted/50 py-16 text-center">
            <Tag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Brak artykułów
            </h2>
            <p className="text-muted-foreground mb-6">
              Nie znaleziono żadnych artykułów z tym tagiem.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Wróć na stronę główną
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TagPage;
