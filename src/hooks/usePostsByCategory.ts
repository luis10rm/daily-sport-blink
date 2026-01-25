import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import { Post, POST_SELECT } from "./usePosts";

export const usePostsByCategory = (categorySlug: string | undefined) => {
  return useQuery({
    queryKey: ["posts", "category", categorySlug],
    queryFn: async () => {
      if (!categorySlug) return [];

      // First get the category ID from slug
      const { data: category, error: categoryError } = await supabase
        .from("sport_categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();

      if (categoryError || !category) return [];

      const sevenDaysAgo = subDays(new Date(), 7).toISOString();

      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("category_id", category.id)
        .gte("published_at", sevenDaysAgo)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Post[];
    },
    enabled: !!categorySlug,
  });
};

export const useArchivedPostsByCategory = (categorySlug: string | undefined) => {
  return useQuery({
    queryKey: ["posts", "archive", "category", categorySlug],
    queryFn: async () => {
      if (!categorySlug) return [];

      // First get the category ID from slug
      const { data: category, error: categoryError } = await supabase
        .from("sport_categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();

      if (categoryError || !category) return [];

      const sevenDaysAgo = subDays(new Date(), 7).toISOString();

      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("category_id", category.id)
        .lt("published_at", sevenDaysAgo)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Post[];
    },
    enabled: !!categorySlug,
  });
};
