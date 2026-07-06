import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { subDays } from "date-fns";

export interface PostCategory {
  id: string;
  slug: string;
  name: string;
  icon_name: string | null;
  icon_url: string | null;
  bg_color: string;
}

export interface PostAuthor {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  slug: string | null;
  role_title: string | null;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string | null;
  category_id?: string | null;
  sport_category?: PostCategory | null;
  image_url?: string | null;
  source_url: string;
  tags: string[];
  is_sponsored: boolean;
  is_news_of_day: boolean;
  published_at: string;
  created_by?: string | null;
  author_id?: string | null;
  author?: PostAuthor | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePostInput {
  title: string;
  excerpt: string;
  content?: string;
  slug?: string;
  category_id?: string;
  image_url?: string;
  source_url: string;
  tags?: string[];
  is_sponsored?: boolean;
  is_news_of_day?: boolean;
  published_at?: string;
  created_by?: string;
  author_id?: string;
}

export interface UpdatePostInput extends Partial<CreatePostInput> {
  id: string;
}

export const POST_SELECT = `
  *,
  sport_category:sport_categories!fk_posts_category(id, slug, name, icon_name, icon_url, bg_color),
  positive_category:positive_categories!posts_positive_category_id_fkey(id, slug, name, icon_name, icon_url, bg_color),
  author:authors(id, display_name, avatar_url, slug, role_title)
`;

// Fetch all posts
export const usePosts = () => {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("is_hidden" as never, false as never)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as Post[];
    },
  });
};

// Fetch posts by specific date (YYYY-MM-DD)
export const usePostsByDate = (date: string) => {
  return useQuery({
    queryKey: ["posts", "date", date],
    queryFn: async () => {
      const parsed = new Date(date + "T00:00:00");
      if (isNaN(parsed.getTime())) return [] as Post[];

      const startOfDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0).toISOString();
      const endOfDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999).toISOString();

      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("is_hidden" as never, false as never)
        .gte("published_at", startOfDay)
        .lte("published_at", endOfDay)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as Post[];
    },
    enabled: !!date,
  });
};

// Fetch posts from today only (sport channel)
export const useTodaysPosts = () => {
  return useQuery({
    queryKey: ["posts", "today"],
    queryFn: async () => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();
      
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("channel" as never, "sport" as never)
        .gte("published_at", startOfDay)
        .lte("published_at", endOfDay)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as Post[];
    },
  });
};

// Fetch posts from last 7 days (for stories) - sport channel
export const useRecentPosts = () => {
  return useQuery({
    queryKey: ["posts", "recent"],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("channel" as never, "sport" as never)
        .gte("published_at", sevenDaysAgo)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as Post[];
    },
  });
};

// Fetch news of the day
export const useNewsOfTheDay = () => {
  return useQuery({
    queryKey: ["posts", "newsOfDay"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("channel" as never, "sport" as never)
        .eq("is_news_of_day", true)
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Post | null;
    },
  });
};

// Fetch posts for feed (with sponsored in correct position) - limited to 7 days
export const usePostsFeed = () => {
  return useQuery({
    queryKey: ["posts", "feed"],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("channel" as never, "sport" as never)
        .eq("is_news_of_day", false)
        .gte("published_at", sevenDaysAgo)
        .order("published_at", { ascending: false });

      if (error) throw error;
      
      const posts = data as Post[];
      const sponsored = posts.find(p => p.is_sponsored);
      const nonSponsored = posts.filter(p => !p.is_sponsored);
      
      if (sponsored && nonSponsored.length > 0) {
        const [first, ...rest] = nonSponsored;
        return [first, sponsored, ...rest];
      }
      
      return posts;
    },
  });
};

// Fetch archived posts (older than 7 days)
export const useArchivedPosts = (filters?: {
  categoryId?: string;
}) => {
  return useQuery({
    queryKey: ["posts", "archive", filters],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      
      let query = supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("channel" as never, "sport" as never)
        .lt("published_at", sevenDaysAgo)
        .order("published_at", { ascending: false });

      if (filters?.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Post[];
    },
  });
};

// Fetch single post (for admin editor)
export const usePost = (id: string) => {
  return useQuery({
    queryKey: ["posts", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Post;
    },
    enabled: !!id,
  });
};

// Fetch single post by slug (for public BlinkPage)
export const usePostBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["posts", "public", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as Post | null;
    },
    enabled: !!slug,
  });
};

// Create post mutation
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      // slug is auto-generated by database trigger if not provided
      const { data, error } = await supabase
        .from("posts")
        .insert([input as any])
        .select()
        .single();

      if (error) throw error;
      return data as Post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: "Sukces!",
        description: "Post został utworzony.",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Update post mutation
export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdatePostInput) => {
      const { data, error } = await supabase
        .from("posts")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: "Sukces!",
        description: "Post został zaktualizowany.",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Delete post mutation
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: "Sukces!",
        description: "Post został usunięty.",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
