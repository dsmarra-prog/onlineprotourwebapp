import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  tourPlayersTable,
  tourScheduleTable,
  tourOomStandingsTable,
  tourTournamentsTable,
  tourMatchesTable,
  tourEntriesTable,
  tourBonusPointsTable,
  systemSettingsTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

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

async function checkTournamentComplete(tournamentId: number) {
  const matches = await db.select().from(tourMatchesTable)
    .where(eq(tourMatchesTable.tournament_id, tournamentId));
  const final = matches.find((m) => m.runde === "F");
  if (final?.winner_id) {
    await db.update(tourTournamentsTable)
      .set({ status: "abgeschlossen" })
      .where(eq(tourTournamentsTable.id, tournamentId));
  }
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
  { season: 1, rank: 16, autodarts_username: "schmitz1980", total_points: 925, bonus_points: 0, tournaments_played: 7, tournament_breakdown: "{\"PC1\":25,\"PC2\":75,\"PC3\":75,\"PC4\":150,\"PC5\":75,\"PC7\":400,\"Spring Open\":125}", last_updated: "26.03.2026" },
  { season: 1, rank: 17, autodarts_username: "the_phili_buster", total_points: 875, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC1\":25,\"PC3\":25,\"PC5\":400,\"PC6\":75,\"PC7\":25,\"Spring Open\":325}", last_updated: "26.03.2026" },
  { season: 1, rank: 18, autodarts_username: "dartspieler88_82773", total_points: 850, bonus_points: 0, tournaments_played: 7, tournament_breakdown: "{\"PC1\":75,\"PC2\":75,\"PC3\":25,\"PC4\":150,\"PC5\":75,\"PC7\":250,\"Spring Open\":200}", last_updated: "26.03.2026" },
  { season: 1, rank: 19, autodarts_username: "seb_s180", total_points: 825, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC2\":400,\"PC3\":25,\"PC4\":25,\"PC5\":25,\"PC6\":25,\"Spring Open\":325}", last_updated: "26.03.2026" },
  { season: 1, rank: 20, autodarts_username: "petrus_72", total_points: 800, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC1\":75,\"PC2\":25,\"PC4\":75,\"PC6\":400,\"PC7\":75,\"Spring Open\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 21, autodarts_username: "flojo1988", total_points: 775, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC5\":150,\"PC6\":150,\"Spring Open\":425}", last_updated: "26.03.2026" },
  { season: 1, rank: 22, autodarts_username: "juergen0770", total_points: 750, bonus_points: 0, tournaments_played: 7, tournament_breakdown: "{\"PC1\":150,\"PC2\":25,\"PC3\":400,\"PC4\":25,\"PC6\":75,\"PC7\":25,\"PC8\":50}", last_updated: "26.03.2026" },
  { season: 1, rank: 23, autodarts_username: "thekingofbob", total_points: 750, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC3\":25,\"PC5\":25,\"PC7\":25,\"Spring Open\":625}", last_updated: "26.03.2026" },
  { season: 1, rank: 24, autodarts_username: "thopps1985", total_points: 725, bonus_points: 0, tournaments_played: 7, tournament_breakdown: "{\"PC1\":150,\"PC2\":150,\"PC3\":75,\"PC4\":25,\"PC5\":75,\"PC6\":75,\"Spring Open\":175}", last_updated: "26.03.2026" },
  { season: 1, rank: 25, autodarts_username: "flibber180", total_points: 700, bonus_points: 0, tournaments_played: 7, tournament_breakdown: "{\"PC1\":250,\"PC2\":75,\"PC3\":25,\"PC4\":75,\"PC5\":25,\"PC6\":25,\"Spring Open\":225}", last_updated: "26.03.2026" },
  { season: 1, rank: 26, autodarts_username: "boomshack_at", total_points: 675, bonus_points: 0, tournaments_played: 7, tournament_breakdown: "{\"PC1\":75,\"PC2\":75,\"PC3\":150,\"PC4\":25,\"PC5\":25,\"PC7\":75,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 27, autodarts_username: "mojofreaky", total_points: 675, bonus_points: 0, tournaments_played: 7, tournament_breakdown: "{\"PC1\":75,\"PC2\":250,\"PC3\":75,\"PC4\":75,\"PC5\":25,\"PC7\":25,\"Spring Open\":150}", last_updated: "26.03.2026" },
  { season: 1, rank: 28, autodarts_username: "jonasdarts501", total_points: 650, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC1\":250,\"PC2\":25,\"PC3\":25,\"PC5\":25,\"PC7\":150,\"Spring Open\":175}", last_updated: "26.03.2026" },
  { season: 1, rank: 29, autodarts_username: "tordart_97", total_points: 625, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC1\":75,\"PC2\":25,\"PC3\":25,\"PC4\":400,\"PC7\":25,\"Spring Open\":75}", last_updated: "26.03.2026" },
  { season: 1, rank: 30, autodarts_username: "marco.darts", total_points: 600, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":150,\"PC3\":75,\"PC5\":25,\"PC7\":25,\"Spring Open\":325}", last_updated: "26.03.2026" },
  { season: 1, rank: 31, autodarts_username: "chefkoch1978", total_points: 575, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC1\":25,\"PC2\":75,\"PC3\":25,\"PC4\":25,\"PC5\":100,\"Spring Open\":325}", last_updated: "26.03.2026" },
  { season: 1, rank: 32, autodarts_username: "sully180", total_points: 575, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC5\":25,\"PC6\":400,\"PC8\":100}", last_updated: "26.03.2026" },
  { season: 1, rank: 33, autodarts_username: "einhornrider", total_points: 550, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC2\":150,\"PC4\":25,\"PC5\":25,\"PC6\":25,\"Spring Open\":325}", last_updated: "26.03.2026" },
  { season: 1, rank: 34, autodarts_username: "freddy_pdh", total_points: 550, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":25,\"PC5\":25,\"PC6\":75,\"PC7\":75,\"Spring Open\":350}", last_updated: "26.03.2026" },
  { season: 1, rank: 35, autodarts_username: "lukaskle", total_points: 550, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC2\":75,\"PC3\":25,\"PC6\":25,\"PC7\":75,\"Spring Open\":350}", last_updated: "26.03.2026" },
  { season: 1, rank: 36, autodarts_username: "eliasb2105", total_points: 525, bonus_points: 0, tournaments_played: 7, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC3\":25,\"PC4\":25,\"PC5\":25,\"PC6\":25,\"Spring Open\":375}", last_updated: "26.03.2026" },
  { season: 1, rank: 37, autodarts_username: "f1tzyyy_", total_points: 525, bonus_points: 0, tournaments_played: 7, tournament_breakdown: "{\"PC1\":75,\"PC2\":25,\"PC3\":25,\"PC4\":25,\"PC5\":25,\"PC7\":25,\"Spring Open\":325}", last_updated: "26.03.2026" },
  { season: 1, rank: 38, autodarts_username: "martinb2810", total_points: 525, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":400,\"PC2\":25,\"PC3\":25,\"PC5\":25,\"Spring Open\":50}", last_updated: "26.03.2026" },
  { season: 1, rank: 39, autodarts_username: "matze_3112", total_points: 525, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC3\":150,\"PC4\":25,\"PC5\":25,\"Spring Open\":275}", last_updated: "26.03.2026" },
  { season: 1, rank: 40, autodarts_username: "reini_md", total_points: 500, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC3\":75,\"PC5\":25,\"Spring Open\":350}", last_updated: "26.03.2026" },
  { season: 1, rank: 41, autodarts_username: "djdrake2609", total_points: 475, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC3\":25,\"PC4\":25,\"PC6\":25,\"Spring Open\":350}", last_updated: "26.03.2026" },
  { season: 1, rank: 42, autodarts_username: "kraut0001", total_points: 475, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":75,\"PC3\":25,\"PC5\":25,\"PC6\":25,\"Spring Open\":325}", last_updated: "26.03.2026" },
  { season: 1, rank: 43, autodarts_username: "alex.de.wolf", total_points: 450, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC4\":150,\"PC5\":25,\"Spring Open\":225}", last_updated: "26.03.2026" },
  { season: 1, rank: 44, autodarts_username: "amateurdarter", total_points: 450, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC1\":25,\"PC2\":150,\"PC3\":25,\"PC5\":25,\"PC6\":150,\"PC8\":75}", last_updated: "26.03.2026" },
  { season: 1, rank: 45, autodarts_username: "bigzap", total_points: 450, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":25,\"PC4\":75,\"PC5\":75,\"PC6\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 46, autodarts_username: "bwl_babbel", total_points: 450, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":150,\"PC2\":75,\"PC4\":75,\"PC5\":75,\"Spring Open\":75}", last_updated: "26.03.2026" },
  { season: 1, rank: 47, autodarts_username: "dennis_0125", total_points: 450, bonus_points: 0, tournaments_played: 6, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC3\":25,\"PC4\":25,\"PC5\":25,\"Spring Open\":325}", last_updated: "26.03.2026" },
  { season: 1, rank: 48, autodarts_username: "mr.t180", total_points: 450, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC2\":25,\"PC3\":75,\"PC4\":25,\"PC5\":25,\"Spring Open\":300}", last_updated: "26.03.2026" },
  { season: 1, rank: 49, autodarts_username: "svenw_74", total_points: 450, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":25,\"PC3\":25,\"PC4\":25,\"PC5\":150,\"Spring Open\":225}", last_updated: "26.03.2026" },
  { season: 1, rank: 50, autodarts_username: "thomas_ka", total_points: 450, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC2\":25,\"PC3\":25,\"PC4\":150,\"PC5\":25,\"Spring Open\":225}", last_updated: "26.03.2026" },
  { season: 1, rank: 51, autodarts_username: "gerry_d67", total_points: 425, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":25,\"PC2\":75,\"PC4\":25,\"PC7\":25,\"Spring Open\":275}", last_updated: "26.03.2026" },
  { season: 1, rank: 52, autodarts_username: "hotwings_88", total_points: 425, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC3\":25,\"PC6\":25,\"Spring Open\":325}", last_updated: "26.03.2026" },
  { season: 1, rank: 53, autodarts_username: "ruhrgebietsdarter", total_points: 425, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC3\":25,\"PC4\":25,\"PC5\":25,\"PC6\":25,\"Spring Open\":325}", last_updated: "26.03.2026" },
  { season: 1, rank: 54, autodarts_username: "waldenburger1", total_points: 425, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":25,\"PC2\":75,\"PC4\":25,\"PC5\":25,\"Spring Open\":275}", last_updated: "26.03.2026" },
  { season: 1, rank: 55, autodarts_username: "dh777", total_points: 400, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC2\":25,\"PC5\":25,\"PC6\":25,\"Spring Open\":325}", last_updated: "26.03.2026" },
  { season: 1, rank: 56, autodarts_username: "mig_b", total_points: 400, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC5\":25,\"Spring Open\":375}", last_updated: "26.03.2026" },  
  { season: 1, rank: 57, autodarts_username: "hoss.dc", total_points: 375, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC2\":25,\"PC3\":25,\"PC4\":25,\"Spring Open\":300}", last_updated: "26.03.2026" },
  { season: 1, rank: 58, autodarts_username: "nixy_180", total_points: 375, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC3\":75,\"PC4\":25,\"Spring Open\":225}", last_updated: "26.03.2026" },
  { season: 1, rank: 59, autodarts_username: "phils_dart_time", total_points: 375, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC2\":25,\"PC3\":25,\"PC6\":25,\"Spring Open\":300}", last_updated: "26.03.2026" },
  { season: 1, rank: 60, autodarts_username: "swordfish22", total_points: 375, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":25,\"PC4\":25,\"PC5\":25,\"Spring Open\":300}", last_updated: "26.03.2026" },
  { season: 1, rank: 61, autodarts_username: "aronhilmarsson0", total_points: 350, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC7\":25,\"Spring Open\":275}", last_updated: "26.03.2026" },
  { season: 1, rank: 62, autodarts_username: "double_troub2802", total_points: 350, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":25,\"PC3\":25,\"PC4\":75,\"Spring Open\":225}", last_updated: "26.03.2026" },
  { season: 1, rank: 63, autodarts_username: "ebbe_1999", total_points: 350, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC4\":25,\"PC5\":25,\"Spring Open\":300}", last_updated: "26.03.2026" },
  { season: 1, rank: 64, autodarts_username: "hansi_darts", total_points: 350, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC3\":25,\"Spring Open\":275}", last_updated: "26.03.2026" },
  { season: 1, rank: 65, autodarts_username: "j.b1984", total_points: 350, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":25,\"PC3\":25,\"PC7\":25,\"Spring Open\":275}", last_updated: "26.03.2026" },
  { season: 1, rank: 66, autodarts_username: "mr.bvb", total_points: 350, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":75,\"PC3\":25,\"PC4\":25,\"Spring Open\":225}", last_updated: "26.03.2026" },
  { season: 1, rank: 67, autodarts_username: "mrmeeseeks_", total_points: 350, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC1\":25,\"PC5\":25,\"Spring Open\":300}", last_updated: "26.03.2026" },
  { season: 1, rank: 68, autodarts_username: "philibert8820", total_points: 350, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC3\":25,\"PC5\":25,\"Spring Open\":300}", last_updated: "26.03.2026" },
  { season: 1, rank: 69, autodarts_username: "purdartist", total_points: 350, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC2\":25,\"PC6\":25,\"Spring Open\":300}", last_updated: "26.03.2026" },
  { season: 1, rank: 70, autodarts_username: "sioux", total_points: 350, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":25,\"PC3\":25,\"PC4\":25,\"Spring Open\":275}", last_updated: "26.03.2026" },
  { season: 1, rank: 71, autodarts_username: "stefano_darts", total_points: 350, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC5\":25,\"PC6\":25,\"Spring Open\":300}", last_updated: "26.03.2026" },
  { season: 1, rank: 72, autodarts_username: "wolfgangh_", total_points: 350, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"Spring Open\":300}", last_updated: "26.03.2026" },
  { season: 1, rank: 73, autodarts_username: "2fournought", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":25,\"PC3\":25,\"PC4\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 74, autodarts_username: "andy_trv", total_points: 325, bonus_points: 0, tournaments_played: 5, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC3\":25,\"PC4\":25,\"Spring Open\":225}", last_updated: "26.03.2026" },
  { season: 1, rank: 75, autodarts_username: "arni80", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":25,\"PC4\":25,\"PC5\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 76, autodarts_username: "cyborg_dart", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC3\":25,\"PC4\":25,\"PC6\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 77, autodarts_username: "double_trouble_jc", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC2\":25,\"PC3\":25,\"PC4\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 78, autodarts_username: "durmdart", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC2\":25,\"PC5\":25,\"PC6\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 79, autodarts_username: "hammarby_ola", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC2\":25,\"PC3\":25,\"PC4\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 80, autodarts_username: "hasselblatt_66", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC3\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 81, autodarts_username: "jkl180darts", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC5\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 82, autodarts_username: "kapo_darts", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC2\":25,\"PC3\":25,\"PC5\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 83, autodarts_username: "mflorstedt", total_points: 325, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC2\":25,\"PC6\":25,\"Spring Open\":275}", last_updated: "26.03.2026" },
  { season: 1, rank: 84, autodarts_username: "ole_180", total_points: 325, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC3\":25,\"PC7\":25,\"Spring Open\":275}", last_updated: "26.03.2026" },
  { season: 1, rank: 85, autodarts_username: "peterp_52", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC2\":25,\"PC3\":25,\"PC4\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 86, autodarts_username: "phj1804", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC4\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 87, autodarts_username: "rainer.n", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":25,\"PC4\":25,\"PC5\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 88, autodarts_username: "ridsi_", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC4\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 89, autodarts_username: "rubberduck_gaming", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC3\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 90, autodarts_username: "sven_1974", total_points: 325, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC3\":25,\"PC4\":25,\"Spring Open\":275}", last_updated: "26.03.2026" },
  { season: 1, rank: 91, autodarts_username: "tommi82", total_points: 325, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC2\":25,\"PC5\":25,\"Spring Open\":275}", last_updated: "26.03.2026" },
  { season: 1, rank: 92, autodarts_username: "uc_darts", total_points: 325, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":25,\"PC4\":25,\"PC5\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 93, autodarts_username: "ujw180", total_points: 325, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC2\":25,\"PC5\":25,\"Spring Open\":275}", last_updated: "26.03.2026" },
  { season: 1, rank: 94, autodarts_username: "wuddelhase", total_points: 325, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC3\":25,\"PC6\":25,\"Spring Open\":275}", last_updated: "26.03.2026" },
  { season: 1, rank: 95, autodarts_username: "andi_ddv", total_points: 300, bonus_points: 0, tournaments_played: 4, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"PC3\":25,\"Spring Open\":225}", last_updated: "26.03.2026" },
  { season: 1, rank: 96, autodarts_username: "bmc_t3", total_points: 300, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC1\":25,\"PC3\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 97, autodarts_username: "ebbe1999", total_points: 300, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC4\":25,\"PC5\":25,\"Spring Open\":250}", last_updated: "26.03.2026" },
  { season: 1, rank: 98, autodarts_username: "chris180_1991", total_points: 275, bonus_points: 0, tournaments_played: 3, tournament_breakdown: "{\"PC1\":25,\"PC2\":25,\"Spring Open\":225}", last_updated: "26.03.2026" },
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
    res.json({ ok: true, inserted: OOM_SEED_DATA.length });
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
    const tournaments = await db.select().from(tourTournamentsTable).orderBy(desc(tourTournamentsTable.created_at));
    const enriched = await Promise.all(tournaments.map(async (t) => {
      const entries = await db.select().from(tourEntriesTable).where(eq(tourEntriesTable.tournament_id, t.id));
      return { ...t, player_count: entries.length };
    }));
    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/tournaments
router.post("/tour/tournaments", async (req, res) => {
  try {
    const { name, typ, tour_type, datum, legs_format, max_players, admin_pin, schedule_id, phase } = req.body;
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

// DELETE /tour/tournaments/:id/entries/:playerId
router.delete("/tour/tournaments/:id/entries/:playerId", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const playerId = parseInt(req.params.playerId);

    const t = await db.select().from(tourTournamentsTable).where(eq(tourTournamentsTable.id, tournamentId)).limit(1);
    if (!t[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });
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
    await checkTournamentComplete(match[0].tournament_id);

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

// Autodarts uses two relevant endpoints:
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
  const normalize = (p: any) => (p.name ?? p.user?.name ?? p.displayName ?? "").toLowerCase();
  const p1 = players.find((p) => normalize(p) === username1.toLowerCase());
  const p2 = players.find((p) => normalize(p) === username2.toLowerCase());
  const s1 = p1 !== undefined ? (scores[p1.index] ?? {}) : {};
  const s2 = p2 !== undefined ? (scores[p2.index] ?? {}) : {};
  return {
    legs1: s1.legs ?? p1?.legs ?? 0,
    legs2: s2.legs ?? p2?.legs ?? 0,
    // average lives on user.average (overall), not per-match in this endpoint
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
          // Check both endpoints in parallel:
          // 1. as/v0/matches/{id} → only populated once match is COMPLETED
          // 2. gs/v0/lobbies/{id} → active while match is IN PROGRESS (works for private lobbies)
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
                await db.update(tourMatchesTable)
                  .set({ winner_id: winnerId, score_p1: score.legs1, score_p2: score.legs2, status: "abgeschlossen", autodarts_match_id: directMatch.id })
                  .where(eq(tourMatchesTable.id, match.id));
                await advanceWinner(tournamentId, match.runde, match.match_nr, winnerId);
                await checkTournamentComplete(tournamentId);
                results.push({ match_id: match.id, status: "auto_completed", winner_id: winnerId, legs1: score.legs1, legs2: score.legs2, avg1: Math.round(score.avg1 * 10) / 10, avg2: Math.round(score.avg2 * 10) / 10, autodarts_id: directMatch.id });
                synced++;
                continue;
              } else {
                results.push({ match_id: match.id, status: "live", legs1: score.legs1, legs2: score.legs2, avg1: Math.round(score.avg1 * 10) / 10, avg2: Math.round(score.avg2 * 10) / 10, autodarts_id: directMatch.id });
                continue;
              }
            }
          }

          // Still in progress — check live lobby (works for private lobbies by direct ID)
          if (lobbyRes.status === "fulfilled" && lobbyRes.value.ok) {
            const lobby = await lobbyRes.value.json();
            // Lobby exists → match is live (scores not available until leg completes, show 0:0)
            if (lobby?.id) {
              results.push({ match_id: match.id, status: "live", legs1: 0, legs2: 0, avg1: 0, avg2: 0, autodarts_id: lobby.id });
              continue;
            }
          }

          // Lobby returned 404 → it has expired; clear the stored ID so the UI shows "Lobby erstellen" again
          if (lobbyRes.status === "fulfilled" && lobbyRes.value.status === 404) {
            await db.update(tourMatchesTable)
              .set({ autodarts_match_id: null })
              .where(eq(tourMatchesTable.id, match.id));
          }
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

// POST /tour/matches/:matchId/create-lobby — create a public Autodarts lobby for a tournament match
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

    const accessToken = await getAutodartAccessToken();
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
      .where(eq(tourTournamentsTable.status, "abgeschlossen"))
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
