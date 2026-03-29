import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  tourPlayersTable,
  tourTournamentsTable,
  tourMatchesTable,
  tourEntriesTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

// ─── OOM Points by Tournament Type and Round ───────────────────────────────
const OOM_POINTS: Record<string, Record<string, number>> = {
  players_championship: {
    Sieger: 10000,
    Finale: 6000,
    Halbfinale: 3000,
    Viertelfinale: 1500,
    "Letzte 16": 750,
    "Letzte 32": 375,
    "Letzte 64": 200,
  },
  european_tour: {
    Sieger: 25000,
    Finale: 15000,
    Halbfinale: 8000,
    Viertelfinale: 4000,
    "Letzte 16": 2000,
    "Letzte 32": 1000,
    "Letzte 64": 500,
  },
  world_series: {
    Sieger: 25000,
    Finale: 15000,
    Halbfinale: 8000,
    Viertelfinale: 4000,
    "Letzte 16": 2000,
    "Letzte 32": 1000,
    "Letzte 64": 500,
  },
  major: {
    Sieger: 100000,
    Finale: 60000,
    Halbfinale: 35000,
    Viertelfinale: 20000,
    "Letzte 16": 10000,
    "Letzte 32": 5000,
    "Letzte 64": 2500,
  },
};

function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

function verifyPin(pin: string, hash: string): boolean {
  return hashPin(pin) === hash;
}

// Map runde label → OOM round key
function roundToOomKey(runde: string, totalRounds: number): string {
  const map: Record<string, string> = {
    F: "Finale",
    SF: "Halbfinale",
    QF: "Viertelfinale",
    R16: "Letzte 16",
    R32: "Letzte 32",
    R64: "Letzte 64",
  };
  return map[runde] || runde;
}

// Build round labels from player count
function buildRoundLabels(playerCount: number): string[] {
  const rounds: string[] = [];
  let n = playerCount;
  while (n > 2) {
    rounds.push(n <= 4 ? (n === 4 ? "QF" : "SF") : `R${n}`);
    n = Math.ceil(n / 2);
  }
  rounds.push("SF");
  rounds.push("F");
  // Deduplicate
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const r of ["R64", "R32", "R16", "QF", "SF", "F"]) {
    if (playerCount >= (r === "R64" ? 33 : r === "R32" ? 17 : r === "R16" ? 9 : r === "QF" ? 5 : r === "SF" ? 3 : 2)) {
      if (!seen.has(r)) { seen.add(r); labels.push(r); }
    }
  }
  labels.push("F");
  return labels;
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
  const map: Record<string, number> = {
    R64: 64, R32: 32, R16: 16, QF: 8, SF: 4, F: 2,
  };
  return map[runde] || 2;
}

// ─── Build bracket for tournament ──────────────────────────────────────────
async function generateBracket(tournamentId: number, playerIds: number[], legsFormat: number) {
  const entries = [...playerIds];
  const maxPlayers = entries.length;
  const rounds = getRoundsForSize(maxPlayers);

  // Pad to next power of 2 for byes
  let bracketSize = 2;
  while (bracketSize < entries.length) bracketSize *= 2;

  // Seed-based bracket (top seed vs bottom seed)
  const seeded = [...entries, ...Array(bracketSize - entries.length).fill(null)];

  // First round matches
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

  // Generate empty matches for subsequent rounds
  for (let ri = 1; ri < rounds.length; ri++) {
    const prevRound = rounds[ri - 1];
    const prevSize = getRoundSize(prevRound);
    const thisRound = rounds[ri];
    const thisCount = prevSize / 4; // halved

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

  // Advance byes immediately
  await propagateByes(tournamentId);
}

async function propagateByes(tournamentId: number) {
  const matches = await db
    .select()
    .from(tourMatchesTable)
    .where(eq(tourMatchesTable.tournament_id, tournamentId));

  const rounds = [...new Set(matches.map((m) => m.runde))];
  const roundOrder = ["R64", "R32", "R16", "QF", "SF", "F"];
  rounds.sort((a, b) => roundOrder.indexOf(a) - roundOrder.indexOf(b));

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
          await db
            .update(tourMatchesTable)
            .set({ player1_id: f1.winner_id, player2_id: f2.winner_id })
            .where(eq(tourMatchesTable.id, nextMatch.id));
        }
      } else if (feeders.length === 1) {
        const f = feeders[0];
        if (f.winner_id) {
          const isP1Slot = f.match_nr % 2 === 1;
          if (isP1Slot && !nextMatch.player1_id) {
            await db
              .update(tourMatchesTable)
              .set({ player1_id: f.winner_id })
              .where(eq(tourMatchesTable.id, nextMatch.id));
          } else if (!isP1Slot && !nextMatch.player2_id) {
            await db
              .update(tourMatchesTable)
              .set({ player2_id: f.winner_id })
              .where(eq(tourMatchesTable.id, nextMatch.id));
          }
        }
      }
    }
  }
}

