import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import ReviewsList from "@/pages/admin/ReviewsList";

export const Route = createFileRoute("/admin/recki/")({
  component: () => (
    <ProtectedRoute>
      <ReviewsList />
    </ProtectedRoute>
  ),
});
