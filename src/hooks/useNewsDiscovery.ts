import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  list_selector: string | null;
  is_active: boolean;
  last_scanned_at: string | null;
  created_at: string;
}

export interface NewsSuggestion {
  id: string;
  source_id: string | null;
  article_url: string;
  title: string | null;
  excerpt: string | null;
  image_url: string | null;
  published_at: string | null;
  ai_score: number | null;
  ai_reasoning: string | null;
  suggested_category_id: string | null;
  suggested_tags: string[] | null;
  status: string;
  accepted_post_id: string | null;
  discovered_at: string;
  news_sources?: { name: string; url: string } | null;
  sport_categories?: { name: string; slug: string } | null;
}

export const useNewsSources = () => {
  return useQuery({
    queryKey: ["news_sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_sources")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as NewsSource[];
    },
  });
};

export const useCreateNewsSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; url: string; list_selector?: string }) => {
      const { data, error } = await supabase.from("news_sources").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news_sources"] });
      toast.success("Źródło dodane");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateNewsSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<NewsSource> & { id: string }) => {
      const { error } = await supabase.from("news_sources").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["news_sources"] }),
  });
};

export const useDeleteNewsSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news_sources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news_sources"] });
      toast.success("Źródło usunięte");
    },
  });
};

interface SuggestionFilters {
  status?: string;
  sourceId?: string;
  minScore?: number;
}

export const useNewsSuggestions = (filters: SuggestionFilters = {}) => {
  return useQuery({
    queryKey: ["news_suggestions", filters],
    queryFn: async () => {
      let q = supabase
        .from("news_suggestions")
        .select("*, news_sources(name,url), sport_categories:suggested_category_id(name,slug)")
        .order("ai_score", { ascending: false, nullsFirst: false })
        .order("discovered_at", { ascending: false })
        .limit(200);
      if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
      if (filters.sourceId) q = q.eq("source_id", filters.sourceId);
      if (filters.minScore) q = q.gte("ai_score", filters.minScore);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as NewsSuggestion[];
    },
  });
};

export const usePendingSuggestionsCount = () => {
  return useQuery({
    queryKey: ["news_suggestions_pending_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("news_suggestions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });
};

export const useUpdateSuggestionStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, postId }: { id: string; status: string; postId?: string }) => {
      const patch: Record<string, unknown> = { status };
      if (postId) patch.accepted_post_id = postId;
      const { error } = await supabase.from("news_suggestions").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news_suggestions"] });
      qc.invalidateQueries({ queryKey: ["news_suggestions_pending_count"] });
    },
  });
};

export const useScanNewsSources = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sourceId?: string) => {
      const { data, error } = await supabase.functions.invoke("scan-news-sources", {
        body: sourceId ? { source_id: sourceId } : {},
      });
      if (error) throw error;
      return data as { ok: boolean; new_suggestions?: number; details?: unknown };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["news_suggestions"] });
      qc.invalidateQueries({ queryKey: ["news_sources"] });
      qc.invalidateQueries({ queryKey: ["news_suggestions_pending_count"] });
      toast.success(`Skan zakończony — ${data?.new_suggestions ?? 0} nowych propozycji`);
    },
    onError: (e: Error) => toast.error(`Skan nieudany: ${e.message}`),
  });
};
