import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import CategoryEditor from "@/pages/admin/CategoryEditor";

export const Route = createFileRoute("/admin/categories/$id/edit")({
  component: () => (
    <ProtectedRoute requireAdmin>
      <CategoryEditor />
    </ProtectedRoute>
  ),
});
