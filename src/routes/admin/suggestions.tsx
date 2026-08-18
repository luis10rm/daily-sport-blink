import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import SuggestionsList from "@/pages/admin/SuggestionsList";

export const Route = createFileRoute("/admin/suggestions")({
  component: () => (
    <ProtectedRoute>
      <SuggestionsList />
    </ProtectedRoute>
  ),
});
