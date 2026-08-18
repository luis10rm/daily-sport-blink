import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import SourcesList from "@/pages/admin/SourcesList";

export const Route = createFileRoute("/admin/sources")({
  component: () => (
    <ProtectedRoute>
      <SourcesList />
    </ProtectedRoute>
  ),
});
