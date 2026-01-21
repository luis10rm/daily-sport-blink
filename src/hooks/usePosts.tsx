import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { subDays } from "date-fns";

export type SportCategory = "football" | "basketball" | "tennis" | "f1" | "mma" | "other";

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content?: string | null;
  category: SportCategory;
  image_url?: string | null;
  source_url: string;
  tags: string[];
  is_sponsored: boolean;
  is_news_of_day: boolean;
  published_at: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePostInput {
  title: string;
  excerpt: string;
  content?: string;
  category: SportCategory;
  image_url?: string;
  source_url: string;
  tags?: string[];
  is_sponsored?: boolean;
  is_news_of_day?: boolean;
  published_at?: string;
}

export interface UpdatePostInput extends Partial<CreatePostInput> {
  id: string;
}

// Fetch all posts
export const usePosts = () => {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as Post[];
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
        .select("*")
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
        .select("*")
        .eq("is_news_of_day", true)
        .order("published_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as Post | null;
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
        .select("*")
        .eq("is_news_of_day", false)
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

// Fetch single post
export const usePost = (id: string) => {
  return useQuery({
    queryKey: ["posts", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Post;
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
