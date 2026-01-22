import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useSetting = (key: string) => {
  return useQuery({
    queryKey: ["settings", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", key)
        .single();

      if (error) {
        // If setting doesn't exist, return null
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }
      return data?.value || null;
    },
  });
};

export const useUpdateSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("settings")
        .update({ 
          value, 
          updated_at: new Date().toISOString() 
        })
        .eq("key", key);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["settings", variables.key] });
      toast.success("Ustawienia zapisane");
    },
    onError: (error) => {
      console.error("Error updating setting:", error);
      toast.error("Nie udało się zapisać ustawień");
    },
  });
};

export const useExtractArticle = () => {
  return useMutation({
    mutationFn: async (url: string) => {
      const { data, error } = await supabase.functions.invoke("extract-article", {
        body: { url },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as {
        title: string;
        excerpt: string;
        category: "football" | "basketball" | "tennis" | "f1" | "mma" | "other";
        tags: string[];
        og_image: string | null;
      };
    },
    onError: (error) => {
      console.error("Error extracting article:", error);
      if (error.message.includes("Rate limit")) {
        toast.error("Zbyt wiele zapytań. Poczekaj chwilę i spróbuj ponownie.");
      } else if (error.message.includes("credits")) {
        toast.error("Brak kredytów AI. Doładuj konto w ustawieniach.");
      } else {
        toast.error("Nie udało się przeanalizować artykułu");
      }
    },
  });
};
