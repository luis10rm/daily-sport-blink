import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://szortsy.pl";
const SITE_NAME = "Szortsy";
const DEFAULT_DESCRIPTION = "Najważniejsze wiadomości ze świata sportu w 60 słowach. Piłka nożna, tenis, F1, MMA i więcej – krótko, codziennie.";
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
    const setMeta = (selector: string, content: string, attr = "content") => {
      let meta = document.querySelector(selector) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement("meta");
        const [type, value] = selector.replace(/[\[\]"]/g, "").split("=");
        if (type.includes("property")) {
          meta.setAttribute("property", value);
        } else {
          meta.setAttribute("name", value);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute(attr, content);
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
    setMeta('meta[name="description"]', description);
    setMeta('meta[name="robots"]', robots);

    // ===== Canonical =====
    setLink("canonical", canonicalUrl);

    // ===== Open Graph =====
    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', canonicalUrl);
    setMeta('meta[property="og:type"]', ogType);
    setMeta('meta[property="og:image"]', ogImage);
    setMeta('meta[property="og:site_name"]', SITE_NAME);
    setMeta('meta[property="og:locale"]', "pl_PL");

    // ===== Twitter Card =====
    setMeta('meta[name="twitter:card"]', "summary_large_image");
    setMeta('meta[name="twitter:title"]', fullTitle);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', ogImage);

    // ===== Article-specific tags =====
    if (ogType === "article") {
      if (articlePublishedTime) {
        setMeta('meta[property="article:published_time"]', articlePublishedTime);
      }
      if (articleModifiedTime) {
        setMeta('meta[property="article:modified_time"]', articleModifiedTime);
      }
      if (articleAuthor) {
        setMeta('meta[property="article:author"]', articleAuthor);
      }
      if (articleSection) {
        setMeta('meta[property="article:section"]', articleSection);
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
}) => {
  useSEOMeta({
    title: article.title,
    description: article.excerpt,
    canonical: `https://szortsy.pl/blink/${article.slug}`,
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
  useSEOMeta({
    title: `${category.name} - Wiadomości`,
    description: category.description || `Najnowsze wiadomości sportowe z kategorii ${category.name}. Śledź wszystkie newsy na Szortsy.`,
    canonical: `https://szortsy.pl/kategoria/${category.slug}`,
    robots: "index, follow",
  });
};

/**
 * Preset for tag pages
 */
export const useTagSEOMeta = (tag: {
  name: string;
  slug: string;
  description?: string;
}) => {
  useSEOMeta({
    title: tag.name,
    description: tag.description || `Wszystkie wiadomości sportowe związane z ${tag.name}. Śledź najnowsze informacje na Szortsy.`,
    canonical: `https://szortsy.pl/tag/${tag.slug}`,
    robots: "index, follow",
  });
};
