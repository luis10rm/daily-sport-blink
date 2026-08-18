import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import DuplicatesList from "@/pages/admin/DuplicatesList";

export const Route = createFileRoute("/admin/duplikaty")({
  component: () => (
    <ProtectedRoute>
      <DuplicatesList />
    </ProtectedRoute>
  ),
});
