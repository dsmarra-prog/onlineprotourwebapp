import { pgTable, text, integer, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const careerTable = pgTable("career", {
  id: integer("id").primaryKey().default(1),
  spieler_name: text("spieler_name").notNull().default("Dennis"),
  hat_tourcard: boolean("hat_tourcard").notNull().default(false),
  q_school_punkte: integer("q_school_punkte").notNull().default(0),
  order_of_merit_geld: integer("order_of_merit_geld").notNull().default(0),
  bank_konto: integer("bank_konto").notNull().default(2500),
  saison_jahr: integer("saison_jahr").notNull().default(1),
  turnier_laeuft: boolean("turnier_laeuft").notNull().default(false),
  aktuelles_turnier_index: integer("aktuelles_turnier_index").notNull().default(0),
  aktuelle_runde: integer("aktuelle_runde").notNull().default(0),
  gegner_name: text("gegner_name").notNull().default(""),
  gegner_avg: real("gegner_avg").notNull().default(0),
  stats_spiele: integer("stats_spiele").notNull().default(0),
  stats_siege: integer("stats_siege").notNull().default(0),
  stats_legs_won: integer("stats_legs_won").notNull().default(0),
  stats_legs_lost: integer("stats_legs_lost").notNull().default(0),
  stats_180s: integer("stats_180s").notNull().default(0),
  stats_highest_finish: integer("stats_highest_finish").notNull().default(0),
  stats_avg_history: jsonb("stats_avg_history").notNull().default([]),
  stats_checkout_percent_history: jsonb("stats_checkout_percent_history").notNull().default([]),
  bot_form: jsonb("bot_form").notNull().default({}),
  h2h: jsonb("h2h").notNull().default({}),
  aktiver_sponsor: jsonb("aktiver_sponsor"),
  letzte_schlagzeile: jsonb("letzte_schlagzeile"),
  achievements: jsonb("achievements").notNull().default({}),
  turnier_baum: jsonb("turnier_baum").notNull().default([]),
  bot_rangliste: jsonb("bot_rangliste").notNull().default([]),
  // New columns
  name_set: boolean("name_set").notNull().default(false),
  turnier_verlauf: jsonb("turnier_verlauf").notNull().default([]),
  ranking_verlauf: jsonb("ranking_verlauf").notNull().default([]),
  equipment: jsonb("equipment").notNull().default([]),
  avg_bonus: real("avg_bonus").notNull().default(0),
  checkout_bonus: real("checkout_bonus").notNull().default(0),
  saison_avg_history: jsonb("saison_avg_history").notNull().default([]),
  schwierigkeitsgrad: integer("schwierigkeitsgrad").notNull().default(5),
  spieler_avg: integer("spieler_avg").notNull().default(60),
  turnier_runden_log: jsonb("turnier_runden_log").notNull().default([]),
});

export const insertCareerSchema = createInsertSchema(careerTable);
export type InsertCareer = z.infer<typeof insertCareerSchema>;
export type Career = typeof careerTable.$inferSelect;
