import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import WallpapersList from "@/pages/admin/WallpapersList";

export const Route = createFileRoute("/admin/wallpapers/")({
  component: () => (
    <ProtectedRoute requireAdmin>
      <WallpapersList />
    </ProtectedRoute>
  ),
});
