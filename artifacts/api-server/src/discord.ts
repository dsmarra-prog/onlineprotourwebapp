import { db } from "@workspace/db";
import { systemSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const OPT_COLOR = 0xC8982E;
const OPT_ICON = "https://onlineprotour.eu/images/opt-logo.png";

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getDiscordSettings() {
  try {
    const rows = await db.select().from(systemSettingsTable);
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      webhookUrl: map["discord_webhook_url"] ?? null,
      botToken: map["discord_bot_token"] ?? null,
      channelId: map["discord_channel_id"] ?? null,
    };
  } catch {
    return { webhookUrl: null, botToken: null, channelId: null };
  }
}

export async function saveDiscordSettings(settings: {
  webhookUrl?: string;
  botToken?: string;
  channelId?: string;
}) {
  const entries = [
    { key: "discord_webhook_url", value: settings.webhookUrl ?? "" },
    { key: "discord_bot_token", value: settings.botToken ?? "" },
    { key: "discord_channel_id", value: settings.channelId ?? "" },
  ];
  for (const e of entries) {
    await db.insert(systemSettingsTable)
      .values({ key: e.key, value: e.value, updated_at: new Date() })
      .onConflictDoUpdate({ target: systemSettingsTable.key, set: { value: e.value, updated_at: new Date() } });
  }
}

// ─── Webhook helper ───────────────────────────────────────────────────────────

async function sendWebhook(webhookUrl: string, payload: object) {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch { /* non-critical */ }
}

// ─── Bot API helpers ──────────────────────────────────────────────────────────

async function botRequest(token: string, method: string, path: string, body?: object) {
  try {
    const res = await fetch(`https://discord.com/api/v10${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bot ${token}`,
        "User-Agent": "OnlineProTour/1.0",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) return await res.json();
    const err = await res.text();
    console.warn(`[Discord Bot] ${method} ${path} → ${res.status}: ${err}`);
    return null;
  } catch (e) {
    console.warn(`[Discord Bot] fetch error:`, e);
    return null;
  }
}

// ─── Notification functions ───────────────────────────────────────────────────

