import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ReviewRequest {
  id: string;
  title: string;
  normalized_title: string;
  votes: number;
  is_visible: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

/** Public list (RLS returns only visible rows for anon visitors). */
export const useReviewRequests = () => {
  return useQuery({
    queryKey: ["review-requests", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_requests")
        .select("*")
        .eq("is_visible", true)
        .order("is_pinned", { ascending: false })
        .order("votes", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return (data ?? []) as ReviewRequest[];
    },
    staleTime: 60_000,
  });
};

export const useSubmitReviewRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase.rpc("submit_review_request", { _title: title });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row as { id: string; title: string; votes: number; is_new: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-requests"] });
    },
    onError: () => {
      toast({
        title: "Nie udało się zapisać",
        description: "Spróbuj ponownie za chwilę.",
        variant: "destructive",
      });
    },
  });
};

export const useVoteReviewRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("vote_review_request", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-requests"] });
    },
    onError: () => {
      toast({
        title: "Nie udało się zapisać głosu",
        description: "Spróbuj ponownie za chwilę.",
        variant: "destructive",
      });
    },
  });
};

/** Admin list — includes hidden rows. */
export const useAdminReviewRequests = (sort: "votes" | "created_at" = "votes") => {
  return useQuery({
    queryKey: ["review-requests", "admin", sort],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_requests")
        .select("*")
        .order(sort, { ascending: false });

      if (error) throw error;
      return (data ?? []) as ReviewRequest[];
    },
  });
};

export const useUpdateReviewRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: { id: string } & Partial<Pick<ReviewRequest, "title" | "votes" | "is_visible" | "is_pinned">>) => {
      const { error } = await supabase.from("review_requests").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-requests"] });
    },
    onError: (error: Error) => {
      toast({ title: "Błąd zapisu", description: error.message, variant: "destructive" });
    },
  });
};

export const useCreateReviewRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase.rpc("submit_review_request", { _title: title });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-requests"] });
      toast({ title: "Dodano", description: "Pozycja jest już na liście." });
    },
    onError: (error: Error) => {
      toast({ title: "Błąd", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteReviewRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("review_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-requests"] });
      toast({ title: "Usunięto", description: "Pozycja została usunięta." });
    },
    onError: (error: Error) => {
      toast({ title: "Błąd", description: error.message, variant: "destructive" });
    },
  });
};
