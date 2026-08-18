import { createFileRoute } from "@tanstack/react-router";
import BlinkPage from "@/pages/BlinkPage";
import { postBySlugQueryOptions, type SsrPost } from "@/lib/postQuery";
import { buildSeoTitle, buildSeoDescription } from "@/lib/seoTitle";
import {
  SITE_URL,
  buildArticleSchema,
  buildArticleTimeMeta,
  buildBreadcrumbList,
} from "@/lib/articleSchema";

export const Route = createFileRoute("/pozytywne/$category/$slug")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(postBySlugQueryOptions(params.slug)),
  head: ({ params, loaderData }) => {
    const post = loaderData as SsrPost | null | undefined;
    if (!post) return { meta: [{ title: "Nie znaleziono artykułu | Szortsy" }] };

    const canonical = `${SITE_URL}/pozytywne/${params.category}/${params.slug}`;
    const title = buildSeoTitle(post.title, "Szortsy");
    const description = buildSeoDescription(post.excerpt);
    const image = post.image_url || `${SITE_URL}/og-image.png`;
    const categoryName = post.sport_category?.name || "Pozytywne";

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
        ...buildArticleTimeMeta(post.published_at, post.updated_at),
        ...(post.author?.display_name
          ? [{ property: "article:author", content: post.author.display_name }]
          : []),
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            buildArticleSchema({
              type: "NewsArticle",
              canonical,
              headline: post.title,
              description: post.excerpt,
              imageUrl: post.image_url,
              imageWidth: post.image_width,
              imageHeight: post.image_height,
              publishedAt: post.published_at,
              updatedAt: post.updated_at,
              authorName: post.author?.display_name,
              authorSlug: post.author?.slug,
              section: categoryName,
              keywords: post.tags,
              sourceUrl: post.source_url,
            }),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            buildBreadcrumbList([
              { name: "Pozytywne", url: `${SITE_URL}/pozytywne` },
              { name: categoryName, url: `${SITE_URL}/pozytywne/${params.category}` },
              { name: post.title, url: canonical },
            ]),
          ),
        },
      ],
    };
  },
  component: BlinkPage,
});
