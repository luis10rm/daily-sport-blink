import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SsrSportCategory {
  slug: string;
  name: string;
  postCount: number;
}

/** Dane kategorii sportowej potrzebne do meta po stronie serwera. */
export const sportCategorySeoQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["sport-category-seo", slug],
    queryFn: async (): Promise<SsrSportCategory | null> => {
      const { data, error } = await supabase
        .from("sport_categories")
        .select("slug, name, id")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const { count } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("category_id", (data as { id: string }).id)
        .eq("is_hidden", false);

      return { slug: data.slug, name: data.name, postCount: count ?? 0 };
    },
    staleTime: 5 * 60_000,
  });

export interface SsrAuthor {
  slug: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  role_title: string | null;
}

/** Publiczny profil autora (widok authors_public — bez pól wrażliwych). */
export const authorSeoQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["author-seo", slug],
    queryFn: async (): Promise<SsrAuthor | null> => {
      const { data, error } = await supabase
        .from("authors_public" as never)
        .select("slug, display_name, bio, avatar_url, role_title")
        .eq("slug", slug)
        .limit(1);
      if (error) throw error;
      const rows = data as unknown as SsrAuthor[] | null;
      return rows?.[0] ?? null;
    },
    staleTime: 5 * 60_000,
  });
