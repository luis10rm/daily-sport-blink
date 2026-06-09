import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WORLD_CUP_END } from "@/lib/worldCupTheme";

export type TournamentMode = "off" | "worldcup_2026";

/**
 * Reads the global `tournament_mode` setting (publicly readable).
 * Returns the active mode, automatically forcing "off" after the tournament end date
 * even if admin forgets to flip the switch.
 */
export const useTournamentMode = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["settings", "tournament_mode"],
    queryFn: async (): Promise<TournamentMode> => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "tournament_mode")
        .maybeSingle();

      if (error) {
        console.error("[useTournamentMode] read failed", error);
        return "off";
      }
      const raw = (data?.value || "off").trim().replace(/^"|"$/g, "");
      if (raw === "worldcup_2026") return "worldcup_2026";
      return "off";
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Safety: auto-disable after the tournament ends
  const now = new Date();
  let mode: TournamentMode = data ?? "off";
  if (mode === "worldcup_2026" && now > WORLD_CUP_END) {
    mode = "off";
  }

  return {
    mode,
    isWorldCup: mode === "worldcup_2026",
    isLoading,
  };
};
