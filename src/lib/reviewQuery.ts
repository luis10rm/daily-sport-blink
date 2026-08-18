import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SELECT = `*, category:review_categories(id, name, slug, description, color, sort_order)`;

export interface SsrReview {
  slug: string;
  title: string;
  excerpt?: string | null;
  image_url?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  category?: { slug?: string | null; name?: string | null } | null;
}

export const reviewBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["review", slug],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("reviews")
        .select(SELECT)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as SsrReview) ?? null;
    },
  });
