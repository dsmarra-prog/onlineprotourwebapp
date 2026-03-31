import { db } from "@workspace/db";
import { systemSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const OPT_COLOR = 0xC8982E;
const OPT_ICON = "https://onlineprotour.eu/images/opt-logo.png";

// ─── Settings ────────────────────────────────────────────────────────────────
// Priority: DB value (set via admin panel) → environment variable fallback

// Extract numeric channel ID from a full Discord URL or plain snowflake
function normalizeChannelId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // https://discord.com/channels/GUILD_ID/CHANNEL_ID  → last segment
  const urlMatch = raw.match(/\/channels\/\d+\/(\d+)/);
  if (urlMatch) return urlMatch[1];
  // plain numeric ID
  if (/^\d+$/.test(raw.trim())) return raw.trim();
  return null;
}

export async function getDiscordSettings() {
  try {
    const rows = await db.select().from(systemSettingsTable);
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    const webhookUrl = (map["discord_webhook_url"] || "") || process.env["DISCORD_WEBHOOK_URL"] || null;
    const botToken   = (map["discord_bot_token"]   || "") || process.env["DISCORD_BOT_TOKEN"]   || null;
    const rawChannel = (map["discord_channel_id"]  || "") || process.env["DISCORD_CHANNEL_ID"]  || null;
    const channelId  = normalizeChannelId(rawChannel);

    return { webhookUrl, botToken, channelId };
  } catch {
    return {
      webhookUrl: process.env["DISCORD_WEBHOOK_URL"] ?? null,
      botToken:   process.env["DISCORD_BOT_TOKEN"]   ?? null,
      channelId:  normalizeChannelId(process.env["DISCORD_CHANNEL_ID"] ?? null),
    };
  }
}

export async function saveDiscordSettings(settings: {
  webhookUrl?: string;
  botToken?: string;
  channelId?: string;
}) {
  const entries = [
    { key: "discord_webhook_url", value: settings.webhookUrl },
    { key: "discord_bot_token",   value: settings.botToken },
    { key: "discord_channel_id",  value: settings.channelId },
  ].filter((e) => e.value !== undefined) as { key: string; value: string }[];

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
): Promise<string | null> {
  const threadName = `${tournamentShort} · Match ${matchNr}: ${p1} vs ${p2}`.substring(0, 100);
  const content = `🎯 **${p1}** vs **${p2}** — Verabredet hier euren Spieltermin!\n\nNutzt diesen Thread um euch abzusprechen wann ihr das Match spielen wollt.`;

  const msg = await botRequest(botToken, "POST", `/channels/${channelId}/messages`, { content });
  if (!msg?.id) return null;

  const thread = await botRequest(botToken, "POST", `/channels/${channelId}/messages/${msg.id}/threads`, {
    name: threadName,
    auto_archive_duration: 1440,
  });
  return thread?.id ?? null;
}

// ─── Standalone match thread creator (used by advanceWinner for all rounds) ───

export async function createMatchThreadForMatch(
  tournamentName: string,
  tournamentId: number,
  runde: string,
  matchNr: number,
  p1Name: string,
  p2Name: string,
  lobbyUrl?: string | null,
): Promise<string | null> {
  const { botToken, channelId } = await getDiscordSettings();
  if (!botToken || !channelId) return null;

  const shortName = tournamentName
    .replace("Players Championship", "PC")
    .replace("Development Cup", "DC")
    .replace("Spring Open", "SO")
    .replace("Grand Prix", "GP")
    .replace("Home Matchplay", "HM")
    .replace("Grand Final", "GF");

  const roundLabel: Record<string, string> = {
    F: "Finale", SF: "Halbfinale", QF: "Viertelfinale",
    R16: "Achtelfinale", R32: "Letzte 32", R64: "Runde 1",
  };
  const roundText = roundLabel[runde] ?? runde;

  const threadName = `${shortName} · ${roundText}: ${p1Name} vs ${p2Name}`.substring(0, 100);
  const lobbyLine = lobbyUrl ? `\n🔗 **Lobby:** ${lobbyUrl}` : "";
  const content = `🎯 **${p1Name}** vs **${p2Name}** — ${roundText} in **${tournamentName}**\n\nNutzt diesen Thread um euch abzusprechen wann ihr das Match spielen wollt.${lobbyLine}`;

  const msg = await botRequest(botToken, "POST", `/channels/${channelId}/messages`, { content });
  if (!msg?.id) return null;

  const thread = await botRequest(botToken, "POST", `/channels/${channelId}/messages/${msg.id}/threads`, {
    name: threadName,
    auto_archive_duration: 1440,
  });
  return thread?.id ?? null;
}

// ─── Live Score Updates ────────────────────────────────────────────────────────

export async function postLiveScoreToThread(
  threadId: string,
  p1Name: string,
  p2Name: string,
  legs1: number,
  legs2: number,
  avg1: number,
  avg2: number,
  legsFormat: number,
): Promise<string | null> {
  const { botToken } = await getDiscordSettings();
  if (!botToken) return null;

  const winLegs = Math.ceil(legsFormat / 2);
  const bar = (legs: number) => "🟣".repeat(legs) + "⚫".repeat(winLegs - legs);
  const content = [
    `📊 **Live Score Update**`,
    ``,
    `**${p1Name}** ${bar(legs1)} **${legs1}** : **${legs2}** ${bar(legs2)} **${p2Name}**`,
    ``,
    `Avg: ${avg1 > 0 ? avg1.toFixed(1) : "—"} · ${avg2 > 0 ? avg2.toFixed(1) : "—"}`,
    `Best of ${legsFormat} · Erster zu ${winLegs} Legs`,
  ].join("\n");

  const msg = await botRequest(botToken, "POST", `/channels/${threadId}/messages`, { content });
  return msg?.id ?? null;
}

