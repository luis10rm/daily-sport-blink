import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import BannersList from "@/pages/admin/BannersList";

export const Route = createFileRoute("/admin/banners/")({
  component: () => (
    <ProtectedRoute>
      <BannersList />
    </ProtectedRoute>
  ),
});
