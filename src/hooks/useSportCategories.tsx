import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SportCategory {
  id: string;
  slug: string;
  name: string;
  icon_name: string | null;
  icon_url: string | null;
  bg_color: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SportCategoryInsert {
  slug: string;
  name: string;
  icon_name?: string | null;
  icon_url?: string | null;
  bg_color: string;
  sort_order?: number;
  is_default?: boolean;
}

export interface SportCategoryUpdate extends Partial<SportCategoryInsert> {
  id: string;
}

// Fetch all sport categories
export const useSportCategories = () => {
  return useQuery({
    queryKey: ["sport-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sport_categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as SportCategory[];
    },
  });
};

// Fetch a single category by ID
export const useSportCategory = (id: string | undefined) => {
  return useQuery({
    queryKey: ["sport-categories", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("sport_categories")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as SportCategory | null;
    },
    enabled: !!id,
  });
};

// Create a new category
export const useCreateSportCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: SportCategoryInsert) => {
      const { data, error } = await supabase
        .from("sport_categories")
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sport-categories"] });
      toast.success("Kategoria została utworzona");
    },
    onError: (error: Error) => {
      toast.error(`Błąd: ${error.message}`);
    },
  });
};

// Update an existing category
export const useUpdateSportCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: SportCategoryUpdate) => {
      const { data, error } = await supabase
        .from("sport_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sport-categories"] });
      toast.success("Kategoria została zaktualizowana");
    },
    onError: (error: Error) => {
      toast.error(`Błąd: ${error.message}`);
    },
  });
};

// Delete a category (with check for posts)
export const useDeleteSportCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First check if any posts are using this category
      const { count, error: countError } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("category_id", id);

      if (countError) throw countError;

      if (count && count > 0) {
        throw new Error(
          `Nie można usunąć kategorii - ${count} ${count === 1 ? "post jest" : "postów jest"} do niej przypisanych`
        );
      }

      const { error } = await supabase
        .from("sport_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sport-categories"] });
      toast.success("Kategoria została usunięta");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Upload category icon
export const useUploadCategoryIcon = () => {
  return useMutation({
    mutationFn: async ({
      file,
      categorySlug,
    }: {
      file: File;
      categorySlug: string;
    }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${categorySlug}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("category-icons")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("category-icons")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    },
    onError: (error: Error) => {
      toast.error(`Błąd uploadu: ${error.message}`);
    },
  });
};

// Reorder categories (batch update sort_order)
export const useReorderSportCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      // Create batch updates for each category
      const updates = orderedIds.map((id, index) => ({
        id,
        sort_order: index,
      }));

      // Update each category's sort_order
      for (const update of updates) {
        const { error } = await supabase
          .from("sport_categories")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);

        if (error) throw error;
      }
    },
    onMutate: async (orderedIds) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["sport-categories"] });

      // Snapshot previous value
      const previousCategories = queryClient.getQueryData<SportCategory[]>([
        "sport-categories",
      ]);

      // Optimistically update
      if (previousCategories) {
        const reorderedCategories = orderedIds
          .map((id, index) => {
            const category = previousCategories.find((c) => c.id === id);
            return category ? { ...category, sort_order: index } : null;
          })
          .filter(Boolean) as SportCategory[];

        queryClient.setQueryData(["sport-categories"], reorderedCategories);
      }

      return { previousCategories };
    },
    onError: (error: Error, _, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(
          ["sport-categories"],
          context.previousCategories
        );
      }
      toast.error(`Błąd zmiany kolejności: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sport-categories"] });
    },
    onSuccess: () => {
      toast.success("Kolejność została zapisana");
    },
  });
};

// Get category by slug (for backwards compatibility)
export const useSportCategoryBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["sport-categories", "slug", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("sport_categories")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as SportCategory | null;
    },
    enabled: !!slug,
  });
};
