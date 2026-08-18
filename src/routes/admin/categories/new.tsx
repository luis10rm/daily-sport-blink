import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import CategoryEditor from "@/pages/admin/CategoryEditor";

export const Route = createFileRoute("/admin/categories/new")({
  component: () => (
    <ProtectedRoute requireAdmin>
      <CategoryEditor />
    </ProtectedRoute>
  ),
});
