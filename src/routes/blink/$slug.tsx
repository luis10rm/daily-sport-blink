import { createFileRoute } from "@tanstack/react-router";
import BlinkPage from "@/pages/BlinkPage";

export const Route = createFileRoute("/blink/$slug")({
  component: BlinkPage,
});
