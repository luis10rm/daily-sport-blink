import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { POST_SELECT, Post } from "./usePosts";

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  post_count: number;
  created_at: string;
  updated_at: string;
}

// Fetch tag by slug
export const useTagBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["tag", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as Tag | null;
    },
    enabled: !!slug,
  });
};

// Fetch posts by tag name
export const usePostsByTag = (tagName: string | undefined) => {
  return useQuery({
    queryKey: ["posts", "tag", tagName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .contains("tags", [tagName])
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as Post[];
    },
    enabled: !!tagName,
  });
};

// Fetch posts by tag slug - optimized to avoid API cascade
export const usePostsByTagSlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["posts", "tagSlug", slug],
    queryFn: async () => {
      // Get tag name first
      const { data: tag } = await supabase
        .from("tags")
        .select("name")
        .eq("slug", slug)
        .single();

      if (!tag) return [];

      // Then fetch posts
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .contains("tags", [tag.name])
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as Post[];
    },
    enabled: !!slug,
  });
};

// Fetch all tags with minimum post count
export const useTags = (minPostCount: number = 1) => {
  return useQuery({
    queryKey: ["tags", minPostCount],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .gte("post_count", minPostCount)
        .order("post_count", { ascending: false });

      if (error) throw error;
      return data as Tag[];
    },
  });
};

// Fetch popular tags (top N by post count)
export const usePopularTags = (limit: number = 10) => {
  return useQuery({
    queryKey: ["tags", "popular", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .gte("post_count", 1)
        .order("post_count", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Tag[];
    },
  });
};
