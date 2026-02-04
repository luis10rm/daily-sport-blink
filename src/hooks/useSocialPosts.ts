import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SocialPost {
  id: string;
  post_id: string;
  platform: "facebook" | "twitter" | "instagram";
  status: "pending" | "published" | "failed";
  caption: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  webhook_response: Record<string, unknown> | null;
  created_at: string;
  created_by: string | null;
}

export const useSocialPostsByPostId = (postId: string) => {
  return useQuery({
    queryKey: ["social-posts", postId],
    queryFn: async () => {
      if (!postId) return [];
      
      const { data, error } = await supabase
        .from("social_posts")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SocialPost[];
    },
    enabled: !!postId,
  });
};

export interface PublishToSocialParams {
  post_id: string;
  platform?: "facebook" | "twitter" | "instagram";
  custom_caption?: string;
}

export const usePublishToSocial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ post_id, platform = "facebook", custom_caption }: PublishToSocialParams) => {
      const { data, error } = await supabase.functions.invoke("publish-to-social", {
        body: { post_id, platform, custom_caption },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["social-posts", variables.post_id] });
      toast.success("Post wysłany na Facebook!");
    },
    onError: (error) => {
      console.error("Error publishing to social:", error);
      
      if (error.message.includes("Webhook")) {
        toast.error("Błąd webhooka Make. Sprawdź konfigurację w Ustawieniach.");
      } else if (error.message.includes("autoryzacji") || error.message.includes("uprawnień")) {
        toast.error("Brak uprawnień do publikacji");
      } else {
        toast.error(error.message || "Nie udało się wysłać posta");
      }
    },
  });
};