export async function notifyRegistration(
  tournamentName: string,
  tournamentId: number,
  playerName: string,
  autodarts_username: string,
  count: number,
  max: number,
) {
  const { webhookUrl } = await getDiscordSettings();
  if (!webhookUrl) return;

  const embed = {
    color: OPT_COLOR,
    author: { name: "Online Pro Tour", icon_url: OPT_ICON },
    title: `📋 Neue Anmeldung — ${tournamentName}`,
    description: `**${playerName}** (@${autodarts_username}) hat sich angemeldet.`,
    fields: [
      { name: "Anmeldungen", value: `${count} / ${max}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
  };

  await sendWebhook(webhookUrl, { embeds: [embed] });
}

export async function notifyTournamentStart(
  tournament: { id: number; name: string; typ: string; tour_type: string; datum: string; max_players: number },
  firstRoundMatches: Array<{
    match_nr: number;
    runde: string;
    is_bye: boolean;
    player1_name: string | null;
    player2_name: string | null;
  }>,
) {
  const { webhookUrl, botToken, channelId } = await getDiscordSettings();

  const realMatches = firstRoundMatches.filter((m) => !m.is_bye && m.player1_name && m.player2_name);
  const typLabel: Record<string, string> = {
    pc: "Players Championship", m1: "Major", m2: "Grand Final",
    dev_cup: "Development Cup", dev_major: "Dev Major",
  };

  // Webhook notification
  if (webhookUrl) {
    const matchList = realMatches
      .map((m) => `• Match ${m.match_nr}: **${m.player1_name}** vs **${m.player2_name}**`)
      .join("\n");

    const embed = {
      color: 0x2ECC71,
      author: { name: "Online Pro Tour", icon_url: OPT_ICON },
      title: `🏆 Turnier gestartet — ${tournament.name}`,
      description: matchList || "Bracket wird generiert...",
      fields: [
        { name: "Typ", value: typLabel[tournament.typ] ?? tournament.typ, inline: true },
        { name: "Datum", value: tournament.datum, inline: true },
        { name: "Matches", value: `${realMatches.length}`, inline: true },
      ],
      footer: { text: tournament.tour_type === "development" ? "Development Tour" : "Pro Tour" },
      timestamp: new Date().toISOString(),
    };
    await sendWebhook(webhookUrl, { embeds: [embed] });
  }

  // Create Discord threads for each first-round match
  if (botToken && channelId && realMatches.length > 0) {
    const shortName = tournament.name.replace("Players Championship", "PC")
      .replace("Development Cup", "DC")
      .replace("Spring Open", "SO")
      .replace("Grand Prix", "GP")
      .replace("Home Matchplay", "HM")
      .replace("Grand Final", "GF");

    for (const match of realMatches) {
      await createMatchThread(
        botToken,
        channelId,
        shortName,
        match.match_nr,
        match.player1_name!,
        match.player2_name!,
      );
      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 300));
    }
  }
}

async function createMatchThread(
  botToken: string,
  channelId: string,
  tournamentShort: string,
  matchNr: number,
  p1: string,
  p2: string,
) {
  const threadName = `${tournamentShort} · Match ${matchNr}: ${p1} vs ${p2}`.substring(0, 100);
  const content = `🎯 **${p1}** vs **${p2}** — Verabredet hier euren Spieltermin!\n\nNutzt diesen Thread um euch abzusprechen wann ihr das Match spielen wollt.`;

  // Post a message to the channel
  const msg = await botRequest(botToken, "POST", `/channels/${channelId}/messages`, { content });
  if (!msg?.id) return;

  // Create thread from the message
  await botRequest(botToken, "POST", `/channels/${channelId}/messages/${msg.id}/threads`, {
    name: threadName,
    auto_archive_duration: 1440, // 24h
  });
}

export async function notifyMatchResult(
  tournamentName: string,
  runde: string,
  p1Name: string,
  p2Name: string,
  scoreP1: number,
  scoreP2: number,
  winnerName: string,
  avgP1?: number | null,
  avgP2?: number | null,
) {
  const { webhookUrl } = await getDiscordSettings();
  if (!webhookUrl) return;

  const roundLabel: Record<string, string> = {
    F: "Finale", SF: "Halbfinale", QF: "Viertelfinale",
    R16: "Achtelfinale", R32: "Letzte 32", R64: "Runde 1",
  };

  const fields: any[] = [
    { name: "Ergebnis", value: `**${scoreP1}** : **${scoreP2}**`, inline: true },
    { name: "Sieger", value: `🏆 ${winnerName}`, inline: true },
    { name: "Runde", value: roundLabel[runde] ?? runde, inline: true },
  ];

  if (avgP1 != null || avgP2 != null) {
    fields.push({
      name: "Averages",
      value: `${p1Name}: ${avgP1 != null ? avgP1.toFixed(1) : "—"} · ${p2Name}: ${avgP2 != null ? avgP2.toFixed(1) : "—"}`,
      inline: false,
    });
  }

  const embed = {
    color: winnerName === p1Name ? OPT_COLOR : 0x9B59B6,
    author: { name: "Online Pro Tour", icon_url: OPT_ICON },
    title: `🎯 ${p1Name} vs ${p2Name}`,
    description: `Ergebnis in **${tournamentName}** eingetragen`,
    fields,
    timestamp: new Date().toISOString(),
  };

  await sendWebhook(webhookUrl, { embeds: [embed] });
}

export async function notifyTournamentComplete(
  tournamentName: string,
  winnerName: string,
  runnerUpName: string,
) {
  const { webhookUrl } = await getDiscordSettings();
  if (!webhookUrl) return;

  const embed = {
    color: 0xF1C40F,
    author: { name: "Online Pro Tour", icon_url: OPT_ICON },
    title: `🏆 Turnier abgeschlossen — ${tournamentName}`,
    description: `**${winnerName}** gewinnt das Turnier! Glückwunsch! 🎉`,
    fields: [
      { name: "Sieger", value: `🥇 ${winnerName}`, inline: true },
      { name: "Finalist", value: `🥈 ${runnerUpName}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
  };

  await sendWebhook(webhookUrl, { embeds: [embed] });
}

export async function notifyOomUpdate(tourType: "pro" | "dev") {
  const { webhookUrl } = await getDiscordSettings();
  if (!webhookUrl) return;

  const embed = {
    color: OPT_COLOR,
    author: { name: "Online Pro Tour", icon_url: OPT_ICON },
    title: tourType === "pro"
      ? "📊 Pro Tour OOM aktualisiert"
      : "📊 Development Tour OOM aktualisiert",
    description: "Die Order of Merit wurde neu importiert und ist jetzt aktuell.",
    timestamp: new Date().toISOString(),
  };

  await sendWebhook(webhookUrl, { embeds: [embed] });
}
