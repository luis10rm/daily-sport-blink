import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import CategoriesList from "@/pages/admin/CategoriesList";

export const Route = createFileRoute("/admin/categories/")({
  component: () => (
    <ProtectedRoute requireAdmin>
      <CategoriesList />
    </ProtectedRoute>
  ),
});
