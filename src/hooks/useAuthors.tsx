import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Author {
  id: string;
  slug: string | null;
  display_name: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  role_title: string | null;
  is_public: boolean;
  social_twitter: string | null;
  social_instagram: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthorUpdateInput {
  slug?: string;
  display_name?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string | null;
  cover_image_url?: string | null;
  role_title?: string;
  is_public?: boolean;
  social_twitter?: string | null;
  social_instagram?: string | null;
}

// Fetch all PUBLIC authors for public page
export const usePublicAuthors = () => {
  return useQuery({
    queryKey: ["public-authors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_public", true)
        .not("slug", "is", null)
        .not("display_name", "is", null)
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
        .from("profiles")
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
        .from("profiles")
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
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Author | null;
    },
    enabled: !!id,
  });
};

// Fetch posts by author ID
export const useAuthorPosts = (authorId: string) => {
  return useQuery({
    queryKey: ["author-posts", authorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, sport_category:sport_categories(*)")
        .eq("created_by", authorId)
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
        .eq("created_by", authorId)
        .lte("published_at", new Date().toISOString());

      if (countError) throw countError;

      // Get most used category
      const { data: categoryData, error: categoryError } = await supabase
        .from("posts")
        .select("category, sport_category:sport_categories(name)")
        .eq("created_by", authorId)
        .lte("published_at", new Date().toISOString());

      if (categoryError) throw categoryError;

      // Calculate most used category
      const categoryCounts = categoryData?.reduce((acc, post) => {
        const categoryName = post.sport_category?.name || post.category;
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topCategory = Object.entries(categoryCounts || {}).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0];

      // Get first post date
      const { data: firstPost, error: firstPostError } = await supabase
        .from("posts")
        .select("published_at")
        .eq("created_by", authorId)
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
        .from("profiles")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["author"] });
      queryClient.invalidateQueries({ queryKey: ["author-by-id"] });
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
