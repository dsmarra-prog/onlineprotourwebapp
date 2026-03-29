import { pgTable, text, integer, boolean, real, serial, timestamp } from "drizzle-orm/pg-core";

export const tourPlayersTable = pgTable("tour_players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  autodarts_username: text("autodarts_username").notNull().unique(),
  pin_hash: text("pin_hash").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const tourTournamentsTable = pgTable("tour_tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  typ: text("typ").notNull(),
  datum: text("datum").notNull(),
  status: text("status").notNull().default("offen"),
  legs_format: integer("legs_format").notNull().default(5),
  max_players: integer("max_players").notNull().default(32),
  admin_pin: text("admin_pin").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
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
  status: text("status").notNull().default("ausstehend"),
  is_bye: boolean("is_bye").notNull().default(false),
  autodarts_match_id: text("autodarts_match_id"),
});

export const tourEntriesTable = pgTable("tour_entries", {
  id: serial("id").primaryKey(),
  tournament_id: integer("tournament_id").notNull(),
  player_id: integer("player_id").notNull(),
  seed: integer("seed"),
});

export type TourPlayer = typeof tourPlayersTable.$inferSelect;
export type TourTournament = typeof tourTournamentsTable.$inferSelect;
export type TourMatch = typeof tourMatchesTable.$inferSelect;
export type TourEntry = typeof tourEntriesTable.$inferSelect;
