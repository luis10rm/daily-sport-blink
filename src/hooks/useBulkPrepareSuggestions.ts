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
          description: data.failed.map((f) => `• ${friendlyError(f.error)}`).join("\n").slice(0, 400),
        });
      } else {
        toast.error("Nie udało się opublikować żadnego artykułu", {
          description: friendlyError(data.failed[0]?.error),
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

function friendlyError(msg?: string): string {
  if (!msg) return "Nieznany błąd";
  const m = msg.toLowerCase();
  if (m.includes("statement timeout") || m.includes("deadlock")) {
    return "Baza była przeciążona — spróbuj ponownie dla tych pozycji.";
  }
  if (m.includes("extract-article") && /5\d\d/.test(m)) {
    return "Nie udało się wyciągnąć treści ze źródła (błąd serwera).";
  }
  if (m.includes("extract-article")) {
    return "Nie udało się wyciągnąć treści ze źródła.";
  }
  if (m.includes("ai nie zwróciło")) {
    return "AI nie zwróciło tytułu/opisu — spróbuj ponownie.";
  }
  if (m.includes("brak kategorii")) {
    return "Brak kategorii dla tego artykułu (i brak domyślnej).";
  }
  return msg;
}
