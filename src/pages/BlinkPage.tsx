import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavLink } from "@/hooks/useNavLink";
import { ExternalLink, Calendar, Tag, ArrowLeft, Snowflake, Sun } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Header } from "@/components/Header";
import { PozytywneHeader } from "@/components/pozytywne/PozytywneHeader";
import { PozytywneFooter } from "@/components/pozytywne/PozytywneFooter";
import { SEO } from "@/components/SEO";
import { AuthorCard } from "@/components/AuthorCard";
import { DynamicSportIcon } from "@/components/DynamicSportIcon";
import { getCategoryImage } from "@/config/categoryImages";
import { usePostBySlug } from "@/hooks/usePosts";
import { useArticleSEOMeta } from "@/hooks/useSEOMeta";
import { getSourceName, generateSlug } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizeMarkdownInHtml } from "@/lib/normalizeMarkdownInHtml";
import { sanitizePastedHtml } from "@/lib/unescapeHtmlIfEncoded";
import { Footer } from "@/components/Footer";
import { isOlympicCategory } from "@/lib/olympicTheme";
import { isWorldCupCategory } from "@/lib/worldCupTheme";
import { WorldCupRibbon } from "@/components/WorldCupRibbon";
import { WorldCupMatchCenter } from "@/components/worldcup/WorldCupMatchCenter";

// Sanitize HTML to prevent XSS attacks
const sanitizeHtml = (html: string): string => {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'h2', 'h3', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'br', 'blockquote', 'u', 's', 'iframe', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title', 'class', 'data-youtube-video'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['allowfullscreen'],
  });
  // Whitelist iframe sources to YouTube only
  if (typeof window !== 'undefined') {
    const doc = new DOMParser().parseFromString(clean, 'text/html');
    doc.querySelectorAll('iframe').forEach((iframe) => {
      const src = iframe.getAttribute('src') || '';
      try {
        const u = new URL(src, window.location.origin);
        const ok = /(^|\.)youtube\.com$|(^|\.)youtube-nocookie\.com$|(^|\.)youtu\.be$/.test(u.hostname);
        if (!ok) iframe.remove();
      } catch { iframe.remove(); }
    });
    return doc.body.innerHTML;
  }
  return clean;
};

// Parse content - handles HTML, Markdown, and mixed formats with XSS protection
const parseContent = (content: string): string => {
  if (!content) return "";

  // Legacy content may contain escaped HTML entities (`&lt;p&gt;...`) from old pastes.
  const decoded = sanitizePastedHtml(content);

  // Normalize any Markdown patterns inside HTML (e.g. <p>**bold**</p>)
  const normalized = normalizeMarkdownInHtml(decoded);
  
  // Parse through marked for any remaining pure Markdown
  const html = marked.parse(normalized, { async: false }) as string;
  
  // Sanitize to prevent XSS attacks
  return sanitizeHtml(html);
};

const SITE_URL = "https://szortsy.pl";

const BlinkPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = usePostBySlug(slug || "");
  const navLink = useNavLink();

  const isPositive = (post as any)?.channel === "positive";
  const ActiveHeader = isPositive ? PozytywneHeader : Header;
  const ActiveFooter = isPositive ? PozytywneFooter : Footer;
  const homeHref = isPositive ? "/pozytywne" : "/";

  // Apply lime skin to <html> for positive-channel articles
  useEffect(() => {
    if (isPositive) {
      document.documentElement.classList.add("mode-pozytywne");
      return () => document.documentElement.classList.remove("mode-pozytywne");
    }
  }, [isPositive]);


  // Use new SEO meta hook for all meta tags
  useArticleSEOMeta(post ? {
    title: post.title,
    excerpt: post.excerpt,
    slug: post.slug,
    image_url: post.image_url,
    published_at: post.published_at,
    updated_at: post.updated_at,
    author: post.author,
    sport_category: post.sport_category,
    tags: post.tags,
  } : {
    title: "Ładowanie...",
    excerpt: "",
    slug: slug || "",
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ActiveHeader />
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
        <ActiveHeader />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Artykuł nie znaleziony</h1>
          <p className="text-muted-foreground mb-6">
            Przepraszamy, nie udało się znaleźć tego artykułu.
          </p>
          <Button asChild>
            <a {...navLink("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Wróć na stronę główną
            </a>
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
        "@id": `${SITE_URL}/blink/${post.slug}`,
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
        name: "Szortsy",
      },
      publisher: {
        "@type": "Organization",
        name: "Szortsy",
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

  const isOlympic = isOlympicCategory(post.sport_category?.slug);
  const isWorldCup = isWorldCupCategory(post.sport_category?.slug);

  return (
    <div className="min-h-screen bg-background">
      <ActiveHeader />
      <SEO {...newsArticleSchema} />
      
      <main className="container mx-auto px-4 py-8">
        <article className={cn("max-w-3xl mx-auto", isOlympic && "relative")}>
          {/* Back button */}
          <a 
            {...navLink("/")} 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do strony głównej
          </a>

          {/* Olympic winter banner */}
          {isOlympic && (
            <div className="flex items-center gap-2 rounded-lg border border-sky-300/40 bg-sky-50/50 dark:border-sky-600/30 dark:bg-sky-900/20 px-4 py-2.5 mb-6">
              <Snowflake className="h-4 w-4 text-sky-500 dark:text-sky-400" />
              <span className="text-sm font-medium text-sky-700 dark:text-sky-300">Igrzyska Olimpijskie</span>
            </div>
          )}

          {/* World Cup 2026 ribbon */}
          {isWorldCup && <WorldCupRibbon />}

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
          <div className={cn(
            "relative aspect-video w-full overflow-hidden rounded-xl mb-6",
            isOlympic && "olympic-frost-overlay"
          )}>
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

          {/* World Cup Match Center (only for WC posts with team tags) */}
          {isWorldCup && <WorldCupMatchCenter tags={post.tags || []} />}



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
                <a
                  key={tag}
                  {...navLink(`/tag/${generateSlug(tag)}`)}
                  className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  #{tag}
                </a>
              ))}
            </div>
          )}
        </article>
      </main>

      <ActiveFooter />
    </div>
  );
};

export default BlinkPage;
