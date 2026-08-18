import { createFileRoute } from "@tanstack/react-router";
import AuthorProfile from "@/pages/AuthorProfile";

export const Route = createFileRoute("/autor/$slug")({
  component: AuthorProfile,
});
