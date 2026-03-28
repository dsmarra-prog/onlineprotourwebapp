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
    const result = await setPlayerName(parsed.data.name, parsed.data.schwierigkeitsgrad ?? 5);
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

export default router;
