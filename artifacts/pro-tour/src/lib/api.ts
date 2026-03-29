const BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export type TourPlayer = {
  id: number;
  name: string;
  autodarts_username: string;
  created_at: string;
  oom_points: number;
  oom_rank: number;
};

export type TourTournament = {
  id: number;
  name: string;
  typ: "players_championship" | "european_tour" | "world_series" | "major";
  datum: string;
  status: "offen" | "laufend" | "abgeschlossen";
  legs_format: number;
  max_players: number;
  player_count: number;
  winner_name: string | null;
};

export type TourMatch = {
  id: number;
  tournament_id: number;
  runde: string;
  match_nr: number;
  player1_id: number | null;
  player2_id: number | null;
  player1_name: string | null;
  player2_name: string | null;
  winner_id: number | null;
  score_p1: number | null;
  score_p2: number | null;
  status: string;
  is_bye: boolean;
};

export type TourTournamentDetail = {
  tournament: Omit<TourTournament, "player_count" | "winner_name">;
  players: Array<{
    player_id: number;
    seed: number | null;
    name: string;
    autodarts_username: string;
  }>;
  matches: TourMatch[];
  rounds: string[];
};

export type TourOomEntry = {
  rank: number;
  player_id: number;
  player_name: string;
  autodarts_username: string;
  total_points: number;
  tournaments_played: number;
  best_result: string;
  results: Array<{
    tournament_name: string;
    typ: string;
    points: number;
    round: string;
  }>;
};

export type TourPlayerProfile = {
  player: TourPlayer;
  tournament_results: Array<{
    tournament_id: number;
    tournament_name: string;
    tournament_type: string;
    best_round: string;
    points: number;
  }>;
  wins: number;
  losses: number;
};

export const TYP_LABELS: Record<string, string> = {
  players_championship: "Players Championship",
  european_tour: "European Tour",
  world_series: "World Series",
  major: "Major",
};

export const RUNDE_LABELS: Record<string, string> = {
  R64: "Runde 64",
  R32: "Runde 32",
  R16: "Runde 16",
  QF: "Viertelfinale",
  SF: "Halbfinale",
  F: "Finale",
};
