import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PatronSettings {
  enabled: boolean;
  prefix_text: string;
  patron_name: string;
  patron_logo_url?: string;
  cta_text?: string;
  cta_url?: string;
  cta_text_b?: string;
  cta_url_b?: string;
  background_color: string;
  text_color: string;
  style: "solid" | "gradient" | "glass";
  dismissible: boolean;
}

const DEFAULT_PATRON_SETTINGS: PatronSettings = {
  enabled: false,
  prefix_text: "Głównym patronem serwisu jest",
  patron_name: "",
  patron_logo_url: "",
  cta_text: "",
  cta_url: "",
  cta_text_b: "",
  cta_url_b: "",
  background_color: "#1e3a5f",
  text_color: "#ffffff",
  style: "solid",
  dismissible: true,
};

export const usePatronSettings = () => {
  return useQuery({
    queryKey: ["settings", "site_patron"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "site_patron")
        .maybeSingle();

      if (error) {
        console.error("Error fetching patron settings:", error);
        return DEFAULT_PATRON_SETTINGS;
      }

      if (!data?.value) {
        return DEFAULT_PATRON_SETTINGS;
      }

      try {
        return JSON.parse(data.value) as PatronSettings;
      } catch {
        console.error("Error parsing patron settings JSON");
        return DEFAULT_PATRON_SETTINGS;
      }
    },
  });
};

export const useUpdatePatronSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: PatronSettings) => {
      const { error } = await supabase
        .from("settings")
        .update({
          value: JSON.stringify(settings),
          updated_at: new Date().toISOString(),
        })
        .eq("key", "site_patron");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "site_patron"] });
      toast.success("Ustawienia patrona zapisane");
    },
    onError: (error) => {
      console.error("Error updating patron settings:", error);
      toast.error("Nie udało się zapisać ustawień patrona");
    },
  });
};
