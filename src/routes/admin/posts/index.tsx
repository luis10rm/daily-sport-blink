import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import PostsList from "@/pages/admin/PostsList";

export const Route = createFileRoute("/admin/posts/")({
  component: () => (
    <ProtectedRoute>
      <PostsList />
    </ProtectedRoute>
  ),
});
