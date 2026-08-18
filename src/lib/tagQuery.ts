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
        .select("name, slug, description, force_index, post_count")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!tag) return null;

      // post_count jest utrzymywany przez sync tagów — ta sama liczba,
      // której używa generator sitemapy, więc reguły index/noindex się nie rozjeżdżają.
      return {
        name: tag.name,
        slug: tag.slug,
        description: (tag as { description?: string | null }).description ?? null,
        forceIndex: (tag as { force_index?: boolean }).force_index ?? false,
        postCount: (tag as { post_count?: number | null }).post_count ?? 0,
      };
    },
    staleTime: 5 * 60_000,
  });

export const MIN_TAG_POSTS_FOR_INDEX = 4;

/** Poprawna polska odmiana: 1 skrót, 2-4 skróty, 5+ skrótów. */
export function pluralizeSkrot(count: number): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (count === 1) return "1 skrót";
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return `${count} skróty`;
  return `${count} skrótów`;
}
