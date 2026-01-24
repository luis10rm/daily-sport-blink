import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Wallpaper {
  id: string;
  name: string;
  background_image_url: string | null;
  left_wing_url: string | null;
  right_wing_url: string | null;
  background_color: string;
  click_url: string;
  linked_banner_id: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  min_screen_width: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type WallpaperInsert = Omit<Wallpaper, "id" | "created_at" | "updated_at">;
export type WallpaperUpdate = Partial<WallpaperInsert>;

/**
 * Fetch the currently active wallpaper (if any)
 * Only returns wallpaper that is active and within date range
 */
export function useActiveWallpaper() {
  return useQuery({
    queryKey: ["wallpaper", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallpapers")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching active wallpaper:", error);
        return null;
      }

      // Additional client-side validation for date range
      if (data) {
        const now = new Date();
        const startDate = data.start_date ? new Date(data.start_date) : null;
        const endDate = data.end_date ? new Date(data.end_date) : null;

        if (startDate && now < startDate) return null;
        if (endDate && now > endDate) return null;
      }

      return data as Wallpaper | null;
    },
    staleTime: 60 * 1000, // Cache for 1 minute
  });
}

/**
 * Fetch all wallpapers (for admin)
 */
export function useWallpapers() {
  return useQuery({
    queryKey: ["wallpapers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallpapers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Wallpaper[];
    },
  });
}

/**
 * Fetch single wallpaper by ID (for admin editor)
 */
export function useWallpaper(id: string | undefined) {
  return useQuery({
    queryKey: ["wallpaper", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("wallpapers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Wallpaper;
    },
    enabled: !!id,
  });
}
