import { createFileRoute } from "@tanstack/react-router";
import PozytywneArchive from "@/pages/PozytywneArchive";

export const Route = createFileRoute("/pozytywne/archiwum")({
  component: PozytywneArchive,
});
