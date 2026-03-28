import { db, careerTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const WALK_ON_VIDEOS: Record<string, string> = {
  "Michael van Gerwen": "zaJ1AC4wT3Y",
  "Gerwyn Price": "HbDDzJvGguc",
  "Luke Littler": "I66tENw1feA",
};

const KALENDER = [
  { name: "Players Championship 1", typ: "ProTour", format: "legs" },
  { name: "UK Open", typ: "Major", min_platz: 128, format: "legs" },
  { name: "Premier League Night", typ: "Major", min_platz: 8, format: "legs" },
  { name: "Players Championship 2", typ: "ProTour", format: "legs" },
  { name: "World Matchplay", typ: "Major", min_platz: 16, format: "legs" },
  { name: "World Grand Prix", typ: "Major", min_platz: 32, format: "sets" },
  { name: "PDC World Championship", typ: "Major", min_platz: 96, format: "sets" },
];

const DEFAULT_ACHIEVEMENTS = {
  first_win: { name: "Erstes Blut", desc: "Gewinne dein allererstes Match.", unlocked: false },
  tourcard: { name: "Profi-Status", desc: "Sichere dir die PDC Tourcard.", unlocked: false },
  first_title: { name: "Silberzeug!", desc: "Gewinne dein erstes Turnier.", unlocked: false },
  top64: { name: "Etabliert", desc: "Erreiche die Top 64 der Welt.", unlocked: false },
  top16: { name: "Elite", desc: "Erreiche die Top 16 der Welt.", unlocked: false },
  first_180: { name: "Maximum!", desc: "Wirf deine erste 180 im Match.", unlocked: false },
  ton_finish: { name: "Ton Plus", desc: "Checke ein Finish von 100 oder höher.", unlocked: false },
  big_fish: { name: "The Big Fish", desc: "Checke die magische 170.", unlocked: false },
};

const QSCHOOL_SPIELER = ["Fallon Sherrock", "Max Hopp", "John Henderson", "Corey Cadby"];

function buildDefaultBotRangliste() {
  const bots: Array<{ name: string; geld: number }> = [
    { name: "Luke Humphries", geld: 1400000 },
    { name: "Michael van Gerwen", geld: 1000000 },
    { name: "Michael Smith", geld: 850000 },
    { name: "Gerwyn Price", geld: 650000 },
    { name: "Nathan Aspinall", geld: 500000 },
    { name: "Luke Littler", geld: 350000 },
  ];
  let basisGeld = 200000;
  for (let i = 7; i <= 128; i++) {
    basisGeld = Math.floor(basisGeld * 0.94);
    bots.push({ name: `Profi-Bot ${i}`, geld: basisGeld });
  }
  return bots;
}

export async function getOrCreateCareer() {
  const rows = await db.select().from(careerTable).where(eq(careerTable.id, 1));
  if (rows.length > 0) return rows[0];

  const defaultBots = buildDefaultBotRangliste();
  const inserted = await db
    .insert(careerTable)
    .values({
      id: 1,
      spieler_name: "Dennis",
      hat_tourcard: false,
      q_school_punkte: 0,
      order_of_merit_geld: 0,
      bank_konto: 2500,
      saison_jahr: 1,
      turnier_laeuft: false,
      aktuelles_turnier_index: 0,
      aktuelle_runde: 0,
      gegner_name: "",
      gegner_avg: 0,
      stats_spiele: 0,
      stats_siege: 0,
      stats_legs_won: 0,
      stats_legs_lost: 0,
      stats_180s: 0,
      stats_highest_finish: 0,
      stats_avg_history: [],
      stats_checkout_percent_history: [],
      bot_form: {},
      h2h: {},
      aktiver_sponsor: null,
      letzte_schlagzeile: null,
      achievements: DEFAULT_ACHIEVEMENTS,
      turnier_baum: [],
      bot_rangliste: defaultBots,
    })
    .returning();
  return inserted[0];
}

export async function saveCareer(data: Partial<typeof careerTable.$inferInsert>) {
  await db.update(careerTable).set(data).where(eq(careerTable.id, 1));
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getBotAvg(name: string, botRangliste: any[], botForm: Record<string, number>) {
  const sorted = [...botRangliste].sort((a, b) => b.geld - a.geld);
  const formBonus = botForm[name] ?? 0;
  const rank = sorted.findIndex((b) => b.name === name);
  let base: number;
  if (rank < 0) base = rand(65, 75);
  else if (rank < 16) base = rand(95, 105);
  else if (rank < 64) base = rand(86, 94);
  else base = rand(76, 85);
  return Math.round((base + formBonus) * 10) / 10;
}

export function ermittlePlatz(
  botRangliste: any[],
  spielerName: string,
  orderOfMeritGeld: number
) {
  const alle = [...botRangliste, { name: spielerName, geld: orderOfMeritGeld }].sort(
    (a, b) => b.geld - a.geld
  );
  const idx = alle.findIndex((s) => s.name === spielerName);
  return idx + 1;
}

export function getRundenInfo(
  turnier_baum: any[],
  hat_tourcard: boolean,
  aktuelles_turnier_index: number
) {
  const rundenNamen: Record<number, string> = {
    128: "Letzte 128",
    64: "Letzte 64",
    32: "Letzte 32",
    16: "Achtelfinale",
    8: "Viertelfinale",
    4: "Halbfinale",
    2: "Finale",
  };
  const aktuell = turnier_baum.length || 128;
  const name = rundenNamen[aktuell] ?? `Runde ${aktuell}`;

  if (!hat_tourcard) return { name, first_to: 5, format: "legs" };

  const t = KALENDER[aktuelles_turnier_index];
  const format_typ = t.format ?? "legs";

  if (t.name === "Premier League Night") return { name, first_to: 6, format: "legs" };

  if (format_typ === "sets") {
    let first_to: number;
    if (aktuell >= 64) first_to = 3;
    else if (aktuell >= 16) first_to = 4;
    else if (aktuell >= 4) first_to = 5;
    else first_to = 7;
    return { name, first_to, format: "sets" };
  } else {
    let first_to: number;
    if (t.typ === "ProTour") {
      first_to = aktuell >= 8 ? 6 : aktuell === 4 ? 7 : 8;
    } else {
      first_to = aktuell >= 8 ? 10 : aktuell === 4 ? 13 : 18;
    }
    return { name, first_to, format: "legs" };
  }
}

function generiereGegner(career: any) {
  const { hat_tourcard, aktuelles_turnier_index, aktuelle_runde, turnier_baum: existingBaum } = career;
  let botRangliste = career.bot_rangliste as any[];
  let botForm = career.bot_form as Record<string, number>;

  if (aktuelle_runde > 0 && existingBaum.length > 0) {
    const idx = existingBaum.findIndex((p: any) => p.name === career.spieler_name);
    const oppIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
    const gegner = existingBaum[oppIdx];
    const tagesformFaktor = 0.9 + Math.random() * 0.2;
    return {
      gegner_name: gegner.name,
      gegner_avg: Math.round(gegner.avg * tagesformFaktor * 10) / 10,
      turnier_baum: existingBaum,
    };
  }

  let size: number;
  let pool: string[];

  if (!hat_tourcard) {
    size = 128;
    const shuffled = [...QSCHOOL_SPIELER, ...Array.from({ length: 127 }, (_, i) => `Amateur ${i + 1}`)];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    pool = shuffled.slice(0, 127);
  } else {
    const t = KALENDER[aktuelles_turnier_index];
    if (t.name === "World Matchplay" || t.name === "World Grand Prix") size = 32;
    else if (t.name === "Premier League Night") size = 8;
    else size = 128;

    const alleBots = [...botRangliste].sort((a, b) => b.geld - a.geld);
    if (size === 8) pool = alleBots.slice(0, 7).map((b) => b.name);
    else if (size === 32) pool = alleBots.slice(0, 31).map((b) => b.name);
    else pool = botRangliste.map((b: any) => b.name);

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    pool = pool.slice(0, size - 1);
  }

  const bots = pool.map((name) => ({ name, avg: getBotAvg(name, botRangliste, botForm) }));
  let turnier_baum = [{ name: career.spieler_name, avg: 0 }, ...bots];

  for (let i = turnier_baum.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [turnier_baum[i], turnier_baum[j]] = [turnier_baum[j], turnier_baum[i]];
  }

  const idx = turnier_baum.findIndex((p) => p.name === career.spieler_name);
  const oppIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
  const gegner = turnier_baum[oppIdx];
  const tagesformFaktor = 0.9 + Math.random() * 0.2;

  return {
    gegner_name: gegner.name,
    gegner_avg: Math.round(gegner.avg * tagesformFaktor * 10) / 10,
    turnier_baum,
  };
}

function generiereSchlagzeile(
  spielerName: string,
  turnier: string,
  runde: string,
  sieg: boolean,
  avg: number,
  sieger?: string
) {
  const choices = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  let titel: string;
  let text: string;

  if (sieg) {
    titel = choices([
      `🏆 SENSATION: ${spielerName} gewinnt ${turnier}!`,
      `🎯 Unaufhaltsam! ${spielerName} krönt sich zum Champion.`,
      `👑 Darts-Wahnsinn! Turniersieg für ${spielerName}!`,
    ]);
    text = `Was für ein Auftritt! Mit einem starken Average von ${avg} im Finale sichert sich ${spielerName} das Preisgeld und sendet eine Schockwelle durch die Order of Merit.`;
  } else {
    const siegerText = sieger ? ` Das Turnier gewann am Ende übrigens ${sieger}.` : "";
    if (["Letzte 128", "Letzte 64", "Runde 1", "Runde 2"].includes(runde)) {
      titel = choices([
        `🗞️ Enttäuschung pur: ${spielerName} scheitert früh bei ${turnier}.`,
        `📉 Koffer packen: Erst-Runden-Aus für ${spielerName}.`,
        `✈️ Kurzer Ausflug: ${turnier} endet nach schwachem Auftritt.`,
      ]);
      text = `Da war mehr drin. Nach dem frühen Aus in der Runde '${runde}' (Average: ${avg}) hagelt es Kritik von den Experten. Ab ans Practice Board!${siegerText}`;
    } else {
      titel = choices([
        `🗞️ Starker Run endet: ${spielerName} scheidet aus.`,
        `💔 Herzschlagfinale! ${spielerName} verpasst den Titel knapp.`,
        `🎯 Respektabler Auftritt, Endstation in ${runde}.`,
      ]);
      text = `Ein gutes Turnier nimmt ein bitteres Ende bei ${turnier}. Mit einem Average von ${avg} war heute einfach nicht mehr drin.${siegerText}`;
    }
  }
  return { titel, text };
}

function nextTurnier(career: any): { msgs: string[]; updates: any } {
  const msgs: string[] = [];
  const updates: any = {};

  let aktuelles_turnier_index = career.aktuelles_turnier_index;
  let saison_jahr = career.saison_jahr;
  const start = aktuelles_turnier_index;
  const platz = ermittlePlatz(career.bot_rangliste, career.spieler_name, career.order_of_merit_geld);

  while (true) {
    aktuelles_turnier_index = (aktuelles_turnier_index + 1) % KALENDER.length;
    if (aktuelles_turnier_index === 0) saison_jahr += 1;
    const n = KALENDER[aktuelles_turnier_index];
    if (!n.min_platz || platz <= n.min_platz || aktuelles_turnier_index === start) break;
  }

  updates.aktuelles_turnier_index = aktuelles_turnier_index;
  updates.saison_jahr = saison_jahr;

  const botForm: Record<string, number> = { ...career.bot_form };
  for (const bot in botForm) botForm[bot] *= 0.8;
  updates.bot_form = botForm;

  let aktiver_sponsor = career.aktiver_sponsor ? { ...career.aktiver_sponsor } : null;
  if (aktiver_sponsor) {
    aktiver_sponsor.turniere_zeit -= 1;
    if (aktiver_sponsor.turniere_zeit < 0) {
      msgs.push(`📉 Vertrag mit ${aktiver_sponsor.name} abgelaufen! Du hast das Ziel nicht geschafft.`);
      aktiver_sponsor = null;
    }
  }

  if (!aktiver_sponsor && career.hat_tourcard && Math.random() < 0.4) {
    const sponsoren = ["Winmau", "Target", "RedDragon", "Unicorn", "L-Style", "Paddy Power"];
    const ziele = [
      { typ: "180s", ziel: 10, belohnung: 2000, text: "Wirf zehn 180er" },
      { typ: "siege", ziel: 3, belohnung: 3500, text: "Gewinne 3 Matches" },
      { typ: "hf", ziel: 100, belohnung: 1500, text: "Checke 100+ (Highfinish)" },
    ];
    const ziel = ziele[Math.floor(Math.random() * ziele.length)];
    aktiver_sponsor = {
      name: sponsoren[Math.floor(Math.random() * sponsoren.length)],
      ziel_typ: ziel.typ,
      ziel_wert: ziel.ziel,
      aktuell: 0,
      turniere_zeit: 3,
      belohnung: ziel.belohnung,
      text: ziel.text,
    };
    msgs.push(`📝 Angebot von ${aktiver_sponsor.name}! Ziel: ${aktiver_sponsor.text} in den nächsten 3 Turnieren. Bonus: £${aktiver_sponsor.belohnung.toLocaleString()}`);
  }

  updates.aktiver_sponsor = aktiver_sponsor;
  return { msgs, updates };
}

export async function startMatch() {
  const career = await getOrCreateCareer();
  const msgs: string[] = [];
  const updates: any = {};

  if (career.hat_tourcard && career.aktuelle_runde === 0) {
    const t = KALENDER[career.aktuelles_turnier_index];
    let kosten = t.typ === "ProTour" ? 250 : 500;
    if (t.name === "Premier League Night") kosten = 0;
    updates.bank_konto = career.bank_konto - kosten;
    if (kosten > 0) msgs.push(`💸 Reise- & Startgebühren bezahlt: -£${kosten}`);
  }

  updates.letzte_schlagzeile = null;
  updates.turnier_laeuft = true;

  const { gegner_name, gegner_avg, turnier_baum } = generiereGegner({ ...career, ...updates });
  updates.gegner_name = gegner_name;
  updates.gegner_avg = gegner_avg;
  updates.turnier_baum = turnier_baum;

  await saveCareer(updates);
  return { career: await getOrCreateCareer(), messages: msgs };
}

export async function processResult(
  legs_won: number,
  legs_lost: number,
  my_avg: number,
  my_180s: number,
  my_hf: number,
  my_co_pct: number
) {
  const career = await getOrCreateCareer();
  const msgs: string[] = [];
  const updates: any = {};

  const win = legs_won > legs_lost;
  const gegner_name = career.gegner_name;

  updates.stats_spiele = career.stats_spiele + 1;
  updates.stats_legs_won = career.stats_legs_won + legs_won;
  updates.stats_legs_lost = career.stats_legs_lost + legs_lost;
  updates.stats_180s = career.stats_180s + my_180s;

  const avgHistory: number[] = [...(career.stats_avg_history as number[])];
  if (my_avg > 0) avgHistory.push(my_avg);
  updates.stats_avg_history = avgHistory;

  const coHistory: number[] = [...(career.stats_checkout_percent_history as number[])];
  if (my_co_pct > 0) coHistory.push(my_co_pct);
  updates.stats_checkout_percent_history = coHistory;

  if (my_hf > career.stats_highest_finish) updates.stats_highest_finish = my_hf;

  const h2h: Record<string, { siege: number; niederlagen: number }> = { ...(career.h2h as any) };
  if (!h2h[gegner_name]) h2h[gegner_name] = { siege: 0, niederlagen: 0 };
  if (win) h2h[gegner_name].siege += 1;
  else h2h[gegner_name].niederlagen += 1;
  updates.h2h = h2h;

  const turnier_baum = [...(career.turnier_baum as any[])];
  const botForm: Record<string, number> = { ...(career.bot_form as any) };

  const neuerBaum: any[] = [];
  for (let i = 0; i < turnier_baum.length; i += 2) {
    const bot1 = turnier_baum[i];
    const bot2 = turnier_baum[i + 1];
    if (bot1.name === career.spieler_name || bot2.name === career.spieler_name) {
      neuerBaum.push(win ? (bot1.name === career.spieler_name ? bot1 : bot2) : (bot1.name === career.spieler_name ? bot2 : bot1));
    } else {
      const a1 = bot1.avg * (0.9 + Math.random() * 0.2);
      const a2 = bot2.avg * (0.9 + Math.random() * 0.2);
      const c1 = Math.max(0.1, Math.min(0.9, 0.5 + (a1 - a2) * 0.02));
      const winner = Math.random() < c1 ? bot1 : bot2;
      const loser = winner === bot1 ? bot2 : bot1;
      neuerBaum.push(winner);
      botForm[winner.name] = Math.min(5, (botForm[winner.name] ?? 0) + 0.5);
      botForm[loser.name] = Math.max(-5, (botForm[loser.name] ?? 0) - 0.5);
    }
  }
  updates.turnier_baum = neuerBaum;
  updates.bot_form = botForm;

  msgs.push(`📊 Ergebnis eingetragen: ${legs_won} : ${legs_lost}`);

  let turnier_sieger: string | undefined;
  if (!win && career.hat_tourcard) {
    let sim_baum = [...neuerBaum];
    while (sim_baum.length > 1) {
      const next_b: any[] = [];
      for (let i = 0; i < sim_baum.length; i += 2) {
        const b1 = sim_baum[i];
        const b2 = sim_baum[i + 1];
        const c1 = Math.max(0.1, Math.min(0.9, 0.5 + (b1.avg - b2.avg) * 0.02));
        next_b.push(Math.random() < c1 ? b1 : b2);
      }
      sim_baum = next_b;
    }
    turnier_sieger = sim_baum[0]?.name;
  }

  let aktiver_sponsor = career.aktiver_sponsor ? { ...(career.aktiver_sponsor as any) } : null;
  if (aktiver_sponsor) {
    if (aktiver_sponsor.ziel_typ === "180s") aktiver_sponsor.aktuell += my_180s;
    else if (aktiver_sponsor.ziel_typ === "siege" && win) aktiver_sponsor.aktuell += 1;
    else if (aktiver_sponsor.ziel_typ === "hf" && my_hf >= aktiver_sponsor.ziel_wert)
      aktiver_sponsor.aktuell = aktiver_sponsor.ziel_wert;

    if (aktiver_sponsor.aktuell >= aktiver_sponsor.ziel_wert) {
      const bonus = aktiver_sponsor.belohnung;
      updates.bank_konto = (updates.bank_konto ?? career.bank_konto) + bonus;
      msgs.push(`🤝 ZIEL ERREICHT! ${aktiver_sponsor.name} zahlt dir deinen Sponsoren-Bonus von £${bonus.toLocaleString()}.`);
      aktiver_sponsor = null;
    }
    updates.aktiver_sponsor = aktiver_sponsor;
  }

  const achievements: any = { ...(career.achievements as any) };
  if (my_180s > 0 && !achievements.first_180?.unlocked) {
    achievements.first_180.unlocked = true;
    msgs.push("🎯 ONE HUNDRED AND EIGHTY! Deine erste 180 geworfen!");
  }
  if (my_hf >= 100 && !achievements.ton_finish?.unlocked) {
    achievements.ton_finish.unlocked = true;
    msgs.push("🎯 Ton Plus! Starkes High-Finish!");
  }
  if (my_hf >= 170 && !achievements.big_fish?.unlocked) {
    achievements.big_fish.unlocked = true;
    msgs.push("🎯 The Big Fish! Du hast die magische 170 gecheckt!");
  }

  if (win) {
    if (!achievements.first_win?.unlocked) {
      achievements.first_win.unlocked = true;
      msgs.push("⭐ Erstes Blut! Du hast dein allererstes Match gewonnen.");
    }
    updates.stats_siege = career.stats_siege + 1;

    if (!career.hat_tourcard) {
      const neue_punkte = career.q_school_punkte + 1;
      if (neue_punkte >= 5) {
        updates.hat_tourcard = true;
        achievements.tourcard.unlocked = true;
        msgs.push("🎯 Tourcard Gewonnen! Willkommen bei den Profis!");
        updates.turnier_laeuft = false;
        updates.aktuelle_runde = 0;
        updates.turnier_baum = [];
        updates.q_school_punkte = neue_punkte;
      } else {
        updates.q_school_punkte = neue_punkte;
        updates.aktuelle_runde = career.aktuelle_runde + 1;
        const { gegner_name, gegner_avg, turnier_baum: newBaum } = generiereGegner({
          ...career,
          ...updates,
          turnier_baum: neuerBaum,
        });
        updates.gegner_name = gegner_name;
        updates.gegner_avg = gegner_avg;
        updates.turnier_baum = newBaum;
      }
    } else {
      updates.aktuelle_runde = career.aktuelle_runde + 1;
      const t = KALENDER[career.aktuelles_turnier_index];

      if (neuerBaum.length === 1) {
        const geld = t.typ === "ProTour" ? 15000 : 150000;
        updates.order_of_merit_geld = career.order_of_merit_geld + geld;
        updates.bank_konto = (updates.bank_konto ?? career.bank_konto) + geld;
        updates.letzte_schlagzeile = generiereSchlagzeile(career.spieler_name, t.name, "Finale", true, my_avg);
        if (!achievements.first_title?.unlocked) {
          achievements.first_title.unlocked = true;
          msgs.push("⭐ Silberzeug! Du hast dein erstes Turnier gewonnen.");
        }
        msgs.push(`🏆 TURNIERSIEG! ${t.name} gewonnen! Preisgeld: £${geld.toLocaleString()}`);
        updates.turnier_laeuft = false;
        updates.aktuelle_runde = 0;
        updates.turnier_baum = [];
        const { msgs: nextMsgs, updates: nextUpdates } = nextTurnier({ ...career, ...updates });
        msgs.push(...nextMsgs);
        Object.assign(updates, nextUpdates);
      } else {
        const { gegner_name, gegner_avg, turnier_baum: newBaum } = generiereGegner({
          ...career,
          ...updates,
          turnier_baum: neuerBaum,
        });
        updates.gegner_name = gegner_name;
        updates.gegner_avg = gegner_avg;
        updates.turnier_baum = newBaum;
      }
    }
  } else {
    if (career.hat_tourcard) {
      const trostGeld = career.aktuelle_runde * 1000;
      updates.order_of_merit_geld = career.order_of_merit_geld + trostGeld;
      updates.bank_konto = (updates.bank_konto ?? career.bank_konto) + trostGeld;
      msgs.push(`❌ Ausgeschieden. Preisgeld gesichert: £${trostGeld.toLocaleString()}`);
      const rundenName = getRundenInfo(neuerBaum, true, career.aktuelles_turnier_index).name;
      const t = KALENDER[career.aktuelles_turnier_index];
      updates.letzte_schlagzeile = generiereSchlagzeile(career.spieler_name, t.name, rundenName, false, my_avg, turnier_sieger);
    } else {
      msgs.push("❌ Niederlage. Q-School Tag beendet.");
    }
    updates.turnier_laeuft = false;
    updates.aktuelle_runde = 0;
    updates.turnier_baum = [];
    if (career.hat_tourcard) {
      const { msgs: nextMsgs, updates: nextUpdates } = nextTurnier({ ...career, ...updates });
      msgs.push(...nextMsgs);
      Object.assign(updates, nextUpdates);
    }
  }

  const platz = ermittlePlatz(career.bot_rangliste as any[], career.spieler_name, updates.order_of_merit_geld ?? career.order_of_merit_geld);
  if (platz <= 64 && !achievements.top64?.unlocked) {
    achievements.top64.unlocked = true;
    msgs.push("⭐ Achievement: Etabliert! Du bist in den Top 64!");
  }
  if (platz <= 16 && !achievements.top16?.unlocked) {
    achievements.top16.unlocked = true;
    msgs.push("⭐ Achievement: Elite! Du bist in den Top 16!");
  }
  updates.achievements = achievements;

  await saveCareer(updates);
  return { career: await getOrCreateCareer(), messages: msgs };
}

export function buildCareerState(career: any) {
  const platz = ermittlePlatz(career.bot_rangliste, career.spieler_name, career.order_of_merit_geld);
  const turnier_name = career.hat_tourcard
    ? KALENDER[career.aktuelles_turnier_index].name
    : `Q-School (Siege: ${career.q_school_punkte}/5)`;

  const avgHistory: number[] = career.stats_avg_history ?? [];
  const coHistory: number[] = career.stats_checkout_percent_history ?? [];
  const quote = career.stats_spiele > 0 ? Math.round((career.stats_siege / career.stats_spiele) * 1000) / 10 : 0;
  const gesamt_avg = avgHistory.length > 0 ? Math.round((avgHistory.reduce((a, b) => a + b, 0) / avgHistory.length) * 100) / 100 : 0;
  const gesamt_co = coHistory.length > 0 ? Math.round((coHistory.reduce((a, b) => a + b, 0) / coHistory.length) * 100) / 100 : 0;

  const alle = [...(career.bot_rangliste as any[]), { name: career.spieler_name, geld: career.order_of_merit_geld }].sort(
    (a, b) => b.geld - a.geld
  );
  const oom = alle.slice(0, 10);

  const turnier_baum = career.turnier_baum as any[];
  const matchups: Array<{ player1: string; player2: string }> = [];
  for (let i = 0; i < turnier_baum.length; i += 2) {
    if (i + 1 < turnier_baum.length) {
      matchups.push({ player1: turnier_baum[i].name, player2: turnier_baum[i + 1].name });
    }
  }

  const h2h: Record<string, { siege: number; niederlagen: number }> = career.h2h ?? {};
  const h2hStats = h2h[career.gegner_name] ?? { siege: 0, niederlagen: 0 };

  const runden_info = getRundenInfo(turnier_baum, career.hat_tourcard, career.aktuelles_turnier_index);

  const walk_on_video = WALK_ON_VIDEOS[career.gegner_name] ?? null;

  return {
    spieler_name: career.spieler_name,
    hat_tourcard: career.hat_tourcard,
    q_school_punkte: career.q_school_punkte,
    order_of_merit_geld: career.order_of_merit_geld,
    bank_konto: career.bank_konto,
    saison_jahr: career.saison_jahr,
    turnier_laeuft: career.turnier_laeuft,
    aktuelle_runde: career.aktuelle_runde,
    gegner_name: career.gegner_name,
    gegner_avg: career.gegner_avg,
    stats_spiele: career.stats_spiele,
    stats_siege: career.stats_siege,
    stats_legs_won: career.stats_legs_won,
    stats_legs_lost: career.stats_legs_lost,
    stats_180s: career.stats_180s,
    stats_highest_finish: career.stats_highest_finish,
    achievements: career.achievements,
    aktiver_sponsor: career.aktiver_sponsor,
    letzte_schlagzeile: career.letzte_schlagzeile,
    platz,
    turnier_name,
    quote,
    gesamt_avg,
    gesamt_co,
    oom,
    runden_info,
    matchups,
    h2h_siege: h2hStats.siege,
    h2h_niederlagen: h2hStats.niederlagen,
    walk_on_video,
  };
}

const AUTODARTS_API_URL = "https://api.autodarts.io/as/v0/matches/filter?size=10&page=0&sort=-finished_at";
const AUTODARTS_BEARER_TOKEN = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkTmtvV253VjRRZEpTTlF2a1FGTTEyMm1RUU8zdVJ0R0ZHX3NwUUtwWUpZIn0.eyJleHAiOjE3NzQ2OTMwMDQsImlhdCI6MTc3NDY5MjcwNCwiYXV0aF90aW1lIjoxNzc0NjgyODM2LCJqdGkiOiI1MzkzMWY4Yi1lMzNkLTQ3YzUtOTMzZS1mNjQxZDVlM2JlZTIiLCJpc3MiOiJodHRwczovL2xvZ2luLmF1dG9kYXJ0cy5pby9yZWFsbXMvYXV0b2RhcnRzIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjFkNWI4MzEwLTA2MDMtNGM4YS1hOWMzLWM2YmI5ZmQ3ZWU0MSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImF1dG9kYXJ0cy1wbGF5Iiwibm9uY2UiOiI3OGQ3YTNkOS00NTM5LTRhYjEtYTk4YS02NGJjYjAyOWNkNzAiLCJzZXNzaW9uX3N0YXRlIjoiMjFhM2ZiZTAtY2ZiNi00MzQxLWE3ZjAtMTk4ODJjMTJlOGQwIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyJodHRwczovL2F1dG9kYXJ0cy5pbyIsImh0dHBzOi8vcGxheS5hdXRvZGFydHMuaW8iXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtYXV0b2RhcnRzIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJzaWQiOiIyMWEzZmJlMC1jZmI2LTQzNDEtYTdmMC0xOTg4MmMxMmU4ZDAiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IkRlbm5pcyBTbWFycmEiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzbWFycmFkaW5obyIsImdpdmVuX25hbWUiOiJEZW5uaXMiLCJmYW1pbHlfbmFtZSI6IlNtYXJyYSIsImVtYWlsIjoiZC5zbWFycmFAZ29vZ2xlbWFpbC5jb20ifQ.zELEPyAcNWIgB1QTE7HOxs-ycFbXwoDj5EjYyJvntUYmE1HZUV8sNIO1s7cNmDkNsme9Ft2GOvCgIGRl2QaHhXStBFPnnjky5HI4qyUWNKh0t438U2Yi5L6uHyyQDpYvi_wYt8aekpMPOt3BZaxeOobga74TETcLaZPSV8rblqr4OMVYPDBTt7an74TpKbf0ADNJ9L5QHzo6TRSwYvPo8ksXdSs43bbdu0yuuGZGDI2q3nim2GT9SnpQL4-1hR646lrM_OeC4_fTKOGAsCrzuJ8esvvK4SHZ5YtawM1YEird4Kai8JdfYD_6QcAVjNg_SJzT4xyxPUKVd-Oo5pYV-g";

export async function pullFromAutodarts() {
  const career = await getOrCreateCareer();
  const msgs: string[] = [];

  try {
    const response = await fetch(AUTODARTS_API_URL, {
      headers: { Authorization: AUTODARTS_BEARER_TOKEN, Accept: "application/json" },
    });

    if (!response.ok) {
      return { career: buildCareerState(career), messages: [`❌ Verbindungsfehler zu Autodarts (Code ${response.status}). Token abgelaufen?`] };
    }

    const data = await response.json();
    let matches: any[];
    if (Array.isArray(data)) matches = data;
    else if (data.items) matches = data.items;
    else if (data.matches) matches = data.matches;
    else matches = [];

    if (!matches.length) {
      return { career: buildCareerState(career), messages: ["❌ Keine Matches im Autodarts-Profil gefunden."] };
    }

    const letztes_match = matches[0];
    const players = letztes_match.players ?? [];
    let spieler_daten: any = null;
    let gegner_daten: any = null;

    for (const p of players) {
      if (p.name?.toLowerCase() === career.spieler_name.toLowerCase()) spieler_daten = p;
      else gegner_daten = p;
    }

    if (spieler_daten && gegner_daten) {
      const stats = spieler_daten.stats ?? {};
      const legs_won = spieler_daten.legs ?? 0;
      const legs_lost = gegner_daten.legs ?? 0;
      const my_avg = parseFloat(stats.average ?? 0);
      const my_180s = parseInt(stats["180s"] ?? 0);
      const my_hf = parseInt(stats.highestFinish ?? 0);
      const my_co_pct = parseFloat(stats.checkoutPercentage ?? 0);

      const result = await processResult(legs_won, legs_lost, my_avg, my_180s, my_hf, my_co_pct);
      result.messages.push("✅ Daten erfolgreich von Autodarts importiert!");
      return result;
    } else {
      return { career: buildCareerState(career), messages: ["❌ Dein Spielername wurde im letzten Match nicht gefunden."] };
    }
  } catch (e: any) {
    return { career: buildCareerState(career), messages: [`Fehler beim Abrufen der Daten: ${e.message}`] };
  }
}

export async function resetCareer() {
  await db.delete(careerTable).where(eq(careerTable.id, 1));
  const career = await getOrCreateCareer();
  return { career: buildCareerState(career), messages: ["🔄 Karriere wurde zurückgesetzt!"] };
}
