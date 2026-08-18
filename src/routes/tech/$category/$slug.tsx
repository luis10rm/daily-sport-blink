import { createFileRoute } from "@tanstack/react-router";
import ReckiReview from "@/pages/ReckiReview";
import { reviewBySlugQueryOptions, type SsrReview } from "@/lib/reviewQuery";
import { buildSeoTitle, buildSeoDescription } from "@/lib/seoTitle";
import {
  SITE_URL,
  buildArticleSchema,
  buildArticleTimeMeta,
  buildBreadcrumbList,
  buildReviewSchema,
} from "@/lib/articleSchema";

export const Route = createFileRoute("/tech/$category/$slug")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(reviewBySlugQueryOptions(params.slug)),
  head: ({ params, loaderData }) => {
    const review = loaderData as SsrReview | null | undefined;
    if (!review) return { meta: [{ title: "Nie znaleziono artykułu | Szortsy" }] };

    const canonical = `${SITE_URL}/tech/${params.category}/${params.slug}`;
    const title = buildSeoTitle(review.title, "Szortsy Tech");
    const description = buildSeoDescription(review.excerpt);
    const coverImage = review.cover_image_url || review.image_url || null;
    const image = coverImage || `${SITE_URL}/og-image.png`;
    const categoryName = review.category?.name || "Tech";
    // Gwiazdki w SERP-ie: tylko dla realnych recenzji z oceną i nazwą produktu.
    const reviewSchema =
      review.content_type === "review"
        ? buildReviewSchema({
            canonical,
            headline: review.title,
            score: review.score,
            productName: review.product_name,
            productBrand: review.product_brand,
            imageUrl: coverImage,
            description: review.excerpt,
            publishedAt: review.published_at,
            updatedAt: review.updated_at,
          })
        : undefined;

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
        ...buildArticleTimeMeta(review.published_at, review.updated_at),
        { property: "article:section", content: categoryName },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            buildArticleSchema({
              type: "Article",
              canonical,
              headline: review.title,
              description: review.excerpt,
              imageUrl: coverImage,
              imageWidth: review.image_width,
              imageHeight: review.image_height,
              publishedAt: review.published_at,
              updatedAt: review.updated_at,
              section: categoryName,
            }),
          ),
        },
        ...(reviewSchema
          ? [
              {
                type: "application/ld+json",
                children: JSON.stringify(reviewSchema),
              },
            ]
          : []),
        {
          type: "application/ld+json",
          children: JSON.stringify(
            buildBreadcrumbList([
              { name: "Szortsy Tech", url: `${SITE_URL}/tech` },
              { name: categoryName, url: `${SITE_URL}/tech/${params.category}` },
              { name: review.title, url: canonical },
            ]),
          ),
        },
      ],
    };
  },
  component: ReckiReview,
});
