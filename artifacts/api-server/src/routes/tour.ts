import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  tourPlayersTable,
  tourScheduleTable,
  tourOomStandingsTable,
  tourDevOomStandingsTable,
  tourTournamentsTable,
  tourMatchesTable,
  tourEntriesTable,
  tourBonusPointsTable,
  tourPushSubscriptionsTable,
  tourPlayerAchievementsTable,
  systemSettingsTable,
  tourMatchMessagesTable,
  tourMatchDisputesTable,
  tourMatchFairnessTable,
} from "@workspace/db";
import { eq, and, desc, or } from "drizzle-orm";
import crypto from "crypto";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails("mailto:admin@onlineprotour.de", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}
import {
  notifyRegistration,
  notifyTournamentStart,
  notifyMatchResult,
  createMatchThreadForMatch,
  notifyTournamentComplete,
  notifyOomUpdate,
  getDiscordSettings,
  saveDiscordSettings,
  postLiveScoreToThread,
  updateLiveScoreMessage,
  postMatchResultToThread,
} from "../discord.js";

const router: IRouter = Router();

// ─── Real OOM Points System (onlineprotour.eu) ──────────────────────────────
// kategorie: 'pc' | 'm1' | 'm2' | 'dev_cup' | 'dev_major'
const OOM_POINTS: Record<string, Record<string, number>> = {
  pc: {
    Sieger: 1000,
    Finale: 600,
    Halbfinale: 400,
    Viertelfinale: 250,
    Achtelfinale: 150,
    "Letzte 32": 75,
    Teilnahme: 25,
  },
  m1: {
    Sieger: 1500,
    Finale: 900,
    Halbfinale: 600,
    Viertelfinale: 375,
    Achtelfinale: 225,
    "Letzte 32": 125,
    Teilnahme: 50,
  },
  m2: {
    Sieger: 2000,
    Finale: 1200,
    Halbfinale: 800,
    Viertelfinale: 500,
    Achtelfinale: 300,
    "Letzte 32": 150,
    Teilnahme: 100,
  },
  // Development Cup (DC1–DC6 und weitere): gleiche Struktur wie PC
  dev_cup: {
    Sieger: 1000,
    Finale: 600,
    Halbfinale: 400,
    Viertelfinale: 250,
    Achtelfinale: 150,
    "Letzte 32": 75,
    Teilnahme: 25,
  },
  // Dev Pre-Finals (April Major, May Major): gleiche Struktur wie M1
  dev_major: {
    Sieger: 1500,
    Finale: 900,
    Halbfinale: 600,
    Viertelfinale: 375,
    Achtelfinale: 225,
    "Letzte 32": 125,
    Teilnahme: 50,
  },
  // Dev Grand Final: gleiche Struktur wie M2
  dev_final: {
    Sieger: 2000,
    Finale: 1200,
    Halbfinale: 800,
    Viertelfinale: 500,
    Achtelfinale: 300,
    "Letzte 32": 150,
    Teilnahme: 100,
  },
};

const BONUS_POINTS: Record<string, number> = {
  "9darter": 500,
  bigfish: 100,
};

// Parse German date DD.MM.YYYY or ISO YYYY-MM-DD to ISO string for sorting
function parseDatumToISO(datum: string): string {
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(datum)) {
    const [d, m, y] = datum.split(".");
    return `${y}-${m}-${d}`;
  }
  return datum;
}

