import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import FeedbackList from "@/pages/admin/FeedbackList";

export const Route = createFileRoute("/admin/feedback")({
  component: () => (
    <ProtectedRoute>
      <FeedbackList />
    </ProtectedRoute>
  ),
});
