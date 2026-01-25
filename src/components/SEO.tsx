import { useEffect } from "react";

type SchemaType = "WebSite" | "ItemList" | "Person" | "Organization";

interface SEOProps {
  type: SchemaType;
  data: Record<string, unknown>;
}

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

// Predefined SEO data for common pages
export const getWebsiteSEO = () => ({
  type: "WebSite" as const,
  data: {
    name: "Szortsy",
    description: "Wiadomości sportowe krótko i na temat",
    url: "https://daily-sport-blink.lovable.app",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://daily-sport-blink.lovable.app/archiwum?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  },
});

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
        ...(item.url && { url: item.url }),
      },
    })),
  },
});

export const getPersonSEO = (
  name: string,
  description?: string,
  image?: string
) => ({
  type: "Person" as const,
  data: {
    name,
    ...(description && { description }),
    ...(image && { image }),
  },
});
