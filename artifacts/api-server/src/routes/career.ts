import { Router, type IRouter } from "express";
import {
  getOrCreateCareer,
  startMatch,
  processResult,
  pullFromAutodarts,
  resetCareer,
  buildCareerState,
  buildCalendar,
  buildEquipment,
  buyEquipment,
  setPlayerName,
  avgToAutodartsBotLevel,
  ermittlePlatz,
} from "../lib/career-engine.js";
import { SubmitResultBody, BuyEquipmentBody, SetPlayerNameBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/career", async (req, res) => {
  try {
    const career = await getOrCreateCareer();
    res.json(buildCareerState(career));
  } catch (err) {
    req.log.error({ err }, "Error getting career");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/career/start", async (req, res) => {
  try {
    const result = await startMatch();
    res.json({ career: buildCareerState(result.career), messages: result.messages });
  } catch (err) {
    req.log.error({ err }, "Error starting match");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/career/result", async (req, res) => {
  try {
    const parsed = SubmitResultBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const { legs_won, legs_lost, my_avg = 0, my_180s = 0, my_hf = 0, my_co_pct = 0 } = parsed.data;
    const result = await processResult(legs_won, legs_lost, my_avg, my_180s, my_hf, my_co_pct);
    res.json({ career: buildCareerState(result.career), messages: result.messages });
  } catch (err) {
    req.log.error({ err }, "Error submitting result");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/career/autodarts", async (req, res) => {
  try {
    const result = await pullFromAutodarts();
    res.json({ career: buildCareerState(result.career), messages: result.messages });
  } catch (err) {
    req.log.error({ err }, "Error pulling from Autodarts");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/career/reset", async (req, res) => {
  try {
    const result = await resetCareer();
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error resetting career");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/career/name", async (req, res) => {
  try {
    const parsed = SetPlayerNameBody.safeParse(req.body);
    if (!parsed.success || !parsed.data.name.trim()) {
      res.status(400).json({ error: "Invalid name" });
      return;
    }
    const result = await setPlayerName(parsed.data.name, (parsed.data as any).spieler_avg ?? 60);
    res.json({ career: buildCareerState(result.career), messages: result.messages });
  } catch (err) {
    req.log.error({ err }, "Error setting name");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/career/history", async (req, res) => {
  try {
    const career = await getOrCreateCareer();
    res.json({ history: career.turnier_verlauf ?? [] });
  } catch (err) {
    req.log.error({ err }, "Error getting history");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/career/h2h", async (req, res) => {
  try {
    const career = await getOrCreateCareer();
    const h2h: Record<string, { siege: number; niederlagen: number }> = career.h2h as any ?? {};
    const records = Object.entries(h2h)
      .map(([name, stats]) => ({ name, siege: stats.siege, niederlagen: stats.niederlagen }))
      .sort((a, b) => (b.siege + b.niederlagen) - (a.siege + a.niederlagen));
    res.json({ records });
  } catch (err) {
    req.log.error({ err }, "Error getting H2H");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/career/calendar", async (req, res) => {
  try {
    const career = await getOrCreateCareer();
    const entries = buildCalendar(career);
    res.json({ entries, aktuelles_turnier_index: career.aktuelles_turnier_index });
  } catch (err) {
    req.log.error({ err }, "Error getting calendar");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/career/equipment", async (req, res) => {
  try {
    const career = await getOrCreateCareer();
    const items = buildEquipment(career);
    res.json({ items, bank_konto: career.bank_konto });
  } catch (err) {
    req.log.error({ err }, "Error getting equipment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/career/equipment/buy", async (req, res) => {
  try {
    const parsed = BuyEquipmentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    const result = await buyEquipment(parsed.data.id);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error buying equipment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/career/oom", async (req, res) => {
  try {
    const career = await getOrCreateCareer();
    const botRangliste: any[] = career.bot_rangliste as any[] ?? [];
    const sorted = [...botRangliste].sort((a, b) => b.geld - a.geld);
    const spielerPlatz = ermittlePlatz(botRangliste, career.spieler_name, career.order_of_merit_geld);
    // Map rank position to Autodarts bot level (top players = higher level)
    function rankToBotLevel(rank: number, total: number): number {
      const pct = rank / total;
      if (pct < 0.06) return 9;      // Top 6% → Level 9
      if (pct < 0.13) return 8;      // Top 13%
      if (pct < 0.25) return 7;
      if (pct < 0.40) return 6;
      if (pct < 0.60) return 5;
      if (pct < 0.75) return 4;
      if (pct < 0.88) return 3;
      if (pct < 0.95) return 2;
      return 1;
    }
    const total = sorted.length;
    const entries = sorted.map((b, idx) => ({
      platz: idx + 1,
      name: b.name,
      geld: b.geld,
      bot_level: rankToBotLevel(idx, total),
    }));
    // Insert player at their position
    const spielerEntry = {
      platz: spielerPlatz,
      name: career.spieler_name,
      geld: career.order_of_merit_geld,
      bot_level: null,
      is_player: true,
    };
    const result = entries.map((e, i) => ({
      ...e,
      is_player: false,
      platz: i + 1,
    }));
    // Find insertion point for player
    const insertIdx = result.findIndex((e) => e.geld <= career.order_of_merit_geld);
    if (insertIdx === -1) {
      result.push(spielerEntry as any);
    } else {
      result.splice(insertIdx, 0, spielerEntry as any);
    }
    // Re-number ranks
    result.forEach((e, i) => { e.platz = i + 1; });
    res.json({ entries: result, spieler_name: career.spieler_name });
  } catch (err) {
    req.log.error({ err }, "Error getting OoM");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
