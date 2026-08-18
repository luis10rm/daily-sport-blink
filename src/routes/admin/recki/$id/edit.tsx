import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import ReviewEditor from "@/pages/admin/ReviewEditor";

export const Route = createFileRoute("/admin/recki/$id/edit")({
  component: () => (
    <ProtectedRoute>
      <ReviewEditor />
    </ProtectedRoute>
  ),
});
