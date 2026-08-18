import { createFileRoute } from "@tanstack/react-router";
import TagPage from "@/pages/TagPage";

export const Route = createFileRoute("/tag/$slug")({
  component: TagPage,
});
