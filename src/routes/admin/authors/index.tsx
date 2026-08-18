import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import AuthorsList from "@/pages/admin/AuthorsList";

export const Route = createFileRoute("/admin/authors/")({
  component: () => (
    <ProtectedRoute>
      <AuthorsList />
    </ProtectedRoute>
  ),
});
