import { createFileRoute } from "@tanstack/react-router";
import Archive from "@/pages/Archive";

export const Route = createFileRoute("/archiwum")({
  component: Archive,
});
