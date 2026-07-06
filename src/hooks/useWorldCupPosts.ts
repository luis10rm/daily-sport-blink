import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { POST_SELECT, type Post } from "@/hooks/usePosts";

const WORLD_CUP_CATEGORY_SLUG = "mistrzostwa-swiata-w-pilce-noznej-2026";

/**
 * Fetch ALL posts from World Cup 2026 category.
 * No 7-day limit — this is a dedicated hub for the tournament.
 */
export const useWorldCupPosts = () => {
  return useQuery({
    queryKey: ["worldcup", "posts"],
    queryFn: async () => {
      // First resolve category id by slug
      const { data: category, error: catErr } = await supabase
        .from("sport_categories")
        .select("id")
        .eq("slug", WORLD_CUP_CATEGORY_SLUG)
        .maybeSingle();
      if (catErr) throw catErr;
      if (!category) return [] as Post[];

      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("category_id", category.id)
        .eq("is_hidden" as never, false as never)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Post[];
    },
    staleTime: 60_000,
  });
};
