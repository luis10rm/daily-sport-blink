import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FDMatch, FDScorer, FDStandingGroup } from "@/hooks/useWorldCupData";

interface ApiResponse<T = unknown> {
  source: "cache" | "upstream" | "stale-cache";
  fetched_at: string;
  data: T;
}

async function fetchResource<T>(resource: "matches" | "standings" | "scorers" | "teams") {
  const { data, error } = await supabase.functions.invoke("worldcup-data", {
    body: { resource },
  });
  if (error) throw error;
  return data as ApiResponse<T>;
}

export const worldCupMatchesQueryOptions = () =>
  queryOptions({
    queryKey: ["worldcup", "matches"],
    queryFn: () => fetchResource<{ matches: FDMatch[] }>("matches"),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

export const worldCupScorersQueryOptions = () =>
  queryOptions({
    queryKey: ["worldcup", "scorers"],
    queryFn: () => fetchResource<{ scorers: FDScorer[] }>("scorers"),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

export const worldCupStandingsQueryOptions = () =>
  queryOptions({
    queryKey: ["worldcup", "standings"],
    queryFn: () => fetchResource<{ standings: FDStandingGroup[] }>("standings"),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

const STAGE_LABEL: Record<string, string> = {
  ROUND_OF_16: "1/8 finału",
  QUARTER_FINALS: "1/4 finału",
  SEMI_FINALS: "półfinały",
  THIRD_PLACE: "mecz o 3. miejsce",
  FINAL: "finał",
};

/**
 * Builds a search-intent oriented title/description for the hub from live match data.
 * Query data for "mistrzostwa świata fifa 2026" expects results/schedule, so the
 * current stage and the latest results are surfaced directly in the SERP snippet.
 */
export function buildWorldCupMeta(matches: FDMatch[] | undefined) {
  const fallbackTitle = "Mistrzostwa Świata 2026: wyniki, drabinka i terminarz | Szortsy";
  const fallbackDescription =
    "Mistrzostwa Świata FIFA 2026 na żywo: wyniki meczów, drabinka fazy pucharowej od 1/8 finału do finału, terminarz z godzinami, transmisje, tabele grup i najlepsi strzelcy.";

  if (!matches?.length) {
    return { title: fallbackTitle, description: fallbackDescription };
  }

  const knockout = matches.filter((m) => m.stage && m.stage !== "GROUP_STAGE");
  const finished = knockout
    .filter((m) => m.status === "FINISHED")
    .sort((a, b) => +new Date(b.utcDate) - +new Date(a.utcDate));
  const upcoming = knockout
    .filter((m) => m.status === "SCHEDULED" || m.status === "TIMED")
    .sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate));
  const live = knockout.find((m) => m.status === "IN_PLAY" || m.status === "PAUSED");

  const currentStage = live?.stage ?? upcoming[0]?.stage ?? finished[0]?.stage;
  const stageLabel = currentStage ? STAGE_LABEL[currentStage] : undefined;

  const title = stageLabel
    ? `MŚ 2026: ${stageLabel} — wyniki, drabinka, terminarz | Szortsy`
    : fallbackTitle;

  const shortName = (t: { shortName?: string; name: string }) => t.shortName || t.name;
  const parts: string[] = [];

  if (live) {
    parts.push(
      `Na żywo: ${shortName(live.homeTeam)} ${live.score.fullTime.home ?? 0}:${
        live.score.fullTime.away ?? 0
      } ${shortName(live.awayTeam)}.`,
    );
  }
  if (finished[0]) {
    parts.push(
      `Ostatni wynik: ${shortName(finished[0].homeTeam)} ${finished[0].score.fullTime.home ?? 0}:${
        finished[0].score.fullTime.away ?? 0
      } ${shortName(finished[0].awayTeam)}.`,
    );
  }
  if (upcoming[0]) {
    const d = new Date(upcoming[0].utcDate);
    const when = d.toLocaleString("pl-PL", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Warsaw",
    });
    parts.push(
      `Następny mecz: ${shortName(upcoming[0].homeTeam)} — ${shortName(
        upcoming[0].awayTeam,
      )}, ${when}.`,
    );
  }
  parts.push("Pełna drabinka, terminarz, tabele grup i strzelcy.");

  const description = parts.join(" ").slice(0, 300);
  return { title, description };
}
