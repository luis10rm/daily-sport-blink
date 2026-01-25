import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Author {
  id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  role_title: string | null;
  is_public: boolean;
  social_twitter: string | null;
  social_instagram: string | null;
  linked_user_id: string | null;
  linked_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthorCreateInput {
  display_name: string;
  slug: string;
  bio?: string | null;
  avatar_url?: string | null;
  cover_image_url?: string | null;
  role_title?: string;
  is_public?: boolean;
  social_twitter?: string | null;
  social_instagram?: string | null;
  linked_user_id?: string | null;
  linked_email?: string | null;
}

export interface AuthorUpdateInput {
  display_name?: string;
  slug?: string;
  bio?: string | null;
  avatar_url?: string | null;
  cover_image_url?: string | null;
  role_title?: string;
  is_public?: boolean;
  social_twitter?: string | null;
  social_instagram?: string | null;
  linked_user_id?: string | null;
  linked_email?: string | null;
}

// Fetch all PUBLIC authors for public page
export const usePublicAuthors = () => {
  return useQuery({
    queryKey: ["public-authors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("authors")
        .select("*")
        .eq("is_public", true)
        .order("display_name", { ascending: true });

      if (error) throw error;
      return data as Author[];
    },
  });
};

// Fetch public author by slug
export const useAuthor = (slug: string) => {
  return useQuery({
    queryKey: ["author", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("authors")
        .select("*")
        .eq("slug", slug)
        .eq("is_public", true)
        .maybeSingle();

      if (error) throw error;
      return data as Author | null;
    },
    enabled: !!slug,
  });
};

// Fetch all authors for admin
export const useAuthors = () => {
  return useQuery({
    queryKey: ["authors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("authors")
        .select("*")
        .order("display_name", { ascending: true });

      if (error) throw error;
      return data as Author[];
    },
  });
};

// Fetch author by ID for editing
export const useAuthorById = (id: string) => {
  return useQuery({
    queryKey: ["author-by-id", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("authors")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Author | null;
    },
    enabled: !!id && id !== "new",
  });
};

// Fetch author by linked user ID
export const useAuthorByUserId = (userId: string) => {
  return useQuery({
    queryKey: ["author-by-user-id", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("authors")
        .select("*")
        .eq("linked_user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as Author | null;
    },
    enabled: !!userId,
  });
};

// Fetch posts by author ID
export const useAuthorPosts = (authorId: string) => {
  return useQuery({
    queryKey: ["author-posts", authorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, sport_category:sport_categories!fk_posts_category(*)")
        .eq("author_id", authorId)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!authorId,
  });
};

// Fetch author stats
export const useAuthorStats = (authorId: string) => {
  return useQuery({
    queryKey: ["author-stats", authorId],
    queryFn: async () => {
      // Get posts count
      const { count: postsCount, error: countError } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", authorId)
        .lte("published_at", new Date().toISOString());

      if (countError) throw countError;

      // Get most used category
      const { data: categoryData, error: categoryError } = await supabase
        .from("posts")
        .select("category_id, sport_category:sport_categories!fk_posts_category(name)")
        .eq("author_id", authorId)
        .lte("published_at", new Date().toISOString());

      if (categoryError) throw categoryError;

      // Calculate most used category
      const categoryCounts = (categoryData as any[])?.reduce((acc, post) => {
        const categoryName = post.sport_category?.name || "Inne";
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topCategory = Object.entries(categoryCounts || {}).sort(
        ([, a], [, b]) => (b as number) - (a as number)
      )[0]?.[0];

      // Get first post date
      const { data: firstPost, error: firstPostError } = await supabase
        .from("posts")
        .select("published_at")
        .eq("author_id", authorId)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (firstPostError) throw firstPostError;

      return {
        postsCount: postsCount || 0,
        topCategory: topCategory || null,
        firstPostDate: firstPost?.published_at || null,
      };
    },
    enabled: !!authorId,
  });
};

// Create new author
export const useCreateAuthor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: AuthorCreateInput) => {
      const { data: author, error } = await supabase
        .from("authors")
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return author as Author;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["public-authors"] });
      toast({
        title: "Autor utworzony",
        description: "Nowy profil autora został pomyślnie dodany.",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: `Nie udało się utworzyć autora: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Update author profile
export const useUpdateAuthor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: AuthorUpdateInput;
    }) => {
      const { error } = await supabase
        .from("authors")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["author"] });
      queryClient.invalidateQueries({ queryKey: ["author-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["public-authors"] });
      toast({
        title: "Profil zaktualizowany",
        description: "Zmiany zostały zapisane pomyślnie.",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: `Nie udało się zaktualizować profilu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Delete author
export const useDeleteAuthor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("authors")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["public-authors"] });
      toast({
        title: "Autor usunięty",
        description: "Profil autora został usunięty.",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: `Nie udało się usunąć autora: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Generate slug from name
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
