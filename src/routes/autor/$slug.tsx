import { createFileRoute } from "@tanstack/react-router";
import AuthorProfile from "@/pages/AuthorProfile";
import { authorSeoQueryOptions, type SsrAuthor } from "@/lib/seoQueries";
import { buildSeoTitle, buildSeoDescription } from "@/lib/seoTitle";
import { SITE_URL, buildBreadcrumbList } from "@/lib/articleSchema";

export const Route = createFileRoute("/autor/$slug")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(authorSeoQueryOptions(params.slug)),
  head: ({ params, loaderData }) => {
    const author = loaderData as SsrAuthor | null | undefined;
    const canonical = `${SITE_URL}/autor/${params.slug}`;

    if (!author) {
      return {
        meta: [
          { title: "Profil niedostępny | Szortsy" },
          { name: "robots", content: "noindex, follow" },
        ],
        links: [{ rel: "canonical", href: canonical }],
      };
    }

    const roleSuffix = author.role_title ? ` — ${author.role_title}` : " — autor";
    const title = buildSeoTitle(`${author.display_name}${roleSuffix}`);
    const description = buildSeoDescription(
      author.bio,
      `${author.display_name} w Szortsy — wszystkie skróty wiadomości przygotowane przez tego autora.`,
    );
    const image = author.avatar_url || `${SITE_URL}/og-image.png`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: canonical },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            url: canonical,
            inLanguage: "pl-PL",
            mainEntity: {
              "@type": "Person",
              name: author.display_name,
              url: canonical,
              ...(author.bio ? { description: author.bio } : {}),
              ...(author.avatar_url ? { image: author.avatar_url } : {}),
              ...(author.role_title ? { jobTitle: author.role_title } : {}),
              worksFor: { "@type": "Organization", name: "Szortsy", url: SITE_URL },
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            buildBreadcrumbList([
              { name: "Szortsy", url: SITE_URL },
              { name: "Autorzy", url: `${SITE_URL}/autorzy` },
              { name: author.display_name, url: canonical },
            ]),
          ),
        },
      ],
    };
  },
  component: AuthorProfile,
});
