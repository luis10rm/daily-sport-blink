import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import PostEditor from "@/pages/admin/PostEditor";

export const Route = createFileRoute("/admin/pozytywne/new")({
  component: () => (
    <ProtectedRoute>
      <PostEditor />
    </ProtectedRoute>
  ),
});
