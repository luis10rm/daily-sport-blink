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
  author?: PostAuthor | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePostInput {
  title: string;
  excerpt: string;
  content?: string;
  category_id?: string;
  image_url?: string;
  source_url: string;
  tags?: string[];
  is_sponsored?: boolean;
  is_news_of_day?: boolean;
  published_at?: string;
  created_by?: string;
}

export interface UpdatePostInput extends Partial<CreatePostInput> {
  id: string;
}

const POST_SELECT = `
  *,
  sport_category:sport_categories!category_id(id, slug, name, icon_name, icon_url, bg_color)
`;

// Helper to fetch author data for posts
const fetchAuthorsForPosts = async (posts: any[]): Promise<Post[]> => {
  const authorIds = [...new Set(posts.filter(p => p.created_by).map(p => p.created_by))];
  
  if (authorIds.length === 0) {
    return posts.map(p => ({ ...p, author: null }));
  }

  const { data: authors } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, slug, role_title")
    .in("id", authorIds);

  const authorsMap = new Map(authors?.map(a => [a.id, a]) || []);
  
  return posts.map(p => ({
    ...p,
    author: p.created_by ? authorsMap.get(p.created_by) || null : null,
  }));
};

// Fetch all posts
export const usePosts = () => {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return fetchAuthorsForPosts(data || []);
    },
  });
};

// Fetch posts from today only
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
        .gte("published_at", startOfDay)
        .lte("published_at", endOfDay)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return fetchAuthorsForPosts(data || []);
    },
  });
};

// Fetch posts from last 7 days (for stories)
export const useRecentPosts = () => {
  return useQuery({
    queryKey: ["posts", "recent"],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .gte("published_at", sevenDaysAgo)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return fetchAuthorsForPosts(data || []);
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
        .eq("is_news_of_day", true)
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      const postsWithAuthor = await fetchAuthorsForPosts([data]);
      return postsWithAuthor[0] || null;
    },
  });
};

// Fetch posts for feed (with sponsored in correct position)
export const usePostsFeed = () => {
  return useQuery({
    queryKey: ["posts", "feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("is_news_of_day", false)
        .order("published_at", { ascending: false });

      if (error) throw error;
      
      const posts = await fetchAuthorsForPosts(data || []);
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

// Fetch single post
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
      const postsWithAuthor = await fetchAuthorsForPosts([data]);
      return postsWithAuthor[0];
    },
    enabled: !!id,
  });
};

// Create post mutation
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      const { data, error } = await supabase
        .from("posts")
        .insert([input])
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
