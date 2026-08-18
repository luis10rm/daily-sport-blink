import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import PositivePostsList from "@/pages/admin/PositivePostsList";

export const Route = createFileRoute("/admin/pozytywne/")({
  component: () => (
    <ProtectedRoute>
      <PositivePostsList />
    </ProtectedRoute>
  ),
});
