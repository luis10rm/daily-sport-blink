import { createFileRoute } from "@tanstack/react-router";
import TagPage from "@/pages/TagPage";
import {
  tagSeoQueryOptions,
  MIN_TAG_POSTS_FOR_INDEX,
  pluralizeSkrot,
  type SsrTagSeo,
} from "@/lib/tagQuery";
import { buildSeoTitle, buildSeoDescription } from "@/lib/seoTitle";

const SITE_URL = "https://szortsy.pl";

export const Route = createFileRoute("/tag/$slug")({
  loader: async ({ params, context }) => {
    try {
      return await context.queryClient.ensureQueryData(tagSeoQueryOptions(params.slug));
    } catch {
      return null;
    }
  },
  head: ({ params, loaderData }) => {
    const tag = loaderData as SsrTagSeo | null | undefined;
    const canonical = `${SITE_URL}/tag/${params.slug}`;

    if (!tag) {
      return {
        meta: [
          { title: "Tag nie znaleziony | Szortsy" },
          { name: "robots", content: "noindex, follow" },
        ],
        links: [{ rel: "canonical", href: canonical }],
      };
    }

    // Cienkie strony tagów (mniej niż 4 artykuły) trafiają do noindex, follow —
    // ograniczamy kanibalizację i "Crawled – currently not indexed" w GSC.
    const indexable = tag.forceIndex || tag.postCount >= MIN_TAG_POSTS_FOR_INDEX;
    const title = buildSeoTitle(`${tag.name} — najnowsze wiadomości`);
    const description = buildSeoDescription(
      tag.description,
      `${tag.name}: ${pluralizeSkrot(tag.postCount)} wiadomości do przeczytania w 60 sekund. Najnowsze informacje, wyniki i kontekst w jednym miejscu.`,
    );

    return {
      meta: [
        { title },
        { name: "description", content: description },
        {
          name: "robots",
          content: indexable
            ? "index, follow, max-image-preview:large, max-snippet:-1"
            : "noindex, follow",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: TagPage,
});
