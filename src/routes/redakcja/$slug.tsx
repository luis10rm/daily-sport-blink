import { createFileRoute } from "@tanstack/react-router";
import RedakcjaRedirect from "@/pages/RedakcjaRedirect";

export const Route = createFileRoute("/redakcja/$slug")({
  component: RedakcjaRedirect,
});
