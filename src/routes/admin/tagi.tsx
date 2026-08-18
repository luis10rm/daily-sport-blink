import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import TagsList from "@/pages/admin/TagsList";

export const Route = createFileRoute("/admin/tagi")({
  component: () => (
    <ProtectedRoute>
      <TagsList />
    </ProtectedRoute>
  ),
});
