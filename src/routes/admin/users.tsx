import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import UsersList from "@/pages/admin/UsersList";

export const Route = createFileRoute("/admin/users")({
  component: () => (
    <ProtectedRoute requireAdmin>
      <UsersList />
    </ProtectedRoute>
  ),
});
