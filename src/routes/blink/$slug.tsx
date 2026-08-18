import { createFileRoute, redirect } from "@tanstack/react-router";
import BlinkPage from "@/pages/BlinkPage";
import { postBySlugQueryOptions, type SsrPost } from "@/lib/postQuery";
import { resolvePostRedirect } from "@/lib/postRedirects";
import { buildSeoTitle, buildSeoDescription } from "@/lib/seoTitle";
import {
  SITE_URL,
  buildArticleSchema,
  buildArticleTimeMeta,
  buildBreadcrumbList,
} from "@/lib/articleSchema";

export const Route = createFileRoute("/blink/$slug")({
  loader: async ({ params, context }) => {
    const post = await context.queryClient.ensureQueryData(
      postBySlugQueryOptions(params.slug),
    );
    if (post) return post;

    // Artykuł scalony jako duplikat → trwałe przekierowanie na wersję główną,
    // zamiast 404 (zachowujemy sygnały SEO ze starego adresu).
    const target = await resolvePostRedirect(params.slug);
    if (target) throw redirect({ href: target, statusCode: 301 });
    return null;
  },

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
    const description = buildSeoDescription(post.excerpt);
    const image = post.image_url || `${SITE_URL}/og-image.png`;
    const sectionName = post.sport_category?.name;

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
        ...(sectionName ? [{ property: "article:section", content: sectionName }] : []),
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
              section: sectionName,
              keywords: post.tags,
              sourceUrl: post.source_url,
            }),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            buildBreadcrumbList([
              { name: "Szortsy", url: SITE_URL },
              ...(sectionName && post.sport_category?.slug
                ? [{ name: sectionName, url: `${SITE_URL}/kategoria/${post.sport_category.slug}` }]
                : []),
              { name: post.title, url: canonical },
            ]),
          ),
        },
      ],
    };
  },
  component: BlinkPage,
});