// Build tournament detail response
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

  const playerIds = [...new Set([
    ...entries.map((e) => e.player_id),
    ...matches.flatMap((m) => [m.player1_id, m.player2_id, m.winner_id].filter(Boolean)),
  ])];

  const players =
    playerIds.length > 0
      ? await db.select().from(tourPlayersTable).where(
          // Use inArray equivalent with raw comparison
          (table: any) => table
        )
      : [];

  // Fetch players individually to avoid inArray import issues
  const playerMap: Record<number, any> = {};
  for (const pid of playerIds) {
    if (pid) {
      const p = await db
        .select()
        .from(tourPlayersTable)
        .where(eq(tourPlayersTable.id, pid))
        .limit(1);
      if (p[0]) playerMap[pid] = p[0];
    }
  }

  const rounds = [...new Set(matches.map((m) => m.runde))];

  return {
    tournament: {
      id: tournament[0].id,
      name: tournament[0].name,
      typ: tournament[0].typ,
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
      player1_name: m.player1_id ? playerMap[m.player1_id]?.name : null,
      player2_name: m.player2_id ? playerMap[m.player2_id]?.name : null,
      winner_id: m.winner_id,
      score_p1: m.score_p1,
      score_p2: m.score_p2,
      status: m.status,
      is_bye: m.is_bye,
    })),
    rounds,
  };
}

// ─── Routes ────────────────────────────────────────────────────────────────

