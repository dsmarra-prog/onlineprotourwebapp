import { pgTable, text, integer, boolean, real, serial, timestamp } from "drizzle-orm/pg-core";

export const tourPlayersTable = pgTable("tour_players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  autodarts_username: text("autodarts_username").notNull().unique(),
  oom_name: text("oom_name"),
  discord_id: text("discord_id"),
  pin_hash: text("pin_hash").notNull(),
  autodarts_refresh_token: text("autodarts_refresh_token"),
  is_admin: boolean("is_admin").notNull().default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const tourScheduleTable = pgTable("tour_schedule", {
  id: serial("id").primaryKey(),
  season: integer("season").notNull().default(1),
  tour_type: text("tour_type").notNull(),
  kategorie: text("kategorie").notNull(),
  phase: text("phase").notNull(),
  phase_order: integer("phase_order").notNull(),
  event_name: text("event_name").notNull(),
  datum: text("datum").notNull(),
  tag: text("tag").notNull(),
  uhrzeit: text("uhrzeit").notNull(),
  mode: text("mode").notNull(),
  qualification: text("qualification"),
  status: text("status").notNull().default("upcoming"),
  external_id: integer("external_id"),
});

// Imported OOM standings from onlineprotour.eu
export const tourOomStandingsTable = pgTable("tour_oom_standings", {
  id: serial("id").primaryKey(),
  season: integer("season").notNull().default(1),
  rank: integer("rank").notNull(),
  autodarts_username: text("autodarts_username").notNull(),
  total_points: integer("total_points").notNull(),
  bonus_points: integer("bonus_points").notNull().default(0),
  tournaments_played: integer("tournaments_played").notNull(),
  tournament_breakdown: text("tournament_breakdown").notNull().default("{}"), // JSON
  last_updated: text("last_updated").notNull(),
});

export const tourTournamentsTable = pgTable("tour_tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  typ: text("typ").notNull(),
  tour_type: text("tour_type").notNull().default("pro"),
  phase: text("phase"),
  datum: text("datum").notNull(),
  uhrzeit: text("uhrzeit"),
  status: text("status").notNull().default("offen"),
  legs_format: integer("legs_format").notNull().default(5),
  max_players: integer("max_players").notNull().default(32),
  admin_pin: text("admin_pin").notNull(),
  schedule_id: integer("schedule_id"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  is_test: boolean("is_test").notNull().default(false),
  random_draw: boolean("random_draw").notNull().default(false),
});

export const tourMatchesTable = pgTable("tour_matches", {
  id: serial("id").primaryKey(),
  tournament_id: integer("tournament_id").notNull(),
  runde: text("runde").notNull(),
  match_nr: integer("match_nr").notNull(),
  player1_id: integer("player1_id"),
  player2_id: integer("player2_id"),
  winner_id: integer("winner_id"),
  score_p1: integer("score_p1"),
  score_p2: integer("score_p2"),
  avg_p1: real("avg_p1"),
  avg_p2: real("avg_p2"),
  // Extended stats from Autodarts (populated on match completion)
  first9_p1: real("first9_p1"),
  first9_p2: real("first9_p2"),
  doubles_hit_p1: integer("doubles_hit_p1"),
  doubles_att_p1: integer("doubles_att_p1"),
  doubles_hit_p2: integer("doubles_hit_p2"),
  doubles_att_p2: integer("doubles_att_p2"),
  count_180s_p1: integer("count_180s_p1"),
  count_180s_p2: integer("count_180s_p2"),
  high_checkout_p1: integer("high_checkout_p1"),
  high_checkout_p2: integer("high_checkout_p2"),
  status: text("status").notNull().default("ausstehend"),
  is_bye: boolean("is_bye").notNull().default(false),
  autodarts_match_id: text("autodarts_match_id"),
  discord_thread_id: text("discord_thread_id"),
  discord_score_message_id: text("discord_score_message_id"),
});

export const tourPlayerAchievementsTable = pgTable("tour_player_achievements", {
  id: serial("id").primaryKey(),
  player_id: integer("player_id").notNull(),
  achievement_key: text("achievement_key").notNull(),
  unlocked_at: timestamp("unlocked_at").defaultNow().notNull(),
  match_id: integer("match_id"),
  tournament_id: integer("tournament_id"),
  meta: text("meta"),
});

export const tourEntriesTable = pgTable("tour_entries", {
  id: serial("id").primaryKey(),
  tournament_id: integer("tournament_id").notNull(),
  player_id: integer("player_id").notNull(),
  seed: integer("seed"),
  confirmed: boolean("confirmed").default(false),
  status: text("status").notNull().default("approved"),
});

export const tourBonusPointsTable = pgTable("tour_bonus_points", {
  id: serial("id").primaryKey(),
  player_id: integer("player_id").notNull(),
  tournament_id: integer("tournament_id").notNull(),
  bonus_type: text("bonus_type").notNull(),
  points: integer("points").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Development Tour OOM standings (separate from Pro Tour OOM)
export const tourDevOomStandingsTable = pgTable("tour_dev_oom_standings", {
  id: serial("id").primaryKey(),
  season: integer("season").notNull().default(1),
  rank: integer("rank").notNull(),
  autodarts_username: text("autodarts_username").notNull(),
  total_points: integer("total_points").notNull(),
  bonus_points: integer("bonus_points").notNull().default(0),
  tournaments_played: integer("tournaments_played").notNull(),
  tournament_breakdown: text("tournament_breakdown").notNull().default("{}"),
  last_updated: text("last_updated").notNull(),
});

export const tourPushSubscriptionsTable = pgTable("tour_push_subscriptions", {
  id: serial("id").primaryKey(),
  player_id: integer("player_id").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const tourMatchMessagesTable = pgTable("tour_match_messages", {
  id: serial("id").primaryKey(),
  match_id: integer("match_id").notNull(),
  player_id: integer("player_id").notNull(),
  message: text("message").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const tourMatchDisputesTable = pgTable("tour_match_disputes", {
  id: serial("id").primaryKey(),
  match_id: integer("match_id").notNull(),
  player_id: integer("player_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("offen"), // offen | bearbeitet | geschlossen
  admin_note: text("admin_note"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const tourMatchFairnessTable = pgTable("tour_match_fairness", {
  id: serial("id").primaryKey(),
  match_id: integer("match_id").notNull(),
  player_id: integer("player_id").notNull(),
  vote: text("vote").notNull(), // up | down
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type TourPlayer = typeof tourPlayersTable.$inferSelect;
export type TourPushSubscription = typeof tourPushSubscriptionsTable.$inferSelect;
export const systemSettingsTable = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type TourSchedule = typeof tourScheduleTable.$inferSelect;
export type TourOomStanding = typeof tourOomStandingsTable.$inferSelect;
export type TourTournament = typeof tourTournamentsTable.$inferSelect;
export type TourMatch = typeof tourMatchesTable.$inferSelect;
export type TourEntry = typeof tourEntriesTable.$inferSelect;
export type TourBonusPoints = typeof tourBonusPointsTable.$inferSelect;
export type TourDevOomStanding = typeof tourDevOomStandingsTable.$inferSelect;
export type TourPlayerAchievement = typeof tourPlayerAchievementsTable.$inferSelect;
export type TourMatchMessage = typeof tourMatchMessagesTable.$inferSelect;
export type TourMatchDispute = typeof tourMatchDisputesTable.$inferSelect;
export type TourMatchFairness = typeof tourMatchFairnessTable.$inferSelect;
