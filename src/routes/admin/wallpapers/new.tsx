import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import WallpaperEditor from "@/pages/admin/WallpaperEditor";

export const Route = createFileRoute("/admin/wallpapers/new")({
  component: () => (
    <ProtectedRoute requireAdmin>
      <WallpaperEditor />
    </ProtectedRoute>
  ),
});