// GET /tour/players
router.get("/tour/players", async (_req, res) => {
  try {
    const players = await db
      .select()
      .from(tourPlayersTable)
      .orderBy(tourPlayersTable.name);
    res.json(
      players.map((p) => ({
        id: p.id,
        name: p.name,
        autodarts_username: p.autodarts_username,
        created_at: p.created_at,
        oom_points: 0,
        oom_rank: 0,
      }))
    );
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

    const existing = await db
      .select()
      .from(tourPlayersTable)
      .where(eq(tourPlayersTable.autodarts_username, autodarts_username))
      .limit(1);
    if (existing[0]) {
      return res.status(409).json({ error: "Autodarts-Benutzername bereits registriert" });
    }

    const [player] = await db
      .insert(tourPlayersTable)
      .values({ name, autodarts_username, pin_hash: hashPin(pin) })
      .returning();

    res.json({
      id: player.id,
      name: player.name,
      autodarts_username: player.autodarts_username,
      created_at: player.created_at,
      oom_points: 0,
      oom_rank: 0,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /tour/players/:id
router.get("/tour/players/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const player = await db
      .select()
      .from(tourPlayersTable)
      .where(eq(tourPlayersTable.id, id))
      .limit(1);

    if (!player[0]) return res.status(404).json({ error: "Spieler nicht gefunden" });

    // Get all tournament results for OOM
    const allMatches = await db.select().from(tourMatchesTable);
    const allTournaments = await db
      .select()
      .from(tourTournamentsTable)
      .where(eq(tourTournamentsTable.status, "abgeschlossen"));

    const results: any[] = [];
    let totalWins = 0;
    let totalLosses = 0;

    for (const t of allTournaments) {
      const matches = allMatches.filter((m) => m.tournament_id === t.id);
      const playerMatches = matches.filter(
        (m) => m.player1_id === id || m.player2_id === id
      );

      if (playerMatches.length === 0) continue;

      const won = playerMatches.filter((m) => m.winner_id === id).length;
      const lost = playerMatches.filter((m) => m.winner_id !== null && m.winner_id !== id).length;
      totalWins += won;
      totalLosses += lost;

      // Find best round reached
      const roundOrder = ["R64", "R32", "R16", "QF", "SF", "F"];
      const playerRounds = playerMatches
        .filter((m) => m.winner_id !== null)
        .map((m) => m.runde);

      if (playerRounds.length === 0) continue;

      // Find the deepest round they reached (last round they played)
      const lastRound = playerMatches
        .sort((a, b) => roundOrder.indexOf(b.runde) - roundOrder.indexOf(a.runde))[0];

      const isWinner = lastRound?.winner_id === id && lastRound?.runde === "F";
      const roundKey = isWinner ? "Sieger" : roundToOomKey(lastRound?.runde ?? "R64", 0);
      const points = OOM_POINTS[t.typ]?.[roundKey] ?? 0;

      results.push({
        tournament_id: t.id,
        tournament_name: t.name,
        tournament_type: t.typ,
        best_round: isWinner ? "Sieger" : lastRound?.runde ?? "-",
        points,
      });
    }

    res.json({
      player: {
        id: player[0].id,
        name: player[0].name,
        autodarts_username: player[0].autodarts_username,
        created_at: player[0].created_at,
        oom_points: results.reduce((s, r) => s + r.points, 0),
        oom_rank: 0,
      },
      tournament_results: results,
      wins: totalWins,
      losses: totalLosses,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /tour/tournaments
router.get("/tour/tournaments", async (_req, res) => {
  try {
    const tournaments = await db
      .select()
      .from(tourTournamentsTable)
      .orderBy(desc(tourTournamentsTable.created_at));

    const result = [];
    for (const t of tournaments) {
      const entries = await db
        .select()
        .from(tourEntriesTable)
        .where(eq(tourEntriesTable.tournament_id, t.id));
      result.push({
        id: t.id,
        name: t.name,
        typ: t.typ,
        datum: t.datum,
        status: t.status,
        legs_format: t.legs_format,
        max_players: t.max_players,
        player_count: entries.length,
        winner_name: null,
      });
    }

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/tournaments
router.post("/tour/tournaments", async (req, res) => {
  try {
    const { name, typ, datum, legs_format, max_players, admin_pin } = req.body;
    if (!name || !typ || !datum || !admin_pin) {
      return res.status(400).json({ error: "name, typ, datum und admin_pin erforderlich" });
    }
    const [t] = await db
      .insert(tourTournamentsTable)
      .values({
        name,
        typ,
        datum: datum || new Date().toISOString().slice(0, 10),
        legs_format: legs_format || 5,
        max_players: max_players || 32,
        admin_pin: hashPin(admin_pin),
      })
      .returning();
    res.json({
      id: t.id,
      name: t.name,
      typ: t.typ,
      datum: t.datum,
      status: t.status,
      legs_format: t.legs_format,
      max_players: t.max_players,
      player_count: 0,
      winner_name: null,
    });
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

// DELETE /tour/tournaments/:id
router.delete("/tour/tournaments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { admin_pin } = req.body;

    const tournament = await db
      .select()
      .from(tourTournamentsTable)
      .where(eq(tourTournamentsTable.id, id))
      .limit(1);

    if (!tournament[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });
    if (!verifyPin(admin_pin, tournament[0].admin_pin)) {
      return res.status(403).json({ error: "Falscher PIN" });
    }

    await db.delete(tourMatchesTable).where(eq(tourMatchesTable.tournament_id, id));
    await db.delete(tourEntriesTable).where(eq(tourEntriesTable.tournament_id, id));
    await db.delete(tourTournamentsTable).where(eq(tourTournamentsTable.id, id));

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/tournaments/:id/entries
router.post("/tour/tournaments/:id/entries", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { player_id, seed } = req.body;

    const existing = await db
      .select()
      .from(tourEntriesTable)
      .where(
        and(
          eq(tourEntriesTable.tournament_id, tournamentId),
          eq(tourEntriesTable.player_id, player_id)
        )
      )
      .limit(1);

    if (existing[0]) {
      return res.status(409).json({ error: "Spieler bereits eingetragen" });
    }

    await db.insert(tourEntriesTable).values({ tournament_id: tournamentId, player_id, seed });

    const detail = await buildTournamentDetail(tournamentId);
    res.json(detail);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /tour/tournaments/:id/entries
router.delete("/tour/tournaments/:id/entries", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { player_id } = req.body;

    await db
      .delete(tourEntriesTable)
      .where(
        and(
          eq(tourEntriesTable.tournament_id, tournamentId),
          eq(tourEntriesTable.player_id, player_id)
        )
      );

    const detail = await buildTournamentDetail(tournamentId);
    res.json(detail);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/tournaments/:id/start
router.post("/tour/tournaments/:id/start", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const tournament = await db
      .select()
      .from(tourTournamentsTable)
      .where(eq(tourTournamentsTable.id, id))
      .limit(1);

    if (!tournament[0]) return res.status(404).json({ error: "Turnier nicht gefunden" });
    if (tournament[0].status !== "offen") {
      return res.status(400).json({ error: "Turnier bereits gestartet" });
    }

    const entries = await db
      .select()
      .from(tourEntriesTable)
      .where(eq(tourEntriesTable.tournament_id, id))
      .orderBy(tourEntriesTable.seed);

    if (entries.length < 2) {
      return res.status(400).json({ error: "Mindestens 2 Spieler erforderlich" });
    }

    const playerIds = entries.map((e) => e.player_id);
    await generateBracket(id, playerIds, tournament[0].legs_format);

    await db
      .update(tourTournamentsTable)
      .set({ status: "laufend" })
      .where(eq(tourTournamentsTable.id, id));

    const detail = await buildTournamentDetail(id);
    res.json(detail);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /tour/matches/:matchId/result
router.post("/tour/matches/:matchId/result", async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const { winner_id, score_p1, score_p2, admin_pin } = req.body;

    const match = await db
      .select()
      .from(tourMatchesTable)
      .where(eq(tourMatchesTable.id, matchId))
      .limit(1);

    if (!match[0]) return res.status(404).json({ error: "Match nicht gefunden" });

    const tournament = await db
      .select()
      .from(tourTournamentsTable)
      .where(eq(tourTournamentsTable.id, match[0].tournament_id))
      .limit(1);

    if (admin_pin && !verifyPin(admin_pin, tournament[0]?.admin_pin ?? "")) {
      return res.status(403).json({ error: "Falscher PIN" });
    }

    await db
      .update(tourMatchesTable)
      .set({ winner_id, score_p1, score_p2, status: "abgeschlossen" })
      .where(eq(tourMatchesTable.id, matchId));

    // Propagate winner to next round
    await propagateWinner(match[0].tournament_id, matchId, winner_id, match[0].runde, match[0].match_nr);

    // Check if tournament is complete
    await checkTournamentComplete(match[0].tournament_id);

    const detail = await buildTournamentDetail(match[0].tournament_id);
    res.json(detail);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

async function propagateWinner(tournamentId: number, matchId: number, winnerId: number, currentRound: string, matchNr: number) {
  const roundOrder = ["R64", "R32", "R16", "QF", "SF", "F"];
  const currentIdx = roundOrder.indexOf(currentRound);
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
    await db
      .update(tourMatchesTable)
      .set({ player1_id: winnerId })
      .where(eq(tourMatchesTable.id, nextMatches[0].id));
  } else {
    await db
      .update(tourMatchesTable)
      .set({ player2_id: winnerId })
      .where(eq(tourMatchesTable.id, nextMatches[0].id));
  }
}

async function checkTournamentComplete(tournamentId: number) {
  const matches = await db
    .select()
    .from(tourMatchesTable)
    .where(eq(tourMatchesTable.tournament_id, tournamentId));

  const final = matches.find((m) => m.runde === "F");
  if (final?.winner_id) {
    await db
      .update(tourTournamentsTable)
      .set({ status: "abgeschlossen" })
      .where(eq(tourTournamentsTable.id, tournamentId));
  }
}

// POST /tour/matches/:matchId/autodarts
router.post("/tour/matches/:matchId/autodarts", async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const match = await db
      .select()
      .from(tourMatchesTable)
      .where(eq(tourMatchesTable.id, matchId))
      .limit(1);

    if (!match[0]) return res.status(404).json({ error: "Match nicht gefunden" });

    // Get player autodarts usernames
    const p1 = match[0].player1_id
      ? await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, match[0].player1_id)).limit(1)
      : [];
    const p2 = match[0].player2_id
      ? await db.select().from(tourPlayersTable).where(eq(tourPlayersTable.id, match[0].player2_id)).limit(1)
      : [];

    if (!p1[0] || !p2[0]) {
      return res.json({ found: false, match_id: null, player1_legs: 0, player2_legs: 0, player1_avg: 0, player2_avg: 0 });
    }

    // Try to get autodarts token from env
    const refreshToken = process.env.AUTODARTS_REFRESH_TOKEN;
    if (!refreshToken) {
      return res.json({ found: false, match_id: null, player1_legs: 0, player2_legs: 0, player1_avg: 0, player2_avg: 0 });
    }

    try {
      // Get access token
      const tokenRes = await fetch("https://login.autodarts.io/realms/autodarts/protocol/openid-connect/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: "autodarts-play",
          refresh_token: refreshToken,
        }),
      });
      if (!tokenRes.ok) throw new Error("Token fetch failed");
      const tokenData: any = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // Search for recent matches between the two players
      const matchesRes = await fetch(
        `https://api.autodarts.io/ms/v0/matches?limit=20`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!matchesRes.ok) throw new Error("Matches fetch failed");
      const matchesData: any = await matchesRes.json();
      const matches: any[] = matchesData.data || matchesData || [];

      // Find a match involving both players
      const targetMatch = matches.find((m: any) => {
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

// GET /tour/oom
router.get("/tour/oom", async (_req, res) => {
  try {
    const players = await db.select().from(tourPlayersTable);
    const tournaments = await db
      .select()
      .from(tourTournamentsTable)
      .where(eq(tourTournamentsTable.status, "abgeschlossen"));
    const allMatches = await db.select().from(tourMatchesTable);

    const oomData = players.map((player) => {
      const results: any[] = [];

      for (const t of tournaments) {
        const tMatches = allMatches.filter((m) => m.tournament_id === t.id);
        const playerMatches = tMatches.filter(
          (m) => m.player1_id === player.id || m.player2_id === player.id
        );
        if (playerMatches.length === 0) continue;

        const roundOrder = ["R64", "R32", "R16", "QF", "SF", "F"];
        const playedMatches = playerMatches.filter((m) => m.status === "abgeschlossen" && !m.is_bye);
        if (playedMatches.length === 0) continue;

        const deepestMatch = playedMatches.sort(
          (a, b) => roundOrder.indexOf(b.runde) - roundOrder.indexOf(a.runde)
        )[0];

        const isWinner = deepestMatch.runde === "F" && deepestMatch.winner_id === player.id;
        const roundKey = isWinner ? "Sieger" : roundToOomKey(deepestMatch.runde, 0);
        const points = OOM_POINTS[t.typ]?.[roundKey] ?? 0;

        results.push({
          tournament_name: t.name,
          typ: t.typ,
          points,
          round: isWinner ? "Sieger" : deepestMatch.runde,
        });
      }

      const totalPoints = results.reduce((s, r) => s + r.points, 0);
      const bestResult = results.length > 0 ? results.sort((a, b) => b.points - a.points)[0].round : "-";

      return {
        player_id: player.id,
        player_name: player.name,
        autodarts_username: player.autodarts_username,
        total_points: totalPoints,
        tournaments_played: results.length,
        best_result: bestResult,
        results,
      };
    });

    // Sort by points and assign ranks
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
    // Admin PIN is the same across all tournaments — for quick setup, use env or first tournament
    const anyTournament = await db.select().from(tourTournamentsTable).limit(1);
    if (!anyTournament[0]) return res.json({ ok: false });

    const ok = verifyPin(pin, anyTournament[0].admin_pin);
    res.json({ ok });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