// ─── Development Tour OOM Seed Data ─────────────────────────────────────────
// DC1–DC6 abgeschlossen. Daten werden vom Admin über /tour/dev-oom/seed importiert.
const DEV_OOM_SEED_DATA: {
  season: number; rank: number; autodarts_username: string; total_points: number;
  bonus_points: number; tournaments_played: number; tournament_breakdown: string; last_updated: string;
}[] = [
  { season: 1, rank: 1, autodarts_username: "veterdarto180", total_points: 1650, bonus_points: 0, tournaments_played: 4, tournament_breakdown: JSON.stringify([{"t":"DC2","p":25},{"t":"DC3","p":600},{"t":"DC4","p":1000},{"t":"DC5","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 2, autodarts_username: "spinpuke", total_points: 1600, bonus_points: 0, tournaments_played: 5, tournament_breakdown: JSON.stringify([{"t":"DC1","p":25},{"t":"DC2","p":150},{"t":"DC4","p":25},{"t":"DC5","p":1000},{"t":"DC6","p":400}]), last_updated: "30.03.2026" },
  { season: 1, rank: 3, autodarts_username: "babu9435", total_points: 1400, bonus_points: 0, tournaments_played: 3, tournament_breakdown: JSON.stringify([{"t":"DC1","p":1000},{"t":"DC2","p":250},{"t":"DC4","p":150}]), last_updated: "30.03.2026" },
  { season: 1, rank: 4, autodarts_username: "roman910433", total_points: 1325, bonus_points: 0, tournaments_played: 6, tournament_breakdown: JSON.stringify([{"t":"DC1","p":25},{"t":"DC2","p":250},{"t":"DC3","p":25},{"t":"DC4","p":25},{"t":"DC5","p":600},{"t":"DC6","p":400}]), last_updated: "30.03.2026" },
  { season: 1, rank: 5, autodarts_username: "redstar10.", total_points: 1275, bonus_points: 0, tournaments_played: 3, tournament_breakdown: JSON.stringify([{"t":"DC4","p":25},{"t":"DC5","p":250},{"t":"DC6","p":1000}]), last_updated: "30.03.2026" },
  { season: 1, rank: 6, autodarts_username: "the_maniac040", total_points: 1250, bonus_points: 0, tournaments_played: 3, tournament_breakdown: JSON.stringify([{"t":"DC1","p":250},{"t":"DC2","p":400},{"t":"DC4","p":600}]), last_updated: "30.03.2026" },
  { season: 1, rank: 7, autodarts_username: "superseppensepp", total_points: 1100, bonus_points: 0, tournaments_played: 4, tournament_breakdown: JSON.stringify([{"t":"DC1","p":150},{"t":"DC3","p":400},{"t":"DC4","p":400},{"t":"DC5","p":150}]), last_updated: "30.03.2026" },
  { season: 1, rank: 8, autodarts_username: "pasqualo5693", total_points: 1050, bonus_points: 0, tournaments_played: 3, tournament_breakdown: JSON.stringify([{"t":"DC2","p":1000},{"t":"DC3","p":25},{"t":"DC4","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 9, autodarts_username: "dartmitbart.", total_points: 1000, bonus_points: 0, tournaments_played: 2, tournament_breakdown: JSON.stringify([{"t":"DC1","p":600},{"t":"DC5","p":400}]), last_updated: "30.03.2026" },
  { season: 1, rank: 10, autodarts_username: "thommy_the_gun_44538", total_points: 1000, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC3","p":1000}]), last_updated: "30.03.2026" },
  { season: 1, rank: 11, autodarts_username: "mighty_maggo", total_points: 850, bonus_points: 0, tournaments_played: 5, tournament_breakdown: JSON.stringify([{"t":"DC1","p":25},{"t":"DC2","p":250},{"t":"DC3","p":150},{"t":"DC4","p":400},{"t":"DC5","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 12, autodarts_username: "lohoff44", total_points: 825, bonus_points: 0, tournaments_played: 5, tournament_breakdown: JSON.stringify([{"t":"DC1","p":25},{"t":"DC3","p":25},{"t":"DC4","p":150},{"t":"DC5","p":25},{"t":"DC6","p":600}]), last_updated: "30.03.2026" },
  { season: 1, rank: 13, autodarts_username: "jaykopp_1988", total_points: 675, bonus_points: 0, tournaments_played: 3, tournament_breakdown: JSON.stringify([{"t":"DC1","p":400},{"t":"DC3","p":25},{"t":"DC5","p":250}]), last_updated: "30.03.2026" },
  { season: 1, rank: 14, autodarts_username: "rafi19931", total_points: 675, bonus_points: 0, tournaments_played: 4, tournament_breakdown: JSON.stringify([{"t":"DC1","p":150},{"t":"DC2","p":25},{"t":"DC4","p":250},{"t":"DC5","p":250}]), last_updated: "30.03.2026" },
  { season: 1, rank: 15, autodarts_username: "chriko91", total_points: 650, bonus_points: 0, tournaments_played: 2, tournament_breakdown: JSON.stringify([{"t":"DC3","p":400},{"t":"DC4","p":250}]), last_updated: "30.03.2026" },
  { season: 1, rank: 16, autodarts_username: "marhol13_70756", total_points: 650, bonus_points: 0, tournaments_played: 2, tournament_breakdown: JSON.stringify([{"t":"DC4","p":250},{"t":"DC5","p":400}]), last_updated: "30.03.2026" },
  { season: 1, rank: 17, autodarts_username: "puetten77", total_points: 600, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC2","p":600}]), last_updated: "30.03.2026" },
  { season: 1, rank: 18, autodarts_username: "infernohunter1405", total_points: 575, bonus_points: 0, tournaments_played: 4, tournament_breakdown: JSON.stringify([{"t":"DC1","p":250},{"t":"DC2","p":25},{"t":"DC3","p":150},{"t":"DC4","p":150}]), last_updated: "30.03.2026" },
  { season: 1, rank: 19, autodarts_username: "mawoit", total_points: 575, bonus_points: 0, tournaments_played: 5, tournament_breakdown: JSON.stringify([{"t":"DC1","p":250},{"t":"DC2","p":25},{"t":"DC3","p":25},{"t":"DC4","p":250},{"t":"DC5","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 20, autodarts_username: "quasi_4400", total_points: 550, bonus_points: 0, tournaments_played: 3, tournament_breakdown: JSON.stringify([{"t":"DC3","p":250},{"t":"DC4","p":150},{"t":"DC5","p":150}]), last_updated: "30.03.2026" },
  { season: 1, rank: 21, autodarts_username: "uwe_madhouse", total_points: 550, bonus_points: 0, tournaments_played: 2, tournament_breakdown: JSON.stringify([{"t":"DC1","p":150},{"t":"DC2","p":400}]), last_updated: "30.03.2026" },
  { season: 1, rank: 22, autodarts_username: "bernybonebreaker.", total_points: 450, bonus_points: 0, tournaments_played: 4, tournament_breakdown: JSON.stringify([{"t":"DC1","p":250},{"t":"DC2","p":25},{"t":"DC3","p":25},{"t":"DC4","p":150}]), last_updated: "30.03.2026" },
  { season: 1, rank: 23, autodarts_username: "djbounceger", total_points: 425, bonus_points: 0, tournaments_played: 3, tournament_breakdown: JSON.stringify([{"t":"DC1","p":25},{"t":"DC3","p":250},{"t":"DC4","p":150}]), last_updated: "30.03.2026" },
  { season: 1, rank: 24, autodarts_username: "perzy_07", total_points: 400, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC1","p":400}]), last_updated: "30.03.2026" },
  { season: 1, rank: 25, autodarts_username: "sx197", total_points: 350, bonus_points: 0, tournaments_played: 5, tournament_breakdown: JSON.stringify([{"t":"DC1","p":25},{"t":"DC2","p":25},{"t":"DC3","p":25},{"t":"DC4","p":25},{"t":"DC5","p":250}]), last_updated: "30.03.2026" },
  { season: 1, rank: 26, autodarts_username: "manu791904", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: JSON.stringify([{"t":"DC3","p":25},{"t":"DC4","p":25},{"t":"DC5","p":250},{"t":"DC6","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 27, autodarts_username: "polo1501", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: JSON.stringify([{"t":"DC1","p":25},{"t":"DC2","p":25},{"t":"DC4","p":25},{"t":"DC5","p":250}]), last_updated: "30.03.2026" },
  { season: 1, rank: 28, autodarts_username: "revilocb", total_points: 325, bonus_points: 0, tournaments_played: 3, tournament_breakdown: JSON.stringify([{"t":"DC1","p":150},{"t":"DC2","p":25},{"t":"DC3","p":150}]), last_updated: "30.03.2026" },
  { season: 1, rank: 29, autodarts_username: "caostommy.", total_points: 300, bonus_points: 0, tournaments_played: 2, tournament_breakdown: JSON.stringify([{"t":"DC1","p":150},{"t":"DC2","p":150}]), last_updated: "30.03.2026" },
  { season: 1, rank: 30, autodarts_username: ".teggy_weggy", total_points: 275, bonus_points: 0, tournaments_played: 2, tournament_breakdown: JSON.stringify([{"t":"DC1","p":25},{"t":"DC2","p":250}]), last_updated: "30.03.2026" },
  { season: 1, rank: 31, autodarts_username: "haui75", total_points: 250, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC3","p":250}]), last_updated: "30.03.2026" },
  { season: 1, rank: 32, autodarts_username: "maxmustermann12", total_points: 250, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC5","p":250}]), last_updated: "30.03.2026" },
  { season: 1, rank: 33, autodarts_username: "rupal492", total_points: 250, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC5","p":250}]), last_updated: "30.03.2026" },
  { season: 1, rank: 34, autodarts_username: "schalli1988", total_points: 250, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC3","p":250}]), last_updated: "30.03.2026" },
  { season: 1, rank: 35, autodarts_username: "coolness2punkt0", total_points: 200, bonus_points: 0, tournaments_played: 3, tournament_breakdown: JSON.stringify([{"t":"DC1","p":25},{"t":"DC3","p":150},{"t":"DC4","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 36, autodarts_username: "d9music", total_points: 200, bonus_points: 0, tournaments_played: 3, tournament_breakdown: JSON.stringify([{"t":"DC1","p":150},{"t":"DC3","p":25},{"t":"DC4","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 37, autodarts_username: "mirmlinger", total_points: 175, bonus_points: 0, tournaments_played: 2, tournament_breakdown: JSON.stringify([{"t":"DC1","p":150},{"t":"DC2","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 38, autodarts_username: "roevergaming", total_points: 175, bonus_points: 0, tournaments_played: 2, tournament_breakdown: JSON.stringify([{"t":"DC2","p":150},{"t":"DC5","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 39, autodarts_username: "baf01552", total_points: 150, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC3","p":150}]), last_updated: "30.03.2026" },
  { season: 1, rank: 40, autodarts_username: "shiouk", total_points: 150, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC2","p":150}]), last_updated: "30.03.2026" },
  { season: 1, rank: 41, autodarts_username: "tobi1888", total_points: 150, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC4","p":150}]), last_updated: "30.03.2026" },
  { season: 1, rank: 42, autodarts_username: "x999jey", total_points: 150, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC1","p":150}]), last_updated: "30.03.2026" },
  { season: 1, rank: 43, autodarts_username: "holgik66", total_points: 75, bonus_points: 0, tournaments_played: 3, tournament_breakdown: JSON.stringify([{"t":"DC1","p":25},{"t":"DC3","p":25},{"t":"DC4","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 44, autodarts_username: "dartcore25_23442", total_points: 50, bonus_points: 0, tournaments_played: 2, tournament_breakdown: JSON.stringify([{"t":"DC3","p":25},{"t":"DC4","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 45, autodarts_username: "dcschiltornboyz", total_points: 50, bonus_points: 0, tournaments_played: 2, tournament_breakdown: JSON.stringify([{"t":"DC2","p":25},{"t":"DC3","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 46, autodarts_username: "tobi1879.", total_points: 50, bonus_points: 0, tournaments_played: 2, tournament_breakdown: JSON.stringify([{"t":"DC3","p":25},{"t":"DC4","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 47, autodarts_username: "zorax0681", total_points: 50, bonus_points: 0, tournaments_played: 2, tournament_breakdown: JSON.stringify([{"t":"DC1","p":25},{"t":"DC3","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 48, autodarts_username: "benbuttons", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC2","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 49, autodarts_username: "dcgartenzwerge", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC5","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 50, autodarts_username: "dt09_83", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC2","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 51, autodarts_username: "grauwolfjan", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC1","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 52, autodarts_username: "ironprecision", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC4","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 53, autodarts_username: "sc3ptiix", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC2","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 54, autodarts_username: "super_mario1981", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC6","p":25}]), last_updated: "30.03.2026" },
  { season: 1, rank: 55, autodarts_username: "wummanizer", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: JSON.stringify([{"t":"DC2","p":25}]), last_updated: "30.03.2026" },
];

// ─── Season 1 Schedule Data ─────────────────────────────────────────────────
const SEASON1_SCHEDULE = [
  // Phase 1 – Sprint Phase (alle abgeschlossen)
  { phase: "Phase 1 – Saisonstart (Sprint Phase)", phase_order: 1, tour_type: "pro", kategorie: "pc", event_name: "Players Championship 1", datum: "18.01.2026", tag: "SO", uhrzeit: "19:00", mode: "Bo5", qualification: null, status: "abgeschlossen", external_id: 5 },
  { phase: "Phase 1 – Saisonstart (Sprint Phase)", phase_order: 1, tour_type: "pro", kategorie: "pc", event_name: "Players Championship 2", datum: "22.01.2026", tag: "DO", uhrzeit: "20:00", mode: "Bo5", qualification: null, status: "abgeschlossen", external_id: 6 },
  { phase: "Phase 1 – Saisonstart (Sprint Phase)", phase_order: 1, tour_type: "pro", kategorie: "pc", event_name: "Players Championship 3", datum: "25.01.2026", tag: "SO", uhrzeit: "19:00", mode: "Bo5", qualification: null, status: "abgeschlossen", external_id: 7 },
  { phase: "Phase 1 – Saisonstart (Sprint Phase)", phase_order: 1, tour_type: "pro", kategorie: "pc", event_name: "Players Championship 4", datum: "29.01.2026", tag: "DO", uhrzeit: "20:00", mode: "Bo5", qualification: null, status: "abgeschlossen", external_id: 8 },
  // Dev Tour Start (alle abgeschlossen)
  { phase: "Development Tour – Start", phase_order: 2, tour_type: "development", kategorie: "dev_cup", event_name: "Development Cup 1", datum: "01.02.2026", tag: "SO", uhrzeit: "19:00", mode: "Bo3", qualification: null, status: "abgeschlossen", external_id: 9 },
  { phase: "Development Tour – Start", phase_order: 2, tour_type: "development", kategorie: "dev_cup", event_name: "Development Cup 2", datum: "05.02.2026", tag: "DO", uhrzeit: "20:00", mode: "Bo3", qualification: null, status: "abgeschlossen", external_id: 10 },
  // Phase 1 Fortsetzung (alle abgeschlossen)
  { phase: "Phase 1 – Fortsetzung & Endspurt", phase_order: 3, tour_type: "pro", kategorie: "pc", event_name: "Players Championship 5", datum: "08.02.2026", tag: "SO", uhrzeit: "19:00", mode: "Bo5", qualification: null, status: "abgeschlossen", external_id: 11 },
  { phase: "Phase 1 – Fortsetzung & Endspurt", phase_order: 3, tour_type: "pro", kategorie: "pc", event_name: "Players Championship 6", datum: "19.02.2026", tag: "DO", uhrzeit: "20:00", mode: "Bo5", qualification: null, status: "abgeschlossen", external_id: 12 },
  { phase: "Phase 1 – Fortsetzung & Endspurt", phase_order: 3, tour_type: "pro", kategorie: "pc", event_name: "Players Championship 7", datum: "01.03.2026", tag: "SO", uhrzeit: "19:00", mode: "Bo5", qualification: null, status: "abgeschlossen", external_id: 13 },
  // Dev Tour Fortsetzung (alle abgeschlossen)
  { phase: "Development Tour – Fortsetzung", phase_order: 4, tour_type: "development", kategorie: "dev_cup", event_name: "Development Cup 3", datum: "15.02.2026", tag: "SO", uhrzeit: "20:00", mode: "Bo3", qualification: null, status: "abgeschlossen", external_id: 14 },
  { phase: "Development Tour – Fortsetzung", phase_order: 4, tour_type: "development", kategorie: "dev_cup", event_name: "Development Cup 4", datum: "22.02.2026", tag: "SO", uhrzeit: "19:00", mode: "Bo3", qualification: null, status: "abgeschlossen", external_id: 16 },
  { phase: "Development Tour – Fortsetzung", phase_order: 4, tour_type: "development", kategorie: "dev_cup", event_name: "Development Cup 5", datum: "05.03.2026", tag: "DO", uhrzeit: "20:00", mode: "Bo3", qualification: null, status: "abgeschlossen", external_id: 15 },
  { phase: "Development Tour – Fortsetzung", phase_order: 4, tour_type: "development", kategorie: "dev_cup", event_name: "Development Cup 6", datum: "21.03.2026", tag: "SA", uhrzeit: "19:00", mode: "Bo3", qualification: null, status: "abgeschlossen", external_id: 29 },
  // Major 1 – Spring Open (abgeschlossen)
  { phase: "Major 1 – The Spring Open", phase_order: 5, tour_type: "pro", kategorie: "m1", event_name: "Spring Open 2026", datum: "15.03.2026", tag: "SO", uhrzeit: "17:00", mode: "Bo11", qualification: "Top 32 OoM", status: "abgeschlossen", external_id: 17 },
  // Phase 2 – Tactical Phase
  { phase: "Phase 2 – Tactical Phase", phase_order: 6, tour_type: "pro", kategorie: "pc", event_name: "Players Championship 8", datum: "26.03.2026", tag: "DO", uhrzeit: "20:00", mode: "Bo5", qualification: null, status: "abgeschlossen", external_id: 18 },
  { phase: "Phase 2 – Tactical Phase", phase_order: 6, tour_type: "pro", kategorie: "pc", event_name: "Players Championship 9", datum: "05.04.2026", tag: "SO", uhrzeit: "18:00", mode: "Bo5", qualification: null, status: "upcoming", external_id: 19 },
  // Dev Tour Pre Finals
  { phase: "Development Tour – Pre Finals", phase_order: 7, tour_type: "development", kategorie: "dev_major", event_name: "April Major", datum: "02.04.2026", tag: "DO", uhrzeit: "18:00", mode: "Bo7", qualification: "Top 16 OoM", status: "upcoming", external_id: 30 },
  // Major 2 – Grand Prix
  { phase: "Major 2 – The Grand Prix (Double In/Out)", phase_order: 8, tour_type: "pro", kategorie: "m1", event_name: "Grand Prix (Di/Do)", datum: "12.04.2026", tag: "SO", uhrzeit: "17:00", mode: "Sets", qualification: "Top 32 OoM", status: "upcoming", external_id: 20 },
  // Haupttour Späte Saison
  { phase: "Haupttour – Späte Saison", phase_order: 9, tour_type: "pro", kategorie: "pc", event_name: "Players Championship 10", datum: "16.04.2026", tag: "DO", uhrzeit: "20:00", mode: "Bo5", qualification: null, status: "upcoming", external_id: 21 },
  { phase: "Haupttour – Späte Saison", phase_order: 9, tour_type: "pro", kategorie: "pc", event_name: "Players Championship 11", datum: "26.04.2026", tag: "SO", uhrzeit: "18:00", mode: "Bo5", qualification: null, status: "upcoming", external_id: 22 },
  // Dev Tour Pre Finals cont.
  { phase: "Development Tour – Pre Finals", phase_order: 7, tour_type: "development", kategorie: "dev_major", event_name: "May Major", datum: "03.05.2026", tag: "SO", uhrzeit: "18:00", mode: "Bo7", qualification: "Top 16 OoM", status: "upcoming", external_id: 23 },
  // Major 3 – Home Matchplay
  { phase: "Major 3 – Home Matchplay", phase_order: 10, tour_type: "pro", kategorie: "m2", event_name: "Home Matchplay", datum: "10.05.2026", tag: "SO", uhrzeit: "17:00", mode: "Sets", qualification: "Top 32 OoM", status: "upcoming", external_id: 25 },
  // Dev Tour Finals
  { phase: "Development Tour – Grand Final", phase_order: 11, tour_type: "development", kategorie: "dev_final", event_name: "Grand Final", datum: "24.05.2026", tag: "SO", uhrzeit: "18:00", mode: "Bo7", qualification: "Top 16 OoM", status: "upcoming", external_id: 24 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

function verifyPin(pin: string, hash: string): boolean {
  return hashPin(pin) === hash;
}

async function isAdminPlayer(playerId: number, pin: string): Promise<boolean> {
  try {
    const [p] = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, playerId)).limit(1);
    return !!(p && p.is_admin && verifyPin(String(pin), p.pin_hash));
  } catch {
    return false;
  }
}

function roundToOomKey(runde: string): string {
  const map: Record<string, string> = {
    F: "Finale",
    SF: "Halbfinale",
    QF: "Viertelfinale",
    R16: "Achtelfinale",
    R32: "Letzte 32",
    R64: "Teilnahme",
  };
  return map[runde] ?? "Teilnahme";
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRoundsForSize(size: number): string[] {
  if (size <= 2) return ["F"];
  if (size <= 4) return ["SF", "F"];
  if (size <= 8) return ["QF", "SF", "F"];
  if (size <= 16) return ["R16", "QF", "SF", "F"];
  if (size <= 32) return ["R32", "R16", "QF", "SF", "F"];
  return ["R64", "R32", "R16", "QF", "SF", "F"];
}

function getRoundSize(runde: string): number {
  const map: Record<string, number> = { R64: 64, R32: 32, R16: 16, QF: 8, SF: 4, F: 2 };
  return map[runde] ?? 2;
}

// ─── Bracket Generation ───────────────────────────────────────────────────────
async function generateBracket(tournamentId: number, playerIds: number[], legsFormat: number, randomDraw = false) {
  const entries = [...playerIds];
  const rounds = getRoundsForSize(entries.length);

  let bracketSize = 2;
  while (bracketSize < entries.length) bracketSize *= 2;

  // Shuffle entries for random draw
  const shuffled = randomDraw ? fisherYatesShuffle(entries) : entries;
  const seeded = [...shuffled, ...Array(bracketSize - shuffled.length).fill(null)];
  const firstRound = rounds[0];
  const matchCount = bracketSize / 2;
  const matches = [];

  for (let i = 0; i < matchCount; i++) {
    const p1 = seeded[i * 2] ?? null;
    const p2 = seeded[i * 2 + 1] ?? null;
    const isBye = p1 !== null && p2 === null;
    matches.push({
      tournament_id: tournamentId,
      runde: firstRound,
      match_nr: i + 1,
      player1_id: p1,
      player2_id: p2,
      status: isBye ? "abgeschlossen" : "ausstehend",
      is_bye: isBye,
      winner_id: isBye ? p1 : null,
      score_p1: isBye ? legsFormat : null,
      score_p2: isBye ? 0 : null,
    });
  }

  // For random_draw tournaments, only create the first round
  if (!randomDraw) {
    for (let ri = 1; ri < rounds.length; ri++) {
      const prevRound = rounds[ri - 1];
      const prevSize = getRoundSize(prevRound);
      const thisRound = rounds[ri];
      const thisCount = prevSize / 4;
      for (let i = 0; i < Math.max(1, thisCount); i++) {
        matches.push({
          tournament_id: tournamentId,
          runde: thisRound,
          match_nr: i + 1,
          player1_id: null,
          player2_id: null,
          status: "ausstehend",
          is_bye: false,
          winner_id: null,
          score_p1: null,
          score_p2: null,
        });
      }
    }
  }

  await db.insert(tourMatchesTable).values(matches as any);
  await propagateByes(tournamentId);

  // Auto-create lobbies for all first-round matches where both players are known
  const createdMatches = await db.select()
    .from(tourMatchesTable)
    .where(and(
      eq(tourMatchesTable.tournament_id, tournamentId),
      eq(tourMatchesTable.status, "ausstehend"),
      eq(tourMatchesTable.is_bye, false),
    ));

  const [tournament] = await db.select().from(tourTournamentsTable)
    .where(eq(tourTournamentsTable.id, tournamentId)).limit(1);
  const tournamentName = tournament?.name ?? "Turnier";

  const playerNames = new Map<number, string>();
  for (const m of createdMatches) {
    for (const pid of [m.player1_id, m.player2_id]) {
      if (pid && !playerNames.has(pid)) {
        const p = await db.select({ name: tourPlayersTable.name }).from(tourPlayersTable)
          .where(eq(tourPlayersTable.id, pid)).limit(1);
        if (p[0]) playerNames.set(pid, p[0].name);
      }
    }
  }

  for (const m of createdMatches) {
    if (m.player1_id && m.player2_id) {
      const lobbyUrl = await autoCreateLobby(m.id).catch(() => null);
      const p1Name = playerNames.get(m.player1_id) ?? "Spieler 1";
      const p2Name = playerNames.get(m.player2_id) ?? "Spieler 2";
      createMatchThreadForMatch(tournamentName, tournamentId, m.runde, m.match_nr, p1Name, p2Name, lobbyUrl)
        .then((threadId) => {
          if (threadId) db.update(tourMatchesTable).set({ discord_thread_id: threadId }).where(eq(tourMatchesTable.id, m.id)).catch(() => {});
        })
        .catch(() => {});
      notifyMatchReady(m.id, tournamentName, lobbyUrl).catch(() => {});
      await new Promise((r) => setTimeout(r, 350));
    }
  }
}

async function propagateByes(tournamentId: number) {
  const matches = await db
    .select()
    .from(tourMatchesTable)
    .where(eq(tourMatchesTable.tournament_id, tournamentId));

  const roundOrder = ["R64", "R32", "R16", "QF", "SF", "F"];
  const rounds = [...new Set(matches.map((m) => m.runde))].sort(
    (a, b) => roundOrder.indexOf(a) - roundOrder.indexOf(b)
  );

  for (let ri = 0; ri < rounds.length - 1; ri++) {
    const currentRound = rounds[ri];
    const nextRound = rounds[ri + 1];
    const currentMatches = matches.filter((m) => m.runde === currentRound && m.winner_id !== null);
    const nextMatches = matches.filter((m) => m.runde === nextRound);

    for (const nextMatch of nextMatches) {
      const feeders = currentMatches.filter(
        (m) => Math.ceil(m.match_nr / 2) === nextMatch.match_nr
      );
      if (feeders.length >= 2) {
        const [f1, f2] = feeders.sort((a, b) => a.match_nr - b.match_nr);
        if (f1.winner_id && f2.winner_id && !nextMatch.player1_id && !nextMatch.player2_id) {
          await db.update(tourMatchesTable)
            .set({ player1_id: f1.winner_id, player2_id: f2.winner_id })
            .where(eq(tourMatchesTable.id, nextMatch.id));
        }
      } else if (feeders.length === 1) {
        const f = feeders[0];
        if (f.winner_id) {
          const isP1Slot = f.match_nr % 2 === 1;
          if (isP1Slot && !nextMatch.player1_id) {
            await db.update(tourMatchesTable)
              .set({ player1_id: f.winner_id })
              .where(eq(tourMatchesTable.id, nextMatch.id));
          } else if (!isP1Slot && !nextMatch.player2_id) {
            await db.update(tourMatchesTable)
              .set({ player2_id: f.winner_id })
              .where(eq(tourMatchesTable.id, nextMatch.id));
          }
        }
      }
    }
  }
}

async function buildTournamentDetail(tournamentId: number) {
  const tournament = await db
    .select()
    .from(tourTournamentsTable)
    .where(eq(tourTournamentsTable.id, tournamentId))
    .limit(1);

  if (!tournament[0]) return null;

  const entries = await db
    .select()
    .from(tourEntriesTable)
    .where(eq(tourEntriesTable.tournament_id, tournamentId));

  const matches = await db
    .select()
    .from(tourMatchesTable)
    .where(eq(tourMatchesTable.tournament_id, tournamentId));

  const playerIds = [
    ...new Set([
      ...entries.map((e) => e.player_id),
      ...matches.flatMap((m) => [m.player1_id, m.player2_id, m.winner_id].filter(Boolean) as number[]),
    ]),
  ];

  const playerMap: Record<number, any> = {};
  for (const pid of playerIds) {
    if (pid) {
      const p = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, pid)).limit(1);
      if (p[0]) playerMap[pid] = p[0];
    }
  }

  const rounds = [...new Set(matches.map((m) => m.runde))];

  return {
    tournament: {
      id: tournament[0].id,
      name: tournament[0].name,
      typ: tournament[0].typ,
      tour_type: tournament[0].tour_type,
      datum: tournament[0].datum,
      uhrzeit: tournament[0].uhrzeit,
      status: tournament[0].status,
      legs_format: tournament[0].legs_format,
      max_players: tournament[0].max_players,
      is_test: tournament[0].is_test,
      random_draw: tournament[0].random_draw,
    },
    players: entries.map((e) => ({
      player_id: e.player_id,
      seed: e.seed,
      confirmed: e.confirmed ?? false,
      name: playerMap[e.player_id]?.name ?? "?",
      autodarts_username: playerMap[e.player_id]?.autodarts_username ?? "",
    })),
    matches: matches.map((m) => ({
      id: m.id,
      tournament_id: m.tournament_id,
      runde: m.runde,
      match_nr: m.match_nr,
      player1_id: m.player1_id,
      player2_id: m.player2_id,
      player1_name: m.player1_id ? playerMap[m.player1_id]?.name ?? null : null,
      player2_name: m.player2_id ? playerMap[m.player2_id]?.name ?? null : null,
      winner_id: m.winner_id,
      score_p1: m.score_p1,
      score_p2: m.score_p2,
      avg_p1: m.avg_p1 ?? null,
      avg_p2: m.avg_p2 ?? null,
      status: m.status,
      is_bye: m.is_bye,
      autodarts_match_id: m.autodarts_match_id ?? null,
    })),
    rounds,
  };
}

// ─── Push Notification Helper ─────────────────────────────────────────────────
async function sendPushToPlayer(playerId: number, title: string, body: string, url = "/") {
  try {
    const subs = await db.select().from(tourPushSubscriptionsTable)
      .where(eq(tourPushSubscriptionsTable.player_id, playerId)).limit(1);
    if (!subs[0]) return;
    const sub = subs[0];
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title, body, url })
    );
  } catch (e) {
    // Remove invalid subscriptions
    if ((e as any)?.statusCode === 410) {
      await db.delete(tourPushSubscriptionsTable).where(eq(tourPushSubscriptionsTable.player_id, playerId)).catch(() => {});
    }
    console.warn("Push notification failed for player", playerId, String(e));
  }
}

async function autoCreateLobby(matchId: number): Promise<string | null> {
  try {
    const [match] = await db.select().from(tourMatchesTable).where(eq(tourMatchesTable.id, matchId)).limit(1);
    if (!match || match.status !== "ausstehend" || match.autodarts_match_id) return null;
    if (!match.player1_id || !match.player2_id) return null;

    const [tournament] = await db.select().from(tourTournamentsTable)
      .where(eq(tourTournamentsTable.id, match.tournament_id)).limit(1);
    if (!tournament) return null;

    const winLegs = Math.ceil(tournament.legs_format / 2);

    // Token priority: player1 → player2 → global admin
    let accessToken: string | null = null;
    for (const id of [match.player1_id, match.player2_id]) {
      accessToken = await getPlayerAccessToken(id);
      if (accessToken) break;
    }
    if (!accessToken) accessToken = await getAutodartAccessToken();
    if (!accessToken) return null;

    const lobbyBody = {
      variant: "X01",
      settings: { inMode: "Straight", outMode: "Double", bullMode: "25/50", maxRounds: 50, baseScore: 501 },
      bullOffMode: "Normal",
      legs: winLegs,
      hasReferee: false,
      isPrivate: true,
    };

    const lobbyRes = await fetch("https://api.autodarts.io/gs/v0/lobbies", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(lobbyBody),
    });

    if (!lobbyRes.ok) return null;

    const lobby = await lobbyRes.json();
    await db.update(tourMatchesTable)
      .set({ autodarts_match_id: lobby.id })
      .where(eq(tourMatchesTable.id, matchId));

    return `https://play.autodarts.io/lobbies/${lobby.id}`;
  } catch {
    return null;
  }
}

async function notifyMatchReady(matchId: number, tournamentName: string, lobbyUrl?: string | null) {
  try {
    const match = await db.select().from(tourMatchesTable).where(eq(tourMatchesTable.id, matchId)).limit(1);
    if (!match[0] || !match[0].player1_id || !match[0].player2_id) return;
    const [p1, p2] = await Promise.all([
      db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, match[0].player1_id)).limit(1),
      db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, match[0].player2_id)).limit(1),
    ]);
    const p1Name = p1[0]?.name ?? "Gegner";
    const p2Name = p2[0]?.name ?? "Gegner";
    const roundLabel: Record<string, string> = { R64: "R64", R32: "R32", R16: "Achtelfinale", QF: "Viertelfinale", SF: "Halbfinale", F: "Finale" };
    const round = roundLabel[match[0].runde] ?? match[0].runde;

    const notifUrl = lobbyUrl ?? `/pro-tour/turniere/${match[0].tournament_id}`;
    const bodyText = lobbyUrl
      ? `${round}: ${p1Name} vs ${p2Name} — Lobby bereit! Jetzt joinen.`
      : `${round}: ${p1Name} vs ${p2Name} — ${tournamentName}`;

    if (match[0].player1_id) {
      sendPushToPlayer(match[0].player1_id, `🎯 Dein Match ist bereit!`, bodyText, notifUrl).catch(() => {});
    }
    if (match[0].player2_id) {
      sendPushToPlayer(match[0].player2_id, `🎯 Dein Match ist bereit!`, bodyText, notifUrl).catch(() => {});
    }
  } catch (e) {
    console.warn("notifyMatchReady error:", String(e));
  }
}

async function advanceWinner(tournamentId: number, currentRunde: string, matchNr: number, winnerId: number) {
  const roundOrder = ["R64", "R32", "R16", "QF", "SF", "F"];
  const currentIdx = roundOrder.indexOf(currentRunde);
  if (currentIdx === -1 || currentIdx >= roundOrder.length - 1) return;

  const nextRound = roundOrder[currentIdx + 1];
  const nextMatchNr = Math.ceil(matchNr / 2);
  const isP1 = matchNr % 2 === 1;

  const nextMatches = await db
    .select()
    .from(tourMatchesTable)
    .where(
      and(
        eq(tourMatchesTable.tournament_id, tournamentId),
        eq(tourMatchesTable.runde, nextRound),
        eq(tourMatchesTable.match_nr, nextMatchNr)
      )
    )
    .limit(1);

  if (!nextMatches[0]) return;

  if (isP1) {
    await db.update(tourMatchesTable)
      .set({ player1_id: winnerId })
      .where(eq(tourMatchesTable.id, nextMatches[0].id));
  } else {
    await db.update(tourMatchesTable)
      .set({ player2_id: winnerId })
      .where(eq(tourMatchesTable.id, nextMatches[0].id));
  }

  // Notify both players if next match is now fully populated
  const updated = await db.select().from(tourMatchesTable).where(eq(tourMatchesTable.id, nextMatches[0].id)).limit(1);
  if (updated[0]?.player1_id && updated[0]?.player2_id && !updated[0]?.is_bye) {
    const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, tournamentId)).limit(1);
    const tournamentName = t[0]?.name ?? "Turnier";

    // Auto-create Autodarts lobby
    const lobbyUrl = await autoCreateLobby(updated[0].id).catch(() => null);

    // Load player names for Discord thread
    const [p1, p2] = await Promise.all([
      db.select({ name: tourPlayersTable.name }).from(tourPlayersTable)
        .where(eq(tourPlayersTable.id, updated[0].player1_id!)).limit(1),
      db.select({ name: tourPlayersTable.name }).from(tourPlayersTable)
        .where(eq(tourPlayersTable.id, updated[0].player2_id!)).limit(1),
    ]);

    // Discord match thread for this round
    const matchIdForThread = updated[0].id;
    createMatchThreadForMatch(
      tournamentName, tournamentId,
      updated[0].runde, updated[0].match_nr,
      p1[0]?.name ?? "Spieler 1", p2[0]?.name ?? "Spieler 2",
      lobbyUrl,
    ).then((threadId) => {
      if (threadId) db.update(tourMatchesTable).set({ discord_thread_id: threadId }).where(eq(tourMatchesTable.id, matchIdForThread)).catch(() => {});
    }).catch(() => {});

    notifyMatchReady(updated[0].id, tournamentName, lobbyUrl).catch(() => {});
  }
}

async function checkTournamentComplete(tournamentId: number): Promise<boolean> {
  const matches = await db.select().from(tourMatchesTable)
    .where(eq(tourMatchesTable.tournament_id, tournamentId));
  const final = matches.find((m) => m.runde === "F");
  if (final?.winner_id) {
    const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, tournamentId)).limit(1);
    if (t[0]?.status !== "abgeschlossen") {
      await db.update(tourTournamentsTable)
        .set({ status: "abgeschlossen" })
        .where(eq(tourTournamentsTable.id, tournamentId));
      return true;
    }
  }
  return false;
}

// ─── Spielplan Routes ─────────────────────────────────────────────────────────

// GET /tour/schedule - get all schedule entries
router.get("/tour/schedule", async (_req, res) => {
  try {
    const entries = await db
      .select()
      .from(tourScheduleTable)
      .orderBy(tourScheduleTable.phase_order, tourScheduleTable.datum);
    res.json(entries);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/schedule/seed - populate Season 1 schedule (idempotent)
router.post("/tour/schedule/seed", async (_req, res) => {
  try {
    const existing = await db.select().from(tourScheduleTable).limit(1);
    if (existing.length > 0) {
      return res.json({ ok: true, message: "Spielplan bereits befüllt" });
    }
    const rows = SEASON1_SCHEDULE.map((s) => ({ ...s, season: 1 }));
    await db.insert(tourScheduleTable).values(rows);
    res.json({ ok: true, inserted: rows.length });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ─── OOM Standings (imported from onlineprotour.eu) ──────────────────────────

const OOM_SEED_DATA = [
  { season: 1, rank: 1, autodarts_username: "sw4g89", total_points: 6500, bonus_points: 0, tournaments_played: 9, tournament_breakdown: "{\"PC1\":1000,\"PC2\":600,\"PC3\":400,\"PC4\":600,\"PC5\":150,\"PC6\":1000,\"PC7\":1000,\"Spring Open\":1500,\"PC8\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 2, autodarts_username: "prachtbursche180", total_points: 3900, bonus_points: 0, tournaments_played: 8, tournament_breakdown: "{\"PC1\":250,\"PC2\":1000,\"PC4\":1000,\"PC5\":1000,\"PC6\":25,\"PC7\":250,\"Spring Open\":225,\"PC8\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 3, autodarts_username: "markusv22", total_points: 2800, bonus_points: 0, tournaments_played: 8, tournament_breakdown: "{\"PC1\":400,\"PC2\":250,\"PC3\":600,\"PC4\":25,\"PC5\":600,\"PC6\":150,\"PC7\":400,\"Spring Open\":375}", last_updated: "26.03.2026" },
  { season: 1, rank: 4, autodarts_username: "releven91", total_points: 2350, bonus_points: 100, tournaments_played: 9, tournament_breakdown: "{\"PC1\":700,\"PC2\":150,\"PC3\":150,\"PC4\":250,\"PC5\":250,\"PC6\":250,\"PC7\":150,\"Spring Open\":375,\"PC8\":75}", last_updated: "26.03.2026" },
  { season: 1, rank: 5, autodarts_username: "sircrytex", total_points: 2025, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC3\":1000,\"PC4\":400,\"PC5\":25,\"Spring Open\":600}", last_updated: "26.03.2026" },
  { season: 1, rank: 6, autodarts_username: "smarradinho", total_points: 1950, bonus_points: 0, tournaments_played: 8, tournament_breakdown: "{\"PC1\":75,\"PC2\":150,\"PC3\":75,\"PC4\":250,\"PC6\":600,\"PC7\":25,\"Spring Open\":375,\"PC8\":400}", last_updated: "26.03.2026" },
  { season: 1, rank: 7, autodarts_username: "captinhoook_28219", total_points: 1675, bonus_points: 0, tournaments_played: 8, tournament_breakdown: "{\"PC1\":400,\"PC2\":400,\"PC3\":150,\"PC5\":150,\"PC6\":25,\"PC7\":250,\"Spring Open\":50,\"PC8\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 8, autodarts_username: "mg_82", total_points: 1500, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC4\":400,\"PC5\":25,\"PC6\":400,\"PC7\":600,\"Spring Open\":50,\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 9, autodarts_username: "jensonjdv2110", total_points: 1200, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC1\":150,\"PC3\":250,\"PC4\":25,\"PC5\":150,\"PC6\":250,\"Spring Open\":375}", last_updated: "26.03.2026" },
  { season: 1, rank: 10, autodarts_username: "purcello87_18488", total_points: 1175, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC2\":25,\"Spring Open\":900,\"PC8\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 11, autodarts_username: "elitedragon94", total_points: 1150, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC3\":250,\"PC4\":150,\"PC6\":250,\"PC7\":25,\"Spring Open\":225,\"PC8\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 12, autodarts_username: "sulmi.", total_points: 1075, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC4\":250,\"PC5\":150,\"PC6\":150,\"PC7\":400,\"Spring Open\":50,\"PC8\":75}", last_updated: "26.03.2026" },
  { season: 1, rank: 13, autodarts_username: "blackjackleo", total_points: 1000, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC8\":1000}", last_updated: "26.03.2026" },
  { season: 1, rank: 14, autodarts_username: "babu9435", total_points: 950, bonus_points: 0, tournaments_played: 8, tournament_breakdown: "{\"PC1\":150,\"PC2\":150,\"PC3\":150,\"PC4\":75,\"PC6\":25,\"PC7\":150,\"Spring Open\":225,\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 15, autodarts_username: "infernohunter1405", total_points: 950, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC3\":150,\"PC5\":250,\"PC6\":25,\"PC7\":150,\"Spring Open\":225,\"PC8\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 16, autodarts_username: "patty024676", total_points: 900, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC1\":150,\"PC2\":25,\"PC4\":25,\"PC5\":25,\"PC6\":75,\"Spring Open\":600}", last_updated: "26.03.2026" },
  { season: 1, rank: 17, autodarts_username: "paradoxx180", total_points: 875, bonus_points: 0, tournaments_played: 8, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC3\":25,\"PC4\":250,\"PC5\":400,\"PC6\":75,\"PC7\":25,\"Spring Open\":50}", last_updated: "26.03.2026" },
  { season: 1, rank: 18, autodarts_username: "d9music", total_points: 800, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC3\":400,\"PC4\":150,\"PC5\":25,\"Spring Open\":225}", last_updated: "26.03.2026" },
  { season: 1, rank: 19, autodarts_username: "chriko91", total_points: 750, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC3\":25,\"PC5\":250,\"PC7\":250,\"Spring Open\":225}", last_updated: "26.03.2026" },
  { season: 1, rank: 20, autodarts_username: "drandi1887", total_points: 725, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC2\":25,\"PC3\":75,\"PC5\":25,\"PC8\":600}", last_updated: "26.03.2026" },
  { season: 1, rank: 21, autodarts_username: "bernybonebreaker.", total_points: 675, bonus_points: 0, tournaments_played: 7, tournament_breakdown: "{\"PC1\":150,\"PC2\":25,\"PC4\":150,\"PC6\":75,\"PC7\":25,\"Spring Open\":225,\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 22, autodarts_username: "roccoamore", total_points: 625, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC2\":150,\"PC4\":75,\"PC5\":400}", last_updated: "26.03.2026" },
  { season: 1, rank: 23, autodarts_username: "felln", total_points: 600, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC3\":150,\"PC4\":150,\"PC5\":25,\"PC7\":25,\"Spring Open\":225,\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 24, autodarts_username: "the_sharpshooter_", total_points: 575, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":250,\"PC3\":25,\"PC6\":250,\"Spring Open\":50}", last_updated: "26.03.2026" },
  { season: 1, rank: 25, autodarts_username: "mighty_maggo", total_points: 525, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC3\":25,\"PC4\":75,\"PC5\":75,\"PC7\":150,\"Spring Open\":50,\"PC8\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 26, autodarts_username: "fleckigerfleck180", total_points: 475, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC2\":150,\"PC3\":25,\"PC4\":150,\"PC5\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 27, autodarts_username: "schrder", total_points: 475, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC2\":400,\"PC3\":75}", last_updated: "26.03.2026" },
  { season: 1, rank: 28, autodarts_username: "johnnoble9", total_points: 450, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC3\":25,\"PC5\":250,\"PC6\":150,\"PC7\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 29, autodarts_username: "dt09_83", total_points: 425, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC5\":25,\"PC6\":400}", last_updated: "26.03.2026" },
  { season: 1, rank: 30, autodarts_username: "dynamite_dave83", total_points: 425, bonus_points: 0, tournaments_played: 7, tournament_breakdown: "{\"PC3\":25,\"PC4\":25,\"PC5\":75,\"PC6\":75,\"PC7\":150,\"Spring Open\":50,\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 31, autodarts_username: "dcschiltornboyz", total_points: 400, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":250,\"PC2\":25,\"PC3\":25,\"PC4\":75,\"PC5\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 32, autodarts_username: "tinochef", total_points: 400, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC8\":400}", last_updated: "26.03.2026" },
  { season: 1, rank: 33, autodarts_username: "n1k_92", total_points: 350, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC1\":75,\"PC3\":250,\"PC5\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 34, autodarts_username: "thommy_the_gun_44538", total_points: 350, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":25,\"PC3\":150,\"PC4\":25,\"PC5\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 35, autodarts_username: "franzet.__19126", total_points: 325, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC5\":75,\"PC7\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 36, autodarts_username: "koboto.", total_points: 325, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC1\":150,\"PC2\":150,\"PC4\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 37, autodarts_username: "salvatoreocchipinti", total_points: 325, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC2\":250,\"PC3\":75}", last_updated: "26.03.2026" },
  { season: 1, rank: 38, autodarts_username: "schumann180", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC2\":250,\"PC3\":25,\"PC4\":25,\"PC7\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 39, autodarts_username: "boiza8899", total_points: 300, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC6\":150,\"PC7\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 40, autodarts_username: "cb2402.", total_points: 300, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC1\":150,\"PC2\":25,\"PC3\":25,\"PC5\":25,\"Spring Open\":50,\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 41, autodarts_username: "lohoff44", total_points: 300, bonus_points: 0, tournaments_played: 9, tournament_breakdown: "{\"PC1\":25,\"PC2\":75,\"PC3\":25,\"PC4\":25,\"PC5\":25,\"PC6\":25,\"PC7\":25,\"Spring Open\":50,\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 42, autodarts_username: "haui75", total_points: 275, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":150,\"PC2\":25,\"PC3\":25,\"PC5\":25,\"Spring Open\":50}", last_updated: "26.03.2026" },
  { season: 1, rank: 43, autodarts_username: "no.score.82", total_points: 275, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC3\":250,\"PC5\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 44, autodarts_username: "veterdarto180", total_points: 275, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC3\":25,\"PC5\":25,\"PC6\":75,\"PC8\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 45, autodarts_username: "caostommy.", total_points: 250, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC5\":150,\"PC7\":25,\"PC8\":75}", last_updated: "26.03.2026" },
  { season: 1, rank: 46, autodarts_username: "djbounceger", total_points: 250, bonus_points: 0, tournaments_played: 7, tournament_breakdown: "{\"PC2\":25,\"PC3\":75,\"PC4\":25,\"PC5\":25,\"PC6\":25,\"PC7\":25,\"Spring Open\":50}", last_updated: "26.03.2026" },
  { season: 1, rank: 47, autodarts_username: "mawoit", total_points: 250, bonus_points: 0, tournaments_played: 7, tournament_breakdown: "{\"PC2\":25,\"PC3\":25,\"PC4\":75,\"PC6\":25,\"PC7\":25,\"Spring Open\":50,\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 48, autodarts_username: "mirmlinger", total_points: 250, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":25,\"PC2\":150,\"PC3\":25,\"PC4\":25,\"PC6\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 49, autodarts_username: "redstar10.", total_points: 250, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC6\":25,\"PC7\":150,\"Spring Open\":50,\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 50, autodarts_username: "seb171_", total_points: 250, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC1\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 51, autodarts_username: "slevin1353", total_points: 250, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC2\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 52, autodarts_username: "spinpuke", total_points: 250, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC5\":25,\"PC6\":25,\"Spring Open\":50,\"PC8\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 53, autodarts_username: "sx197", total_points: 250, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":25,\"PC3\":150,\"PC4\":25,\"PC5\":25,\"PC7\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 54, autodarts_username: "michaelk.1506", total_points: 225, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC3\":75,\"PC4\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 55, autodarts_username: "maexla_098", total_points: 200, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC1\":25,\"PC2\":150,\"PC4\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 56, autodarts_username: "puetten77", total_points: 200, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC3\":25,\"PC4\":25,\"PC7\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 57, autodarts_username: "quasi_4400", total_points: 200, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC6\":150,\"PC7\":25,\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 58, autodarts_username: "roman910433", total_points: 200, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC2\":25,\"PC4\":25,\"PC5\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 59, autodarts_username: "schwatta09", total_points: 200, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC3\":25,\"PC5\":25,\"PC6\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 60, autodarts_username: "senior_noskill", total_points: 200, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC1\":25,\"PC3\":150,\"PC4\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 61, autodarts_username: "shiouk", total_points: 200, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC1\":150,\"PC2\":25,\"PC4\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 62, autodarts_username: "dartsbydanil", total_points: 175, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC2\":25,\"PC4\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 63, autodarts_username: "manu791904", total_points: 175, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC2\":25,\"PC4\":75,\"PC5\":25,\"PC6\":25,\"PC7\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 64, autodarts_username: "pasqualo5693", total_points: 175, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC1\":25,\"PC6\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 65, autodarts_username: "the_maniac040", total_points: 175, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC3\":75,\"PC4\":25,\"PC5\":25,\"PC6\":25,\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 66, autodarts_username: ".teggy_weggy", total_points: 150, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC2\":25,\"PC3\":75,\"PC4\":25,\"PC5\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 67, autodarts_username: "fschmuck90", total_points: 150, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC8\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 68, autodarts_username: "holgik66", total_points: 150, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC6\":25,\"PC7\":75,\"Spring Open\":50}", last_updated: "26.03.2026" },
  { season: 1, rank: 69, autodarts_username: "jduffy512", total_points: 150, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC8\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 70, autodarts_username: "polo1501", total_points: 150, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC2\":25,\"PC3\":25,\"PC4\":25,\"PC6\":25,\"PC7\":25,\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 71, autodarts_username: "revilocb", total_points: 150, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC4\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 72, autodarts_username: "rok180", total_points: 150, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC8\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 73, autodarts_username: "uwe_madhouse", total_points: 150, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC2\":25,\"PC4\":75,\"PC5\":25,\"PC7\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 74, autodarts_username: "wanagin", total_points: 150, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC6\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 75, autodarts_username: "furbys04", total_points: 125, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC3\":25,\"PC4\":25,\"PC5\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 76, autodarts_username: "kruegman0147", total_points: 125, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC2\":25,\"PC4\":75,\"PC6\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 77, autodarts_username: "superseppensepp", total_points: 125, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC4\":25,\"PC5\":75,\"PC6\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 78, autodarts_username: "_sprudel", total_points: 125, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC3\":25,\"PC5\":25,\"PC7\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 79, autodarts_username: "gordon_1785", total_points: 100, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC7\":75,\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 80, autodarts_username: "ironprecision", total_points: 100, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC3\":25,\"PC4\":75}", last_updated: "26.03.2026" },
  { season: 1, rank: 81, autodarts_username: "jan5799", total_points: 100, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC3\":25,\"PC4\":75}", last_updated: "26.03.2026" },
  { season: 1, rank: 82, autodarts_username: "simsoff", total_points: 100, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC3\":75,\"PC4\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 83, autodarts_username: "theblackforest92", total_points: 100, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC1\":25,\"PC3\":75}", last_updated: "26.03.2026" },
  { season: 1, rank: 84, autodarts_username: "xshilex", total_points: 100, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC1\":25,\"PC4\":75}", last_updated: "26.03.2026" },
  { season: 1, rank: 85, autodarts_username: "grauwolfjan", total_points: 75, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC4\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 86, autodarts_username: "kev_180", total_points: 75, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC3\":75}", last_updated: "26.03.2026" },
  { season: 1, rank: 87, autodarts_username: "marshell420", total_points: 75, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC8\":75}", last_updated: "26.03.2026" },
  { season: 1, rank: 88, autodarts_username: "sebastianpotscherterrax", total_points: 75, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC4\":75}", last_updated: "26.03.2026" },
  { season: 1, rank: 89, autodarts_username: "slevin_93004_98258", total_points: 75, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC1\":75}", last_updated: "26.03.2026" },
  { season: 1, rank: 90, autodarts_username: "alpaka00_", total_points: 50, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC3\":25,\"PC4\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 91, autodarts_username: "basti3886", total_points: 50, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC2\":25,\"PC3\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 92, autodarts_username: "coolness2punkt0", total_points: 50, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC1\":25,\"PC3\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 93, autodarts_username: "dartcore25_23442", total_points: 50, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC6\":25,\"PC7\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 94, autodarts_username: "jaykopp_1988", total_points: 50, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC3\":25,\"PC7\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 95, autodarts_username: "rafi19931", total_points: 50, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC5\":25,\"PC6\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 96, autodarts_username: "tobi1879.", total_points: 50, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC4\":25,\"PC7\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 97, autodarts_username: "trevi_26512", total_points: 50, bonus_points: 0, tournaments_played: 2, tournament_breakdown: "{\"PC3\":25,\"PC5\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 98, autodarts_username: "bjorn0976", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC1\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 99, autodarts_username: "dirko306", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 100, autodarts_username: "drbongi", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC4\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 101, autodarts_username: "fanatikal_91", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC6\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 102, autodarts_username: "finnchr95", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC1\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 103, autodarts_username: "franzet._", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC3\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 104, autodarts_username: "gladbach131", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC4\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 105, autodarts_username: "luckyluke02171", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC3\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 106, autodarts_username: "manalexton", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 107, autodarts_username: "markt.1988", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC1\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 108, autodarts_username: "masterstev_68349", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 109, autodarts_username: "mira1860", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC6\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 110, autodarts_username: "nurrox", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 111, autodarts_username: "roevergaming", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC4\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 112, autodarts_username: "sc3ptiix", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC5\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 113, autodarts_username: "schalli1988", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 114, autodarts_username: "schegge_23", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 115, autodarts_username: "thehornet180", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC8\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 116, autodarts_username: "the_snipper", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC5\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 117, autodarts_username: "tuage_michel", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC1\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 118, autodarts_username: "x999jey", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC4\":25}", last_updated: "26.03.2026" },
  { season: 1, rank: 119, autodarts_username: "zorax0681", total_points: 25, bonus_points: 0, tournaments_played: 1, tournament_breakdown: "{\"PC4\":25}", last_updated: "26.03.2026" },
];

// ─── Hall of Fame ──────────────────────────────────────────────────────────────

// Maps short OOM breakdown keys → tournament metadata
const PRO_BREAKDOWN_META: Record<string, { name: string; datum: string; typ: string; tour_type: string }> = {
  "PC1":         { name: "Players Championship 1",  datum: "18.01.2026", typ: "pc",  tour_type: "pro" },
  "PC2":         { name: "Players Championship 2",  datum: "22.01.2026", typ: "pc",  tour_type: "pro" },
  "PC3":         { name: "Players Championship 3",  datum: "25.01.2026", typ: "pc",  tour_type: "pro" },
  "PC4":         { name: "Players Championship 4",  datum: "29.01.2026", typ: "pc",  tour_type: "pro" },
  "PC5":         { name: "Players Championship 5",  datum: "08.02.2026", typ: "pc",  tour_type: "pro" },
  "PC6":         { name: "Players Championship 6",  datum: "19.02.2026", typ: "pc",  tour_type: "pro" },
  "PC7":         { name: "Players Championship 7",  datum: "01.03.2026", typ: "pc",  tour_type: "pro" },
  "PC8":         { name: "Players Championship 8",  datum: "26.03.2026", typ: "pc",  tour_type: "pro" },
  "Spring Open": { name: "Spring Open 2026",        datum: "15.03.2026", typ: "m1",  tour_type: "pro" },
};
const PRO_WINNER_PTS: Record<string, number> = { pc: 1000, m1: 1500, m2: 2000 };

const DEV_BREAKDOWN_META: Record<string, { name: string; datum: string; typ: string; tour_type: string }> = {
  "DC1": { name: "Development Cup 1", datum: "01.02.2026", typ: "dev_cup",   tour_type: "development" },
  "DC2": { name: "Development Cup 2", datum: "05.02.2026", typ: "dev_cup",   tour_type: "development" },
  "DC3": { name: "Development Cup 3", datum: "15.02.2026", typ: "dev_cup",   tour_type: "development" },
  "DC4": { name: "Development Cup 4", datum: "22.02.2026", typ: "dev_cup",   tour_type: "development" },
  "DC5": { name: "Development Cup 5", datum: "05.03.2026", typ: "dev_cup",   tour_type: "development" },
  "DC6": { name: "Development Cup 6", datum: "21.03.2026", typ: "dev_cup",   tour_type: "development" },
  "April Major": { name: "April Major",  datum: "02.04.2026", typ: "dev_major", tour_type: "development" },
  "May Major":   { name: "May Major",    datum: "03.05.2026", typ: "dev_major", tour_type: "development" },
  "Grand Final": { name: "Grand Final",  datum: "24.05.2026", typ: "dev_final", tour_type: "development" },
};
const DEV_WINNER_PTS: Record<string, number> = { dev_cup: 1000, dev_major: 1500, dev_final: 2000 };

// GET /tour/hall-of-fame — all tournament champions (Pro + Dev Tour)
router.get("/tour/hall-of-fame", async (_req, res) => {
  try {
    const entries: any[] = [];
    const seenKeys = new Set<string>(); // prevent duplicates between sources

    // ── 1. In-app tournaments (have a real Final match) ────────────────────
    const appTournaments = await db
      .select()
      .from(tourTournamentsTable)
      .where(and(eq(tourTournamentsTable.status, "abgeschlossen")));

    for (const t of appTournaments) {
      if (t.is_test) continue;
      const allMatches = await db.select().from(tourMatchesTable).where(eq(tourMatchesTable.tournament_id, t.id));
      const finalMatch = allMatches.find((m) => m.runde === "F" && m.winner_id != null && !m.is_bye);
      if (!finalMatch?.winner_id) continue;
      const winnerRows = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, finalMatch.winner_id)).limit(1);
      if (!winnerRows[0]) continue;
      const loserId = finalMatch.player1_id === finalMatch.winner_id ? finalMatch.player2_id : finalMatch.player1_id;
      let runnerUp: string | null = null;
      if (loserId) {
        const loserRows = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, loserId)).limit(1);
        runnerUp = loserRows[0]?.autodarts_username ?? null;
      }
      const key = `app-${t.id}`;
      seenKeys.add(key);
      entries.push({
        key,
        tournament_id: t.id,
        tournament_name: t.name,
        typ: t.typ,
        tour_type: t.tour_type,
        datum: t.datum,
        source: "app",
        champion_id: winnerRows[0].id,
        champion_name: winnerRows[0].name,
        champion_username: winnerRows[0].autodarts_username,
        runner_up: runnerUp,
        score: finalMatch.score_p1 != null && finalMatch.score_p2 != null
          ? (finalMatch.winner_id === finalMatch.player1_id ? `${finalMatch.score_p1}:${finalMatch.score_p2}` : `${finalMatch.score_p2}:${finalMatch.score_p1}`)
          : null,
        avg_winner: finalMatch.winner_id === finalMatch.player1_id ? finalMatch.avg_p1 : finalMatch.avg_p2,
      });
    }

    // ── 2. Historical Pro OOM standings (breakdowns) ───────────────────────
    const proStandings = await db.select().from(tourOomStandingsTable);
    // Build per-tournament winner: find player(s) with max points
    const proTourneyMap: Record<string, { username: string; pts: number }> = {};
    for (const row of proStandings) {
      let breakdown: Record<string, number> = {};
      try { breakdown = JSON.parse(row.tournament_breakdown); } catch { continue; }
      for (const [key, pts] of Object.entries(breakdown)) {
        if (typeof pts !== "number") continue;
        if (!proTourneyMap[key] || pts > proTourneyMap[key].pts) {
          proTourneyMap[key] = { username: row.autodarts_username, pts };
        }
      }
    }
    for (const [shortKey, meta] of Object.entries(PRO_BREAKDOWN_META)) {
      const winnerPts = PRO_WINNER_PTS[meta.typ] ?? 1000;
      const candidate = proTourneyMap[shortKey];
      if (!candidate || candidate.pts < winnerPts) continue;
      const hofKey = `pro-${shortKey}`;
      if (seenKeys.has(hofKey)) continue;
      seenKeys.add(hofKey);
      // Try to find player in our DB for linkability
      const playerRows = await db.select().from(tourPlayersTable)
        .where(eq(tourPlayersTable.autodarts_username, candidate.username)).limit(1);
      entries.push({
        key: hofKey,
        tournament_id: null,
        tournament_name: meta.name,
        typ: meta.typ,
        tour_type: meta.tour_type,
        datum: meta.datum,
        source: "oom",
        champion_id: playerRows[0]?.id ?? null,
        champion_name: playerRows[0]?.name ?? candidate.username,
        champion_username: candidate.username,
        runner_up: null,
        score: null,
        avg_winner: null,
      });
    }

    // ── 3. Historical Dev OOM standings (breakdowns) ───────────────────────
    const devStandings = await db.select().from(tourDevOomStandingsTable);
    // Dev breakdown is stored as JSON array: [{t:"DC1",p:1000},...] or object
    const devTourneyMap: Record<string, { username: string; pts: number }> = {};
    for (const row of devStandings) {
      let breakdown: any;
      try { breakdown = JSON.parse(row.tournament_breakdown); } catch { continue; }
      const pairs: Array<{ t: string; p: number }> = Array.isArray(breakdown)
        ? breakdown
        : Object.entries(breakdown).map(([t, p]) => ({ t, p: p as number }));
      for (const { t: key, p: pts } of pairs) {
        if (typeof pts !== "number") continue;
        if (!devTourneyMap[key] || pts > devTourneyMap[key].pts) {
          devTourneyMap[key] = { username: row.autodarts_username, pts };
        }
      }
    }
    for (const [shortKey, meta] of Object.entries(DEV_BREAKDOWN_META)) {
      const winnerPts = DEV_WINNER_PTS[meta.typ] ?? 1000;
      const candidate = devTourneyMap[shortKey];
      if (!candidate || candidate.pts < winnerPts) continue;
      const hofKey = `dev-${shortKey}`;
      if (seenKeys.has(hofKey)) continue;
      seenKeys.add(hofKey);
      const playerRows = await db.select().from(tourPlayersTable)
        .where(eq(tourPlayersTable.autodarts_username, candidate.username)).limit(1);
      entries.push({
        key: hofKey,
        tournament_id: null,
        tournament_name: meta.name,
        typ: meta.typ,
        tour_type: meta.tour_type,
        datum: meta.datum,
        source: "oom",
        champion_id: playerRows[0]?.id ?? null,
        champion_name: playerRows[0]?.name ?? candidate.username,
        champion_username: candidate.username,
        runner_up: null,
        score: null,
        avg_winner: null,
      });
    }

    // Sort by date descending (newest first)
    entries.sort((a, b) => {
      const parseDatum = (d: string) => { const [dd, mm, yy] = d.split(".").map(Number); return new Date(yy, mm - 1, dd).getTime(); };
      return parseDatum(b.datum) - parseDatum(a.datum);
    });

    res.json(entries);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /tour/stats/leaderboard - Bestenlisten: Average, 180s, High Checkout
router.get("/tour/stats/leaderboard", async (_req, res) => {
  try {
    const matches = await db
      .select({
        player1_id: tourMatchesTable.player1_id,
        player2_id: tourMatchesTable.player2_id,
        avg_p1: tourMatchesTable.avg_p1,
        avg_p2: tourMatchesTable.avg_p2,
        count_180s_p1: tourMatchesTable.count_180s_p1,
        count_180s_p2: tourMatchesTable.count_180s_p2,
        high_checkout_p1: tourMatchesTable.high_checkout_p1,
        high_checkout_p2: tourMatchesTable.high_checkout_p2,
      })
      .from(tourMatchesTable)
      .where(eq(tourMatchesTable.status, "fertig"));

    const players = await db.select().from(tourPlayersTable);
    const playerMap = new Map(players.map((p) => [p.id, p]));

    type PlayerStats = {
      player_id: number;
      name: string;
      autodarts_username: string;
      avg_sum: number; avg_count: number;
      total_180s: number;
      high_checkout: number;
    };
    const stats = new Map<number, PlayerStats>();

    const getOrCreate = (id: number): PlayerStats => {
      if (!stats.has(id)) {
        const p = playerMap.get(id);
        stats.set(id, { player_id: id, name: p?.name ?? `#${id}`, autodarts_username: p?.autodarts_username ?? "", avg_sum: 0, avg_count: 0, total_180s: 0, high_checkout: 0 });
      }
      return stats.get(id)!;
    };

    for (const m of matches) {
      if (m.player1_id) {
        const s = getOrCreate(m.player1_id);
        if (m.avg_p1 && m.avg_p1 > 0) { s.avg_sum += m.avg_p1; s.avg_count++; }
        s.total_180s += m.count_180s_p1 ?? 0;
        if ((m.high_checkout_p1 ?? 0) > s.high_checkout) s.high_checkout = m.high_checkout_p1!;
      }
      if (m.player2_id) {
        const s = getOrCreate(m.player2_id);
        if (m.avg_p2 && m.avg_p2 > 0) { s.avg_sum += m.avg_p2; s.avg_count++; }
        s.total_180s += m.count_180s_p2 ?? 0;
        if ((m.high_checkout_p2 ?? 0) > s.high_checkout) s.high_checkout = m.high_checkout_p2!;
      }
    }

    const list = Array.from(stats.values()).filter((s) => s.avg_count > 0 || s.total_180s > 0 || s.high_checkout > 0);

    const avgBoard = [...list].filter((s) => s.avg_count > 0).sort((a, b) => (b.avg_sum / b.avg_count) - (a.avg_sum / a.avg_count)).slice(0, 10).map((s) => ({ ...s, avg: Math.round((s.avg_sum / s.avg_count) * 10) / 10 }));
    const s180Board = [...list].filter((s) => s.total_180s > 0).sort((a, b) => b.total_180s - a.total_180s).slice(0, 10);
    const checkoutBoard = [...list].filter((s) => s.high_checkout > 0).sort((a, b) => b.high_checkout - a.high_checkout).slice(0, 10);

    res.json({ avgBoard, s180Board, checkoutBoard });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /tour/oom - Pro OOM: historische Basis + automatisch neue App-Turniere
router.get("/tour/oom", async (_req, res) => {
  try {
    // 1. Historische Basis aus tour_oom_standings (PC1–PC8, Spring Open etc.)
    const historicalStandings = await db
      .select()
      .from(tourOomStandingsTable)
      .orderBy(tourOomStandingsTable.rank);

    type ProPlayerEntry = {
      player_id: number;
      player_name: string;
      total_points: number;
      bonus_total: number;
      breakdown: Record<string, number>;
      results: { tournament_id: number; tournament_name: string; typ: string; points: number; bonus: number; round: string }[];
    };
    const playerMap = new Map<string, ProPlayerEntry>();
    const historicalTournamentNames = new Set<string>();

    for (const s of historicalStandings) {
      // Breakdown kann als Objekt {name: pts} oder Array [{t,p}] gespeichert sein
      const raw = JSON.parse(s.tournament_breakdown || "{}");
      const breakdownEntries: [string, number][] = Array.isArray(raw)
        ? raw.map((x: { t: string; p: number }) => [x.t, x.p] as [string, number])
        : Object.entries(raw as Record<string, number>);

      const breakdown: Record<string, number> = Object.fromEntries(breakdownEntries);
      for (const name of Object.keys(breakdown)) historicalTournamentNames.add(name);

      const results = breakdownEntries
        .filter(([, pts]) => pts > 0)
        .map(([name, pts]) => ({
          tournament_id: 0,
          tournament_name: name,
          typ: "pc",
          points: pts,
          bonus: 0,
          round: ptsToBestRound(pts, "pc"),
        }));

      playerMap.set(s.autodarts_username, {
        player_id: 0,
        player_name: s.autodarts_username,
        total_points: s.total_points ?? 0,
        bonus_total: s.bonus_points ?? 0,
        breakdown,
        results,
      });
    }

    // 2. Neue abgeschlossene Pro-Turniere aus der App-DB (nicht Testläufe)
    const appProTournaments = await db
      .select()
      .from(tourTournamentsTable)
      .where(and(
        eq(tourTournamentsTable.status, "abgeschlossen"),
        eq(tourTournamentsTable.tour_type, "pro"),
        eq(tourTournamentsTable.is_test, false),
      ));

    const newTournaments = appProTournaments.filter((t) => !historicalTournamentNames.has(t.name));

    if (newTournaments.length > 0) {
      const allMatches = await db.select().from(tourMatchesTable);
      const allPlayers = await db.select().from(tourPlayersTable);
      const allBonus = await db.select().from(tourBonusPointsTable);
      const roundOrder = ["R64", "R32", "R16", "QF", "SF", "F"];

      for (const t of newTournaments) {
        const tMatches = allMatches.filter((m) => m.tournament_id === t.id);

        const participantIds = new Set<number>();
        for (const m of tMatches) {
          if (m.player1_id) participantIds.add(m.player1_id);
          if (m.player2_id) participantIds.add(m.player2_id);
        }

        for (const playerId of participantIds) {
          const player = allPlayers.find((p) => p.id === playerId);
          if (!player) continue;

          const playerMatches = tMatches.filter(
            (m) => (m.player1_id === playerId || m.player2_id === playerId)
              && m.status === "abgeschlossen" && !m.is_bye
          );

          let roundKey: string;
          if (playerMatches.length === 0) {
            roundKey = "Teilnahme";
          } else {
            const deepest = playerMatches.sort(
              (a, b) => roundOrder.indexOf(b.runde) - roundOrder.indexOf(a.runde)
            )[0];
            const isWinner = deepest.runde === "F" && deepest.winner_id === playerId;
            roundKey = isWinner ? "Sieger" : roundToOomKey(deepest.runde);
          }

          const points = OOM_POINTS[t.typ]?.[roundKey] ?? 0;
          const bonus = allBonus
            .filter((b) => b.player_id === playerId && b.tournament_id === t.id)
            .reduce((s, b) => s + b.points, 0);

          const username = player.autodarts_username;
          const existing = playerMap.get(username) ?? {
            player_id: player.id,
            player_name: player.name,
            total_points: 0, bonus_total: 0, breakdown: {}, results: [],
          };
          existing.total_points += points + bonus;
          existing.bonus_total += bonus;
          existing.breakdown[t.name] = points;
          existing.results.push({
            tournament_id: t.id,
            tournament_name: t.name,
            typ: t.typ,
            points,
            bonus,
            round: roundKey,
          });
          playerMap.set(username, existing);
        }
      }
    }

    // 3. Sortieren, ranken, zurückgeben
    const result = Array.from(playerMap.entries())
      .filter(([, d]) => d.total_points > 0)
      .sort((a, b) => b[1].total_points - a[1].total_points)
      .map(([username, data], i) => {
        const maxPts = Math.max(0, ...data.results.map((r) => r.points));
        return {
          rank: i + 1,
          player_id: data.player_id,
          player_name: data.player_name || username,
          autodarts_username: username,
          total_points: data.total_points,
          bonus_total: data.bonus_total,
          tournaments_played: data.results.filter((r) => r.points > 0).length,
          best_result: ptsToBestRound(maxPts, "pc"),
          last_updated: "",
          results: data.results,
        };
      });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

function ptsToBestRound(pts: number, typ = "pc"): string {
  const table = OOM_POINTS[typ] ?? OOM_POINTS.pc;
  const rounds = ["Sieger", "Finale", "Halbfinale", "Viertelfinale", "Achtelfinale", "Letzte 32", "Teilnahme"];
  for (const round of rounds) {
    if (pts >= (table[round] ?? 0)) return round;
  }
  return "Teilnahme";
}

// POST /tour/oom/seed - seed OOM standings (idempotent)
router.post("/tour/oom/seed", async (_req, res) => {
  try {
    const existing = await db.select().from(tourOomStandingsTable).limit(1);
    if (existing.length > 0) {
      return res.json({ ok: true, message: "OOM bereits befüllt", count: existing.length });
    }
    await db.insert(tourOomStandingsTable).values(OOM_SEED_DATA);
    notifyOomUpdate("pro").catch(() => {});
    res.json({ ok: true, inserted: OOM_SEED_DATA.length });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /tour/dev-oom - Development Tour OOM standings (imported)
router.get("/tour/dev-oom", async (_req, res) => {
  try {
    // 1. Historische Basis aus tour_dev_oom_standings (DC1–DC6 manuell importiert)
    const historicalStandings = await db
      .select()
      .from(tourDevOomStandingsTable)
      .orderBy(tourDevOomStandingsTable.rank);

    // Spieler-Map aufbauen: autodarts_username -> { points, bonus, breakdown, results }
    type PlayerEntry = {
      total_points: number;
      bonus_points: number;
      breakdown: Record<string, number>;   // tournamentName -> points
      results: { tournament_id: number; tournament_name: string; typ: string; points: number; bonus: number; round: string }[];
    };
    const playerMap = new Map<string, PlayerEntry>();
    const historicalTournamentNames = new Set<string>();

    for (const s of historicalStandings) {
      // Breakdown kann als Array [{t, p}] oder als Objekt {name: pts} gespeichert sein
      const raw = JSON.parse(s.tournament_breakdown || "[]");
      const breakdownEntries: [string, number][] = Array.isArray(raw)
        ? raw.map((x: { t: string; p: number }) => [x.t, x.p] as [string, number])
        : Object.entries(raw as Record<string, number>);

      const breakdown: Record<string, number> = Object.fromEntries(breakdownEntries);
      for (const name of Object.keys(breakdown)) historicalTournamentNames.add(name);

      const results = breakdownEntries
        .filter(([, pts]) => pts > 0)
        .map(([name, pts]) => ({
          tournament_id: 0,
          tournament_name: name,
          typ: "dev_cup",
          points: pts,
          bonus: 0,
          round: devPtsToBestRound(pts, "dev_cup"),
        }));
      playerMap.set(s.autodarts_username, {
        total_points: s.total_points ?? 0,
        bonus_points: s.bonus_points ?? 0,
        breakdown,
        results,
      });
    }

    // 2. Neue abgeschlossene Dev-Turniere aus der App-DB finden
    const appDevTournaments = await db
      .select()
      .from(tourTournamentsTable)
      .where(and(
        eq(tourTournamentsTable.status, "abgeschlossen"),
        eq(tourTournamentsTable.tour_type, "development"),
        eq(tourTournamentsTable.is_test, false),
      ));

    // Nur Turniere die noch NICHT in den historischen Daten sind
    const newTournaments = appDevTournaments.filter((t) => !historicalTournamentNames.has(t.name));

    if (newTournaments.length > 0) {
      const allMatches = await db.select().from(tourMatchesTable);
      const allPlayers = await db.select().from(tourPlayersTable);
      const roundOrder = ["R64", "R32", "R16", "QF", "SF", "F"];

      for (const t of newTournaments) {
        const tMatches = allMatches.filter((m) => m.tournament_id === t.id);

        // Alle Teilnehmer des Turniers ermitteln
        const participantIds = new Set<number>();
        for (const m of tMatches) {
          if (m.player1_id) participantIds.add(m.player1_id);
          if (m.player2_id) participantIds.add(m.player2_id);
        }

        for (const playerId of participantIds) {
          const player = allPlayers.find((p) => p.id === playerId);
          if (!player) continue;

          const playerMatches = tMatches.filter(
            (m) => (m.player1_id === playerId || m.player2_id === playerId)
              && m.status === "abgeschlossen" && !m.is_bye
          );

          let roundKey: string;
          if (playerMatches.length === 0) {
            roundKey = "Teilnahme";
          } else {
            const deepest = playerMatches.sort(
              (a, b) => roundOrder.indexOf(b.runde) - roundOrder.indexOf(a.runde)
            )[0];
            const isWinner = deepest.runde === "F" && deepest.winner_id === playerId;
            roundKey = isWinner ? "Sieger" : roundToOomKey(deepest.runde);
          }

          const points = OOM_POINTS[t.typ]?.[roundKey] ?? 0;
          const username = player.autodarts_username;

          const existing = playerMap.get(username) ?? {
            total_points: 0, bonus_points: 0, breakdown: {}, results: [],
          };
          existing.total_points += points;
          existing.breakdown[t.name] = points;
          existing.results.push({
            tournament_id: t.id,
            tournament_name: t.name,
            typ: t.typ,
            points,
            bonus: 0,
            round: roundKey,
          });
          playerMap.set(username, existing);
        }
      }
    }

    // 3. Ergebnis sortieren und ranken
    const result = Array.from(playerMap.entries())
      .filter(([, d]) => d.total_points > 0)
      .sort((a, b) => b[1].total_points - a[1].total_points)
      .map(([username, data], i) => ({
        rank: i + 1,
        player_id: 0,
        player_name: username,
        autodarts_username: username,
        total_points: data.total_points,
        bonus_total: data.bonus_points,
        tournaments_played: data.results.filter((r) => r.points > 0).length,
        last_updated: "",
        results: data.results,
      }));

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

function devPtsToBestRound(pts: number, typ = "dev_cup"): string {
  const table = OOM_POINTS[typ] ?? OOM_POINTS.dev_cup;
  const rounds = ["Sieger", "Finale", "Halbfinale", "Viertelfinale", "Achtelfinale", "Letzte 32", "Teilnahme"];
  for (const round of rounds) {
    if (pts >= (table[round] ?? 0)) return round;
  }
  return "Teilnahme";
}

// POST /tour/dev-oom/seed - seed Development Tour OOM standings
router.post("/tour/dev-oom/seed", async (_req, res) => {
  try {
    const existing = await db.select().from(tourDevOomStandingsTable).limit(1);
    if (existing.length > 0) {
      return res.json({ ok: true, message: "Dev OOM bereits befüllt", count: existing.length });
    }
    if (DEV_OOM_SEED_DATA.length === 0) {
      return res.json({ ok: false, message: "Keine Seed-Daten vorhanden. Bitte DEV_OOM_SEED_DATA in tour.ts befüllen." });
    }
    await db.insert(tourDevOomStandingsTable).values(DEV_OOM_SEED_DATA);
    res.json({ ok: true, inserted: DEV_OOM_SEED_DATA.length });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/dev-oom/update - replace all Dev OOM standings (admin)
router.post("/tour/dev-oom/update", async (req, res) => {
  try {
    const { standings } = req.body;
    if (!Array.isArray(standings) || standings.length === 0) {
      return res.status(400).json({ error: "standings array erforderlich" });
    }
    await db.delete(tourDevOomStandingsTable);
    const rows = standings.map((s: any, i: number) => ({
      season: 1,
      rank: i + 1,
      autodarts_username: s.autodarts_username,
      total_points: s.total_points,
      bonus_points: s.bonus_points ?? 0,
      tournaments_played: s.tournaments_played ?? 1,
      tournament_breakdown: JSON.stringify(s.tournament_breakdown ?? {}),
      last_updated: s.last_updated ?? new Date().toLocaleDateString("de-DE"),
    }));
    await db.insert(tourDevOomStandingsTable).values(rows);
    notifyOomUpdate("dev").catch(() => {});
    res.json({ ok: true, inserted: rows.length });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ─── Discord Settings Admin Endpoints ────────────────────────────────────────

// GET /tour/admin/discord-settings
router.get("/tour/admin/discord-settings", async (_req, res) => {
  try {
    const settings = await getDiscordSettings();
    const dbRows = await db.select().from(systemSettingsTable);
    const dbMap = Object.fromEntries(dbRows.map((r) => [r.key, r.value]));
    const webhookFromEnv = !dbMap["discord_webhook_url"] && !!process.env["DISCORD_WEBHOOK_URL"];
    const botFromEnv = !dbMap["discord_bot_token"] && !!process.env["DISCORD_BOT_TOKEN"];
    res.json({
      webhook_url: settings.webhookUrl ? settings.webhookUrl.replace(/\/[^/]+$/, "/***") : "",
      bot_token_set: !!(settings.botToken && settings.botToken.length > 10),
      channel_id: settings.channelId ?? "",
      webhook_from_env: webhookFromEnv,
      bot_from_env: botFromEnv,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/admin/discord-settings
router.post("/tour/admin/discord-settings", async (req, res) => {
  try {
    const { admin_pin, admin_player_id, admin_player_pin, webhook_url, bot_token, channel_id } = req.body;

    const byPlayer = admin_player_id && admin_player_pin && await isAdminPlayer(parseInt(admin_player_id), String(admin_player_pin));
    if (!byPlayer) {
      const anyT = await db.select().from(tourTournamentsTable).limit(1);
      if (!anyT[0] || !verifyPin(String(admin_pin), anyT[0].admin_pin)) {
        return res.status(403).json({ error: "Falscher Admin-PIN" });
      }
    }

    // Skip masked values (shown as *** in the frontend) — don't overwrite with them
    await saveDiscordSettings({
      webhookUrl: (webhook_url && !webhook_url.includes("***")) ? webhook_url : undefined,
      botToken: (bot_token && bot_token.trim().length > 10) ? bot_token : undefined,
      channelId: channel_id ? channel_id : undefined,
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/admin/discord-test - send a test message
router.post("/tour/admin/discord-test", async (req, res) => {
  try {
    const { admin_pin, admin_player_id, admin_player_pin } = req.body;
    const byPlayer = admin_player_id && admin_player_pin && await isAdminPlayer(parseInt(admin_player_id), String(admin_player_pin));
    if (!byPlayer) {
      const anyT = await db.select().from(tourTournamentsTable).limit(1);
      if (!anyT[0] || !verifyPin(String(admin_pin), anyT[0].admin_pin)) {
        return res.status(403).json({ error: "Falscher Admin-PIN" });
      }
    }
    const settings = await getDiscordSettings();
    if (!settings.webhookUrl) return res.status(400).json({ error: "Kein Webhook-URL konfiguriert" });

    await fetch(settings.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          color: 0xC8982E,
          title: "✅ Discord-Verbindung erfolgreich!",
          description: "Der **Online Pro Tour** Discord-Bot ist korrekt konfiguriert und bereit. Benachrichtigungen werden jetzt automatisch gesendet.",
          timestamp: new Date().toISOString(),
        }],
      }),
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/tournaments/seed-from-schedule - create tournament entries for all upcoming schedule events
router.post("/tour/tournaments/seed-from-schedule", async (req, res) => {
  try {
    const { admin_pin, admin_player_id, admin_player_pin } = req.body;
    let resolvedPinHash: string;
    if (admin_player_id && admin_player_pin) {
      const [p] = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, parseInt(admin_player_id))).limit(1);
      if (!p || !p.is_admin || !verifyPin(String(admin_player_pin), p.pin_hash)) {
        return res.status(403).json({ error: "Keine Admin-Berechtigung" });
      }
      resolvedPinHash = p.pin_hash;
    } else {
      if (!admin_pin) return res.status(400).json({ error: "admin_pin erforderlich" });
      const anyT = await db.select().from(tourTournamentsTable).limit(1);
      if (anyT[0] && !verifyPin(String(admin_pin), anyT[0].admin_pin)) {
        return res.status(403).json({ error: "Falscher Admin-PIN" });
      }
      resolvedPinHash = hashPin(String(admin_pin));
    }

    const upcoming = SEASON1_SCHEDULE.filter((s) => s.status === "upcoming");
    const existing = await db.select().from(tourTournamentsTable);
    const existingScheduleIds = new Set(existing.map((t) => t.schedule_id).filter(Boolean));

    const created: string[] = [];
    const skipped: string[] = [];

    for (const sched of upcoming) {
      if (existingScheduleIds.has(sched.external_id)) {
        skipped.push(sched.event_name);
        continue;
      }

      const legsFormat =
        sched.kategorie === "dev_cup" ? 3 :
        sched.kategorie === "m1" ? 11 :
        sched.kategorie === "m2" ? 11 : 5;

      const maxPlayers =
        sched.qualification ? 32 : 64;

      await db.insert(tourTournamentsTable).values({
        name: sched.event_name,
        typ: sched.kategorie,
        tour_type: sched.tour_type,
        phase: sched.phase,
        datum: sched.datum,
        legs_format: legsFormat,
        max_players: maxPlayers,
        admin_pin: resolvedPinHash,
        schedule_id: sched.external_id,
        is_test: false,
      });
      created.push(sched.event_name);
    }

    res.json({ ok: true, created, skipped });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ─── Player Routes ────────────────────────────────────────────────────────────

/** Normalize username for fuzzy matching: lowercase, strip hyphens/underscores/spaces/dots */
function normalizeUsername(u: string): string {
  return u.toLowerCase().replace(/[-_.\s]/g, "");
}

// GET /tour/players
router.get("/tour/players", async (_req, res) => {
  try {
    const players = await db.select().from(tourPlayersTable).orderBy(tourPlayersTable.name);

    // ── OOM historical standings ─────────────────────────────────────────────
    const proStandings = await db.select().from(tourOomStandingsTable);
    const devStandings = await db.select().from(tourDevOomStandingsTable);

    // Track which tournament names are already counted in historical standings
    const proHistNames = new Set<string>();
    const devHistNames = new Set<string>();

    // Maps use normalized username as key
    const proOomMap = new Map<string, number>(); // normalizedUsername → total_points (historical)
    for (const s of proStandings) {
      proOomMap.set(normalizeUsername(s.autodarts_username), s.total_points ?? 0);
      try {
        const raw = JSON.parse(s.tournament_breakdown || "{}");
        const entries: [string, number][] = Array.isArray(raw)
          ? raw.map((x: { t: string; p: number }) => [x.t, x.p])
          : Object.entries(raw as Record<string, number>);
        for (const [name] of entries) proHistNames.add(name);
      } catch { /* ignore */ }
    }

    const devOomMap = new Map<string, number>(); // normalizedUsername → total_points (historical)
    for (const s of devStandings) {
      devOomMap.set(normalizeUsername(s.autodarts_username), s.total_points ?? 0);
      try {
        const raw = JSON.parse(s.tournament_breakdown || "[]");
        const entries: [string, number][] = Array.isArray(raw)
          ? raw.map((x: { t: string; p: number }) => [x.t, x.p])
          : Object.entries(raw as Record<string, number>);
        for (const [name] of entries) devHistNames.add(name);
      } catch { /* ignore */ }
    }

    // ── New in-app tournament points (not already in historical base) ────────
    const appTournaments = await db.select().from(tourTournamentsTable)
      .where(and(eq(tourTournamentsTable.status, "abgeschlossen"), eq(tourTournamentsTable.is_test, false)));
    const allMatches = await db.select().from(tourMatchesTable);
    const allBonus = await db.select().from(tourBonusPointsTable);
    const roundOrder = ["R64", "R32", "R16", "QF", "SF", "F"];

    const inAppProPts = new Map<number, number>(); // player_id → extra points
    const inAppDevPts = new Map<number, number>();

    for (const t of appTournaments) {
      const histNames = t.tour_type === "pro" ? proHistNames : devHistNames;
      if (histNames.has(t.name)) continue; // already counted in historical base

      const tMatches = allMatches.filter((m) => m.tournament_id === t.id);
      const ptsMap = t.tour_type === "pro" ? inAppProPts : inAppDevPts;

      const participantIds = new Set<number>();
      for (const m of tMatches) {
        if (m.player1_id) participantIds.add(m.player1_id);
        if (m.player2_id) participantIds.add(m.player2_id);
      }

      for (const playerId of participantIds) {
        const playerMatches = tMatches.filter(
          (m) => (m.player1_id === playerId || m.player2_id === playerId)
            && m.status === "abgeschlossen" && !m.is_bye
        );
        if (playerMatches.length === 0) continue;
        const deepest = playerMatches.sort(
          (a, b) => roundOrder.indexOf(b.runde) - roundOrder.indexOf(a.runde)
        )[0];
        const isWinner = deepest.runde === "F" && deepest.winner_id === playerId;
        const roundKey = isWinner ? "Sieger" : roundToOomKey(deepest.runde);
        const pts = OOM_POINTS[t.typ]?.[roundKey] ?? 0;
        const bonus = allBonus
          .filter((b) => b.player_id === playerId && b.tournament_id === t.id)
          .reduce((s, b) => s + b.points, 0);
        ptsMap.set(playerId, (ptsMap.get(playerId) ?? 0) + pts + bonus);
      }
    }

    // ── Build result per registered player ───────────────────────────────────
    const result = players.map((p) => {
      // Use oom_name (Discord/OOM alias) as primary key, fall back to autodarts_username
      const lookupKey = normalizeUsername(p.oom_name ?? p.autodarts_username);
      const fallbackKey = p.oom_name ? normalizeUsername(p.autodarts_username) : null;

      const proHist = proOomMap.get(lookupKey) ?? (fallbackKey ? proOomMap.get(fallbackKey) ?? 0 : 0);
      const devHist = devOomMap.get(lookupKey) ?? (fallbackKey ? devOomMap.get(fallbackKey) ?? 0 : 0);
      const proTotal = proHist + (inAppProPts.get(p.id) ?? 0);
      const devTotal = devHist + (inAppDevPts.get(p.id) ?? 0);

      // Priority: Pro Tour > Dev Tour
      const oomTourType: "pro" | "development" | null =
        proTotal > 0 ? "pro" : devTotal > 0 ? "development" : null;
      const oomPoints = proTotal > 0 ? proTotal : devTotal;

      return {
        id: p.id,
        name: p.name,
        autodarts_username: p.autodarts_username,
        oom_name: p.oom_name ?? null,
        created_at: p.created_at,
        oom_points: oomPoints,
        oom_rank: 0,
        oom_tour_type: oomTourType,
      };
    });

    // Sort by points desc, then assign ranks only to players with points
    result.sort((a, b) => b.oom_points - a.oom_points);
    let rank = 0;
    for (const p of result) {
      if (p.oom_points > 0) p.oom_rank = ++rank;
    }

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/players/register
router.post("/tour/players/register", async (req, res) => {
  try {
    const { name, autodarts_username, oom_name, pin } = req.body;
    if (!name || !autodarts_username || !pin) {
      return res.status(400).json({ error: "name, autodarts_username und pin erforderlich" });
    }
    const existing = await db.select().from(tourPlayersTable)
      .where(eq(tourPlayersTable.autodarts_username, autodarts_username)).limit(1);
    if (existing[0]) return res.status(409).json({ error: "Autodarts-Benutzername bereits registriert" });

    const oomNameValue = typeof oom_name === "string" && oom_name.trim() ? oom_name.trim() : null;
    const [player] = await db.insert(tourPlayersTable)
      .values({ name, autodarts_username, oom_name: oomNameValue, pin_hash: hashPin(pin) })
      .returning();

    res.json({ id: player.id, name: player.name, autodarts_username: player.autodarts_username, created_at: player.created_at, oom_points: 0, oom_rank: 0 });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/players/login — verify credentials and return player data
router.post("/tour/players/login", async (req, res) => {
  try {
    const { autodarts_username, pin } = req.body;
    if (!autodarts_username || !pin) {
      return res.status(400).json({ error: "autodarts_username und pin erforderlich" });
    }
    const players = await db.select().from(tourPlayersTable)
      .where(eq(tourPlayersTable.autodarts_username, autodarts_username)).limit(1);
    if (!players[0]) return res.status(404).json({ error: "Spieler nicht gefunden" });
    if (!verifyPin(String(pin), players[0].pin_hash)) {
      return res.status(403).json({ error: "Falscher PIN" });
    }
    const p = players[0];
    res.json({ id: p.id, name: p.name, autodarts_username: p.autodarts_username, is_admin: p.is_admin });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/admin/grant-admin — ADMIN_SECRET required
router.post("/tour/admin/grant-admin", async (req, res) => {
  try {
    const { admin_secret, player_id } = req.body;
    if (!admin_secret || admin_secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: "Ungültiges Admin-Secret" });
    }
    const [player] = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, parseInt(player_id))).limit(1);
    if (!player) return res.status(404).json({ error: "Spieler nicht gefunden" });
    await db.update(tourPlayersTable).set({ is_admin: true }).where(eq(tourPlayersTable.id, parseInt(player_id)));
    res.json({ ok: true, message: `${player.name} ist jetzt Admin` });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/admin/revoke-admin — ADMIN_SECRET required
router.post("/tour/admin/revoke-admin", async (req, res) => {
  try {
    const { admin_secret, player_id } = req.body;
    if (!admin_secret || admin_secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: "Ungültiges Admin-Secret" });
    }
    const [player] = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, parseInt(player_id))).limit(1);
    if (!player) return res.status(404).json({ error: "Spieler nicht gefunden" });
    await db.update(tourPlayersTable).set({ is_admin: false }).where(eq(tourPlayersTable.id, parseInt(player_id)));
    res.json({ ok: true, message: `${player.name} ist kein Admin mehr` });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// PATCH /tour/players/:id/oom-name — set OOM/Discord name alias (admin only via pin)
router.patch("/tour/players/:id/oom-name", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { oom_name, admin_pin, admin_player_id, admin_player_pin } = req.body;

    const byAdminPin = admin_pin && admin_pin === process.env.ADMIN_SECRET;
    const byAdminPlayer = admin_player_id && admin_player_pin
      && await isAdminPlayer(parseInt(admin_player_id), String(admin_player_pin));

    if (!byAdminPin && !byAdminPlayer) {
      return res.status(403).json({ error: "Admin-Berechtigung erforderlich" });
    }

    const [player] = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, id)).limit(1);
    if (!player) return res.status(404).json({ error: "Spieler nicht gefunden" });

    const newName = typeof oom_name === "string" && oom_name.trim() ? oom_name.trim() : null;
    await db.update(tourPlayersTable).set({ oom_name: newName }).where(eq(tourPlayersTable.id, id));

    res.json({ ok: true, message: newName ? `OOM-Name für ${player.name} gesetzt: ${newName}` : `OOM-Name für ${player.name} entfernt` });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// PATCH /tour/players/:id/discord-id — player sets their own Discord user ID (for @mentions)
router.patch("/tour/players/:id/discord-id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { discord_id, player_pin } = req.body;
    if (!player_pin) return res.status(400).json({ error: "player_pin erforderlich" });

    const [player] = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, id)).limit(1);
    if (!player) return res.status(404).json({ error: "Spieler nicht gefunden" });
    if (!verifyPin(String(player_pin), player.pin_hash)) return res.status(403).json({ error: "Falscher PIN" });

    const newId = typeof discord_id === "string" && discord_id.trim() ? discord_id.trim() : null;
    await db.update(tourPlayersTable).set({ discord_id: newId }).where(eq(tourPlayersTable.id, id));

    res.json({ ok: true, message: newId ? `Discord-ID gesetzt` : `Discord-ID entfernt` });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /tour/players/:id
router.get("/tour/players/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const player = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, id)).limit(1);
    if (!player[0]) return res.status(404).json({ error: "Spieler nicht gefunden" });

    const entries = await db.select().from(tourEntriesTable).where(eq(tourEntriesTable.player_id, id));
    const tournamentIds = entries.map((e) => e.tournament_id);
    const tourResults: any[] = [];

    let totalWins = 0, totalLosses = 0;
    let legWins = 0, legLosses = 0;
    let avgSum = 0, avgCount = 0;
    let first9Sum = 0, first9Count = 0;
    let doublesHitTotal = 0, doublesAttTotal = 0;

    for (const tid of tournamentIds) {
      const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, tid)).limit(1);
      if (!t[0] || t[0].status !== "abgeschlossen" || t[0].is_test) continue;

      const tMatches = await db.select().from(tourMatchesTable)
        .where(eq(tourMatchesTable.tournament_id, tid));
      const playerMatches = tMatches.filter(
        (m) => (m.player1_id === id || m.player2_id === id) && m.status === "abgeschlossen" && !m.is_bye
      );
      if (playerMatches.length === 0) continue;

      // Count wins/losses and leg stats
      for (const m of playerMatches) {
        const isP1 = m.player1_id === id;
        const won = m.winner_id === id;
        if (won) totalWins++; else totalLosses++;
        const myLegs = isP1 ? (m.score_p1 ?? 0) : (m.score_p2 ?? 0);
        const oppLegs = isP1 ? (m.score_p2 ?? 0) : (m.score_p1 ?? 0);
        legWins += myLegs; legLosses += oppLegs;
        const myAvg = isP1 ? m.avg_p1 : m.avg_p2;
        if (myAvg != null && myAvg > 0) { avgSum += myAvg; avgCount++; }
        // Extended stats
        const myFirst9 = isP1 ? m.first9_p1 : m.first9_p2;
        if (myFirst9 != null && myFirst9 > 0) { first9Sum += myFirst9; first9Count++; }
        const myDblHit = isP1 ? m.doubles_hit_p1 : m.doubles_hit_p2;
        const myDblAtt = isP1 ? m.doubles_att_p1 : m.doubles_att_p2;
        if (myDblHit != null) doublesHitTotal += myDblHit;
        if (myDblAtt != null) doublesAttTotal += myDblAtt;
      }

      const roundOrder = ["R64", "R32", "R16", "QF", "SF", "F"];
      const deepest = playerMatches.sort(
        (a, b) => roundOrder.indexOf(b.runde) - roundOrder.indexOf(a.runde)
      )[0];
      const isWinner = deepest.runde === "F" && deepest.winner_id === id;
      const roundKey = isWinner ? "Sieger" : roundToOomKey(deepest.runde);
      // Only count pro tournaments for pro OOM points
      const isDevTour = t[0].tour_type === "development";
      const pts = isDevTour ? 0 : (OOM_POINTS[t[0].typ]?.[roundKey] ?? 0);
      const devPts = isDevTour ? (OOM_POINTS[t[0].typ]?.[roundKey] ?? 0) : 0;

      tourResults.push({
        tournament_id: tid,
        tournament_name: t[0].name,
        typ: t[0].typ,
        tour_type: t[0].tour_type,
        round: roundKey,
        points: pts,
        dev_points: devPts,
        matches_won: playerMatches.filter((m) => m.winner_id === id).length,
        matches_lost: playerMatches.filter((m) => m.winner_id !== id && m.winner_id != null).length,
        datum: t[0].datum,
      });
    }

    const bonusRows = await db.select().from(tourBonusPointsTable).where(eq(tourBonusPointsTable.player_id, id));
    const bonusTotal = bonusRows.reduce((s, b) => s + b.points, 0);
    const totalPoints = tourResults.reduce((s, r) => s + r.points, 0) + bonusTotal;
    const devTotalPoints = tourResults.reduce((s, r) => s + r.dev_points, 0);

    res.json({
      id: player[0].id,
      name: player[0].name,
      autodarts_username: player[0].autodarts_username,
      created_at: player[0].created_at,
      oom_points: totalPoints,
      dev_oom_points: devTotalPoints,
      stats: {
        matches_won: totalWins,
        matches_lost: totalLosses,
        win_rate: totalWins + totalLosses > 0 ? Math.round((totalWins / (totalWins + totalLosses)) * 100) : 0,
        legs_won: legWins,
        legs_lost: legLosses,
        avg_score: avgCount > 0 ? Math.round((avgSum / avgCount) * 10) / 10 : null,
        first9_avg: first9Count > 0 ? Math.round((first9Sum / first9Count) * 10) / 10 : null,
        double_rate: doublesAttTotal > 0 ? Math.round((doublesHitTotal / doublesAttTotal) * 1000) / 10 : null,
        doubles_hit: doublesHitTotal > 0 ? doublesHitTotal : null,
        doubles_att: doublesAttTotal > 0 ? doublesAttTotal : null,
        tournaments_played: tourResults.length,
        titles: tourResults.filter((r) => r.round === "Sieger").length,
      },
      tournament_results: tourResults.sort((a, b) => b.datum.localeCompare(a.datum)),
      bonus_points: bonusRows,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /tour/players/:id/h2h/:opponentId — head-to-head stats
router.get("/tour/players/:id/h2h/:opponentId", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const opponentId = parseInt(req.params.opponentId);
    if (isNaN(id) || isNaN(opponentId)) return res.status(400).json({ error: "Ungültige IDs" });

    const [p1, p2] = await Promise.all([
      db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, id)).limit(1),
      db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, opponentId)).limit(1),
    ]);
    if (!p1[0] || !p2[0]) return res.status(404).json({ error: "Spieler nicht gefunden" });

    const allMatches = await db.select().from(tourMatchesTable).where(
      and(eq(tourMatchesTable.status, "abgeschlossen"))
    );

    const h2hMatches = allMatches.filter(
      (m) => !m.is_bye && (
        (m.player1_id === id && m.player2_id === opponentId) ||
        (m.player1_id === opponentId && m.player2_id === id)
      )
    );

    let wins = 0, losses = 0, legWins = 0, legLosses = 0;
    const history: any[] = [];

    for (const m of h2hMatches) {
      const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, m.tournament_id)).limit(1);
      if (!t[0] || t[0].is_test) continue;

      const isP1 = m.player1_id === id;
      const won = m.winner_id === id;
      if (won) wins++; else losses++;
      const myLegs = isP1 ? (m.score_p1 ?? 0) : (m.score_p2 ?? 0);
      const oppLegs = isP1 ? (m.score_p2 ?? 0) : (m.score_p1 ?? 0);
      legWins += myLegs; legLosses += oppLegs;
      const myAvg = isP1 ? m.avg_p1 : m.avg_p2;
      const oppAvg = isP1 ? m.avg_p2 : m.avg_p1;

      history.push({
        match_id: m.id,
        tournament_id: m.tournament_id,
        tournament_name: t[0].name,
        runde: m.runde,
        won,
        my_score: myLegs,
        opp_score: oppLegs,
        my_avg: myAvg,
        opp_avg: oppAvg,
        datum: t[0].datum ?? "",
      });
    }

    res.json({
      player: { id: p1[0].id, name: p1[0].name, autodarts_username: p1[0].autodarts_username },
      opponent: { id: p2[0].id, name: p2[0].name, autodarts_username: p2[0].autodarts_username },
      wins,
      losses,
      leg_wins: legWins,
      leg_losses: legLosses,
      history: history.sort((a, b) => b.datum.localeCompare(a.datum)),
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ─── Tournament Routes ────────────────────────────────────────────────────────

// GET /tour/tournaments
router.get("/tour/tournaments", async (_req, res) => {
  try {
    const tournaments = await db.select().from(tourTournamentsTable);
    const enriched = await Promise.all(tournaments.map(async (t) => {
      const entries = await db.select().from(tourEntriesTable).where(eq(tourEntriesTable.tournament_id, t.id));
      return { ...t, player_count: entries.length };
    }));
    // Sort: upcoming/open first (by date ascending), then closed (by date descending), then test last
    enriched.sort((a, b) => {
      const aTest = a.is_test ? 1 : 0;
      const bTest = b.is_test ? 1 : 0;
      if (aTest !== bTest) return aTest - bTest;
      const aOpen = (a.status === "offen" || a.status === "laufend") ? 0 : 1;
      const bOpen = (b.status === "offen" || b.status === "laufend") ? 0 : 1;
      if (aOpen !== bOpen) return aOpen - bOpen;
      const aDate = parseDatumToISO(a.datum);
      const bDate = parseDatumToISO(b.datum);
      return aOpen === 0 ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
    });
    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/tournaments
router.post("/tour/tournaments", async (req, res) => {
  try {
    const { name, typ, tour_type, datum, uhrzeit, legs_format, max_players, admin_pin, admin_player_id, admin_player_pin, schedule_id, phase, is_test, random_draw } = req.body;

    let resolvedAdminPinHash: string;
    if (admin_player_id && admin_player_pin) {
      const [p] = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, parseInt(admin_player_id))).limit(1);
      if (!p || !p.is_admin || !verifyPin(String(admin_player_pin), p.pin_hash)) {
        return res.status(403).json({ error: "Keine Admin-Berechtigung" });
      }
      resolvedAdminPinHash = p.pin_hash;
    } else if (admin_pin) {
      resolvedAdminPinHash = hashPin(String(admin_pin));
    } else {
      return res.status(400).json({ error: "name, typ, datum, admin_pin erforderlich" });
    }

    if (!name || !typ || !datum) {
      return res.status(400).json({ error: "name, typ, datum erforderlich" });
    }

    const [t] = await db.insert(tourTournamentsTable)
      .values({
        name,
        typ: typ || "pc",
        tour_type: tour_type || "pro",
        phase: phase || null,
        datum,
        uhrzeit: uhrzeit || null,
        legs_format: legs_format ?? 5,
        max_players: max_players ?? 32,
        admin_pin: resolvedAdminPinHash,
        schedule_id: schedule_id || null,
        is_test: is_test === true || is_test === "true" ? true : false,
        random_draw: random_draw === true || random_draw === "true" ? true : false,
      })
      .returning();

    res.json(t);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /tour/tournaments/:id — admin only, deletes all related data
router.delete("/tour/tournaments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { admin_pin, admin_player_id, admin_player_pin } = req.body;

    const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, id)).limit(1);
    if (!t[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });

    const byPin = admin_pin && verifyPin(String(admin_pin), t[0].admin_pin);
    const byAdmin = admin_player_id && admin_player_pin && await isAdminPlayer(parseInt(admin_player_id), String(admin_player_pin));
    if (!byPin && !byAdmin) return res.status(403).json({ error: "Keine Berechtigung" });

    // Delete all related data first (FK order)
    await db.delete(tourMatchesTable).where(eq(tourMatchesTable.tournament_id, id));
    await db.delete(tourEntriesTable).where(eq(tourEntriesTable.tournament_id, id));
    await db.delete(tourTournamentsTable).where(eq(tourTournamentsTable.id, id));

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /tour/tournaments/:id
router.get("/tour/tournaments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const detail = await buildTournamentDetail(id);
    if (!detail) return res.status(404).json({ error: "Turnier nicht gefunden" });
    res.json(detail);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/tournaments/:id/entries
router.post("/tour/tournaments/:id/entries", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { player_id } = req.body;
    if (!player_id) return res.status(400).json({ error: "player_id erforderlich" });

    const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, tournamentId)).limit(1);
    if (!t[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });
    if (t[0].status !== "offen") return res.status(400).json({ error: "Turnier ist nicht mehr offen" });

    const existing = await db.select().from(tourEntriesTable)
      .where(and(eq(tourEntriesTable.tournament_id, tournamentId), eq(tourEntriesTable.player_id, player_id))).limit(1);
    if (existing[0]) return res.status(409).json({ error: "Spieler bereits eingetragen" });

    const entries = await db.select().from(tourEntriesTable).where(eq(tourEntriesTable.tournament_id, tournamentId));
    if (entries.length >= t[0].max_players) return res.status(400).json({ error: "Turnier ist voll" });

    await db.insert(tourEntriesTable).values({ tournament_id: tournamentId, player_id, seed: entries.length + 1 });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/tournaments/:id/self-register — players request registration (pending admin approval)
router.post("/tour/tournaments/:id/self-register", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { player_id, pin } = req.body;
    if (!player_id || !pin) return res.status(400).json({ error: "player_id und pin erforderlich" });

    const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, tournamentId)).limit(1);
    if (!t[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });
    if (t[0].status !== "offen") return res.status(400).json({ error: "Turnier ist nicht mehr offen für Anmeldungen" });

    const player = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, player_id)).limit(1);
    if (!player[0]) return res.status(404).json({ error: "Spieler nicht gefunden" });
    if (!verifyPin(String(pin), player[0].pin_hash)) return res.status(403).json({ error: "Falscher PIN" });

    const existing = await db.select().from(tourEntriesTable)
      .where(and(eq(tourEntriesTable.tournament_id, tournamentId), eq(tourEntriesTable.player_id, player_id))).limit(1);
    if (existing[0]) return res.status(409).json({ error: "Du bist bereits für dieses Turnier angemeldet oder hast eine ausstehende Anfrage" });

    const approvedEntries = await db.select().from(tourEntriesTable)
      .where(and(eq(tourEntriesTable.tournament_id, tournamentId), eq(tourEntriesTable.status, "approved")));
    if (approvedEntries.length >= t[0].max_players) return res.status(400).json({ error: "Turnier ist voll" });

    // Create pending entry – admin must approve
    await db.insert(tourEntriesTable).values({ tournament_id: tournamentId, player_id, seed: null, status: "pending" });

    // Notify admin via Discord
    notifyRegistration(
      t[0].name,
      tournamentId,
      player[0].name,
      player[0].autodarts_username ?? player[0].name,
      approvedEntries.length + 1,
      t[0].max_players,
    ).catch(() => {});

    // Push to all admins
    const admins = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.is_admin, true));
    for (const admin of admins) {
      sendPushToPlayer(admin.id, "📋 Neue Turnier-Anfrage", `${player[0].name} möchte sich für ${t[0].name} anmelden.`, `/pro-tour/turniere/${tournamentId}`).catch(() => {});
    }

    res.json({ ok: true, status: "pending" });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /tour/tournaments/:id/pending-registrations — admin sees pending entries
router.get("/tour/tournaments/:id/pending-registrations", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const pending = await db.select({
      id: tourEntriesTable.id,
      player_id: tourEntriesTable.player_id,
      name: tourPlayersTable.name,
      autodarts_username: tourPlayersTable.autodarts_username,
    })
      .from(tourEntriesTable)
      .innerJoin(tourPlayersTable, eq(tourEntriesTable.player_id, tourPlayersTable.id))
      .where(and(eq(tourEntriesTable.tournament_id, tournamentId), eq(tourEntriesTable.status, "pending")));
    res.json(pending);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/tournaments/:id/pending-registrations/:entryId/approve — admin approves
router.post("/tour/tournaments/:id/pending-registrations/:entryId/approve", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const entryId = parseInt(req.params.entryId);
    const { admin_pin, admin_player_id, admin_player_pin } = req.body;

    const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, tournamentId)).limit(1);
    if (!t[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });

    const byPlayer = admin_player_id && admin_player_pin && await isAdminPlayer(parseInt(admin_player_id), String(admin_player_pin));
    if (!byPlayer && !verifyPin(String(admin_pin), t[0].admin_pin)) return res.status(403).json({ error: "Falscher Admin-PIN" });

    const approved = await db.select().from(tourEntriesTable)
      .where(and(eq(tourEntriesTable.tournament_id, tournamentId), eq(tourEntriesTable.status, "approved")));
    const seed = approved.length + 1;

    await db.update(tourEntriesTable)
      .set({ status: "approved", seed })
      .where(eq(tourEntriesTable.id, entryId));

    // Notify player
    const entry = await db.select({ player_id: tourEntriesTable.player_id }).from(tourEntriesTable).where(eq(tourEntriesTable.id, entryId)).limit(1);
    if (entry[0]) {
      sendPushToPlayer(entry[0].player_id, "✅ Anmeldung bestätigt!", `Du wurdest für ${t[0].name} freigegeben.`, `/pro-tour/turniere/${tournamentId}`).catch(() => {});
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/tournaments/:id/pending-registrations/:entryId/reject — admin rejects
router.post("/tour/tournaments/:id/pending-registrations/:entryId/reject", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const entryId = parseInt(req.params.entryId);
    const { admin_pin, admin_player_id, admin_player_pin } = req.body;

    const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, tournamentId)).limit(1);
    if (!t[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });

    const byPlayer = admin_player_id && admin_player_pin && await isAdminPlayer(parseInt(admin_player_id), String(admin_player_pin));
    if (!byPlayer && !verifyPin(String(admin_pin), t[0].admin_pin)) return res.status(403).json({ error: "Falscher Admin-PIN" });

    const entry = await db.select({ player_id: tourEntriesTable.player_id }).from(tourEntriesTable).where(eq(tourEntriesTable.id, entryId)).limit(1);

    await db.delete(tourEntriesTable).where(eq(tourEntriesTable.id, entryId));

    if (entry[0]) {
      sendPushToPlayer(entry[0].player_id, "❌ Anmeldung abgelehnt", `Deine Anmeldung für ${t[0].name} wurde abgelehnt.`, `/pro-tour/turniere/${tournamentId}`).catch(() => {});
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /tour/tournaments/:id/entries/:playerId — admin only (requires admin_pin or admin_player auth)
router.delete("/tour/tournaments/:id/entries/:playerId", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const playerId = parseInt(req.params.playerId);
    const { admin_pin, admin_player_id, admin_player_pin } = req.body;

    const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, tournamentId)).limit(1);
    if (!t[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });

    const byPlayer = admin_player_id && admin_player_pin && await isAdminPlayer(parseInt(admin_player_id), String(admin_player_pin));
    if (!byPlayer && (!admin_pin || !verifyPin(String(admin_pin), t[0].admin_pin))) {
      return res.status(403).json({ error: "Falscher Admin-PIN" });
    }
    if (t[0].status !== "offen") return res.status(400).json({ error: "Turnier ist bereits gestartet" });

    await db.delete(tourEntriesTable)
      .where(and(eq(tourEntriesTable.tournament_id, tournamentId), eq(tourEntriesTable.player_id, playerId)));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/tournaments/:id/entries/:playerId/confirm — player confirms attendance (RSVP)
router.post("/tour/tournaments/:id/entries/:playerId/confirm", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const playerId = parseInt(req.params.playerId);
    const { pin } = req.body;

    const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, tournamentId)).limit(1);
    if (!t[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });
    if (t[0].status !== "offen") return res.status(400).json({ error: "Bestätigung nur bei offenen Turnieren möglich" });

    const player = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, playerId)).limit(1);
    if (!player[0]) return res.status(404).json({ error: "Spieler nicht gefunden" });
    if (!verifyPin(String(pin), player[0].pin_hash)) return res.status(403).json({ error: "Falscher PIN" });

    const entry = await db.select().from(tourEntriesTable)
      .where(and(eq(tourEntriesTable.tournament_id, tournamentId), eq(tourEntriesTable.player_id, playerId))).limit(1);
    if (!entry[0]) return res.status(404).json({ error: "Nicht angemeldet" });

    await db.update(tourEntriesTable)
      .set({ confirmed: true })
      .where(and(eq(tourEntriesTable.tournament_id, tournamentId), eq(tourEntriesTable.player_id, playerId)));

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /tour/vapid-public-key — return VAPID public key for push setup
router.get("/tour/vapid-public-key", (_req, res) => {
  res.json({ public_key: VAPID_PUBLIC_KEY });
});

// POST /tour/players/:id/push-subscribe — store push subscription
router.post("/tour/players/:id/push-subscribe", async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const { endpoint, p256dh, auth, pin } = req.body;
    if (!endpoint || !p256dh || !auth) return res.status(400).json({ error: "subscription fields required" });

    const player = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, playerId)).limit(1);
    if (!player[0]) return res.status(404).json({ error: "Spieler nicht gefunden" });
    if (!verifyPin(String(pin), player[0].pin_hash)) return res.status(403).json({ error: "Falscher PIN" });

    await db.delete(tourPushSubscriptionsTable).where(eq(tourPushSubscriptionsTable.player_id, playerId));
    await db.insert(tourPushSubscriptionsTable).values({ player_id: playerId, endpoint, p256dh, auth });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /tour/players/:id/push-unsubscribe
router.delete("/tour/players/:id/push-unsubscribe", async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    await db.delete(tourPushSubscriptionsTable).where(eq(tourPushSubscriptionsTable.player_id, playerId));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /tour/players/:id/push-status — check if player has push subscription
router.get("/tour/players/:id/push-status", async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const sub = await db.select().from(tourPushSubscriptionsTable)
      .where(eq(tourPushSubscriptionsTable.player_id, playerId)).limit(1);
    res.json({ subscribed: sub.length > 0 });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /tour/live-ticker — all active matches from running tournaments
router.get("/tour/live-ticker", async (_req, res) => {
  try {
    const running = await db.select().from(tourTournamentsTable)
      .where(and(eq(tourTournamentsTable.status, "laufend"), eq(tourTournamentsTable.is_test, false)));

    if (running.length === 0) return res.json([]);

    const allPlayers = await db.select().from(tourPlayersTable);
    const playerMap = new Map(allPlayers.map((p) => [p.id, p]));

    const ticker: any[] = [];
    for (const t of running) {
      const matches = await db.select().from(tourMatchesTable)
        .where(and(eq(tourMatchesTable.tournament_id, t.id)));

      const active = matches.filter((m) => !m.is_bye && m.player1_id && m.player2_id && m.status !== "abgeschlossen");
      for (const m of active) {
        ticker.push({
          tournament_id: t.id,
          tournament_name: t.name,
          match_id: m.id,
          runde: m.runde,
          player1: playerMap.get(m.player1_id!)?.name ?? "?",
          player2: playerMap.get(m.player2_id!)?.name ?? "?",
          score_p1: m.score_p1,
          score_p2: m.score_p2,
          avg_p1: m.avg_p1,
          avg_p2: m.avg_p2,
          status: m.status,
          autodarts_match_id: m.autodarts_match_id,
        });
      }
    }

    res.json(ticker);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/tournaments/:id/start
router.post("/tour/tournaments/:id/start", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { admin_pin, admin_player_id, admin_player_pin } = req.body;

    const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, tournamentId)).limit(1);
    if (!t[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });

    const byPin = admin_pin && verifyPin(String(admin_pin), t[0].admin_pin);
    const byAdmin = admin_player_id && admin_player_pin && await isAdminPlayer(parseInt(admin_player_id), String(admin_player_pin));
    if (!byPin && !byAdmin) return res.status(403).json({ error: "Keine Berechtigung" });
    if (t[0].status !== "offen") return res.status(400).json({ error: "Turnier bereits gestartet" });

    const entries = await db.select().from(tourEntriesTable).where(eq(tourEntriesTable.tournament_id, tournamentId));
    if (entries.length < 2) return res.status(400).json({ error: "Mindestens 2 Spieler erforderlich" });

    await db.update(tourTournamentsTable).set({ status: "laufend" }).where(eq(tourTournamentsTable.id, tournamentId));
    const playerIds = entries.sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0)).map((e) => e.player_id);
    await generateBracket(tournamentId, playerIds, t[0].legs_format, t[0].random_draw);

    // Fire-and-forget Discord webhook announcement (lobby + threads handled inside generateBracket)
    (async () => {
      try {
        const allMatches = await db.select().from(tourMatchesTable)
          .where(eq(tourMatchesTable.tournament_id, tournamentId));
        const firstRound = allMatches.length > 0
          ? allMatches.reduce((acc, m) => {
              const order = ["R64", "R32", "R16", "QF", "SF", "F"];
              const aIdx = order.indexOf(acc);
              const mIdx = order.indexOf(m.runde);
              return mIdx < aIdx ? m.runde : acc;
            }, "F")
          : "R64";
        const r1Matches = allMatches.filter((m) => m.runde === firstRound);

        const playerMap = new Map<number, string>();
        for (const entry of entries) {
          const p = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, entry.player_id)).limit(1);
          if (p[0]) playerMap.set(p[0].id, p[0].name);
        }

        const matchData = r1Matches.map((m) => ({
          match_nr: m.match_nr,
          runde: m.runde,
          is_bye: m.is_bye ?? false,
          player1_name: m.player1_id ? (playerMap.get(m.player1_id) ?? null) : null,
          player2_name: m.player2_id ? (playerMap.get(m.player2_id) ?? null) : null,
        }));

        // Webhook overview only — individual threads are created inside generateBracket()
        await notifyTournamentStart(t[0], matchData);
      } catch { /* non-critical */ }
    })();

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/tournaments/:id/draw-next-round — Admin triggers random draw for next round
router.post("/tour/tournaments/:id/draw-next-round", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { admin_player_id, admin_player_pin } = req.body;

    const [t] = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, tournamentId)).limit(1);
    if (!t) return res.status(404).json({ error: "Turnier nicht gefunden" });
    if (!t.random_draw) return res.status(400).json({ error: "Turnier hat keine Zufalls-Auslosung" });
    if (t.status !== "laufend") return res.status(400).json({ error: "Turnier ist nicht aktiv" });

    const byAdmin = admin_player_id && admin_player_pin && await isAdminPlayer(parseInt(admin_player_id), String(admin_player_pin));
    if (!byAdmin) return res.status(403).json({ error: "Keine Admin-Berechtigung" });

    // Find all existing rounds and determine the last one
    const allMatches = await db.select().from(tourMatchesTable).where(eq(tourMatchesTable.tournament_id, tournamentId));
    const roundOrder = ["R64", "R32", "R16", "QF", "SF", "F"];
    const existingRounds = [...new Set(allMatches.map((m) => m.runde))].sort((a, b) => roundOrder.indexOf(a) - roundOrder.indexOf(b));
    const lastRound = existingRounds[existingRounds.length - 1];

    // Ensure all matches in the last round are complete (have a winner)
    const lastRoundMatches = allMatches.filter((m) => m.runde === lastRound);
    const allComplete = lastRoundMatches.every((m) => m.winner_id !== null);
    if (!allComplete) return res.status(400).json({ error: "Noch nicht alle Matches der aktuellen Runde abgeschlossen" });

    // Check if this was the final round
    if (lastRound === "F") return res.status(400).json({ error: "Das Turnier ist bereits beendet" });

    // Collect winners from the last round
    const winners = lastRoundMatches.map((m) => m.winner_id!).filter(Boolean);

    // Determine next round
    const lastRoundIdx = roundOrder.indexOf(lastRound);
    const nextRound = roundOrder[lastRoundIdx + 1];
    if (!nextRound) return res.status(400).json({ error: "Keine weitere Runde verfuegbar" });

    // Check if next round already exists
    const nextRoundExists = allMatches.some((m) => m.runde === nextRound);
    if (nextRoundExists) return res.status(400).json({ error: "Naechste Runde bereits ausgelost" });

    // Shuffle winners randomly (Fisher-Yates)
    const shuffled = fisherYatesShuffle(winners);
    let bracketSize = 2;
    while (bracketSize < shuffled.length) bracketSize *= 2;
    const seeded = [...shuffled, ...Array(bracketSize - shuffled.length).fill(null)];
    const matchCount = seeded.length / 2;

    const newMatches: (typeof tourMatchesTable.$inferInsert)[] = [];
    for (let i = 0; i < matchCount; i++) {
      const p1 = seeded[i * 2] ?? null;
      const p2 = seeded[i * 2 + 1] ?? null;
      const isBye = p1 !== null && p2 === null;
      newMatches.push({
        tournament_id: tournamentId,
        runde: nextRound,
        match_nr: i + 1,
        player1_id: p1,
        player2_id: p2,
        status: isBye ? "abgeschlossen" : "ausstehend",
        is_bye: isBye,
        winner_id: isBye ? p1 : null,
        score_p1: isBye ? t.legs_format : null,
        score_p2: isBye ? 0 : null,
      });
    }

    // Transactional insert: re-check round doesn't exist, then insert atomically
    await db.transaction(async (tx) => {
      const existing = await tx.select({ id: tourMatchesTable.id })
        .from(tourMatchesTable)
        .where(and(eq(tourMatchesTable.tournament_id, tournamentId), eq(tourMatchesTable.runde, nextRound)))
        .limit(1);
      if (existing.length > 0) throw new Error("Naechste Runde bereits ausgelost");
      await tx.insert(tourMatchesTable).values(newMatches);
    });

    // Load player names for response and lobby/thread creation
    const playerNameMap = new Map<number, string>();
    for (const pid of winners) {
      if (pid && !playerNameMap.has(pid)) {
        const [p] = await db.select({ name: tourPlayersTable.name }).from(tourPlayersTable).where(eq(tourPlayersTable.id, pid)).limit(1);
        if (p) playerNameMap.set(pid, p.name);
      }
    }

    // Auto-create lobbies and Discord threads for new non-bye matches
    const insertedMatches = await db.select().from(tourMatchesTable)
      .where(and(
        eq(tourMatchesTable.tournament_id, tournamentId),
        eq(tourMatchesTable.runde, nextRound),
        eq(tourMatchesTable.is_bye, false),
        eq(tourMatchesTable.status, "ausstehend"),
      ));

    for (const m of insertedMatches) {
      if (m.player1_id && m.player2_id) {
        const lobbyUrl = await autoCreateLobby(m.id).catch(() => null);
        const p1Name = playerNameMap.get(m.player1_id) ?? "Spieler 1";
        const p2Name = playerNameMap.get(m.player2_id) ?? "Spieler 2";
        createMatchThreadForMatch(t.name, tournamentId, m.runde, m.match_nr, p1Name, p2Name, lobbyUrl)
          .then((threadId) => {
            if (threadId) db.update(tourMatchesTable).set({ discord_thread_id: threadId }).where(eq(tourMatchesTable.id, m.id)).catch(() => {});
          })
          .catch(() => {});
        notifyMatchReady(m.id, t.name, lobbyUrl).catch(() => {});
        await new Promise((r) => setTimeout(r, 350));
      }
    }

    // Return the pairings for the animation overlay
    const pairings = newMatches.map((m, i) => ({
      match_nr: m.match_nr,
      runde: nextRound,
      player1_id: m.player1_id,
      player2_id: m.player2_id,
      player1_name: m.player1_id ? (playerNameMap.get(m.player1_id) ?? null) : null,
      player2_name: m.player2_id ? (playerNameMap.get(m.player2_id) ?? null) : null,
      is_bye: m.is_bye,
    }));

    res.json({ ok: true, round: nextRound, pairings });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ─── Match Routes ─────────────────────────────────────────────────────────────

// POST /tour/matches/:matchId/result
router.post("/tour/matches/:matchId/result", async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const { winner_id, score_p1, score_p2, admin_pin, admin_player_id, admin_player_pin } = req.body;

    const match = await db.select().from(tourMatchesTable).where(eq(tourMatchesTable.id, matchId)).limit(1);
    if (!match[0]) return res.status(404).json({ error: "Match nicht gefunden" });
    if (match[0].status === "abgeschlossen") return res.status(400).json({ error: "Match bereits abgeschlossen" });

    const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, match[0].tournament_id)).limit(1);
    if (!t[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });

    const byPin = admin_pin && verifyPin(String(admin_pin), t[0].admin_pin);
    const byAdmin = admin_player_id && admin_player_pin && await isAdminPlayer(parseInt(admin_player_id), String(admin_player_pin));
    if (!byPin && !byAdmin) return res.status(403).json({ error: "Keine Berechtigung" });

    await db.update(tourMatchesTable)
      .set({ winner_id, score_p1, score_p2, status: "abgeschlossen" })
      .where(eq(tourMatchesTable.id, matchId));

    await advanceWinner(match[0].tournament_id, match[0].runde, match[0].match_nr, winner_id);
    const wasComplete = await checkTournamentComplete(match[0].tournament_id);

    // Fire-and-forget Discord notifications
    (async () => {
      try {
        const [p1row, p2row, winnerRow] = await Promise.all([
          match[0].player1_id
            ? db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, match[0].player1_id)).limit(1)
            : Promise.resolve([]),
          match[0].player2_id
            ? db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, match[0].player2_id)).limit(1)
            : Promise.resolve([]),
          db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, winner_id)).limit(1),
        ]);
        const p1Name = (p1row as any)[0]?.name ?? "Spieler 1";
        const p2Name = (p2row as any)[0]?.name ?? "Spieler 2";
        const winnerName = winnerRow[0]?.name ?? "Unbekannt";

        await notifyMatchResult(
          t[0].name,
          match[0].runde,
          p1Name,
          p2Name,
          score_p1 ?? 0,
          score_p2 ?? 0,
          winnerName,
        );

        if (wasComplete) {
          const loserName = winner_id === match[0].player1_id ? p2Name : p1Name;
          await notifyTournamentComplete(t[0].name, winnerName, loserName);
        }
      } catch { /* non-critical */ }
    })();

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ─── Autodarts Helpers ────────────────────────────────────────────────────────

let cachedToken: { value: string; expiresAt: number } | null = null;
// Store the latest refresh token in memory — updated on every successful refresh.
// Survives concurrent calls but NOT server restarts (→ persisted to DB below).
let activeRefreshToken: string | null = null;
// Mutex: only one refresh in flight at a time — prevents race-conditions where
// two concurrent callers both try to refresh and Keycloak rejects the second one
// (OAuth2 refresh tokens are single-use).
let refreshPromise: Promise<string | null> | null = null;

async function persistRefreshToken(token: string) {
  try {
    await db.insert(systemSettingsTable)
      .values({ key: "autodarts_refresh_token", value: token, updated_at: new Date() })
      .onConflictDoUpdate({ target: systemSettingsTable.key, set: { value: token, updated_at: new Date() } });
  } catch { /* non-critical */ }
}

async function loadRefreshTokenFromDb(): Promise<string | null> {
  try {
    const row = await db.select().from(systemSettingsTable)
      .where(eq(systemSettingsTable.key, "autodarts_refresh_token")).limit(1);
    return row[0]?.value ?? null;
  } catch { return null; }
}

async function getAutodartAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  // If another caller is already refreshing, wait for that same promise
  if (refreshPromise) return refreshPromise;
  // Priority: in-memory → DB → env var
  if (!activeRefreshToken) {
    activeRefreshToken = await loadRefreshTokenFromDb();
  }
  const refreshToken = activeRefreshToken ?? process.env.AUTODARTS_REFRESH_TOKEN;
  if (!refreshToken) return null;
  refreshPromise = (async () => {
    try {
      const tokenRes = await fetch(
        "https://login.autodarts.io/realms/autodarts/protocol/openid-connect/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: "autodarts-play",
            refresh_token: refreshToken,
          }),
        }
      );
      if (!tokenRes.ok) return null;
      const tokenData: any = await tokenRes.json();
      if (tokenData.refresh_token) {
        activeRefreshToken = tokenData.refresh_token;
        // Persist so the newest token survives server restarts
        await persistRefreshToken(tokenData.refresh_token);
      }
      cachedToken = { value: tokenData.access_token, expiresAt: Date.now() + 50_000 };
      return tokenData.access_token;
    } catch { return null; }
    finally { refreshPromise = null; }
  })();
  return refreshPromise;
}

// ─── Per-player token cache ──────────────────────────────────────────────────
// Each player can store their own Autodarts refresh token. We cache per-player
// access tokens exactly like the global token, keyed by player DB id.
const playerTokenCache = new Map<number, { value: string; expiresAt: number }>();
const playerRefreshPromises = new Map<number, Promise<string | null>>();

async function getPlayerAccessToken(playerId: number): Promise<string | null> {
  const cached = playerTokenCache.get(playerId);
  if (cached && Date.now() < cached.expiresAt) return cached.value;
  if (playerRefreshPromises.has(playerId)) return playerRefreshPromises.get(playerId)!;

  const rows = await db.select({ tok: tourPlayersTable.autodarts_refresh_token })
    .from(tourPlayersTable).where(eq(tourPlayersTable.id, playerId)).limit(1);
  const refreshToken = rows[0]?.tok;
  if (!refreshToken) return null;

  const p = (async () => {
    try {
      const r = await fetch(
        "https://login.autodarts.io/realms/autodarts/protocol/openid-connect/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: "autodarts-play",
            refresh_token: refreshToken,
          }),
        }
      );
      if (!r.ok) return null;
      const d: any = await r.json();
      if (d.refresh_token) {
        await db.update(tourPlayersTable)
          .set({ autodarts_refresh_token: d.refresh_token })
          .where(eq(tourPlayersTable.id, playerId));
      }
      if (d.access_token) {
        playerTokenCache.set(playerId, { value: d.access_token, expiresAt: Date.now() + 50_000 });
        return d.access_token as string;
      }
      return null;
    } catch { return null; }
    finally { playerRefreshPromises.delete(playerId); }
  })();
  playerRefreshPromises.set(playerId, p);
  return p;
}

// ─── Autodarts endpoints ──────────────────────────────────────────────────────
// 1. as/v0/matches/filter — recently COMPLETED matches for the authed user
// 2. gs/v0/lobbies        — currently ACTIVE lobbies/games (all visible lobbies)
const AD_MATCHES_URL = "https://api.autodarts.io/as/v0/matches/filter?size=250&page=0&sort=-finished_at";
const AD_LOBBIES_URL = "https://api.autodarts.io/gs/v0/lobbies";

function parseAdItems(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.items) return data.items;
  if (data?.matches) return data.matches;
  if (data?.data) return data.data;
  return [];
}

async function fetchAutodartMatches(accessToken: string): Promise<{ completed: any[]; live: any[] }> {
  const headers = { Authorization: `Bearer ${accessToken}`, Accept: "application/json" };
  const [matchRes, lobbyRes] = await Promise.allSettled([
    fetch(AD_MATCHES_URL, { headers }),
    fetch(AD_LOBBIES_URL, { headers }),
  ]);

  const completed: any[] = [];
  const live: any[] = [];

  if (matchRes.status === "fulfilled" && matchRes.value.ok) {
    const data = await matchRes.value.json();
    completed.push(...parseAdItems(data));
  }

  if (lobbyRes.status === "fulfilled" && lobbyRes.value.ok) {
    const data = await lobbyRes.value.json();
    const lobbies = parseAdItems(data);
    // Each lobby has a `game` object with players and leg scores
    for (const lobby of lobbies) {
      const game = lobby.game ?? lobby;
      if (game?.players?.length >= 2) live.push(game);
    }
  }

  return { completed, live };
}

function findAdMatch(matches: any[], username1: string, username2: string): any | null {
  return matches.find((m: any) => {
    // Autodarts uses p.name on completed matches, p.user.name on lobby objects
    const names = (m.players || []).map((p: any) =>
      (p.name ?? p.user?.name ?? p.displayName ?? "").toLowerCase()
    );
    return names.includes(username1.toLowerCase()) && names.includes(username2.toLowerCase());
  }) ?? null;
}

// Autodarts API stores legs in `match.scores[player.index].legs`, NOT in `players[].legs`
function isMatchComplete(adMatch: any, winLegs: number): boolean {
  const scores: any[] = adMatch.scores || [];
  if (scores.length > 0) {
    return scores.some((s: any) => (s.legs ?? 0) >= winLegs);
  }
  // fallback for other response shapes
  return (adMatch.players || []).some((p: any) => (p.legs ?? p.legsWon ?? 0) >= winLegs);
}

type MatchStats = {
  legs1: number; legs2: number;
  avg1: number; avg2: number;
  // Extended stats (only populated from as/v0/matches with full games data)
  first9_p1: number | null; first9_p2: number | null;
  doubles_hit_p1: number | null; doubles_att_p1: number | null;
  doubles_hit_p2: number | null; doubles_att_p2: number | null;
  count_180s_p1: number | null; count_180s_p2: number | null;
  high_checkout_p1: number | null; high_checkout_p2: number | null;
};

function getMatchScore(adMatch: any, username1: string, username2: string): MatchStats {
  const players: any[] = adMatch.players || [];
  const scores: any[] = adMatch.scores || [];           // scores[player.index] = { legs, sets }
  const games: any[] = adMatch.games || [];             // as/v0 only: individual leg data with turns
  const normalize = (p: any) => (p.name ?? p.user?.name ?? p.displayName ?? "").toLowerCase();
  const p1 = players.find((p) => normalize(p) === username1.toLowerCase());
  const p2 = players.find((p) => normalize(p) === username2.toLowerCase());

  // as/v0/matches has a games[] array with individual leg data.
  // Use winnerPlayerId to count LEGS WON (scores[].legs = legs PLAYED, not won).
  // Also compute match-specific 3-dart average from turns[].points.
  if (games.length > 0 && p1 && p2) {
    const legs1 = games.filter((g: any) => g.winnerPlayerId === p1.id).length;
    const legs2 = games.filter((g: any) => g.winnerPlayerId === p2.id).length;

    const computeExtendedStats = (pid: string, _legs_won: number) => {
      let totalPts = 0, totalTurns = 0;
      let first9Total = 0, first9Count = 0;
      let doublesHit = 0, doublesAtt = 0;
      let count180s = 0;
      let highCheckout = 0;

      for (const g of games) {
        let playerVisit = 0;
        const legTurns: any[] = (g.turns || []).filter((t: any) => t.playerId === pid);

        for (const t of legTurns) {
          // Overall average (excluding busts)
          if (!t.busted) {
            totalPts += t.points;
            totalTurns++;
            // Count 180s
            if (t.points === 180) count180s++;
          }

          // First 9: first 3 visits per leg
          if (!t.busted && playerVisit < 3) { first9Total += t.points; first9Count++; }
          playerVisit++;

          // Double stats from dart-level data
          const darts: any[] = t.darts || [];
          for (const d of darts) {
            const seg = d.segment ?? d;
            const isDouble = seg.type === "double" || seg.multiplier === 2
              || seg.name === "Bull" || seg.name === "Bullseye" || seg.name === "DB";
            if (isDouble) doublesHit++;
          }
        }

        // Checkout attempts: last leg turn had darts aimed at doubles.
        const lastTurn = legTurns[legTurns.length - 1];
        if (lastTurn) {
          const darts: any[] = lastTurn.darts || [];
          const hadDoubleAttempt = darts.some((d: any) => {
            const seg = d.segment ?? d;
            return seg.type === "double" || seg.multiplier === 2
              || seg.name === "Bull" || seg.name === "Bullseye" || seg.name === "DB";
          });
          if (hadDoubleAttempt) doublesAtt++;
        }

        // High checkout: if player won this leg, last non-busted turn.points = checkout value
        if (g.winnerPlayerId === pid && legTurns.length > 0) {
          const lastNonBusted = [...legTurns].reverse().find((t: any) => !t.busted);
          if (lastNonBusted && lastNonBusted.points > highCheckout) {
            highCheckout = lastNonBusted.points;
          }
        }
      }

      return {
        avg: totalTurns > 0 ? Math.round((totalPts / totalTurns) * 10) / 10 : 0,
        first9: first9Count > 0 ? Math.round((first9Total / first9Count) * 10) / 10 : null,
        doublesHit,
        doublesAtt,
        count180s,
        highCheckout: highCheckout > 0 ? highCheckout : null,
      };
    };

    const s1 = computeExtendedStats(p1.id, legs1);
    const s2 = computeExtendedStats(p2.id, legs2);

    return {
      legs1, legs2,
      avg1: s1.avg, avg2: s2.avg,
      first9_p1: s1.first9, first9_p2: s2.first9,
      doubles_hit_p1: s1.doublesHit, doubles_att_p1: s1.doublesAtt,
      doubles_hit_p2: s2.doublesHit, doubles_att_p2: s2.doublesAtt,
      count_180s_p1: s1.count180s, count_180s_p2: s2.count180s,
      high_checkout_p1: s1.highCheckout, high_checkout_p2: s2.highCheckout,
    };
  }

  // gs/v0/matches: no games array → use scores[player.index].legs and account averages
  const s1 = p1 !== undefined ? (scores[p1.index] ?? {}) : {};
  const s2 = p2 !== undefined ? (scores[p2.index] ?? {}) : {};
  return {
    legs1: s1.legs ?? p1?.legs ?? 0,
    legs2: s2.legs ?? p2?.legs ?? 0,
    avg1: p1?.user?.average ?? p1?.average ?? 0,
    avg2: p2?.user?.average ?? p2?.average ?? 0,
    first9_p1: null, first9_p2: null,
    doubles_hit_p1: null, doubles_att_p1: null,
    doubles_hit_p2: null, doubles_att_p2: null,
    count_180s_p1: null, count_180s_p2: null,
    high_checkout_p1: null, high_checkout_p2: null,
  };
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export const ACHIEVEMENTS = [
  // Category 1: Checkout-Künstler
  {
    key: "clean_sweep",
    name: "Clean Sweep",
    description: "Gewinne ein Match mit einer Checkout-Quote von über 50% (mind. 4 Versuche)",
    category: "checkout",
    category_label: "Checkout-Künstler",
    emoji: "🎯",
    tier: "silver" as const,
  },
  {
    key: "big_fish",
    name: "The Big Fish",
    description: "Checke die magische 170 (Maximum Checkout)",
    category: "checkout",
    category_label: "Checkout-Künstler",
    emoji: "🐟",
    tier: "gold" as const,
  },
  // Category 2: Scoring & Dominanz
  {
    key: "robin_hood",
    name: "Robin Hood",
    description: "Wirf deine erste offizielle 180 in einem Pro/Dev Tour Match",
    category: "scoring",
    category_label: "Scoring & Dominanz",
    emoji: "🏹",
    tier: "bronze" as const,
  },
  {
    key: "maximum_overdrive",
    name: "Maximum Overdrive",
    description: "Wirf drei 180er in einem einzigen Match",
    category: "scoring",
    category_label: "Scoring & Dominanz",
    emoji: "💥",
    tier: "gold" as const,
  },
  {
    key: "whitewash",
    name: "Whitewash",
    description: "Gewinne ein Match ohne dem Gegner ein einziges Leg zu überlassen",
    category: "scoring",
    category_label: "Scoring & Dominanz",
    emoji: "🚿",
    tier: "silver" as const,
  },
  // Category 3: Der absolute Grind
  {
    key: "rookie_of_the_year",
    name: "Rookie of the Year",
    description: "Gewinne dein allererstes Turnier auf der Pro Tour",
    category: "grind",
    category_label: "Der absolute Grind",
    emoji: "🌟",
    tier: "gold" as const,
  },
  {
    key: "top_of_the_world",
    name: "Top of the World",
    description: "Erreiche Platz 1 der offiziellen Order of Merit",
    category: "grind",
    category_label: "Der absolute Grind",
    emoji: "👑",
    tier: "gold" as const,
  },
  {
    key: "the_veteran",
    name: "The Veteran",
    description: "Absolviere 100 Pro Tour-Matches",
    category: "grind",
    category_label: "Der absolute Grind",
    emoji: "🎖️",
    tier: "gold" as const,
  },
  // Category 4: Nervenstärke
  {
    key: "ice_in_the_veins",
    name: "Ice in the Veins",
    description: "Gewinne ein Match im Decider (letztes entscheidendes Leg)",
    category: "clutch",
    category_label: "Nervenstärke",
    emoji: "🧊",
    tier: "silver" as const,
  },
  {
    key: "giant_killer",
    name: "Giant Killer",
    description: "Besiege einen Gegner, dessen Average mindestens 10 Punkte höher war als deiner",
    category: "clutch",
    category_label: "Nervenstärke",
    emoji: "🗡️",
    tier: "gold" as const,
  },
] as const;

type AchievementKey = typeof ACHIEVEMENTS[number]["key"];

/** Unlock an achievement for a player (idempotent – ignores duplicates) */
async function unlockAchievement(
  playerId: number,
  key: AchievementKey,
  matchId?: number,
  tournamentId?: number,
  meta?: object,
) {
  try {
    const existing = await db.select({ id: tourPlayerAchievementsTable.id })
      .from(tourPlayerAchievementsTable)
      .where(and(
        eq(tourPlayerAchievementsTable.player_id, playerId),
        eq(tourPlayerAchievementsTable.achievement_key, key),
      ))
      .limit(1);
    if (existing.length > 0) return; // already unlocked
    await db.insert(tourPlayerAchievementsTable).values({
      player_id: playerId,
      achievement_key: key,
      match_id: matchId ?? null,
      tournament_id: tournamentId ?? null,
      meta: meta ? JSON.stringify(meta) : null,
    });
  } catch { /* ignore race conditions */ }
}

/** Check and unlock achievements triggered by a completed match */
async function checkAndUnlockAchievements(matchId: number, tournamentId: number) {
  const [match] = await db.select().from(tourMatchesTable).where(eq(tourMatchesTable.id, matchId)).limit(1);
  if (!match || !match.winner_id) return;

  const [tournament] = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, tournamentId)).limit(1);
  if (!tournament || tournament.is_test) return;

  const playerIds = [match.player1_id, match.player2_id].filter((id): id is number => id != null);

  for (const playerId of playerIds) {
    const isWinner = match.winner_id === playerId;
    const isP1 = match.player1_id === playerId;

    const myLegs    = isP1 ? match.score_p1 : match.score_p2;
    const oppLegs   = isP1 ? match.score_p2 : match.score_p1;
    const myAvg     = isP1 ? match.avg_p1 : match.avg_p2;
    const oppAvg    = isP1 ? match.avg_p2 : match.avg_p1;
    const myDblHit  = isP1 ? match.doubles_hit_p1 : match.doubles_hit_p2;
    const myDblAtt  = isP1 ? match.doubles_att_p1 : match.doubles_att_p2;
    const my180s    = isP1 ? match.count_180s_p1 : match.count_180s_p2;
    const myCheckout = isP1 ? match.high_checkout_p1 : match.high_checkout_p2;

    // ── Robin Hood: first 180 ever (win or lose) ───────────────────────────
    if (my180s != null && my180s >= 1) {
      await unlockAchievement(playerId, "robin_hood", matchId, tournamentId, { count: my180s });
    }

    // ── Maximum Overdrive: 3+ 180s in one match ────────────────────────────
    if (my180s != null && my180s >= 3) {
      await unlockAchievement(playerId, "maximum_overdrive", matchId, tournamentId, { count: my180s });
    }

    // ── The Big Fish: high checkout ≥ 170 ─────────────────────────────────
    if (myCheckout != null && myCheckout >= 170) {
      await unlockAchievement(playerId, "big_fish", matchId, tournamentId, { checkout: myCheckout });
    }

    if (isWinner) {
      // ── Whitewash: won without opponent winning a leg ──────────────────
      if (oppLegs === 0 && (myLegs ?? 0) > 0) {
        await unlockAchievement(playerId, "whitewash", matchId, tournamentId);
      }

      // ── Clean Sweep: checkout rate > 50% (min 4 attempts) ─────────────
      if (myDblHit != null && myDblAtt != null && myDblAtt >= 4 && myDblHit / myDblAtt > 0.5) {
        await unlockAchievement(playerId, "clean_sweep", matchId, tournamentId,
          { rate: Math.round(myDblHit / myDblAtt * 100), hit: myDblHit, att: myDblAtt });
      }

      // ── Ice in the Veins: won in decider ──────────────────────────────
      const format = tournament.legs_format;
      if (myLegs === format && oppLegs === format - 1) {
        await unlockAchievement(playerId, "ice_in_the_veins", matchId, tournamentId,
          { score: `${myLegs}:${oppLegs}` });
      }

      // ── Giant Killer: won with avg ≥ 10 lower than opponent ───────────
      if (myAvg != null && oppAvg != null && oppAvg - myAvg >= 10) {
        await unlockAchievement(playerId, "giant_killer", matchId, tournamentId,
          { my_avg: myAvg, opp_avg: oppAvg, diff: Math.round((oppAvg - myAvg) * 10) / 10 });
      }

      // ── Rookie of the Year: first Pro Tour final win ───────────────────
      if (match.runde === "F" && tournament.tour_type === "pro") {
        await unlockAchievement(playerId, "rookie_of_the_year", matchId, tournamentId);
      }
    }

    // ── The Veteran: 100 completed non-bye matches ─────────────────────────
    const matchCount = await db.select({ id: tourMatchesTable.id })
      .from(tourMatchesTable)
      .where(and(
        or(eq(tourMatchesTable.player1_id, playerId), eq(tourMatchesTable.player2_id, playerId)),
        eq(tourMatchesTable.status, "abgeschlossen"),
        eq(tourMatchesTable.is_bye, false),
      ));
    if (matchCount.length >= 100) {
      await unlockAchievement(playerId, "the_veteran", matchId, tournamentId, { matches: matchCount.length });
    }
  }
}

// GET /tour/achievements — all achievement definitions
router.get("/tour/achievements", (_req, res) => {
  res.json(ACHIEVEMENTS);
});

// GET /tour/players/:id/achievements — player's achievement status
router.get("/tour/players/:id/achievements", async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);

    // Load unlocked achievements
    const unlocked = await db.select()
      .from(tourPlayerAchievementsTable)
      .where(eq(tourPlayerAchievementsTable.player_id, playerId))
      .orderBy(desc(tourPlayerAchievementsTable.unlocked_at));

    const unlockedKeys = new Set(unlocked.map((u) => u.achievement_key));

    // Check "Top of the World" dynamically (current OOM rank)
    if (!unlockedKeys.has("top_of_the_world")) {
      // Reuse OOM computation: find player rank
      const proStandings = await db.select().from(tourOomStandingsTable);
      const player = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, playerId)).limit(1);
      if (player[0]) {
        const lookupKey = normalizeUsername(player[0].oom_name ?? player[0].autodarts_username);
        const proEntry = proStandings.find((s) => normalizeUsername(s.autodarts_username) === lookupKey);
        if (proEntry?.rank === 1) {
          await unlockAchievement(playerId, "top_of_the_world", undefined, undefined, { rank: 1 });
          unlockedKeys.add("top_of_the_world");
          const fresh = await db.select().from(tourPlayerAchievementsTable)
            .where(and(eq(tourPlayerAchievementsTable.player_id, playerId), eq(tourPlayerAchievementsTable.achievement_key, "top_of_the_world")))
            .limit(1);
          if (fresh[0]) unlocked.push(fresh[0]);
        }
      }
    }

    // Build full list: merge definitions with unlock status
    const result = ACHIEVEMENTS.map((def) => {
      const unlock = unlocked.find((u) => u.achievement_key === def.key);
      return {
        ...def,
        unlocked: !!unlock,
        unlocked_at: unlock?.unlocked_at ?? null,
        match_id: unlock?.match_id ?? null,
        tournament_id: unlock?.tournament_id ?? null,
        meta: unlock?.meta ? JSON.parse(unlock.meta) : null,
      };
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /tour/autodarts-debug — see raw Autodarts API response (admin only)
router.get("/tour/autodarts-debug", async (_req, res) => {
  const accessToken = await getAutodartAccessToken();
  if (!accessToken) return res.status(503).json({ error: "Kein Autodarts-Token konfiguriert" });

  const headers = { Authorization: `Bearer ${accessToken}`, Accept: "application/json" };
  const [matchRes, lobbyRes] = await Promise.allSettled([
    fetch(AD_MATCHES_URL, { headers }),
    fetch(AD_LOBBIES_URL, { headers }),
  ]);

  const matchData = matchRes.status === "fulfilled" && matchRes.value.ok
    ? await matchRes.value.json()
    : { error: matchRes.status === "rejected" ? matchRes.reason : "HTTP " + (matchRes as any).value?.status };

  const lobbyData = lobbyRes.status === "fulfilled" && lobbyRes.value.ok
    ? await lobbyRes.value.json()
    : { error: lobbyRes.status === "rejected" ? lobbyRes.reason : "HTTP " + (lobbyRes as any).value?.status };

  res.json({
    completed_matches: matchData,
    active_lobbies: lobbyData,
    completed_count: parseAdItems(matchData).length,
    lobby_count: parseAdItems(lobbyData).length,
  });
});

// POST /tour/tournaments/:id/autodarts-sync — auto-detect results for all pending matches

router.post("/tour/tournaments/:id/autodarts-sync", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const tournament = await db
      .select()
      .from(tourTournamentsTable)
      .where(eq(tourTournamentsTable.id, tournamentId))
      .limit(1);
    if (!tournament[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });
    if (tournament[0].status !== "laufend") {
      return res.json({ synced: 0, matches: [] });
    }

    // Get all pending matches with both players assigned
    const allMatches = await db
      .select()
      .from(tourMatchesTable)
      .where(eq(tourMatchesTable.tournament_id, tournamentId));

    const pendingMatches = allMatches.filter(
      (m) => m.status === "ausstehend" && m.player1_id && m.player2_id && !m.is_bye
    );

    if (pendingMatches.length === 0) {
      return res.json({ synced: 0, matches: [] });
    }

    // Fetch Autodarts token once
    const accessToken = await getAutodartAccessToken();
    if (!accessToken) {
      return res.json({ synced: 0, matches: [], error: "Kein Autodarts-Token" });
    }

    // Fetch recent Autodarts matches and active lobbies at once
    const { completed: adCompleted, live: adLive } = await fetchAutodartMatches(accessToken);

    // legsFormat → winning legs
    const winLegs = Math.ceil(tournament[0].legs_format / 2);

    // Only consider Autodarts matches that finished AFTER this tournament was created.
    // This prevents old matches (e.g. from test sessions) from contaminating new tournaments.
    const tournamentCreatedAt = new Date(tournament[0].created_at).getTime();
    const validCompleted = adCompleted.filter((m: any) => {
      const finishedAt = m.finishedAt ? new Date(m.finishedAt).getTime() : 0;
      return finishedAt > tournamentCreatedAt && (m.targetLegs ?? 0) >= winLegs;
    });

    // Resolve player names from DB
    const playerIds = [...new Set(pendingMatches.flatMap((m) => [m.player1_id!, m.player2_id!]))];
    const playerMap: Record<number, string> = {};
    const displayNameMap: Record<number, string> = {};
    for (const pid of playerIds) {
      const p = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, pid)).limit(1);
      if (p[0]) { playerMap[pid] = p[0].autodarts_username; displayNameMap[pid] = p[0].name; }
    }

    const results: any[] = [];
    let synced = 0;

    for (const match of pendingMatches) {
      const u1 = playerMap[match.player1_id!];
      const u2 = playerMap[match.player2_id!];
      if (!u1 || !u2) continue;

      // --- Direct fetch for matches with a known lobby/match ID ---
      // When we created the lobby, we stored its ID. After the match finishes,
      // Autodarts makes it available at as/v0/matches/{id} — works for private lobbies too.
      if (match.autodarts_match_id) {
        try {
          // Check all three endpoints in parallel:
          // 1. as/v0/matches/{id} → completed match (analytics, has scores + finishedAt)
          // 2. gs/v0/matches/{id} → in-progress match (game server, has live leg scores)
          // 3. gs/v0/lobbies/{id} → waiting lobby (players joined, game not started yet)
          const [completedRes, lobbyRes] = await Promise.allSettled([
            fetch(`https://api.autodarts.io/as/v0/matches/${match.autodarts_match_id}`,
              { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }),
            fetch(`https://api.autodarts.io/gs/v0/lobbies/${match.autodarts_match_id}`,
              { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }),
          ]);

          // Completed match takes priority
          if (completedRes.status === "fulfilled" && completedRes.value.ok) {
            const directMatch = await completedRes.value.json();
            if (directMatch?.id && directMatch.finishedAt && (directMatch.targetLegs ?? 0) >= winLegs) {
              const score = getMatchScore(directMatch, u1, u2);
              const complete = isMatchComplete(directMatch, winLegs);
              if (complete) {
                const winnerId = score.legs1 >= winLegs ? match.player1_id! : match.player2_id!;
                const a1 = Math.round(score.avg1 * 10) / 10;
                const a2 = Math.round(score.avg2 * 10) / 10;
                await db.update(tourMatchesTable)
                  .set({
                    winner_id: winnerId, score_p1: score.legs1, score_p2: score.legs2,
                    avg_p1: a1, avg_p2: a2,
                    first9_p1: score.first9_p1, first9_p2: score.first9_p2,
                    doubles_hit_p1: score.doubles_hit_p1, doubles_att_p1: score.doubles_att_p1,
                    doubles_hit_p2: score.doubles_hit_p2, doubles_att_p2: score.doubles_att_p2,
                    count_180s_p1: score.count_180s_p1, count_180s_p2: score.count_180s_p2,
                    high_checkout_p1: score.high_checkout_p1, high_checkout_p2: score.high_checkout_p2,
                    status: "abgeschlossen", autodarts_match_id: directMatch.id,
                  })
                  .where(eq(tourMatchesTable.id, match.id));
                await advanceWinner(tournamentId, match.runde, match.match_nr, winnerId);
                await checkTournamentComplete(tournamentId);
                await checkAndUnlockAchievements(match.id, tournamentId).catch(() => {});
                results.push({ match_id: match.id, status: "auto_completed", winner_id: winnerId, legs1: score.legs1, legs2: score.legs2, avg1: a1, avg2: a2, autodarts_id: directMatch.id });
                synced++;
                // Discord: post match result to thread
                if (match.discord_thread_id) {
                  const p1n = displayNameMap[match.player1_id!] ?? u1;
                  const p2n = displayNameMap[match.player2_id!] ?? u2;
                  postMatchResultToThread(match.discord_thread_id, p1n, p2n, score.legs1, score.legs2, winnerId === match.player1_id ? p1n : p2n, a1, a2).catch(() => {});
                }
                continue;
              } else {
                results.push({ match_id: match.id, status: "live", legs1: score.legs1, legs2: score.legs2, avg1: Math.round(score.avg1 * 10) / 10, avg2: Math.round(score.avg2 * 10) / 10, autodarts_id: directMatch.id });
                // Discord: post/update live score in thread
                if (match.discord_thread_id && (score.legs1 > 0 || score.legs2 > 0)) {
                  const p1n = displayNameMap[match.player1_id!] ?? u1;
                  const p2n = displayNameMap[match.player2_id!] ?? u2;
                  const a1r = Math.round(score.avg1 * 10) / 10;
                  const a2r = Math.round(score.avg2 * 10) / 10;
                  if (match.discord_score_message_id) {
                    updateLiveScoreMessage(match.discord_thread_id, match.discord_score_message_id, p1n, p2n, score.legs1, score.legs2, a1r, a2r, tournament[0].legs_format).catch(() => {});
                  } else {
                    postLiveScoreToThread(match.discord_thread_id, p1n, p2n, score.legs1, score.legs2, a1r, a2r, tournament[0].legs_format).then((msgId) => {
                      if (msgId) db.update(tourMatchesTable).set({ discord_score_message_id: msgId }).where(eq(tourMatchesTable.id, match.id)).catch(() => {});
                    }).catch(() => {});
                  }
                }
                continue;
              }
            }
          }

          // Lobby exists → match is in lobby phase (players waiting, game not yet started)
          // Show as "live" with 0:0 score; actual scores come once gs/v0/matches is available.
          if (lobbyRes.status === "fulfilled" && lobbyRes.value.ok) {
            const lobby = await lobbyRes.value.json();
            if (lobby?.id) {
              results.push({ match_id: match.id, status: "live", legs1: 0, legs2: 0, avg1: 0, avg2: 0, autodarts_id: lobby.id });
              continue;
            }
          }

          // Game in progress — check gs/v0/matches/{id} (works for private matches, has live leg scores + averages)
          // This is the game-server live match endpoint; populated once the match starts (lobby consumed → 404).
          const liveMatchRes = await fetch(
            `https://api.autodarts.io/gs/v0/matches/${match.autodarts_match_id}`,
            { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
          ).catch(() => null);
          if (liveMatchRes?.ok) {
            const liveMatch = await liveMatchRes.json();
            if (liveMatch?.id && Array.isArray(liveMatch.players)) {
              // Map leg scores to player1/player2 by matching Autodarts username
              const idx1 = liveMatch.players.findIndex((p: any) => p.name?.toLowerCase() === u1.toLowerCase());
              const idx2 = liveMatch.players.findIndex((p: any) => p.name?.toLowerCase() === u2.toLowerCase());
              const legs1 = idx1 >= 0 ? (liveMatch.scores?.[idx1]?.legs ?? 0) : 0;
              const legs2 = idx2 >= 0 ? (liveMatch.scores?.[idx2]?.legs ?? 0) : 0;
              const p1obj = idx1 >= 0 ? liveMatch.players[idx1] : null;
              const p2obj = idx2 >= 0 ? liveMatch.players[idx2] : null;
              const avg1 = Math.round((p1obj?.user?.average ?? p1obj?.average ?? 0) * 10) / 10;
              const avg2 = Math.round((p2obj?.user?.average ?? p2obj?.average ?? 0) * 10) / 10;
              results.push({ match_id: match.id, status: "live", legs1, legs2, avg1, avg2, autodarts_id: liveMatch.id });
              continue;
            }
          }

          // Note: lobby 404 + gs/v0/matches 404 can mean expired lobby (before match started).
          // We keep the stored ID so as/v0/matches/{id} can detect completion once finished.
        } catch { /* fall through to global filter */ }
      }

      // --- Global filter fallback (for matches without a stored lobby ID) ---
      // Lobby = currently playing indicator (scores always undefined/0:0 from API)
      // Completed matches = accumulated leg score (the real running score)
      // → Always use completed match for score; lobby is just "in progress" signal
      // Only accept Autodarts matches whose targetLegs >= winLegs (filters out short test games)
      // adLiveMatch: lobby signals "game in progress" – no format filter needed (score comes from completed)
      // adCompletedMatch: only matches after tournament creation + correct targetLegs (via validCompleted)
      const adLiveMatch = findAdMatch(adLive, u1, u2);
      const adCompletedMatch = findAdMatch(validCompleted, u1, u2);

      if (!adLiveMatch && !adCompletedMatch) {
        results.push({ match_id: match.id, status: "not_found" });
        continue;
      }

      // Score always comes from the completed match (it carries accumulated legs).
      // If no completed match yet (first leg still in lobby), score is 0:0.
      const scoreSource = adCompletedMatch ?? adLiveMatch!;
      const score = getMatchScore(scoreSource, u1, u2);
      // Only auto-complete based on completed match data (lobby has no reliable score)
      const complete = adCompletedMatch ? isMatchComplete(adCompletedMatch, winLegs) : false;

      if (!complete) {
        results.push({
          match_id: match.id,
          status: "live",
          legs1: score.legs1,
          legs2: score.legs2,
          avg1: Math.round(score.avg1 * 10) / 10,
          avg2: Math.round(score.avg2 * 10) / 10,
          autodarts_id: scoreSource.id,
        });
        // Store the Autodarts match ID (prefer completed match ID)
        await db.update(tourMatchesTable)
          .set({ autodarts_match_id: scoreSource.id })
          .where(eq(tourMatchesTable.id, match.id));
        // Discord: post/update live score
        if (match.discord_thread_id && (score.legs1 > 0 || score.legs2 > 0)) {
          const p1n = displayNameMap[match.player1_id!] ?? u1;
          const p2n = displayNameMap[match.player2_id!] ?? u2;
          const a1r = Math.round(score.avg1 * 10) / 10;
          const a2r = Math.round(score.avg2 * 10) / 10;
          if (match.discord_score_message_id) {
            updateLiveScoreMessage(match.discord_thread_id, match.discord_score_message_id, p1n, p2n, score.legs1, score.legs2, a1r, a2r, tournament[0].legs_format).catch(() => {});
          } else {
            postLiveScoreToThread(match.discord_thread_id, p1n, p2n, score.legs1, score.legs2, a1r, a2r, tournament[0].legs_format).then((msgId) => {
              if (msgId) db.update(tourMatchesTable).set({ discord_score_message_id: msgId }).where(eq(tourMatchesTable.id, match.id)).catch(() => {});
            }).catch(() => {});
          }
        }
        continue;
      }

      // Match complete → auto-record
      const winnerId = score.legs1 >= winLegs ? match.player1_id! : match.player2_id!;
      await db.update(tourMatchesTable)
        .set({
          winner_id: winnerId,
          score_p1: score.legs1,
          score_p2: score.legs2,
          avg_p1: Math.round(score.avg1 * 10) / 10,
          avg_p2: Math.round(score.avg2 * 10) / 10,
          first9_p1: score.first9_p1,
          first9_p2: score.first9_p2,
          doubles_hit_p1: score.doubles_hit_p1,
          doubles_att_p1: score.doubles_att_p1,
          doubles_hit_p2: score.doubles_hit_p2,
          doubles_att_p2: score.doubles_att_p2,
          count_180s_p1: score.count_180s_p1,
          count_180s_p2: score.count_180s_p2,
          high_checkout_p1: score.high_checkout_p1,
          high_checkout_p2: score.high_checkout_p2,
          status: "abgeschlossen",
          autodarts_match_id: scoreSource.id,
        })
        .where(eq(tourMatchesTable.id, match.id));

      await advanceWinner(tournamentId, match.runde, match.match_nr, winnerId);
      await checkTournamentComplete(tournamentId);
      await checkAndUnlockAchievements(match.id, tournamentId).catch(() => {});

      results.push({
        match_id: match.id,
        status: "auto_completed",
        winner_id: winnerId,
        legs1: score.legs1,
        legs2: score.legs2,
        avg1: Math.round(score.avg1 * 10) / 10,
        avg2: Math.round(score.avg2 * 10) / 10,
        autodarts_id: scoreSource.id,
      });
      synced++;
      // Discord: post match result to thread
      if (match.discord_thread_id) {
        const p1n = displayNameMap[match.player1_id!] ?? u1;
        const p2n = displayNameMap[match.player2_id!] ?? u2;
        const a1r = Math.round(score.avg1 * 10) / 10;
        const a2r = Math.round(score.avg2 * 10) / 10;
        postMatchResultToThread(match.discord_thread_id, p1n, p2n, score.legs1, score.legs2, winnerId === match.player1_id ? p1n : p2n, a1r, a2r).catch(() => {});
      }
    }

    res.json({ synced, matches: results });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/players/:id/autodarts-oauth-callback — exchange OAuth2 code for Autodarts token
router.post("/tour/players/:id/autodarts-oauth-callback", async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const { code, code_verifier, redirect_uri, pin } = req.body;
    if (!code || !code_verifier || !redirect_uri || !pin) {
      return res.status(400).json({ error: "code, code_verifier, redirect_uri und pin erforderlich" });
    }

    const pinHash = crypto.createHash("sha256").update(String(pin)).digest("hex");
    const player = await db.select().from(tourPlayersTable)
      .where(eq(tourPlayersTable.id, playerId)).limit(1);
    if (!player[0]) return res.status(404).json({ error: "Spieler nicht gefunden" });
    if (player[0].pin_hash !== pinHash) return res.status(403).json({ error: "Ungültiger PIN" });

    // Exchange authorization code for tokens via Keycloak
    const tokenRes = await fetch(
      "https://login.autodarts.io/realms/autodarts/protocol/openid-connect/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: "autodarts-play",
          code,
          code_verifier,
          redirect_uri,
        }),
      }
    );
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return res.status(400).json({ error: "Autodarts-Authentifizierung fehlgeschlagen: " + errText });
    }
    const tokenData: any = await tokenRes.json();
    const refreshToken = tokenData.refresh_token;
    if (!refreshToken) return res.status(400).json({ error: "Kein Refresh-Token erhalten" });

    await db.update(tourPlayersTable)
      .set({ autodarts_refresh_token: refreshToken })
      .where(eq(tourPlayersTable.id, playerId));
    playerTokenCache.delete(playerId);

    res.json({ ok: true, message: "Autodarts-Account erfolgreich verbunden" });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/players/:id/autodarts-connect — player stores own Autodarts refresh token
router.post("/tour/players/:id/autodarts-connect", async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const { pin, token } = req.body;
    if (!pin || !token) return res.status(400).json({ error: "pin und token erforderlich" });

    const pinHash = crypto.createHash("sha256").update(String(pin)).digest("hex");
    const player = await db.select().from(tourPlayersTable)
      .where(eq(tourPlayersTable.id, playerId)).limit(1);
    if (!player[0]) return res.status(404).json({ error: "Spieler nicht gefunden" });
    if (player[0].pin_hash !== pinHash) return res.status(403).json({ error: "Ungültige PIN" });

    // Verify the token actually works by fetching an access token
    const verifyRes = await fetch(
      "https://login.autodarts.io/realms/autodarts/protocol/openid-connect/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: "autodarts-play",
          refresh_token: token,
        }),
      }
    );
    if (!verifyRes.ok) return res.status(400).json({ error: "Autodarts-Token ungültig oder abgelaufen" });
    const tokenData: any = await verifyRes.json();

    // Store the latest refresh token (Autodarts rotates tokens on each refresh)
    const latestRefreshToken = tokenData.refresh_token ?? token;
    await db.update(tourPlayersTable)
      .set({ autodarts_refresh_token: latestRefreshToken })
      .where(eq(tourPlayersTable.id, playerId));

    // Invalidate any cached access token for this player
    playerTokenCache.delete(playerId);

    res.json({ ok: true, message: "Autodarts-Account erfolgreich verbunden" });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/players/:id/autodarts-disconnect — remove player's stored token
router.post("/tour/players/:id/autodarts-disconnect", async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ error: "pin erforderlich" });
    const pinHash = crypto.createHash("sha256").update(String(pin)).digest("hex");
    const player = await db.select().from(tourPlayersTable)
      .where(eq(tourPlayersTable.id, playerId)).limit(1);
    if (!player[0]) return res.status(404).json({ error: "Spieler nicht gefunden" });
    if (player[0].pin_hash !== pinHash) return res.status(403).json({ error: "Ungültige PIN" });

    await db.update(tourPlayersTable)
      .set({ autodarts_refresh_token: null })
      .where(eq(tourPlayersTable.id, playerId));
    playerTokenCache.delete(playerId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /tour/players/:id/autodarts-status — check if player has a connected token
router.get("/tour/players/:id/autodarts-status", async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const rows = await db.select({ tok: tourPlayersTable.autodarts_refresh_token })
      .from(tourPlayersTable).where(eq(tourPlayersTable.id, playerId)).limit(1);
    if (!rows[0]) return res.status(404).json({ error: "Spieler nicht gefunden" });
    res.json({ connected: !!rows[0].tok });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/matches/:matchId/create-lobby — create an Autodarts lobby for a tournament match.
// Pass optional { player_id } in the body to prefer that player's own Autodarts token;
// falls back through match players, then the global admin token.
router.post("/tour/matches/:matchId/create-lobby", async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const match = await db.select().from(tourMatchesTable).where(eq(tourMatchesTable.id, matchId)).limit(1);
    if (!match[0]) return res.status(404).json({ error: "Match nicht gefunden" });
    if (match[0].status !== "ausstehend") return res.status(400).json({ error: "Match bereits abgeschlossen" });

    const tournament = await db.select().from(tourTournamentsTable)
      .where(eq(tourTournamentsTable.id, match[0].tournament_id)).limit(1);
    if (!tournament[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });

    const winLegs = Math.ceil(tournament[0].legs_format / 2);

    // Token priority: requesting player → player1 → player2 → global admin
    const requestingPlayerId: number | undefined = req.body?.player_id ? parseInt(req.body.player_id) : undefined;
    const candidateIds = [
      requestingPlayerId,
      match[0].player1_id ?? undefined,
      match[0].player2_id ?? undefined,
    ].filter((id): id is number => typeof id === "number");

    let accessToken: string | null = null;
    for (const id of candidateIds) {
      accessToken = await getPlayerAccessToken(id);
      if (accessToken) break;
    }
    // Final fallback: global admin token
    if (!accessToken) accessToken = await getAutodartAccessToken();
    if (!accessToken) return res.status(503).json({ error: "Kein Autodarts-Token konfiguriert" });

    const lobbyBody = {
      variant: "X01",
      settings: {
        inMode: "Straight",
        outMode: "Double",
        bullMode: "25/50",
        maxRounds: 50,
        baseScore: 501,
      },
      bullOffMode: "Normal",
      legs: winLegs,
      hasReferee: false,
      isPrivate: true,    // Private — result fetched directly via stored lobby ID
    };

    const lobbyRes = await fetch("https://api.autodarts.io/gs/v0/lobbies", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(lobbyBody),
    });

    if (!lobbyRes.ok) {
      const err = await lobbyRes.text();
      return res.status(502).json({ error: `Autodarts-Fehler: ${err}` });
    }

    const lobby = await lobbyRes.json();
    const joinUrl = `https://play.autodarts.io/lobbies/${lobby.id}`;

    // Store lobby ID so we can correlate the finished match later
    await db.update(tourMatchesTable)
      .set({ autodarts_match_id: lobby.id })
      .where(eq(tourMatchesTable.id, matchId));

    res.json({ lobbyId: lobby.id, joinUrl });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/admin/autodarts-token — admin: update Autodarts refresh token (survives restarts via DB)
router.post("/tour/admin/autodarts-token", async (req, res) => {
  try {
    const { pin, refresh_token } = req.body;
    if (!pin || !refresh_token) return res.status(400).json({ error: "pin und refresh_token erforderlich" });
    // Accept any registered player's PIN (all are trusted admins in this closed system)
    const pinHash = crypto.createHash("sha256").update(String(pin)).digest("hex");
    const players = await db.select().from(tourPlayersTable).limit(20);
    const isAdmin = players.some((p) => p.pin_hash === pinHash);
    // Also accept the env-level admin override
    const adminOverride = process.env.ADMIN_PIN
      ? crypto.createHash("sha256").update(process.env.ADMIN_PIN).digest("hex") === pinHash
      : false;
    if (!isAdmin && !adminOverride) return res.status(403).json({ error: "Ungültige PIN" });
    // Reset in-memory state and persist to DB
    activeRefreshToken = refresh_token;
    cachedToken = null;
    await persistRefreshToken(refresh_token);
    // Verify it works
    const token = await getAutodartAccessToken();
    if (!token) return res.status(502).json({ error: "Token gespeichert, aber Autodarts-Login fehlgeschlagen" });
    res.json({ ok: true, message: "Token aktualisiert und verifiziert" });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/matches/:matchId/autodarts — manual single-match check
router.post("/tour/matches/:matchId/autodarts", async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const match = await db.select().from(tourMatchesTable).where(eq(tourMatchesTable.id, matchId)).limit(1);
    if (!match[0]) return res.status(404).json({ error: "Match nicht gefunden" });

    const [p1Rows, p2Rows] = await Promise.all([
      match[0].player1_id ? db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, match[0].player1_id)).limit(1) : Promise.resolve([]),
      match[0].player2_id ? db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, match[0].player2_id)).limit(1) : Promise.resolve([]),
    ]);
    const empty = { found: false, match_id: null, player1_legs: 0, player2_legs: 0, player1_avg: 0, player2_avg: 0 };
    if (!(p1Rows as any[])[0] || !(p2Rows as any[])[0]) return res.json(empty);

    const accessToken = await getAutodartAccessToken();
    if (!accessToken) return res.json(empty);

    const u1 = (p1Rows as any[])[0].autodarts_username;
    const u2 = (p2Rows as any[])[0].autodarts_username;
    const { completed, live } = await fetchAutodartMatches(accessToken);
    const targetMatch = findAdMatch(live, u1, u2) ?? findAdMatch(completed, u1, u2);

    if (!targetMatch) return res.json(empty);

    const score = getMatchScore(targetMatch, u1, u2);
    res.json({
      found: true,
      match_id: targetMatch.id ?? targetMatch.gameId,
      player1_legs: score.legs1,
      player2_legs: score.legs2,
      player1_avg: score.avg1,
      player2_avg: score.avg2,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ─── Bonus Points Routes ──────────────────────────────────────────────────────

// POST /tour/bonus
router.post("/tour/bonus", async (req, res) => {
  try {
    const { player_id, tournament_id, bonus_type, admin_pin } = req.body;
    if (!player_id || !tournament_id || !bonus_type) {
      return res.status(400).json({ error: "player_id, tournament_id, bonus_type erforderlich" });
    }

    const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, tournament_id)).limit(1);
    if (!t[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });
    if (!verifyPin(String(admin_pin), t[0].admin_pin)) return res.status(403).json({ error: "Falscher Admin-PIN" });

    const points = BONUS_POINTS[bonus_type];
    if (!points) return res.status(400).json({ error: `Unbekannter Bonus-Typ: ${bonus_type}` });

    const [bonus] = await db.insert(tourBonusPointsTable)
      .values({ player_id, tournament_id, bonus_type, points })
      .returning();

    res.json(bonus);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /tour/bonus/:tournamentId
router.get("/tour/bonus/:tournamentId", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournamentId);
    const bonuses = await db.select().from(tourBonusPointsTable)
      .where(eq(tourBonusPointsTable.tournament_id, tournamentId));
    res.json(bonuses);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});


// POST /tour/admin/verify
router.post("/tour/admin/verify", async (req, res) => {
  try {
    const { pin } = req.body;
    const anyTournament = await db.select().from(tourTournamentsTable).limit(1);
    if (!anyTournament[0]) return res.json({ ok: false });
    const ok = verifyPin(pin, anyTournament[0].admin_pin);
    res.json({ ok });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ─── Match Chat ───────────────────────────────────────────────────────────────

// GET /tour/matches/:matchId/messages — fetch chat messages (auth: player1, player2, or admin)
router.get("/tour/matches/:matchId/messages", async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const playerId = parseInt(req.query.player_id as string);
    const pin = req.query.pin as string;
    if (!matchId || !playerId || !pin) return res.status(400).json({ error: "match_id, player_id und pin erforderlich" });

    const [player] = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, playerId)).limit(1);
    if (!player || !verifyPin(pin, player.pin_hash)) return res.status(403).json({ error: "Ungültiger PIN" });

    const [match] = await db.select().from(tourMatchesTable).where(eq(tourMatchesTable.id, matchId)).limit(1);
    if (!match) return res.status(404).json({ error: "Match nicht gefunden" });

    const isParticipant = match.player1_id === playerId || match.player2_id === playerId;
    if (!isParticipant && !player.is_admin) return res.status(403).json({ error: "Kein Zugriff" });

    const messages = await db.select({
      id: tourMatchMessagesTable.id,
      match_id: tourMatchMessagesTable.match_id,
      player_id: tourMatchMessagesTable.player_id,
      player_name: tourPlayersTable.name,
      message: tourMatchMessagesTable.message,
      created_at: tourMatchMessagesTable.created_at,
    })
      .from(tourMatchMessagesTable)
      .leftJoin(tourPlayersTable, eq(tourMatchMessagesTable.player_id, tourPlayersTable.id))
      .where(eq(tourMatchMessagesTable.match_id, matchId))
      .orderBy(tourMatchMessagesTable.created_at);

    res.json(messages);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/matches/:matchId/messages — send a chat message + push notification to other player
router.post("/tour/matches/:matchId/messages", async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const { player_id, pin, message } = req.body as { player_id: number; pin: string; message: string };
    if (!matchId || !player_id || !pin || !message?.trim()) return res.status(400).json({ error: "match_id, player_id, pin und message erforderlich" });

    const [player] = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, player_id)).limit(1);
    if (!player || !verifyPin(pin, player.pin_hash)) return res.status(403).json({ error: "Ungültiger PIN" });

    const [match] = await db.select().from(tourMatchesTable).where(eq(tourMatchesTable.id, matchId)).limit(1);
    if (!match) return res.status(404).json({ error: "Match nicht gefunden" });

    const isParticipant = match.player1_id === player_id || match.player2_id === player_id;
    if (!isParticipant && !player.is_admin) return res.status(403).json({ error: "Kein Zugriff" });

    const [newMsg] = await db.insert(tourMatchMessagesTable).values({
      match_id: matchId,
      player_id,
      message: message.trim(),
    }).returning();

    // Push notification to the other player
    const otherPlayerId = match.player1_id === player_id ? match.player2_id : match.player1_id;
    if (otherPlayerId) {
      const [tournament] = await db.select({ name: tourTournamentsTable.name })
        .from(tourTournamentsTable).where(eq(tourTournamentsTable.id, match.tournament_id)).limit(1);
      const notifUrl = `/pro-tour/turniere/${match.tournament_id}`;
      sendPushToPlayer(
        otherPlayerId,
        `💬 Neue Nachricht von ${player.name}`,
        message.trim().length > 80 ? message.trim().slice(0, 80) + "…" : message.trim(),
        notifUrl,
      ).catch(() => {});
    }

    res.json(newMsg);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ─── Match Disputes ───────────────────────────────────────────────────────────

// POST /tour/matches/:matchId/dispute — player files a dispute
router.post("/tour/matches/:matchId/dispute", async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const { player_id, pin, reason } = req.body as { player_id: number; pin: string; reason: string };
    if (!matchId || !player_id || !pin || !reason?.trim()) return res.status(400).json({ error: "Alle Felder sind erforderlich" });

    const [player] = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, player_id)).limit(1);
    if (!player || !verifyPin(pin, player.pin_hash)) return res.status(403).json({ error: "Ungültiger PIN" });

    const [match] = await db.select().from(tourMatchesTable).where(eq(tourMatchesTable.id, matchId)).limit(1);
    if (!match) return res.status(404).json({ error: "Match nicht gefunden" });

    const isParticipant = match.player1_id === player_id || match.player2_id === player_id;
    if (!isParticipant) return res.status(403).json({ error: "Kein Zugriff" });

    const [dispute] = await db.insert(tourMatchDisputesTable).values({
      match_id: matchId,
      player_id,
      reason: reason.trim(),
      status: "offen",
    }).returning();

    // Notify all admins
    const admins = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.is_admin, true));
    const [tournament] = await db.select({ name: tourTournamentsTable.name })
      .from(tourTournamentsTable).where(eq(tourTournamentsTable.id, match.tournament_id)).limit(1);
    const notifUrl = `/pro-tour/turniere/${match.tournament_id}`;
    for (const admin of admins) {
      sendPushToPlayer(
        admin.id,
        `⚠️ Ergebnis angefochten`,
        `${player.name} hat ein Match in "${tournament?.name ?? "Turnier"}" angefochten.`,
        notifUrl,
      ).catch(() => {});
    }

    res.json(dispute);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /tour/admin/disputes — list all disputes (admin only)
router.get("/tour/admin/disputes", async (req, res) => {
  try {
    const playerId = parseInt(req.query.player_id as string);
    const pin = req.query.pin as string;
    if (!playerId || !pin) return res.status(400).json({ error: "player_id und pin erforderlich" });

    const [player] = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, playerId)).limit(1);
    if (!player || !verifyPin(pin, player.pin_hash) || !player.is_admin) return res.status(403).json({ error: "Kein Admin-Zugriff" });

    const disputes = await db.select({
      id: tourMatchDisputesTable.id,
      match_id: tourMatchDisputesTable.match_id,
      player_id: tourMatchDisputesTable.player_id,
      player_name: tourPlayersTable.name,
      reason: tourMatchDisputesTable.reason,
      status: tourMatchDisputesTable.status,
      admin_note: tourMatchDisputesTable.admin_note,
      created_at: tourMatchDisputesTable.created_at,
      tournament_id: tourMatchesTable.tournament_id,
      runde: tourMatchesTable.runde,
      match_nr: tourMatchesTable.match_nr,
    })
      .from(tourMatchDisputesTable)
      .leftJoin(tourPlayersTable, eq(tourMatchDisputesTable.player_id, tourPlayersTable.id))
      .leftJoin(tourMatchesTable, eq(tourMatchDisputesTable.match_id, tourMatchesTable.id))
      .orderBy(desc(tourMatchDisputesTable.created_at));

    res.json(disputes);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// PATCH /tour/admin/disputes/:id — update dispute status + admin note
router.patch("/tour/admin/disputes/:id", async (req, res) => {
  try {
    const disputeId = parseInt(req.params.id);
    const { player_id, pin, status, admin_note } = req.body as { player_id: number; pin: string; status: string; admin_note?: string };
    if (!disputeId || !player_id || !pin) return res.status(400).json({ error: "player_id und pin erforderlich" });

    const [player] = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, player_id)).limit(1);
    if (!player || !verifyPin(pin, player.pin_hash) || !player.is_admin) return res.status(403).json({ error: "Kein Admin-Zugriff" });

    const [updated] = await db.update(tourMatchDisputesTable)
      .set({ status, admin_note: admin_note ?? null })
      .where(eq(tourMatchDisputesTable.id, disputeId))
      .returning();

    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ─── Match Fairness ───────────────────────────────────────────────────────────

// POST /tour/matches/:matchId/fairness — submit fairness vote (once per player per match)
router.post("/tour/matches/:matchId/fairness", async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const { player_id, pin, vote } = req.body as { player_id: number; pin: string; vote: "up" | "down" };
    if (!matchId || !player_id || !pin || !["up", "down"].includes(vote)) return res.status(400).json({ error: "match_id, player_id, pin und vote (up/down) erforderlich" });

    const [player] = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, player_id)).limit(1);
    if (!player || !verifyPin(pin, player.pin_hash)) return res.status(403).json({ error: "Ungültiger PIN" });

    const [match] = await db.select().from(tourMatchesTable).where(eq(tourMatchesTable.id, matchId)).limit(1);
    if (!match) return res.status(404).json({ error: "Match nicht gefunden" });
    if (match.status !== "abgeschlossen") return res.status(400).json({ error: "Match noch nicht abgeschlossen" });

    const isParticipant = match.player1_id === player_id || match.player2_id === player_id;
    if (!isParticipant) return res.status(403).json({ error: "Nur Teilnehmer dürfen bewerten" });

    // Check if already voted
    const existing = await db.select().from(tourMatchFairnessTable)
      .where(and(eq(tourMatchFairnessTable.match_id, matchId), eq(tourMatchFairnessTable.player_id, player_id))).limit(1);
    if (existing[0]) return res.status(409).json({ error: "Du hast bereits bewertet" });

    const [entry] = await db.insert(tourMatchFairnessTable).values({ match_id: matchId, player_id, vote }).returning();
    res.json(entry);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /tour/admin/fairness — admin overview: all fairness votes with player + match info
router.get("/tour/admin/fairness", async (req, res) => {
  try {
    const playerId = parseInt(req.query.player_id as string);
    const pin = req.query.pin as string;
    if (!playerId || !pin) return res.status(400).json({ error: "player_id und pin erforderlich" });

    const [player] = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, playerId)).limit(1);
    if (!player || !verifyPin(pin, player.pin_hash) || !player.is_admin) return res.status(403).json({ error: "Kein Admin-Zugriff" });

    const votes = await db.select({
      id: tourMatchFairnessTable.id,
      match_id: tourMatchFairnessTable.match_id,
      player_id: tourMatchFairnessTable.player_id,
      player_name: tourPlayersTable.name,
      vote: tourMatchFairnessTable.vote,
      created_at: tourMatchFairnessTable.created_at,
      tournament_id: tourMatchesTable.tournament_id,
      runde: tourMatchesTable.runde,
      match_nr: tourMatchesTable.match_nr,
    })
      .from(tourMatchFairnessTable)
      .leftJoin(tourPlayersTable, eq(tourMatchFairnessTable.player_id, tourPlayersTable.id))
      .leftJoin(tourMatchesTable, eq(tourMatchFairnessTable.match_id, tourMatchesTable.id))
      .orderBy(desc(tourMatchFairnessTable.created_at));

    res.json(votes);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
