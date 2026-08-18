import { createFileRoute } from "@tanstack/react-router";
import NewsGone from "@/pages/NewsGone";

export const Route = createFileRoute("/news/$")({
  component: NewsGone,
});
