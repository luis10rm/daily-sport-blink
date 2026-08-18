import { useQuery } from "@tanstack/react-query";
import {
  worldCupMatchesQueryOptions,
  worldCupScorersQueryOptions,
  worldCupStandingsQueryOptions,
} from "@/lib/worldCupQuery";

type Resource = "matches" | "standings" | "scorers" | "teams";

interface ApiResponse<T = unknown> {
  source: "cache" | "upstream" | "stale-cache";
  fetched_at: string;
  data: T;
}

async function fetchResource<T>(resource: Resource): Promise<ApiResponse<T>> {
  const { data, error } = await supabase.functions.invoke("worldcup-data", {
    body: { resource },
  });
  if (error) throw error;
  return data as ApiResponse<T>;
}

// --- Domain types (subset of football-data.org schema) ---
export interface FDTeam {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
}

export interface FDMatch {
  id: number;
  utcDate: string;
  status: "SCHEDULED" | "TIMED" | "IN_PLAY" | "PAUSED" | "FINISHED" | "POSTPONED" | "SUSPENDED" | "CANCELLED";
  matchday?: number;
  stage?: string;
  group?: string | null;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: {
    winner?: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    duration?: string;
    fullTime: { home: number | null; away: number | null };
    halfTime?: { home: number | null; away: number | null };
  };
  minute?: number | null;
}

export interface FDScorer {
  player: { id: number; name: string; nationality?: string };
  team: FDTeam;
  goals: number | null;
  assists: number | null;
  playedMatches?: number | null;
}

export interface FDStandingRow {
  position: number;
  team: FDTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface FDStandingGroup {
  stage: string;
  type: string;
  group?: string | null;
  table: FDStandingRow[];
}

export const useWorldCupMatches = () => useQuery(worldCupMatchesQueryOptions());

export const useWorldCupScorers = () => useQuery(worldCupScorersQueryOptions());

export const useWorldCupStandings = () => useQuery(worldCupStandingsQueryOptions());
