import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import BannerEditor from "@/pages/admin/BannerEditor";

export const Route = createFileRoute("/admin/banners/new")({
  component: () => (
    <ProtectedRoute>
      <BannerEditor />
    </ProtectedRoute>
  ),
});
