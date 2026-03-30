const BASE = "/api";

export async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
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
  oom_name: string | null;
  created_at: string;
  oom_points: number;
  oom_rank: number;
  oom_tour_type: "pro" | "development" | null;
};

export type TourScheduleEntry = {
  id: number;
  season: number;
  tour_type: "pro" | "development";
  kategorie: "pc" | "m1" | "m2" | "dev_cup" | "dev_major";
  phase: string;
  phase_order: number;
  event_name: string;
  datum: string;
  tag: string;
  uhrzeit: string;
  mode: string;
  qualification: string | null;
  status: "abgeschlossen" | "upcoming" | "laufend";
  external_id: number | null;
};

export type TourTournament = {
  id: number;
  name: string;
  typ: "pc" | "m1" | "m2" | "dev_cup" | "dev_major";
  tour_type: "pro" | "development";
  phase: string | null;
  datum: string;
  status: "offen" | "laufend" | "abgeschlossen";
  legs_format: number;
  max_players: number;
  player_count: number;
  is_test: boolean;
  schedule_id: number | null;
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
  avg_p1: number | null;
  avg_p2: number | null;
  status: string;
  is_bye: boolean;
  autodarts_match_id: string | null;
};

export type TourTournamentDetail = {
  tournament: Omit<TourTournament, "player_count">;
  players: Array<{
    player_id: number;
    seed: number | null;
    confirmed: boolean;
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
  bonus_total: number;
  tournaments_played: number;
  best_result: string;
  results: Array<{
    tournament_id: number;
    tournament_name: string;
    typ: string;
    points: number;
    bonus: number;
    round: string;
  }>;
};

export type TourPlayerProfile = {
  id: number;
  name: string;
  autodarts_username: string;
  created_at: string;
  oom_points: number;
  dev_oom_points: number;
  stats: {
    matches_won: number;
    matches_lost: number;
    win_rate: number;
    legs_won: number;
    legs_lost: number;
    avg_score: number | null;
    first9_avg: number | null;
    double_rate: number | null;
    doubles_hit: number | null;
    doubles_att: number | null;
    tournaments_played: number;
    titles: number;
  };
  tournament_results: Array<{
    tournament_id: number;
    tournament_name: string;
    typ: string;
    tour_type: string;
    round: string;
    points: number;
    dev_points: number;
    matches_won: number;
    matches_lost: number;
    datum: string;
  }>;
  bonus_points: Array<{
    id: number;
    bonus_type: string;
    points: number;
    tournament_id: number;
  }>;
};

export type TourH2H = {
  player: { id: number; name: string; autodarts_username: string };
  opponent: { id: number; name: string; autodarts_username: string };
  wins: number;
  losses: number;
  leg_wins: number;
  leg_losses: number;
  history: Array<{
    match_id: number;
    tournament_id: number;
    tournament_name: string;
    runde: string;
    won: boolean;
    my_score: number;
    opp_score: number;
    my_avg: number | null;
    opp_avg: number | null;
    datum: string;
  }>;
};

export type LiveTickerMatch = {
  tournament_id: number;
  tournament_name: string;
  match_id: number;
  runde: string;
  player1: string;
  player2: string;
  score_p1: number | null;
  score_p2: number | null;
  avg_p1: number | null;
  avg_p2: number | null;
  status: string;
  autodarts_match_id: string | null;
};

export const TYP_LABELS: Record<string, string> = {
  pc: "Players Championship",
  m1: "Major",
  m2: "Grand Final",
  dev_cup: "Development Cup",
  dev_major: "Dev Pre-Finals",
  dev_final: "Dev Grand Final",
};

export const RUNDE_LABELS: Record<string, string> = {
  R64: "Letzte 64",
  R32: "Letzte 32",
  R16: "Achtelfinale",
  QF: "Viertelfinale",
  SF: "Halbfinale",
  F: "Finale",
};