export async function updateLiveScoreMessage(
  threadId: string,
  messageId: string,
  p1Name: string,
  p2Name: string,
  legs1: number,
  legs2: number,
  avg1: number,
  avg2: number,
  legsFormat: number,
): Promise<void> {
  const { botToken } = await getDiscordSettings();
  if (!botToken) return;

  const winLegs = Math.ceil(legsFormat / 2);
  const bar = (legs: number) => "🟣".repeat(legs) + "⚫".repeat(winLegs - legs);
  const content = [
    `📊 **Live Score Update**`,
    ``,
    `**${p1Name}** ${bar(legs1)} **${legs1}** : **${legs2}** ${bar(legs2)} **${p2Name}**`,
    ``,
    `Avg: ${avg1 > 0 ? avg1.toFixed(1) : "—"} · ${avg2 > 0 ? avg2.toFixed(1) : "—"}`,
    `Best of ${legsFormat} · Erster zu ${winLegs} Legs`,
  ].join("\n");

  await botRequest(botToken, "PATCH", `/channels/${threadId}/messages/${messageId}`, { content });
}

export async function postMatchResultToThread(
  threadId: string,
  p1Name: string,
  p2Name: string,
  scoreP1: number,
  scoreP2: number,
  winnerName: string,
  avg1?: number | null,
  avg2?: number | null,
): Promise<void> {
  const { botToken } = await getDiscordSettings();
  if (!botToken) return;

  const content = [
    `🏆 **Match beendet!**`,
    ``,
    `**${p1Name}** **${scoreP1}** : **${scoreP2}** **${p2Name}**`,
    ``,
    `🥇 Sieger: **${winnerName}**`,
    avg1 != null || avg2 != null
      ? `📈 Avg: ${avg1 != null ? avg1.toFixed(1) : "—"} · ${avg2 != null ? avg2.toFixed(1) : "—"}`
      : "",
  ].filter(Boolean).join("\n");

  await botRequest(botToken, "POST", `/channels/${threadId}/messages`, { content });
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

// ─── Tournament Check-In Reminder (30 min before) ─────────────────────────────
export async function sendTournamentCheckInReminder(opts: {
  tournamentName: string;
  uhrzeit: string;
  discordIds: string[];
}) {
  const { webhookUrl, botToken, channelId } = await getDiscordSettings();

  const mentions = opts.discordIds.length > 0
    ? opts.discordIds.map((id) => `<@${id}>`).join(" ")
    : "";

  const content = mentions
    ? `${mentions}\n⏰ **Erinnerung:** Das Turnier **${opts.tournamentName}** startet in **30 Minuten** um **${opts.uhrzeit} Uhr**! Bitte bestätigt eure Teilnahme in der App.`
    : `⏰ **Erinnerung:** Das Turnier **${opts.tournamentName}** startet in **30 Minuten** um **${opts.uhrzeit} Uhr**!`;

  const embed = {
    color: OPT_COLOR,
    author: { name: "Online Pro Tour", icon_url: OPT_ICON },
    title: `⏰ ${opts.tournamentName} – Start in 30 Minuten!`,
    description: `Das Turnier startet um **${opts.uhrzeit} Uhr**.\nBitte bestätigt eure Teilnahme in der App!`,
    timestamp: new Date().toISOString(),
  };

  // Prefer bot token + channel for mentions (webhook doesn't support @user mentions)
  if (botToken && channelId) {
    const body: Record<string, unknown> = { content, embeds: [embed] };
    try {
      await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      return;
    } catch {
      // fall through to webhook
    }
  }

  if (webhookUrl) {
    await sendWebhook(webhookUrl, { content, embeds: [embed] });
  }
}

// ─── Match @mention in Discord thread ────────────────────────────────────────
export async function postMatchMentionsToThread(opts: {
  threadId: string;
  p1Name: string;
  p2Name: string;
  p1DiscordId: string | null;
  p2DiscordId: string | null;
  runde: string;
  lobbyUrl?: string | null;
}) {
  const { botToken } = await getDiscordSettings();
  if (!botToken) return;

  const m1 = opts.p1DiscordId ? `<@${opts.p1DiscordId}>` : `**${opts.p1Name}**`;
  const m2 = opts.p2DiscordId ? `<@${opts.p2DiscordId}>` : `**${opts.p2Name}**`;

  const roundLabel: Record<string, string> = {
    F: "Finale", SF: "Halbfinale", QF: "Viertelfinale",
    R16: "Achtelfinale", R32: "Letzte 32", R64: "Runde 1",
  };
  const roundText = roundLabel[opts.runde] ?? opts.runde;
  const lobbyLine = opts.lobbyUrl ? `\n🔗 Lobby: ${opts.lobbyUrl}` : "";
  const content = `${m1} ${m2} — Ihr seid dran! Verabredet euch hier für euer ${roundText}-Match. 🎯${lobbyLine}`;

  await botRequest(botToken, "POST", `/channels/${opts.threadId}/messages`, { content });
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
