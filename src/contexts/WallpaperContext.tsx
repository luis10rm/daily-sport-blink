import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { useActiveWallpaper, Wallpaper } from "@/hooks/useWallpaper";

interface WallpaperContextValue {
  wallpaper: Wallpaper | null;
  isLoading: boolean;
  isTakeoverActive: boolean;
  linkedBannerId: string | null;
  isScreenWideEnough: boolean;
}

const WallpaperContext = createContext<WallpaperContextValue>({
  wallpaper: null,
  isLoading: true,
  isTakeoverActive: false,
  linkedBannerId: null,
  isScreenWideEnough: false,
});

export const useWallpaperContext = () => useContext(WallpaperContext);

interface WallpaperProviderProps {
  children: React.ReactNode;
}

export function WallpaperProvider({ children }: WallpaperProviderProps) {
  const { data: wallpaper, isLoading } = useActiveWallpaper();
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  // Track screen width for responsiveness
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const value = useMemo(() => {
    const minWidth = wallpaper?.min_screen_width ?? 1280;
    const isScreenWideEnough = screenWidth >= minWidth;

    return {
      wallpaper: wallpaper ?? null,
      isLoading,
      isTakeoverActive: !!wallpaper && isScreenWideEnough,
      linkedBannerId: wallpaper?.linked_banner_id ?? null,
      isScreenWideEnough,
    };
  }, [wallpaper, isLoading, screenWidth]);

  return (
    <WallpaperContext.Provider value={value}>
      {children}
    </WallpaperContext.Provider>
  );
}
