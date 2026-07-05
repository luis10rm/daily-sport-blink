import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase as sb } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Positive categories table not yet in generated types — cast client to any.
const supabase = sb as any;

export interface PositiveCategory {
  id: string;
  slug: string;
  name: string;
  icon_name: string | null;
  icon_url: string | null;
  bg_color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PositiveCategoryInput {
  slug: string;
  name: string;
  icon_name?: string | null;
  icon_url?: string | null;
  bg_color?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export const usePositiveCategories = () => {
  return useQuery({
    queryKey: ["positive-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("positive_categories" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as unknown) as PositiveCategory[];
    },
  });
};

export const usePositiveCategory = (id?: string) => {
  return useQuery({
    queryKey: ["positive-categories", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("positive_categories" as any)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as PositiveCategory | null;
    },
    enabled: !!id,
  });
};

export const usePositiveCategoryBySlug = (slug?: string) => {
  return useQuery({
    queryKey: ["positive-categories", "slug", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("positive_categories" as any)
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as PositiveCategory | null;
    },
    enabled: !!slug,
  });
};

export const useCreatePositiveCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PositiveCategoryInput) => {
      const { data, error } = await supabase
        .from("positive_categories" as any)
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positive-categories"] });
      toast.success("Kategoria została utworzona");
    },
    onError: (e: Error) => toast.error(`Błąd: ${e.message}`),
  });
};

export const useUpdatePositiveCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: PositiveCategoryInput & { id: string }) => {
      const { data, error } = await supabase
        .from("positive_categories" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positive-categories"] });
      toast.success("Kategoria została zaktualizowana");
    },
    onError: (e: Error) => toast.error(`Błąd: ${e.message}`),
  });
};

export const useDeletePositiveCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { count, error: countErr } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("positive_category_id" as any, id);
      if (countErr) throw countErr;
      if (count && count > 0) {
        throw new Error(
          `Nie można usunąć – ${count} ${count === 1 ? "post jest" : "postów jest"} przypisanych do kategorii`,
        );
      }
      const { error } = await supabase
        .from("positive_categories" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positive-categories"] });
      toast.success("Kategoria została usunięta");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
