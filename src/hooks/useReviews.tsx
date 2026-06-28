import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ReviewCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  sort_order: number;
}

export interface Review {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  verdict: string | null;
  score: number | null;
  pros: string[];
  cons: string[];
  gallery: string[];
  cover_image_url: string | null;
  product_name: string | null;
  product_brand: string | null;
  category_id: string | null;
  category?: ReviewCategory | null;
  author_id: string | null;
  status: "draft" | "published";
  published_at: string | null;
  source_url: string | null;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

const SELECT = `*, category:review_categories(id, name, slug, description, color, sort_order)`;

export const useReviewCategories = () => {
  return useQuery({
    queryKey: ["review_categories"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("review_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ReviewCategory[];
    },
  });
};

export const usePublishedReviews = (categorySlug?: string) => {
  return useQuery({
    queryKey: ["reviews", "published", categorySlug ?? "all"],
    queryFn: async () => {
      let q = (supabase as any)
        .from("reviews")
        .select(SELECT)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(60);
      const { data, error } = await q;
      if (error) throw error;
      const items = (data ?? []) as Review[];
      return categorySlug ? items.filter((r) => r.category?.slug === categorySlug) : items;
    },
  });
};

export const useReviewBySlug = (slug?: string) => {
  return useQuery({
    queryKey: ["review", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("reviews")
        .select(SELECT)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Review | null;
    },
  });
};

export const useAllReviewsAdmin = () => {
  return useQuery({
    queryKey: ["reviews", "admin"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("reviews")
        .select(SELECT)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });
};

export const useReviewById = (id?: string) => {
  return useQuery({
    queryKey: ["review", "id", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("reviews")
        .select(SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Review | null;
    },
  });
};

export const useUpsertReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Review> & { id?: string }) => {
      const payload: any = { ...input };
      if (payload.status === "published" && !payload.published_at) {
        payload.published_at = new Date().toISOString();
      }
      const { data, error } = payload.id
        ? await (supabase as any).from("reviews").update(payload).eq("id", payload.id).select().single()
        : await (supabase as any).from("reviews").insert(payload).select().single();
      if (error) throw error;
      return data as Review;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["review"] });
      toast.success("Recenzja zapisana");
    },
    onError: (e: any) => toast.error(e?.message ?? "Błąd zapisu"),
  });
};

export const useDeleteReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Recenzja usunięta");
    },
  });
};
