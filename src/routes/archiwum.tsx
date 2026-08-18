import { createFileRoute } from "@tanstack/react-router";
import Archive from "@/pages/Archive";

const CANONICAL = "https://szortsy.pl/archiwum";
const TITLE = "Archiwum wiadomości | Szortsy";
const DESCRIPTION =
  "Archiwum skrótów wiadomości Szortsy — wszystkie starsze materiały z podziałem na kategorie sportowe.";

export const Route = createFileRoute("/archiwum")({
  head: () => ({
    // Strona nawigacyjna, nie treściowa — noindex, follow (linki nadal przekazują sygnały).
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: Archive,
});
