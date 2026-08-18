import { createFileRoute } from "@tanstack/react-router";
import BlinkPage from "@/pages/BlinkPage";
import { postBySlugQueryOptions, type SsrPost } from "@/lib/postQuery";
import { buildSeoTitle, buildSeoDescription } from "@/lib/seoTitle";

const SITE_URL = "https://szortsy.pl";

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
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: BlinkPage,
});
