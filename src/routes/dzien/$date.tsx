import { createFileRoute } from "@tanstack/react-router";
import DailyPage from "@/pages/DailyPage";

export const Route = createFileRoute("/dzien/$date")({
  component: DailyPage,
});
