import { useParams, Link } from "react-router-dom";
import { ExternalLink, Calendar, Tag, ArrowLeft } from "lucide-react";
import { marked } from "marked";
import { Header } from "@/components/Header";
import { SEO } from "@/components/SEO";
import { AuthorCard } from "@/components/AuthorCard";
import { DynamicSportIcon } from "@/components/DynamicSportIcon";
import { getCategoryImage } from "@/config/categoryImages";
import { usePostById } from "@/hooks/usePosts";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getSourceName, generateSlug } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizeMarkdownInHtml } from "@/lib/normalizeMarkdownInHtml";

// Parse content - handles HTML, Markdown, and mixed formats
const parseContent = (content: string): string => {
  if (!content) return "";
  
  // First normalize any Markdown patterns inside HTML (e.g. <p>**bold**</p>)
  const normalized = normalizeMarkdownInHtml(content);
  
  // Then parse through marked for any remaining pure Markdown
  return marked.parse(normalized, { async: false }) as string;
};

const SITE_URL = "https://daily-sport-blink.lovable.app";

const BlinkPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: post, isLoading, error } = usePostById(id || "");

  useDocumentTitle(post?.title ? `${post.title} | Daily Sport Blink` : "Daily Sport Blink");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Artykuł nie znaleziony</h1>
          <p className="text-muted-foreground mb-6">
            Przepraszamy, nie udało się znaleźć tego artykułu.
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Wróć na stronę główną
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  const formattedDate = new Date(post.published_at).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Build full NewsArticle JSON-LD according to expert recommendations
  const authorUrl = post.author?.slug ? `${SITE_URL}/redakcja/${post.author.slug}` : undefined;
  
  const newsArticleSchema = {
    type: "NewsArticle" as const,
    data: {
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${SITE_URL}/blink/${post.id}`,
      },
      headline: post.title,
      description: post.excerpt,
      image: post.image_url ? {
        "@type": "ImageObject",
        url: post.image_url,
        width: 1200,
        height: 675,
      } : undefined,
      datePublished: post.published_at,
      dateModified: post.updated_at,
      author: post.author ? {
        "@type": "Person",
        name: post.author.display_name,
        ...(authorUrl && { url: authorUrl }),
      } : {
        "@type": "Organization",
        name: "Daily Sport Blink",
      },
      publisher: {
        "@type": "Organization",
        name: "Daily Sport Blink",
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/logo-seo.png`,
        },
      },
      isBasedOn: post.source_url,
      ...(post.sport_category && { articleSection: post.sport_category.name }),
      ...(post.tags?.length && { keywords: post.tags }),
      inLanguage: "pl-PL",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SEO {...newsArticleSchema} />
      
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-3xl mx-auto">
          {/* Back button */}
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do strony głównej
          </Link>

          {/* Category and date */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <DynamicSportIcon 
                sportCategory={post.sport_category} 
                className="h-10 w-10" 
              />
              <span className="text-sm font-medium uppercase tracking-wider text-primary">
                {post.sport_category?.name || "Inne"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </div>
          </div>

          {/* Title */}
          <h1 className="font-heading text-3xl md:text-4xl font-bold leading-tight mb-6">
            {post.title}
          </h1>

          {/* Featured image */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl mb-6">
            <img
              src={getCategoryImage(post.sport_category?.slug, post.image_url, post.sport_category?.slug)}
              alt={post.title}
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
            {post.content ? (
              <div 
                className="article-content"
                dangerouslySetInnerHTML={{ __html: parseContent(post.content) }} 
              />
            ) : (
              <p className="text-lg leading-relaxed">{post.excerpt}</p>
            )}
          </div>

          {/* Source box */}
          <div className="bg-muted/50 border rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">📰 Źródło:</span>
                <span>{getSourceName(post.source_url)}</span>
              </div>
              <a
                href={post.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Przeczytaj oryginalny artykuł
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Author */}
          {post.author && (
            <div className="border-t pt-6 mb-6">
              <AuthorCard author={post.author} />
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/tag/${generateSlug(tag)}`}
                  className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </article>
      </main>
    </div>
  );
};

export default BlinkPage;
