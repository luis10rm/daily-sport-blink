import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import ReviewCategoriesList from "@/pages/admin/ReviewCategoriesList";

export const Route = createFileRoute("/admin/recki/kategorie/")({
  component: () => (
    <ProtectedRoute>
      <ReviewCategoriesList />
    </ProtectedRoute>
  ),
});
