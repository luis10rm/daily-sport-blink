import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import PositiveCategoriesList from "@/pages/admin/PositiveCategoriesList";

export const Route = createFileRoute("/admin/pozytywne/kategorie/")({
  component: () => (
    <ProtectedRoute>
      <PositiveCategoriesList />
    </ProtectedRoute>
  ),
});
