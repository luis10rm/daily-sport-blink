import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import PositiveCategoryEditor from "@/pages/admin/PositiveCategoryEditor";

export const Route = createFileRoute("/admin/pozytywne/kategorie/$id/edit")({
  component: () => (
    <ProtectedRoute>
      <PositiveCategoryEditor />
    </ProtectedRoute>
  ),
});
