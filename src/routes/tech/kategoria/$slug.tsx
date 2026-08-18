import { createFileRoute } from "@tanstack/react-router";
import ReckiHome from "@/pages/ReckiHome";

export const Route = createFileRoute("/tech/kategoria/$slug")({
  component: ReckiHome,
});
