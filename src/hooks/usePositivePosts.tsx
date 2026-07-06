import { useQuery } from "@tanstack/react-query";
import { supabase as sb } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import type { Post, PostAuthor } from "./usePosts";

const supabase = sb as any;

export interface PositiveCategoryRef {
  id: string;
  slug: string;
  name: string;
  icon_name: string | null;
  icon_url: string | null;
  bg_color: string | null;
}

export interface PositivePost extends Omit<Post, "sport_category"> {
  channel: "positive";
  positive_category_id?: string | null;
  positive_category?: PositiveCategoryRef | null;
}

// Full post row + join to positive_categories + author. We rely on the FK from
// posts.positive_category_id → positive_categories(id).
const POSITIVE_POST_SELECT = `
  *,
  positive_category:positive_categories!posts_positive_category_id_fkey(id, slug, name, icon_name, icon_url, bg_color),
  author:authors(id, display_name, avatar_url, slug, role_title)
`;

// Public feed (last 7 days, positive channel only)
export const usePositivePostsFeed = () => {
  return useQuery({
    queryKey: ["positive-posts", "feed"],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data, error } = await supabase
        .from("posts")
        .select(POSITIVE_POST_SELECT)
        .eq("channel", "positive")
        .eq("is_hidden", false)
        .gte("published_at", sevenDaysAgo)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data as unknown) as PositivePost[];
    },
  });
};

export const usePositivePostsByCategory = (categorySlug?: string) => {
  return useQuery({
    queryKey: ["positive-posts", "category", categorySlug],
    queryFn: async () => {
      if (!categorySlug) return [] as PositivePost[];
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data: cat, error: cErr } = await supabase
        .from("positive_categories")
        .select("id")
        .eq("slug", categorySlug)
        .maybeSingle();
      if (cErr) throw cErr;
      if (!cat) return [] as PositivePost[];
      const { data, error } = await supabase
        .from("posts")
        .select(POSITIVE_POST_SELECT)
        .eq("channel", "positive")
        .eq("is_hidden", false)
        .eq("positive_category_id", (cat as any).id)
        .gte("published_at", sevenDaysAgo)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data as unknown) as PositivePost[];
    },
    enabled: !!categorySlug,
  });
};

// Admin: all positive posts (no date limit)
export const useAllPositivePosts = () => {
  return useQuery({
    queryKey: ["positive-posts", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(POSITIVE_POST_SELECT)
        .eq("channel", "positive")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data as unknown) as PositivePost[];
    },
  });
};

// Today's positive posts
export const useTodaysPositivePosts = () => {
  return useQuery({
    queryKey: ["positive-posts", "today"],
    queryFn: async () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString();
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();
      const { data, error } = await supabase
        .from("posts")
        .select(POSITIVE_POST_SELECT)
        .eq("channel", "positive")
        .eq("is_hidden", false)
        .gte("published_at", start)
        .lte("published_at", end)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data as unknown) as PositivePost[];
    },
  });
};
