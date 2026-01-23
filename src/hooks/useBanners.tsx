import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type BannerPosition = "home_top" | "home_middle" | "home_bottom";
export type BannerTargetDevice = "all" | "desktop" | "mobile";

export interface Banner {
  id: string;
  title: string;
  description: string | null;
  cta_text: string;
  click_tag: string;
  impression_tag: string | null;
  image_desktop_url: string | null;
  image_mobile_url: string | null;
  position: BannerPosition;
  target_device: BannerTargetDevice;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type BannerInsert = Omit<Banner, "id" | "created_at" | "updated_at">;
export type BannerUpdate = Partial<BannerInsert>;

// Fetch all banners (for admin panel)
export const useBanners = () => {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Banner[];
    },
  });
};

// Fetch single banner by ID
export const useBanner = (id: string | undefined) => {
  return useQuery({
    queryKey: ["banners", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Banner | null;
    },
    enabled: !!id,
  });
};

// Fetch active banner for a specific position (legacy - returns first active banner)
export const useActiveBanner = (position: BannerPosition) => {
  return useQuery({
    queryKey: ["banners", "active", position],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      let query = supabase
        .from("banners")
        .select("*")
        .eq("position", position)
        .eq("is_active", true);
      
      query = query.or(`start_date.is.null,start_date.lte.${now}`);
      
      const { data, error } = await query.limit(10);

      if (error) throw error;
      
      const validBanner = data?.find(banner => {
        if (!banner.end_date) return true;
        return new Date(banner.end_date) >= new Date(now);
      });
      
      return (validBanner as Banner) || null;
    },
  });
};

// Fetch active banner for a specific position AND device (desktop/mobile)
export const useActiveBannerForDevice = (position: BannerPosition, device: "desktop" | "mobile") => {
  return useQuery({
    queryKey: ["banners", "active", position, device],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      // Fetch banners for this position that target this device or all devices
      let query = supabase
        .from("banners")
        .select("*")
        .eq("position", position)
        .eq("is_active", true)
        .or(`target_device.eq.all,target_device.eq.${device}`);
      
      query = query.or(`start_date.is.null,start_date.lte.${now}`);
      
      const { data, error } = await query
        .order("updated_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Filter by end_date and find banner with valid image for this device
      const validBanner = data?.find(banner => {
        // Check date validity
        if (banner.end_date && new Date(banner.end_date) < new Date(now)) {
          return false;
        }
        
        // Check if banner has the right image for this device
        if (device === "desktop") {
          return banner.image_desktop_url && banner.image_desktop_url !== "";
        } else {
          return banner.image_mobile_url && banner.image_mobile_url !== "";
        }
      });
      
      return (validBanner as Banner) || null;
    },
  });
};

// Create banner mutation
export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (banner: BannerInsert) => {
      const { data, error } = await supabase
        .from("banners")
        .insert(banner)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      queryClient.invalidateQueries({ queryKey: ["banners", "active"] });
      toast({
        title: "Baner utworzony",
        description: "Nowy baner został pomyślnie dodany.",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: `Nie udało się utworzyć banera: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Update banner mutation
export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: BannerUpdate }) => {
      const { data, error } = await supabase
        .from("banners")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      queryClient.invalidateQueries({ queryKey: ["banners", "active"] });
      toast({
        title: "Baner zaktualizowany",
        description: "Zmiany zostały zapisane.",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: `Nie udało się zaktualizować banera: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Delete banner mutation
export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      queryClient.invalidateQueries({ queryKey: ["banners", "active"] });
      toast({
        title: "Baner usunięty",
        description: "Baner został pomyślnie usunięty.",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: `Nie udało się usunąć banera: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Toggle banner active status
export const useToggleBannerActive = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("banners")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      queryClient.invalidateQueries({ queryKey: ["banners", "active"] });
      toast({
        title: data.is_active ? "Baner aktywowany" : "Baner dezaktywowany",
        description: data.is_active
          ? "Baner jest teraz widoczny na stronie."
          : "Baner został ukryty.",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: `Nie udało się zmienić statusu banera: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Upload banner image
export const useUploadBannerImage = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      file,
      type,
    }: {
      file: File;
      type: "desktop" | "mobile";
    }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${type}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("banners").getPublicUrl(fileName);

      return data.publicUrl;
    },
    onError: (error) => {
      toast({
        title: "Błąd uploadu",
        description: `Nie udało się przesłać obrazu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
