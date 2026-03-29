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
  systemSettingsTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";
import {
  notifyRegistration,
  notifyTournamentStart,
  notifyMatchResult,
  notifyTournamentComplete,
  notifyOomUpdate,
  getDiscordSettings,
  saveDiscordSettings,
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
  dev_cup: {
    Sieger: 500,
    Finale: 300,
    Halbfinale: 200,
    Viertelfinale: 125,
    Achtelfinale: 75,
    "Letzte 32": 40,
    Teilnahme: 15,
  },
  dev_major: {
    Sieger: 750,
    Finale: 450,
    Halbfinale: 300,
    Viertelfinale: 188,
    Achtelfinale: 113,
    "Letzte 32": 60,
    Teilnahme: 25,
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
}[] = [];
// Admin kann hier die tatsächlichen Dev Tour OOM-Daten hinterlegen (analog zu OOM_SEED_DATA).

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
  { phase: "Development Tour – Grand Final", phase_order: 11, tour_type: "development", kategorie: "dev_major", event_name: "Grand Final", datum: "24.05.2026", tag: "SO", uhrzeit: "18:00", mode: "Bo7", qualification: "Top 16 OoM", status: "upcoming", external_id: 24 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

function verifyPin(pin: string, hash: string): boolean {
  return hashPin(pin) === hash;
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
async function generateBracket(tournamentId: number, playerIds: number[], legsFormat: number) {
  const entries = [...playerIds];
  const rounds = getRoundsForSize(entries.length);

  let bracketSize = 2;
  while (bracketSize < entries.length) bracketSize *= 2;

  const seeded = [...entries, ...Array(bracketSize - entries.length).fill(null)];
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

  await db.insert(tourMatchesTable).values(matches as any);
  await propagateByes(tournamentId);
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
      status: tournament[0].status,
      legs_format: tournament[0].legs_format,
      max_players: tournament[0].max_players,
      is_test: tournament[0].is_test,
    },
    players: entries.map((e) => ({
      player_id: e.player_id,
      seed: e.seed,
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

// GET /tour/oom - imported OOM standings
router.get("/tour/oom", async (_req, res) => {
  try {
    const standings = await db
      .select()
      .from(tourOomStandingsTable)
      .orderBy(tourOomStandingsTable.rank);

    if (standings.length === 0) {
      return res.json([]);
    }

    // Format for OOM page
    const result = standings.map((s) => {
      const breakdown = JSON.parse(s.tournament_breakdown || "{}");
      const results = Object.entries(breakdown).map(([name, points]) => ({
        tournament_name: name,
        points: points as number,
      }));

      // Determine best result from breakdown
      const maxPts = Math.max(0, ...results.map((r) => r.points));
      const bestResult = ptsToBestRound(maxPts);

      return {
        rank: s.rank,
        player_id: s.id,
        player_name: s.autodarts_username,
        autodarts_username: s.autodarts_username,
        total_points: s.total_points,
        bonus_total: s.bonus_points,
        tournaments_played: s.tournaments_played,
        best_result: bestResult,
        last_updated: s.last_updated,
        results: results.map((r) => ({
          tournament_id: 0,
          tournament_name: r.tournament_name,
          typ: "pc",
          points: r.points,
          bonus: 0,
          round: ptsToBestRound(r.points),
        })),
      };
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

function ptsToBestRound(pts: number): string {
  if (pts >= 1500) return "Sieger";
  if (pts >= 900) return "Finale";
  if (pts >= 600) return "Sieger";
  if (pts >= 400) return "Sieger";
  if (pts >= 375) return "Halbfinale";
  if (pts >= 300) return "Finale";
  if (pts >= 250) return "Viertelfinale";
  if (pts >= 225) return "Halbfinale";
  if (pts >= 200) return "Halbfinale";
  if (pts >= 150) return "Achtelfinale";
  if (pts >= 125) return "Letzte 32";
  if (pts >= 100) return "Teilnahme";
  if (pts >= 75) return "Letzte 32";
  if (pts >= 50) return "Teilnahme";
  if (pts >= 25) return "Teilnahme";
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
    const standings = await db
      .select()
      .from(tourDevOomStandingsTable)
      .orderBy(tourDevOomStandingsTable.rank);

    if (standings.length > 0) {
      const result = standings.map((s) => {
        const breakdown = JSON.parse(s.tournament_breakdown || "{}");
        const results = Object.entries(breakdown).map(([name, points]) => ({
          tournament_name: name,
          points: points as number,
        }));
        return {
          rank: s.rank,
          player_id: s.id,
          player_name: s.autodarts_username,
          autodarts_username: s.autodarts_username,
          total_points: s.total_points,
          bonus_total: s.bonus_points,
          tournaments_played: s.tournaments_played,
          last_updated: s.last_updated,
          results: results.map((r) => ({
            tournament_id: 0,
            tournament_name: r.tournament_name,
            typ: "dev_cup",
            points: r.points,
            bonus: 0,
            round: devPtsToBestRound(r.points),
          })),
        };
      });
      return res.json(result);
    }

    // Fallback: calculate live from DB tournaments (tour_type = "development")
    const players = await db.select().from(tourPlayersTable);
    const devTournaments = await db.select().from(tourTournamentsTable)
      .where(and(eq(tourTournamentsTable.status, "abgeschlossen"), eq(tourTournamentsTable.is_test, false)));
    const devTs = devTournaments.filter((t) => t.tour_type === "development");

    if (devTs.length === 0) {
      return res.json([]);
    }

    const allMatches = await db.select().from(tourMatchesTable);
    const roundOrder = ["R64", "R32", "R16", "QF", "SF", "F"];

    const oomData = players.map((player) => {
      const results: any[] = [];
      for (const t of devTs) {
        const tMatches = allMatches.filter((m) => m.tournament_id === t.id);
        const playerMatches = tMatches.filter(
          (m) => (m.player1_id === player.id || m.player2_id === player.id) && m.status === "abgeschlossen" && !m.is_bye
        );
        if (playerMatches.length === 0) continue;
        const deepest = playerMatches.sort(
          (a, b) => roundOrder.indexOf(b.runde) - roundOrder.indexOf(a.runde)
        )[0];
        const isWinner = deepest.runde === "F" && deepest.winner_id === player.id;
        const roundKey = isWinner ? "Sieger" : roundToOomKey(deepest.runde);
        const points = OOM_POINTS[t.typ]?.[roundKey] ?? 0;
        results.push({ tournament_id: t.id, tournament_name: t.name, typ: t.typ, points, bonus: 0, round: roundKey });
      }
      const totalPoints = results.reduce((s, r) => s + r.points, 0);
      return { player_id: player.id, player_name: player.name, autodarts_username: player.autodarts_username, total_points: totalPoints, bonus_total: 0, tournaments_played: results.length, best_result: "-", results };
    }).filter((p) => p.tournaments_played > 0);

    oomData.sort((a, b) => b.total_points - a.total_points);
    res.json(oomData.map((p, i) => ({ rank: i + 1, ...p })));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

function devPtsToBestRound(pts: number): string {
  if (pts >= 750) return "Sieger";
  if (pts >= 500) return "Sieger";
  if (pts >= 450) return "Finale";
  if (pts >= 300) return "Finale";
  if (pts >= 188) return "Viertelfinale";
  if (pts >= 200) return "Halbfinale";
  if (pts >= 125) return "Viertelfinale";
  if (pts >= 113) return "Achtelfinale";
  if (pts >= 75) return "Achtelfinale";
  if (pts >= 60) return "Letzte 32";
  if (pts >= 40) return "Letzte 32";
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
    const { admin_pin, webhook_url, bot_token, channel_id } = req.body;

    const anyT = await db.select().from(tourTournamentsTable).limit(1);
    if (!anyT[0] || !verifyPin(String(admin_pin), anyT[0].admin_pin)) {
      return res.status(403).json({ error: "Falscher Admin-PIN" });
    }

    await saveDiscordSettings({
      webhookUrl: webhook_url ?? "",
      botToken: bot_token ?? "",
      channelId: channel_id ?? "",
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/admin/discord-test - send a test message
router.post("/tour/admin/discord-test", async (req, res) => {
  try {
    const { admin_pin } = req.body;
    const anyT = await db.select().from(tourTournamentsTable).limit(1);
    if (!anyT[0] || !verifyPin(String(admin_pin), anyT[0].admin_pin)) {
      return res.status(403).json({ error: "Falscher Admin-PIN" });
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
    const { admin_pin } = req.body;
    if (!admin_pin) {
      return res.status(400).json({ error: "admin_pin erforderlich" });
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
        admin_pin: hashPin(String(admin_pin)),
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

// GET /tour/players
router.get("/tour/players", async (_req, res) => {
  try {
    const players = await db.select().from(tourPlayersTable).orderBy(tourPlayersTable.name);
    const tournaments = await db.select().from(tourTournamentsTable)
      .where(eq(tourTournamentsTable.status, "abgeschlossen"));
    const allMatches = await db.select().from(tourMatchesTable);
    const allBonus = await db.select().from(tourBonusPointsTable);

    const result = players.map((p) => {
      let totalPoints = 0;
      for (const t of tournaments) {
        const tMatches = allMatches.filter((m) => m.tournament_id === t.id);
        const playerMatches = tMatches.filter(
          (m) => (m.player1_id === p.id || m.player2_id === p.id) && m.status === "abgeschlossen" && !m.is_bye
        );
        if (playerMatches.length === 0) continue;
        const roundOrder = ["R64", "R32", "R16", "QF", "SF", "F"];
        const deepest = playerMatches.sort(
          (a, b) => roundOrder.indexOf(b.runde) - roundOrder.indexOf(a.runde)
        )[0];
        const isWinner = deepest.runde === "F" && deepest.winner_id === p.id;
        const roundKey = isWinner ? "Sieger" : roundToOomKey(deepest.runde);
        totalPoints += OOM_POINTS[t.typ]?.[roundKey] ?? 0;
      }
      const bonusTotal = allBonus
        .filter((b) => b.player_id === p.id)
        .reduce((s, b) => s + b.points, 0);

      return {
        id: p.id,
        name: p.name,
        autodarts_username: p.autodarts_username,
        created_at: p.created_at,
        oom_points: totalPoints + bonusTotal,
        oom_rank: 0,
      };
    });

    result.sort((a, b) => b.oom_points - a.oom_points);
    result.forEach((p, i) => { p.oom_rank = i + 1; });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/players/register
router.post("/tour/players/register", async (req, res) => {
  try {
    const { name, autodarts_username, pin } = req.body;
    if (!name || !autodarts_username || !pin) {
      return res.status(400).json({ error: "name, autodarts_username und pin erforderlich" });
    }
    const existing = await db.select().from(tourPlayersTable)
      .where(eq(tourPlayersTable.autodarts_username, autodarts_username)).limit(1);
    if (existing[0]) return res.status(409).json({ error: "Autodarts-Benutzername bereits registriert" });

    const [player] = await db.insert(tourPlayersTable)
      .values({ name, autodarts_username, pin_hash: hashPin(pin) })
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
    res.json({ id: p.id, name: p.name, autodarts_username: p.autodarts_username });
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

    for (const tid of tournamentIds) {
      const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, tid)).limit(1);
      if (!t[0] || t[0].status !== "abgeschlossen") continue;

      const tMatches = await db.select().from(tourMatchesTable)
        .where(eq(tourMatchesTable.tournament_id, tid));
      const playerMatches = tMatches.filter(
        (m) => (m.player1_id === id || m.player2_id === id) && m.status === "abgeschlossen" && !m.is_bye
      );
      if (playerMatches.length === 0) continue;

      const roundOrder = ["R64", "R32", "R16", "QF", "SF", "F"];
      const deepest = playerMatches.sort(
        (a, b) => roundOrder.indexOf(b.runde) - roundOrder.indexOf(a.runde)
      )[0];
      const isWinner = deepest.runde === "F" && deepest.winner_id === id;
      const roundKey = isWinner ? "Sieger" : roundToOomKey(deepest.runde);
      const pts = OOM_POINTS[t[0].typ]?.[roundKey] ?? 0;

      tourResults.push({ tournament_id: tid, tournament_name: t[0].name, typ: t[0].typ, round: roundKey, points: pts });
    }

    const bonusRows = await db.select().from(tourBonusPointsTable).where(eq(tourBonusPointsTable.player_id, id));
    const bonusTotal = bonusRows.reduce((s, b) => s + b.points, 0);
    const totalPoints = tourResults.reduce((s, r) => s + r.points, 0) + bonusTotal;

    res.json({
      id: player[0].id,
      name: player[0].name,
      autodarts_username: player[0].autodarts_username,
      created_at: player[0].created_at,
      oom_points: totalPoints,
      tournament_results: tourResults,
      bonus_points: bonusRows,
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
    const { name, typ, tour_type, datum, legs_format, max_players, admin_pin, schedule_id, phase, is_test } = req.body;
    if (!name || !typ || !datum || !admin_pin) {
      return res.status(400).json({ error: "name, typ, datum, admin_pin erforderlich" });
    }

    const [t] = await db.insert(tourTournamentsTable)
      .values({
        name,
        typ: typ || "pc",
        tour_type: tour_type || "pro",
        phase: phase || null,
        datum,
        legs_format: legs_format ?? 5,
        max_players: max_players ?? 32,
        admin_pin: hashPin(String(admin_pin)),
        schedule_id: schedule_id || null,
        is_test: is_test === true || is_test === "true" ? true : false,
      })
      .returning();

    res.json(t);
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

// POST /tour/tournaments/:id/self-register — players register themselves (with their own PIN)
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
    if (existing[0]) return res.status(409).json({ error: "Du bist bereits für dieses Turnier angemeldet" });

    const entries = await db.select().from(tourEntriesTable).where(eq(tourEntriesTable.tournament_id, tournamentId));
    if (entries.length >= t[0].max_players) return res.status(400).json({ error: "Turnier ist voll" });

    await db.insert(tourEntriesTable).values({ tournament_id: tournamentId, player_id, seed: entries.length + 1 });

    // Fire-and-forget Discord notification
    notifyRegistration(
      t[0].name,
      tournamentId,
      player[0].name,
      player[0].autodarts_username ?? player[0].name,
      entries.length + 1,
      t[0].max_players,
    ).catch(() => {});

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /tour/tournaments/:id/entries/:playerId — admin only (requires admin_pin in body)
router.delete("/tour/tournaments/:id/entries/:playerId", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const playerId = parseInt(req.params.playerId);
    const { admin_pin } = req.body;

    const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, tournamentId)).limit(1);
    if (!t[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });
    if (!admin_pin || !verifyPin(String(admin_pin), t[0].admin_pin)) {
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

// POST /tour/tournaments/:id/start
router.post("/tour/tournaments/:id/start", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { admin_pin } = req.body;

    const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, tournamentId)).limit(1);
    if (!t[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });
    if (!verifyPin(String(admin_pin), t[0].admin_pin)) return res.status(403).json({ error: "Falscher Admin-PIN" });
    if (t[0].status !== "offen") return res.status(400).json({ error: "Turnier bereits gestartet" });

    const entries = await db.select().from(tourEntriesTable).where(eq(tourEntriesTable.tournament_id, tournamentId));
    if (entries.length < 2) return res.status(400).json({ error: "Mindestens 2 Spieler erforderlich" });

    await db.update(tourTournamentsTable).set({ status: "laufend" }).where(eq(tourTournamentsTable.id, tournamentId));
    const playerIds = entries.sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0)).map((e) => e.player_id);
    await generateBracket(tournamentId, playerIds, t[0].legs_format);

    // Fire-and-forget Discord notification + match threads
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

        await notifyTournamentStart(t[0], matchData);
      } catch { /* non-critical */ }
    })();

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ─── Match Routes ─────────────────────────────────────────────────────────────

// POST /tour/matches/:matchId/result
router.post("/tour/matches/:matchId/result", async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const { winner_id, score_p1, score_p2, admin_pin } = req.body;

    const match = await db.select().from(tourMatchesTable).where(eq(tourMatchesTable.id, matchId)).limit(1);
    if (!match[0]) return res.status(404).json({ error: "Match nicht gefunden" });
    if (match[0].status === "abgeschlossen") return res.status(400).json({ error: "Match bereits abgeschlossen" });

    const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, match[0].tournament_id)).limit(1);
    if (!t[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });
    if (!verifyPin(String(admin_pin), t[0].admin_pin)) return res.status(403).json({ error: "Falscher Admin-PIN" });

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

function getMatchScore(adMatch: any, username1: string, username2: string) {
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
    const computeMatchAvg = (pid: string) => {
      let total = 0;
      let turns = 0;
      for (const g of games) {
        for (const t of (g.turns || [])) {
          if (t.playerId === pid && !t.busted) { total += t.points; turns++; }
        }
      }
      return turns > 0 ? Math.round((total / turns) * 10) / 10 : 0;
    };
    return { legs1, legs2, avg1: computeMatchAvg(p1.id), avg2: computeMatchAvg(p2.id) };
  }

  // gs/v0/matches: no games array → use scores[player.index].legs and account averages
  const s1 = p1 !== undefined ? (scores[p1.index] ?? {}) : {};
  const s2 = p2 !== undefined ? (scores[p2.index] ?? {}) : {};
  return {
    legs1: s1.legs ?? p1?.legs ?? 0,
    legs2: s2.legs ?? p2?.legs ?? 0,
    avg1: p1?.user?.average ?? p1?.average ?? 0,
    avg2: p2?.user?.average ?? p2?.average ?? 0,
  };
}

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
    for (const pid of playerIds) {
      const p = await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, pid)).limit(1);
      if (p[0]) playerMap[pid] = p[0].autodarts_username;
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
                  .set({ winner_id: winnerId, score_p1: score.legs1, score_p2: score.legs2, avg_p1: a1, avg_p2: a2, status: "abgeschlossen", autodarts_match_id: directMatch.id })
                  .where(eq(tourMatchesTable.id, match.id));
                await advanceWinner(tournamentId, match.runde, match.match_nr, winnerId);
                await checkTournamentComplete(tournamentId);
                results.push({ match_id: match.id, status: "auto_completed", winner_id: winnerId, legs1: score.legs1, legs2: score.legs2, avg1: a1, avg2: a2, autodarts_id: directMatch.id });
                synced++;
                continue;
              } else {
                results.push({ match_id: match.id, status: "live", legs1: score.legs1, legs2: score.legs2, avg1: Math.round(score.avg1 * 10) / 10, avg2: Math.round(score.avg2 * 10) / 10, autodarts_id: directMatch.id });
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
        continue;
      }

      // Match complete → auto-record
      const winnerId = score.legs1 >= winLegs ? match.player1_id! : match.player2_id!;
      await db.update(tourMatchesTable)
        .set({
          winner_id: winnerId,
          score_p1: score.legs1,
          score_p2: score.legs2,
          status: "abgeschlossen",
          autodarts_match_id: scoreSource.id,
        })
        .where(eq(tourMatchesTable.id, match.id));

      await advanceWinner(tournamentId, match.runde, match.match_nr, winnerId);
      await checkTournamentComplete(tournamentId);

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

// ─── OOM Route ────────────────────────────────────────────────────────────────

// GET /tour/oom
router.get("/tour/oom", async (_req, res) => {
  try {
    const players = await db.select().from(tourPlayersTable);
    const tournaments = await db.select().from(tourTournamentsTable)
      .where(and(eq(tourTournamentsTable.status, "abgeschlossen"), eq(tourTournamentsTable.is_test, false)))
      .orderBy(tourTournamentsTable.datum);
    const allMatches = await db.select().from(tourMatchesTable);
    const allBonus = await db.select().from(tourBonusPointsTable);

    const roundOrder = ["R64", "R32", "R16", "QF", "SF", "F"];

    const oomData = players.map((player) => {
      const results: any[] = [];

      for (const t of tournaments) {
        const tMatches = allMatches.filter((m) => m.tournament_id === t.id);
        const playerMatches = tMatches.filter(
          (m) => (m.player1_id === player.id || m.player2_id === player.id) && m.status === "abgeschlossen" && !m.is_bye
        );
        if (playerMatches.length === 0) continue;

        const deepest = playerMatches.sort(
          (a, b) => roundOrder.indexOf(b.runde) - roundOrder.indexOf(a.runde)
        )[0];

        const isWinner = deepest.runde === "F" && deepest.winner_id === player.id;
        const roundKey = isWinner ? "Sieger" : roundToOomKey(deepest.runde);
        const points = OOM_POINTS[t.typ]?.[roundKey] ?? 0;

        // Bonus points for this tournament
        const bonusForTournament = allBonus
          .filter((b) => b.player_id === player.id && b.tournament_id === t.id)
          .reduce((s, b) => s + b.points, 0);

        results.push({
          tournament_id: t.id,
          tournament_name: t.name,
          typ: t.typ,
          points,
          bonus: bonusForTournament,
          round: roundKey,
        });
      }

      const totalPoints = results.reduce((s, r) => s + r.points + r.bonus, 0);

      return {
        player_id: player.id,
        player_name: player.name,
        autodarts_username: player.autodarts_username,
        total_points: totalPoints,
        bonus_total: results.reduce((s, r) => s + r.bonus, 0),
        tournaments_played: results.length,
        best_result: results.length > 0
          ? results.sort((a, b) => b.points - a.points)[0].round
          : "-",
        results,
      };
    }).filter((p) => p.tournaments_played > 0);

    oomData.sort((a, b) => b.total_points - a.total_points);
    const ranked = oomData.map((p, i) => ({ rank: i + 1, ...p }));

    res.json(ranked);
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

export default router;
