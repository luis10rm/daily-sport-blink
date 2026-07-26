import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://szortsy.pl";
const SITE_NAME = "Szortsy";
const DEFAULT_DESCRIPTION = "Szortsy – najważniejsze wiadomości sportowe w 60 sekund. Piłka nożna, F1, tenis, MMA i więcej. Krótko, konkretnie, codziennie. Bądź na bieżąco!";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface SEOMetaOptions {
  /** Page title (will be suffixed with " | Szortsy") */
  title?: string;
  /** Meta description for search results */
  description?: string;
  /** Canonical URL (defaults to current path on szortsy.pl) */
  canonical?: string;
  /** Robots directive (defaults to "index, follow") */
  robots?: string;
  /** Open Graph type (defaults to "website") */
  ogType?: "website" | "article";
  /** Open Graph image URL */
  ogImage?: string;
  /** Article published date (for og:article) */
  articlePublishedTime?: string;
  /** Article modified date (for og:article) */
  articleModifiedTime?: string;
  /** Article author name */
  articleAuthor?: string;
  /** Article section/category */
  articleSection?: string;
  /** Article tags */
  articleTags?: string[];
}

/**
 * Global SEO meta tags hook
 * Manages all SEO-related meta tags dynamically
 */
export const useSEOMeta = (options: SEOMetaOptions = {}) => {
  const location = useLocation();

  useEffect(() => {
    const {
      title,
      description = DEFAULT_DESCRIPTION,
      canonical,
      robots = "index, follow",
      ogType = "website",
      ogImage = DEFAULT_OG_IMAGE,
      articlePublishedTime,
      articleModifiedTime,
      articleAuthor,
      articleSection,
      articleTags,
    } = options;

    // Build full title
    const fullTitle = title 
      ? `${title} | ${SITE_NAME}` 
      : `${SITE_NAME} - Wiadomości sportowe krótko i na temat`;

    // Build canonical URL
    const canonicalUrl = canonical || `${SITE_URL}${location.pathname}`;

    // Update document title
    document.title = fullTitle;

    // Helper to set or create meta tag
    const setMeta = (type: 'name' | 'property', name: string, content: string) => {
      const selector = `meta[${type}="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(type, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Helper to set or create link tag
    const setLink = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", rel);
        document.head.appendChild(link);
      }
      link.setAttribute("href", href);
    };

    // Helper to remove meta tag
    const removeMeta = (selector: string) => {
      const meta = document.querySelector(selector);
      if (meta) meta.remove();
    };

    // ===== Core Meta Tags =====
    setMeta('name', 'description', description);
    setMeta('name', 'robots', robots);

    // ===== Canonical =====
    setLink("canonical", canonicalUrl);

    // ===== Open Graph =====
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:locale', "pl_PL");

    // ===== Twitter Card =====
    setMeta('name', 'twitter:card', "summary_large_image");
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage);

    // ===== Article-specific tags =====
    if (ogType === "article") {
      if (articlePublishedTime) {
        setMeta('property', 'article:published_time', articlePublishedTime);
      }
      if (articleModifiedTime) {
        setMeta('property', 'article:modified_time', articleModifiedTime);
      }
      if (articleAuthor) {
        setMeta('property', 'article:author', articleAuthor);
      }
      if (articleSection) {
        setMeta('property', 'article:section', articleSection);
      }
      if (articleTags?.length) {
        // Remove old article:tag metas
        document.querySelectorAll('meta[property="article:tag"]').forEach(el => el.remove());
        // Add new ones
        articleTags.forEach(tag => {
          const meta = document.createElement("meta");
          meta.setAttribute("property", "article:tag");
          meta.setAttribute("content", tag);
          document.head.appendChild(meta);
        });
      }
    } else {
      // Clean up article tags if not an article
      removeMeta('meta[property="article:published_time"]');
      removeMeta('meta[property="article:modified_time"]');
      removeMeta('meta[property="article:author"]');
      removeMeta('meta[property="article:section"]');
      document.querySelectorAll('meta[property="article:tag"]').forEach(el => el.remove());
    }

    // Cleanup function - reset to defaults when unmounting
    return () => {
      // We don't clean up here because the next page will set its own values
    };
  }, [options, location.pathname]);
};

/**
 * Preset for article pages
 */
export const useArticleSEOMeta = (article: {
  title: string;
  excerpt: string;
  slug: string;
  image_url?: string | null;
  published_at: string;
  updated_at: string;
  author?: { display_name: string } | null;
  sport_category?: { name: string } | null;
  tags?: string[] | null;
  canonical?: string;
}) => {
  useSEOMeta({
    title: article.title,
    description: article.excerpt,
    canonical: article.canonical || `https://szortsy.pl/blink/${article.slug}`,
    robots: "index, follow",
    ogType: "article",
    ogImage: article.image_url || undefined,
    articlePublishedTime: article.published_at,
    articleModifiedTime: article.updated_at,
    articleAuthor: article.author?.display_name,
    articleSection: article.sport_category?.name,
    articleTags: article.tags || undefined,
  });
};

/**
 * Preset for category pages
 */
export const useCategorySEOMeta = (category: {
  name: string;
  slug: string;
  description?: string;
}) => {
  // Sponsored content category — never index
  const isSponsored = category.slug === "wspo-praca-reklamowa";
  useSEOMeta({
    title: `${category.name} - Wiadomości`,
    description: category.description || `Najnowsze wiadomości sportowe z kategorii ${category.name}. Śledź wszystkie newsy na Szortsy.`,
    canonical: `https://szortsy.pl/kategoria/${category.slug}`,
    robots: isSponsored ? "noindex, follow" : "index, follow",
  });
};

/**
 * Tag indexability threshold. Tags with fewer than this number of published
 * articles are noindex,follow unless an editor sets `force_index = true`.
 */
export const TAG_INDEX_MIN_POSTS = 4;

/**
 * Preset for tag pages
 */
export const useTagSEOMeta = (tag: {
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
  forceIndex?: boolean;
}) => {
  const shouldNoindex =
    !tag.forceIndex && (tag.postCount ?? 0) < TAG_INDEX_MIN_POSTS;
  useSEOMeta({
    title: tag.name,
    description: tag.description || `Wszystkie wiadomości sportowe związane z ${tag.name}. Śledź najnowsze informacje na Szortsy.`,
    canonical: `https://szortsy.pl/tag/${tag.slug}`,
    robots: shouldNoindex ? "noindex, follow" : "index, follow",
  });
};
