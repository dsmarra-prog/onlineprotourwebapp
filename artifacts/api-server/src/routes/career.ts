import { Router, type IRouter } from "express";
import {
  getOrCreateCareer,
  startMatch,
  processResult,
  pullFromAutodarts,
  resetCareer,
  buildCareerState,
} from "../lib/career-engine.js";
import { SubmitResultBody } from "@workspace/api-zod";

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

export default router;
