import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import PositiveCategoryEditor from "@/pages/admin/PositiveCategoryEditor";

export const Route = createFileRoute("/admin/pozytywne/kategorie/new")({
  component: () => (
    <ProtectedRoute>
      <PositiveCategoryEditor />
    </ProtectedRoute>
  ),
});
