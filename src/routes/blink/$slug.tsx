import { createFileRoute } from "@tanstack/react-router";
import BlinkPage from "@/pages/BlinkPage";
import { postBySlugQueryOptions, type SsrPost } from "@/lib/postQuery";

const SITE_URL = "https://szortsy.pl";

export const Route = createFileRoute("/blink/$slug")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(postBySlugQueryOptions(params.slug)),
  head: ({ params, loaderData }) => {
    const post = loaderData as SsrPost | null | undefined;
    if (!post) {
      return {
        meta: [{ title: "Nie znaleziono artykułu | Szortsy" }],
      };
    }

    const isPositive = post.channel === "positive";
    const canonical =
      isPositive && post.positive_category?.slug
        ? `${SITE_URL}/pozytywne/${post.positive_category.slug}/${post.slug}`
        : `${SITE_URL}/blink/${params.slug}`;
    const title = buildSeoTitle(post.title);
    const description = buildSeoDescription(post.excerpt, post.content);
    const image = post.image_url || `${SITE_URL}/og-image.png`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
        ...(post.published_at
          ? [{ property: "article:published_time", content: post.published_at }]
          : []),
        ...(post.updated_at
          ? [{ property: "article:modified_time", content: post.updated_at }]
          : []),
        ...(post.author?.display_name
          ? [{ property: "article:author", content: post.author.display_name }]
          : []),
        ...(post.sport_category?.name
          ? [{ property: "article:section", content: post.sport_category.name }]
          : []),
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
            headline: post.title,
            description: post.excerpt,
            ...(post.image_url && {
              image: { "@type": "ImageObject", url: post.image_url, width: 1200, height: 675 },
            }),
            datePublished: post.published_at,
            dateModified: post.updated_at,
            author: post.author?.display_name
              ? {
                  "@type": "Person",
                  name: post.author.display_name,
                  ...(post.author.slug && { url: `${SITE_URL}/autor/${post.author.slug}` }),
                }
              : { "@type": "Organization", name: "Szortsy" },
            publisher: {
              "@type": "Organization",
              name: "Szortsy",
              logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-seo.png` },
            },
            ...(post.source_url && { isBasedOn: post.source_url }),
            ...(post.sport_category?.name && { articleSection: post.sport_category.name }),
            ...(post.tags?.length && { keywords: post.tags }),
            inLanguage: "pl-PL",
          }),
        },
      ],
    };
  },
  component: BlinkPage,
});
