import { createFileRoute } from "@tanstack/react-router";
import PozytywneHome from "@/pages/PozytywneHome";

export const Route = createFileRoute("/pozytywne/kategoria/$slug")({
  component: PozytywneHome,
});
