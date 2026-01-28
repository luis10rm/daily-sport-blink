import { useEffect } from "react";
import { Post } from "@/hooks/usePosts";

type SchemaType = "WebSite" | "ItemList" | "Person" | "Organization" | "NewsArticle";

interface SEOProps {
  type: SchemaType;
  data: Record<string, unknown>;
}

// Base URL for the site
const SITE_URL = "https://daily-sport-blink.lovable.app";
const SITE_NAME = "Szortsy";
const LOGO_URL = `${SITE_URL}/og-image.png`;

// Publisher object (reused across NewsArticle schemas)
const PUBLISHER = {
  "@type": "Organization",
  name: SITE_NAME,
  logo: {
    "@type": "ImageObject",
    url: LOGO_URL,
    width: 1200,
    height: 630,
  },
};

export const SEO = ({ type, data }: SEOProps) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "seo-structured-data";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": type,
      ...data,
    });

    // Remove old script if exists
    const existing = document.getElementById("seo-structured-data");
    if (existing) existing.remove();

    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [type, data]);

  return null;
};

// Multi-schema component for pages with multiple posts
export const MultiSEO = ({ schemas }: { schemas: Array<{ type: SchemaType; data: Record<string, unknown> }> }) => {
  useEffect(() => {
    const scriptId = "seo-multi-structured-data";
    
    // Remove old script if exists
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = scriptId;
    script.text = JSON.stringify(
      schemas.map(({ type, data }) => ({
        "@context": "https://schema.org",
        "@type": type,
        ...data,
      }))
    );

    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [schemas]);

  return null;
};

// Predefined SEO data for common pages
export const getWebsiteSEO = () => ({
  type: "WebSite" as const,
  data: {
    name: SITE_NAME,
    description: "Wiadomości sportowe krótko i na temat",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/archiwum?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
});

// Full NewsArticle schema for individual posts
export const getNewsArticleSEO = (post: Post) => {
  const authorUrl = post.author?.slug ? `${SITE_URL}/autor/${post.author.slug}` : undefined;
  
  return {
    type: "NewsArticle" as const,
    data: {
      headline: post.title,
      description: post.excerpt,
      // Image with 1200px requirement for Google Discover
      image: post.image_url ? {
        "@type": "ImageObject",
        url: post.image_url,
        width: 1200,
        height: 630,
      } : undefined,
      datePublished: post.published_at,
      dateModified: post.updated_at,
      // Author as Person with link to profile page
      author: post.author ? {
        "@type": "Person",
        name: post.author.display_name,
        ...(authorUrl && { url: authorUrl }),
        ...(post.author.role_title && { jobTitle: post.author.role_title }),
      } : {
        "@type": "Organization",
        name: SITE_NAME,
      },
      publisher: PUBLISHER,
      // isBasedOn - CRITICAL for E-E-A-T when curating content
      isBasedOn: {
        "@type": "WebPage",
        url: post.source_url,
      },
      // Main entity reference
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": SITE_URL,
      },
      // Article section (category)
      ...(post.sport_category && {
        articleSection: post.sport_category.name,
      }),
      // Keywords from tags
      ...(post.tags?.length && {
        keywords: post.tags.join(", "),
      }),
      // In Polish
      inLanguage: "pl-PL",
    },
  };
};

// ItemList with full NewsArticle items (for category/tag pages)
export const getItemListSEO = (
  name: string,
  items: Array<{
    headline: string;
    datePublished: string;
    author?: string;
    url?: string;
  }>
) => ({
  type: "ItemList" as const,
  data: {
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "NewsArticle",
        headline: item.headline,
        datePublished: item.datePublished,
        ...(item.author && {
          author: { "@type": "Person", name: item.author },
        }),
        ...(item.url && { 
          isBasedOn: {
            "@type": "WebPage",
            url: item.url,
          },
        }),
        publisher: PUBLISHER,
      },
    })),
  },
});

// Rich ItemList with full Post data (for pages that have complete post objects)
export const getRichItemListSEO = (name: string, posts: Post[]) => ({
  type: "ItemList" as const,
  data: {
    name,
    numberOfItems: posts.length,
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "NewsArticle",
        headline: post.title,
        description: post.excerpt,
        datePublished: post.published_at,
        dateModified: post.updated_at,
        ...(post.image_url && {
          image: {
            "@type": "ImageObject",
            url: post.image_url,
            width: 1200,
            height: 630,
          },
        }),
        ...(post.author && {
          author: {
            "@type": "Person",
            name: post.author.display_name,
            ...(post.author.slug && { url: `${SITE_URL}/autor/${post.author.slug}` }),
          },
        }),
        isBasedOn: {
          "@type": "WebPage",
          url: post.source_url,
        },
        publisher: PUBLISHER,
        inLanguage: "pl-PL",
        ...(post.sport_category && { articleSection: post.sport_category.name }),
        ...(post.tags?.length && { keywords: post.tags.join(", ") }),
      },
    })),
  },
});

export const getPersonSEO = (
  name: string,
  description?: string,
  image?: string,
  slug?: string
) => ({
  type: "Person" as const,
  data: {
    name,
    ...(description && { description }),
    ...(image && { image }),
    ...(slug && { url: `${SITE_URL}/autor/${slug}` }),
    // Affiliation with Szortsy
    worksFor: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  },
});
