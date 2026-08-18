import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import ReviewCategoryEditor from "@/pages/admin/ReviewCategoryEditor";

export const Route = createFileRoute("/admin/recki/kategorie/$id/edit")({
  component: () => (
    <ProtectedRoute>
      <ReviewCategoryEditor />
    </ProtectedRoute>
  ),
});
