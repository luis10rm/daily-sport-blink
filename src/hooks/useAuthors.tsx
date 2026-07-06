import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Public author interface (from authors_public view - no sensitive fields)
export interface PublicAuthor {
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
  created_at: string;
  updated_at: string;
}

// Full author interface (for admin - includes linked_user_id but NOT email)
export interface Author extends PublicAuthor {
  linked_user_id: string | null;
}

// Author with email (fetched separately from author_emails table)
export interface AuthorWithEmail extends Author {
  email?: string | null;
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
}

// Fetch all PUBLIC authors for public page (uses secure view without sensitive fields)
export const usePublicAuthors = () => {
  return useQuery({
    queryKey: ["public-authors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("authors_public" as any)
        .select("*");

      if (error) throw error;
      
      // Sort and return with correct type
      const authors = (data as unknown as PublicAuthor[]) || [];
      return authors.sort((a, b) => a.display_name.localeCompare(b.display_name));
    },
  });
};

// Fetch public author by slug (uses secure view without sensitive fields)
export const useAuthor = (slug: string) => {
  return useQuery({
    queryKey: ["author", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("authors_public" as any)
        .select("*")
        .eq("slug", slug)
        .limit(1);

      if (error) throw error;
      
      const authors = data as unknown as PublicAuthor[];
      return authors?.[0] || null;
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

// Fetch author by ID for editing (includes email from separate table)
export const useAuthorById = (id: string) => {
  return useQuery({
    queryKey: ["author-by-id", id],
    queryFn: async () => {
      // Fetch author data
      const { data: authorData, error: authorError } = await supabase
        .from("authors")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (authorError) throw authorError;
      if (!authorData) return null;

      // Fetch email from separate secure table
      const { data: emailData, error: emailError } = await supabase
        .from("author_emails")
        .select("email")
        .eq("author_id", id)
        .maybeSingle();

      // Email fetch might fail for non-admins, that's ok
      const email = emailError ? null : emailData?.email;

      return {
        ...authorData,
        email,
      } as AuthorWithEmail;
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
        .eq("is_hidden" as never, false as never)
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
        .eq("is_hidden" as never, false as never)
        .lte("published_at", new Date().toISOString());

      if (countError) throw countError;

      // Get most used category
      const { data: categoryData, error: categoryError } = await supabase
        .from("posts")
        .select("category_id, sport_category:sport_categories!fk_posts_category(name)")
        .eq("author_id", authorId)
        .eq("is_hidden" as never, false as never)
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

// Create new author (with optional email in separate table)
export const useCreateAuthor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: AuthorCreateInput & { email?: string | null }) => {
      const { email, ...authorData } = data;
      
      // Create author
      const { data: author, error } = await supabase
        .from("authors")
        .insert([authorData])
        .select()
        .single();

      if (error) throw error;

      // If email provided, insert into author_emails table
      if (email && author) {
        const { error: emailError } = await supabase
          .from("author_emails")
          .insert([{ author_id: author.id, email }]);
        
        if (emailError) {
          console.error("Failed to save author email:", emailError);
        }
      }

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

// Update author profile (with optional email in separate table)
export const useUpdateAuthor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: AuthorUpdateInput & { email?: string | null };
    }) => {
      const { email, ...authorData } = data;
      
      // Update author
      const { error } = await supabase
        .from("authors")
        .update(authorData)
        .eq("id", id);

      if (error) throw error;

      // Handle email update in separate table
      if (email !== undefined) {
        // Check if email record exists
        const { data: existingEmail } = await supabase
          .from("author_emails")
          .select("id")
          .eq("author_id", id)
          .maybeSingle();

        if (email && email.trim()) {
          if (existingEmail) {
            // Update existing email
            await supabase
              .from("author_emails")
              .update({ email })
              .eq("author_id", id);
          } else {
            // Insert new email
            await supabase
              .from("author_emails")
              .insert([{ author_id: id, email }]);
          }
        } else if (existingEmail) {
          // Delete email if empty
          await supabase
            .from("author_emails")
            .delete()
            .eq("author_id", id);
        }
      }
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
