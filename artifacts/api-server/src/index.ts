import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import {
  tourScheduleTable,
  tourPushSubscriptionsTable,
  tourTournamentsTable,
  tourEntriesTable,
  tourPlayersTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import webpush from "web-push";
import { sendTournamentCheckInReminder } from "./discord";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails("mailto:admin@onlineprotour.de", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// ─── Push Reminder Cron (every 5 minutes) ─────────────────────────────────────
const sentReminders = new Set<string>();

async function sendTournamentReminders() {
  try {
    const now = new Date();
    const scheduleRows = await db.select().from(tourScheduleTable);

    for (const row of scheduleRows) {
      if (!row.datum || !row.uhrzeit) continue;
      // Parse datum: DD.MM.YYYY
      let dateStr = row.datum;
      if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
        const [d, m, y] = dateStr.split(".");
        dateStr = `${y}-${m}-${d}`;
      }
      const eventDate = new Date(`${dateStr}T${row.uhrzeit}:00`);
      const diffMs = eventDate.getTime() - now.getTime();
      const diffMin = diffMs / 60000;

      // Remind 50–70 minutes before (window to avoid double-sends across 5-min intervals)
      if (diffMin < 50 || diffMin > 70) continue;

      const reminderKey = `${row.id}-${dateStr}`;
      if (sentReminders.has(reminderKey)) continue;
      sentReminders.add(reminderKey);

      // Get all push subscriptions
      const subs = await db.select({
        endpoint: tourPushSubscriptionsTable.endpoint,
        p256dh: tourPushSubscriptionsTable.p256dh,
        auth: tourPushSubscriptionsTable.auth,
      }).from(tourPushSubscriptionsTable);

      const payload = JSON.stringify({
        title: `⏰ Turnier in ~1 Stunde`,
        body: `${row.event_name} startet um ${row.uhrzeit} Uhr`,
        url: "/pro-tour/turniere",
      });

      for (const sub of subs) {
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        ).catch(() => {});
      }

      logger.info({ event: row.event_name, diffMin: Math.round(diffMin) }, "Sent tournament reminder");
    }
  } catch (e) {
    logger.warn({ err: e }, "Reminder cron error");
  }
}

// ─── Discord Check-In Cron (every 5 minutes) ─────────────────────────────────
const sentDiscordReminders = new Set<string>();

async function sendDiscordCheckInReminders() {
  try {
    const now = new Date();
    const tournaments = await db
      .select()
      .from(tourTournamentsTable)
      .where(eq(tourTournamentsTable.status, "offen"));

    for (const t of tournaments) {
      if (!t.datum || !t.uhrzeit) continue;

      // Parse datum: DD.MM.YYYY or YYYY-MM-DD
      let dateStr = t.datum;
      if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
        const [d, m, y] = dateStr.split(".");
        dateStr = `${y}-${m}-${d}`;
      }
      const eventDate = new Date(`${dateStr}T${t.uhrzeit}:00`);
      const diffMin = (eventDate.getTime() - now.getTime()) / 60000;

      // Send 25–35 minutes before (window covers one 5-min check interval)
      if (diffMin < 25 || diffMin > 35) continue;

      const reminderKey = `discord-${t.id}-${dateStr}`;
      if (sentDiscordReminders.has(reminderKey)) continue;
      sentDiscordReminders.add(reminderKey);

      // Get all approved entries for this tournament
      const entries = await db
        .select({ player_id: tourEntriesTable.player_id })
        .from(tourEntriesTable)
        .where(eq(tourEntriesTable.tournament_id, t.id));

      const playerIds = entries.map((e) => e.player_id).filter(Boolean) as number[];
      let discordIds: string[] = [];

      if (playerIds.length > 0) {
        const players = await db
          .select({ discord_id: tourPlayersTable.discord_id })
          .from(tourPlayersTable)
          .where(inArray(tourPlayersTable.id, playerIds));
        discordIds = players.map((p) => p.discord_id).filter(Boolean) as string[];
      }

      await sendTournamentCheckInReminder({
        tournamentName: t.name,
        uhrzeit: t.uhrzeit,
        discordIds,
      });

      logger.info({ tournament: t.name, mentions: discordIds.length, diffMin: Math.round(diffMin) }, "Sent Discord check-in reminder");
    }
  } catch (e) {
    logger.warn({ err: e }, "Discord check-in cron error");
  }
}

// Run every 5 minutes
setInterval(sendTournamentReminders, 5 * 60 * 1000);
setInterval(sendDiscordCheckInReminders, 5 * 60 * 1000);
// Run once at startup (after 30s so server is ready)
setTimeout(sendTournamentReminders, 30_000);
setTimeout(sendDiscordCheckInReminders, 35_000);

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
