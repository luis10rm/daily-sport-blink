import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Feedback {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// Submit feedback (public)
export const useSubmitFeedback = () => {
  return useMutation({
    mutationFn: async (message: string) => {
      const { error } = await supabase
        .from("feedback")
        .insert({ message });
      
      if (error) throw error;
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się wysłać feedbacku. Spróbuj ponownie.",
        variant: "destructive",
      });
    },
  });
};

// Fetch all feedback (admin only)
export const useFeedbackList = () => {
  return useQuery({
    queryKey: ["feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Feedback[];
    },
  });
};

// Mark feedback as read (admin only)
export const useMarkFeedbackRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_read }: { id: string; is_read: boolean }) => {
      const { error } = await supabase
        .from("feedback")
        .update({ is_read })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });
};

// Delete feedback (admin only)
export const useDeleteFeedback = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("feedback")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast({
        title: "Usunięto",
        description: "Feedback został usunięty.",
      });
    },
  });
};
