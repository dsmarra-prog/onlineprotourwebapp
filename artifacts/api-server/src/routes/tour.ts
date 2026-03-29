import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  tourPlayersTable,
  tourScheduleTable,
  tourTournamentsTable,
  tourMatchesTable,
  tourEntriesTable,
  tourBonusPointsTable,
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

// POST /tour/matches/:matchId/autodarts
router.post("/tour/matches/:matchId/autodarts", async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const match = await db.select().from(tourMatchesTable).where(eq(tourMatchesTable.id, matchId)).limit(1);
    if (!match[0]) return res.status(404).json({ error: "Match nicht gefunden" });

    const p1 = match[0].player1_id
      ? await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, match[0].player1_id)).limit(1)
      : [];
    const p2 = match[0].player2_id
      ? await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, match[0].player2_id)).limit(1)
      : [];

    if (!p1[0] || !p2[0]) {
      return res.json({ found: false, match_id: null, player1_legs: 0, player2_legs: 0, player1_avg: 0, player2_avg: 0 });
    }

    const refreshToken = process.env.AUTODARTS_REFRESH_TOKEN;
    if (!refreshToken) {
      return res.json({ found: false, match_id: null, player1_legs: 0, player2_legs: 0, player1_avg: 0, player2_avg: 0 });
    }

    try {
      const tokenRes = await fetch("https://login.autodarts.io/realms/autodarts/protocol/openid-connect/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "refresh_token", client_id: "autodarts-play", refresh_token: refreshToken }),
      });
      if (!tokenRes.ok) throw new Error("Token fetch failed");
      const tokenData: any = await tokenRes.json();
      const accessToken = tokenData.access_token;

      const matchesRes = await fetch("https://api.autodarts.io/ms/v0/matches?limit=20", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!matchesRes.ok) throw new Error("Matches fetch failed");
      const matchesData: any = await matchesRes.json();
      const adMatches: any[] = matchesData.data || matchesData || [];

      const targetMatch = adMatches.find((m: any) => {
        const usernames = (m.players || []).map((p: any) => p.name?.toLowerCase());
        return (
          usernames.includes(p1[0].autodarts_username.toLowerCase()) &&
          usernames.includes(p2[0].autodarts_username.toLowerCase())
        );
      });

      if (!targetMatch) {
        return res.json({ found: false, match_id: null, player1_legs: 0, player2_legs: 0, player1_avg: 0, player2_avg: 0 });
      }

      const players = targetMatch.players || [];
      const p1Data = players.find((p: any) => p.name?.toLowerCase() === p1[0].autodarts_username.toLowerCase());
      const p2Data = players.find((p: any) => p.name?.toLowerCase() === p2[0].autodarts_username.toLowerCase());

      res.json({
        found: true,
        match_id: targetMatch.id,
        player1_legs: p1Data?.legs ?? 0,
        player2_legs: p2Data?.legs ?? 0,
        player1_avg: p1Data?.stats?.average ?? 0,
        player2_avg: p2Data?.stats?.average ?? 0,
      });
    } catch {
      res.json({ found: false, match_id: null, player1_legs: 0, player2_legs: 0, player1_avg: 0, player2_avg: 0 });
    }
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
