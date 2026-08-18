import { createFileRoute } from "@tanstack/react-router";
import CategoryPage from "@/pages/CategoryPage";
import { sportCategorySeoQueryOptions, type SsrSportCategory } from "@/lib/seoQueries";
import { buildSeoTitle, buildSeoDescription } from "@/lib/seoTitle";
import { SITE_URL, buildBreadcrumbList } from "@/lib/articleSchema";

/** Kategoria reklamowa nigdy nie idzie do indeksu. */
const SPONSORED_SLUG = "wspo-praca-reklamowa";

export const Route = createFileRoute("/kategoria/$slug")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(sportCategorySeoQueryOptions(params.slug)),
  head: ({ params, loaderData }) => {
    const category = loaderData as SsrSportCategory | null | undefined;
    const canonical = `${SITE_URL}/kategoria/${params.slug}`;

    if (!category) {
      return {
        meta: [
          { title: "Kategoria niedostępna | Szortsy" },
          { name: "robots", content: "noindex, follow" },
        ],
        links: [{ rel: "canonical", href: canonical }],
      };
    }

    const title = buildSeoTitle(`${category.name} — wiadomości i skróty`);
    const description = buildSeoDescription(
      `Najnowsze wiadomości z kategorii ${category.name} — krótkie, 60-sekundowe skróty. Wyniki, transfery i najważniejsze informacje w jednym miejscu.`,
    );
    const isSponsored = params.slug === SPONSORED_SLUG;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: isSponsored ? "noindex, follow" : "index, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${category.name} — Szortsy`,
            description,
            url: canonical,
            inLanguage: "pl-PL",
            isPartOf: { "@type": "WebSite", name: "Szortsy", url: SITE_URL },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            buildBreadcrumbList([
              { name: "Szortsy", url: SITE_URL },
              { name: category.name, url: canonical },
            ]),
          ),
        },
      ],
    };
  },
  component: CategoryPage,
});
