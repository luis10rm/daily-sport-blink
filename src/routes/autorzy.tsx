import { createFileRoute } from "@tanstack/react-router";
import AuthorsPage from "@/pages/AuthorsPage";
import { SITE_URL, buildBreadcrumbList } from "@/lib/articleSchema";

const CANONICAL = `${SITE_URL}/autorzy`;
const TITLE = "Redakcja Szortsy — nasi autorzy";
const DESCRIPTION =
  "Poznaj zespół Szortsy: autorów, którzy codziennie przygotowują 60-sekundowe skróty wiadomości sportowych, technologicznych i pozytywnych.";

export const Route = createFileRoute("/autorzy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          buildBreadcrumbList([
            { name: "Szortsy", url: SITE_URL },
            { name: "Autorzy", url: CANONICAL },
          ]),
        ),
      },
    ],
  }),
  component: AuthorsPage,
});
