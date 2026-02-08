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

export interface ExtractionInfo {
  original_text_length: number;
  final_text_length: number;
  used_firecrawl: boolean;
  quality_warning: boolean;
}

export interface ExtractArticleResult {
  title: string;
  excerpt: string;
  content: string;
  category: "football" | "basketball" | "tennis" | "f1" | "mma" | "other";
  tags: string[];
  og_image: string | null;
  extraction_info?: ExtractionInfo;
}

export const useExtractArticle = () => {
  return useMutation({
    mutationFn: async (url: string): Promise<ExtractArticleResult> => {
      const { data, error } = await supabase.functions.invoke("extract-article", {
        body: { url },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as ExtractArticleResult;
    },
    onError: (error) => {
      console.error("Error extracting article:", error);
      if (error.message.includes("Rate limit")) {
        toast.error("Zbyt wiele zapytań. Poczekaj chwilę i spróbuj ponownie.");
      } else if (error.message.includes("credits")) {
        toast.error("Brak kredytów AI. Doładuj konto w ustawieniach.");
      } else if (error.message.includes("za mało") || error.message.includes("znaków")) {
        toast.error(error.message);
      } else {
        toast.error("Nie udało się przeanalizować artykułu");
      }
    },
  });
};

export interface DailySummaryResult {
  title: string;
  excerpt: string;
  content: string;
  suggested_tags: string[];
  posts_count: number;
  date: string;
}

export const useGenerateArticleImage = () => {
  return useMutation({
    mutationFn: async ({
      title,
      excerpt,
      category,
    }: {
      title: string;
      excerpt?: string;
      category?: string;
    }): Promise<{ image_url: string }> => {
      const { data, error } = await supabase.functions.invoke("generate-article-image", {
        body: { title, excerpt, category },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data as { image_url: string };
    },
    onError: (error) => {
      console.error("Error generating article image:", error);
      if (error.message.includes("wiele zapytań") || error.message.includes("Rate limit")) {
        toast.error("Zbyt wiele zapytań AI. Spróbuj ponownie za chwilę.");
      } else if (error.message.includes("kredytów") || error.message.includes("credits")) {
        toast.error("Brak kredytów AI. Doładuj konto.");
      } else {
        toast.error("Nie udało się wygenerować grafiki");
      }
    },
    onSuccess: () => {
      toast.success("Grafika AI wygenerowana!");
    },
  });
};

export const useGenerateDailySummary = () => {
  return useMutation({
    mutationFn: async (date: Date): Promise<DailySummaryResult> => {
      const dateString = date.toISOString().split("T")[0];
      
      const { data, error } = await supabase.functions.invoke("generate-daily-summary", {
        body: { date: dateString },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as DailySummaryResult;
    },
    onError: (error) => {
      console.error("Error generating daily summary:", error);
      if (error.message.includes("No posts found")) {
        toast.error("Brak postów dla wybranej daty");
      } else if (error.message.includes("Rate limit") || error.message.includes("wiele zapytań")) {
        toast.error("Zbyt wiele zapytań AI. Spróbuj ponownie za chwilę.");
      } else if (error.message.includes("credits") || error.message.includes("kredytów")) {
        toast.error("Brak kredytów AI. Doładuj konto w ustawieniach.");
      } else {
        toast.error("Nie udało się wygenerować podsumowania");
      }
    },
    onSuccess: () => {
      toast.success("Podsumowanie dnia wygenerowane!");
    },
  });
};
