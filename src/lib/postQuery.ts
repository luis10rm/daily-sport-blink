import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { POST_SELECT } from "@/hooks/usePosts";

export interface SsrPost {
  slug: string;
  title: string;
  excerpt?: string | null;
  image_url?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  source_url?: string | null;
  tags?: string[] | null;
  channel?: string | null;
  author?: { display_name?: string | null; slug?: string | null } | null;
  sport_category?: { name?: string | null } | null;
  positive_category?: { slug?: string | null } | null;
}

export const postBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["posts", "public", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return (data as unknown as SsrPost) ?? null;
    },
  });
