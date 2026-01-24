import { useLocation } from "react-router-dom";
import { WallpaperBackground } from "./WallpaperBackground";

/**
 * Wrapper that conditionally renders WallpaperBackground
 * only on public pages (not admin or auth routes)
 */
export function ConditionalWallpaper() {
  const location = useLocation();
  
  // Don't render wallpaper on admin or auth pages
  if (location.pathname.startsWith("/admin") || location.pathname === "/auth") {
    return null;
  }
  
  return <WallpaperBackground />;
}
