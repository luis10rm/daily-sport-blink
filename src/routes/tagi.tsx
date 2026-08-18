import { createFileRoute } from "@tanstack/react-router";
import TagsListPage from "@/pages/TagsListPage";

export const Route = createFileRoute("/tagi")({
  component: TagsListPage,
});
