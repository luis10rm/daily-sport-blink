import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import Settings from "@/pages/admin/Settings";

export const Route = createFileRoute("/admin/settings")({
  component: () => (
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  ),
});
