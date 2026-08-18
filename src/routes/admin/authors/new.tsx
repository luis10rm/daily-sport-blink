import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import AuthorEditor from "@/pages/admin/AuthorEditor";

export const Route = createFileRoute("/admin/authors/new")({
  component: () => (
    <ProtectedRoute>
      <AuthorEditor />
    </ProtectedRoute>
  ),
});
