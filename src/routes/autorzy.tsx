import { createFileRoute } from "@tanstack/react-router";
import AuthorsPage from "@/pages/AuthorsPage";

export const Route = createFileRoute("/autorzy")({
  component: AuthorsPage,
});
