import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SsrTagSeo {
  name: string;
  slug: string;
  description: string | null;
  forceIndex: boolean;
  postCount: number;
}

/**
 * Minimalne dane tagu potrzebne do wygenerowania meta po stronie serwera.
 * Liczba artykułów decyduje o index/noindex (progi ustalone w strategii SEO).
 */
export const tagSeoQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["tag-seo", slug],
    queryFn: async (): Promise<SsrTagSeo | null> => {
      const { data: tag, error } = await supabase
        .from("tags")
        .select("name, slug, description, force_index")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!tag) return null;

      const { count } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .contains("tags", [tag.name])
        .eq("is_hidden", false);

      return {
        name: tag.name,
        slug: tag.slug,
        description: (tag as { description?: string | null }).description ?? null,
        forceIndex: (tag as { force_index?: boolean }).force_index ?? false,
        postCount: count ?? 0,
      };
    },
    staleTime: 5 * 60_000,
  });

export const MIN_TAG_POSTS_FOR_INDEX = 4;
