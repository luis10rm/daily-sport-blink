import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type BulkPrepareResult = {
  successful: Array<{ suggestion_id: string; post_id: string; slug: string; title: string }>;
  failed: Array<{ suggestion_id: string; error: string }>;
  total: number;
};

export function useBulkPrepareSuggestions() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (suggestion_ids: string[]): Promise<BulkPrepareResult> => {
      const { data, error } = await supabase.functions.invoke<BulkPrepareResult>(
        "bulk-prepare-suggestions",
        { body: { suggestion_ids } }
      );
      if (error) throw error;
      if (!data) throw new Error("Brak odpowiedzi z funkcji");
      return data;
    },
    onSuccess: (data) => {
      const ok = data.successful.length;
      const fail = data.failed.length;
      if (ok > 0 && fail === 0) {
        toast.success(`Opublikowano ${ok} ${pluralize(ok)}`);
      } else if (ok > 0 && fail > 0) {
        toast.warning(`Opublikowano ${ok} z ${data.total}. Błędy: ${fail}`, {
          description: data.failed.map((f) => `• ${f.error}`).join("\n").slice(0, 300),
        });
      } else {
        toast.error("Nie udało się opublikować żadnego artykułu", {
          description: data.failed[0]?.error,
        });
      }
      qc.invalidateQueries({ queryKey: ["news_suggestions"] });
      qc.invalidateQueries({ queryKey: ["news_suggestions_pending_count"] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err: Error) => {
      toast.error("Błąd publikacji zbiorczej", { description: err.message });
    },
  });
}

function pluralize(n: number) {
  if (n === 1) return "artykuł";
  const lastTwo = n % 100;
  const last = n % 10;
  if (lastTwo >= 12 && lastTwo <= 14) return "artykułów";
  if (last >= 2 && last <= 4) return "artykuły";
  return "artykułów";
}
