import { createFileRoute } from "@tanstack/react-router";
import TagsListPage from "@/pages/TagsListPage";

const CANONICAL = "https://szortsy.pl/tagi";
const TITLE = "Wszystkie tematy i tagi | Szortsy";
const DESCRIPTION =
  "Pełna lista tematów i tagów w Szortsach — wybierz interesujący Cię wątek i czytaj skróty wiadomości w 60 sekund.";

export const Route = createFileRoute("/tagi")({
  head: () => ({
    // Katalog linków — noindex, follow, żeby nie konkurował z właściwymi stronami tagów.
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
  component: TagsListPage,
});
