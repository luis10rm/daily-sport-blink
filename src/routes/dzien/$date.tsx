import { createFileRoute } from "@tanstack/react-router";
import DailyPage from "@/pages/DailyPage";

const SITE_URL = "https://szortsy.pl";

function formatPl(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

export const Route = createFileRoute("/dzien/$date")({
  head: ({ params }) => {
    const pretty = formatPl(params.date);
    const title = `Wiadomości z ${pretty} | Szortsy`;
    const description = `Przegląd wszystkich skrótów wiadomości z ${pretty} — sport, tech i pozytywne informacje w 60-sekundowych blinkach.`;

    return {
      // Codzienne zestawienia duplikują treść artykułów — noindex, follow.
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `${SITE_URL}/dzien/${params.date}` },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/dzien/${params.date}` }],
    };
  },
  component: DailyPage,
});
