import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import {
  tourScheduleTable,
  tourPushSubscriptionsTable,
} from "@workspace/db";
import webpush from "web-push";

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

// Run every 5 minutes
setInterval(sendTournamentReminders, 5 * 60 * 1000);
// Run once at startup (after 30s so server is ready)
setTimeout(sendTournamentReminders, 30_000);

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
