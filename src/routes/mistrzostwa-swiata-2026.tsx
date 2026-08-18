import { createFileRoute } from "@tanstack/react-router";
import WorldCup2026 from "@/pages/WorldCup2026";
import { worldCupMatchesQueryOptions, buildWorldCupMeta } from "@/lib/worldCupQuery";
import type { FDMatch } from "@/hooks/useWorldCupData";

const SITE_URL = "https://szortsy.pl";
const HUB_URL = `${SITE_URL}/mistrzostwa-swiata-2026`;
const HUB_IMAGE = `${SITE_URL}/og-image.png`;

export const Route = createFileRoute("/mistrzostwa-swiata-2026")({
  loader: async ({ context }) => {
    try {
      const res = await context.queryClient.ensureQueryData(worldCupMatchesQueryOptions());
      return { matches: (res?.data?.matches ?? []) as FDMatch[] };
    } catch {
      return { matches: [] as FDMatch[] };
    }
  },
  head: ({ loaderData }) => {
    const { title, description } = buildWorldCupMeta(loaderData?.matches);

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: HUB_URL },
        { property: "og:image", content: HUB_IMAGE },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: HUB_IMAGE },
      ],
      links: [{ rel: "canonical", href: HUB_URL }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            name: "Mistrzostwa Świata w Piłce Nożnej 2026",
            alternateName: "FIFA World Cup 2026",
            startDate: "2026-06-11",
            endDate: "2026-07-19",
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
            sport: "Football",
            url: HUB_URL,
            image: HUB_IMAGE,
            location: [
              { "@type": "Country", name: "Stany Zjednoczone" },
              { "@type": "Country", name: "Kanada" },
              { "@type": "Country", name: "Meksyk" },
            ],
            organizer: { "@type": "Organization", name: "FIFA", url: "https://www.fifa.com" },
            inLanguage: "pl-PL",
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Szortsy", item: SITE_URL },
              {
                "@type": "ListItem",
                position: 2,
                name: "Mistrzostwa Świata 2026",
                item: HUB_URL,
              },
            ],
          }),
        },
      ],
    };
  },
  component: WorldCup2026,
});
