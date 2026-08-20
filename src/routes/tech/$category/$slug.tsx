import { createFileRoute } from "@tanstack/react-router";
import ReckiReview from "@/pages/ReckiReview";

export const Route = createFileRoute("/tech/$category/$slug")({
  component: ReckiReview,
});
