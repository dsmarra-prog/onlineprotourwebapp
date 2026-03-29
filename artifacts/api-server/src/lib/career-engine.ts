import { db, careerTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const WALK_ON_VIDEOS: Record<string, string> = {
  "Michael van Gerwen": "zaJ1AC4wT3Y",
  "Gerwyn Price": "HbDDzJvGguc",
  "Luke Littler": "I66tENw1feA",
  "Luke Humphries": "x9bHvQc_VnU",
  "Michael Smith": "kLKK21m9tOo",
  "Peter Wright": "HSTa28UTMUQ",
  "Gary Anderson": "MWkDjHrMjvI",
  "Jonny Clayton": "zFBkl4Y3cdo",
  "Jose de Sousa": "fOJQiHKbFRU",
  "Rob Cross": "g9sWxBF-78M",
  "Dimitri Van den Bergh": "t6_rVl63CXQ",
  "Nathan Aspinall": "V7aeO3EFMHE",
  "Damon Heta": "CmXOuX5dM34",
  "Raymond van Barneveld": "mVRHGVpbYgQ",
  "James Wade": "nPXyHv5Lvfc",
  "Mensur Suljovic": "hY7mK9cXZdA",
};

export const KALENDER = [
  // Q1 – Players Championships
  { name: "Players Championship 1", typ: "ProTour", format: "legs" },
  { name: "Players Championship 2", typ: "ProTour", format: "legs" },
  { name: "Players Championship 3", typ: "ProTour", format: "legs" },
  // UK Open (Major)
  { name: "UK Open", typ: "Major", min_platz: 128, format: "legs" },
  // Q2 – Players Championships
  { name: "Players Championship 4", typ: "ProTour", format: "legs" },
  { name: "Players Championship 5", typ: "ProTour", format: "legs" },
  { name: "Players Championship 6", typ: "ProTour", format: "legs" },
  // European Tour
  { name: "European Tour 1", typ: "EuropeanTour", min_platz: 64, format: "legs" },
  { name: "European Tour 2", typ: "EuropeanTour", min_platz: 64, format: "legs" },
  // Premier League
  { name: "Premier League Night", typ: "PremierLeague", min_platz: 8, format: "legs" },
  // Q3 – Players Championships
  { name: "Players Championship 7", typ: "ProTour", format: "legs" },
  { name: "Players Championship 8", typ: "ProTour", format: "legs" },
  { name: "Players Championship 9", typ: "ProTour", format: "legs" },
  // US Masters / World Series
  { name: "US Masters", typ: "WorldSeries", min_platz: 32, format: "legs" },
  // European Tour
  { name: "European Tour 3", typ: "EuropeanTour", min_platz: 64, format: "legs" },
  { name: "European Tour 4", typ: "EuropeanTour", min_platz: 64, format: "legs" },
  // Q4 – Players Championships
  { name: "Players Championship 10", typ: "ProTour", format: "legs" },
  { name: "Players Championship 11", typ: "ProTour", format: "legs" },
  { name: "Players Championship 12", typ: "ProTour", format: "legs" },
  // World Matchplay (Major)
  { name: "World Matchplay", typ: "Major", min_platz: 16, format: "legs" },
  // Q5 – Players Championships
  { name: "Players Championship 13", typ: "ProTour", format: "legs" },
  { name: "Players Championship 14", typ: "ProTour", format: "legs" },
  // European Tour
  { name: "European Tour 5", typ: "EuropeanTour", min_platz: 64, format: "legs" },
  { name: "European Tour 6", typ: "EuropeanTour", min_platz: 64, format: "legs" },
  // Brisbane Masters / World Series
  { name: "Brisbane Masters", typ: "WorldSeries", min_platz: 32, format: "legs" },
  // Q6 – Players Championships
  { name: "Players Championship 15", typ: "ProTour", format: "legs" },
  { name: "Players Championship 16", typ: "ProTour", format: "legs" },
  // World Grand Prix (Major) – Double-In / Double-Out
  { name: "World Grand Prix", typ: "Major", min_platz: 32, format: "sets", modus: "double_in_out" },
  // Q7 – Players Championships
  { name: "Players Championship 17", typ: "ProTour", format: "legs" },
  { name: "Players Championship 18", typ: "ProTour", format: "legs" },
  // European Championship
  { name: "European Championship", typ: "Major", min_platz: 24, format: "sets" },
  // Q8 – Players Championships
  { name: "Players Championship 19", typ: "ProTour", format: "legs" },
  { name: "Players Championship 20", typ: "ProTour", format: "legs" },
  // Grand Slam of Darts (Major) – Gruppenphase + Knockout
  { name: "Grand Slam of Darts", typ: "Major", min_platz: 16, format: "sets", gruppenphase: true },
  // Q9 – Players Championships
  { name: "Players Championship 21", typ: "ProTour", format: "legs" },
  { name: "Players Championship 22", typ: "ProTour", format: "legs" },
  // Players Championship Finals (Major)
  { name: "Players Championship Finals", typ: "Major", min_platz: 64, format: "legs" },
  // PDC World Championship (Major, Season finale)
  { name: "PDC World Championship", typ: "Major", min_platz: 96, format: "sets" },
];

const PRIZE_MONEY: Record<string, { win: number; rd_exit: (round: number) => number }> = {
  ProTour: { win: 15000, rd_exit: (r) => r * 500 },
  Major: { win: 150000, rd_exit: (r) => r * 5000 },
  EuropeanTour: { win: 25000, rd_exit: (r) => r * 1000 },
  WorldSeries: { win: 40000, rd_exit: (r) => r * 1500 },
  PremierLeague: { win: 35000, rd_exit: () => 5000 },
};

// Premier League – Preisgeld nach Platzierung (4 Spieler)
const PL_PRIZE_POSITIONS = [35000, 20000, 10000, 5000];

const DEFAULT_ACHIEVEMENTS = {
  first_win: { name: "Erstes Blut", desc: "Gewinne dein allererstes Match.", unlocked: false },
  tourcard: { name: "Profi-Status", desc: "Sichere dir die PDC Tourcard.", unlocked: false },
  first_title: { name: "Silberzeug!", desc: "Gewinne dein erstes Turnier.", unlocked: false },
  top64: { name: "Etabliert", desc: "Erreiche die Top 64 der Welt.", unlocked: false },
  top16: { name: "Elite", desc: "Erreiche die Top 16 der Welt.", unlocked: false },
  top8: { name: "World Class", desc: "Erreiche die Top 8 der Welt.", unlocked: false },
  first_180: { name: "Maximum!", desc: "Wirf deine erste 180 im Match.", unlocked: false },
  ton_finish: { name: "Ton Plus", desc: "Checke ein Finish von 100 oder höher.", unlocked: false },
  big_fish: { name: "The Big Fish", desc: "Checke die magische 170.", unlocked: false },
  first_major: { name: "Major Champion", desc: "Gewinne dein erstes Major-Turnier.", unlocked: false },
  century_180s: { name: "180 Maschine", desc: "Wirf insgesamt 100 Maximums.", unlocked: false },
  millionaire: { name: "Millionär", desc: "Verdiene £1.000.000 auf der Order of Merit.", unlocked: false },
};

// Realistic Q-School / regional tour player name pool (~200 names)
const BOT_NAME_POOL = [
  // English
  "Phil Morton", "Dave Richardson", "Mark Taylor", "Steve Cooper", "Paul Watson",
  "Andy Fletcher", "Lee Morris", "Wayne Davies", "Chris Bennett", "Gary White",
  "Ian Clarke", "Colin Evans", "Terry Shaw", "Roger Watts", "Mick Turner",
  "Alan Crawford", "Tony Hayes", "Ray Burton", "Dennis Roberts", "Jack Fletcher",
  "Tom Morris", "Ben Watson", "Will Parker", "Sam Clarke", "Chris Foster",
  "Neil White", "Carl Davies", "Brian Robertson", "Stuart Harris", "Frank Kemp",
  "Fred Parkin", "Charlie Keane", "Sid Coleman", "Jack Barton", "Bert Lawson",
  "Ron Fowler", "Norman Perkins", "Reg Chambers", "Alf Preston", "Pete Harper",
  "Geoff Sutton", "Len Bowden", "Vic Frost", "Walt Dawson", "Ernie Walters",
  "Roy Simmons", "Ken Griffiths", "Harry Bowen", "Don Fletcher", "Cliff Reed",
  "Dean Baines", "Lee Garner", "Scott Palmer", "Paul Houghton", "Mark Sutton",
  "Kevin Walsh", "Rob Pearce", "Adam Gray", "Jason Tate", "Danny Bolton",
  "Ricky Gibson", "Peter Stone", "Simon Barker", "Neil Turner", "Craig Thornton",
  "Tom Bradley", "David Fenton", "Luke Cairns", "Jamie Prescott", "Kyle Henderson",
  "Liam Wright", "Brandon Hughes", "Tyler Reed", "Jake Coleman", "Connor Sutton",
  "Riley Chapman", "Callum Foster", "Ethan Barker", "Joshua Morris", "Ryan Bolton",
  // Scottish
  "Alasdair Reid", "Callum Shaw", "Douglas Grant", "Hamish Murray", "Ian Campbell",
  "Ross McAllister", "Gordon McDougall", "Angus Fraser", "Duncan MacGregor", "Craig Kerr",
  // Welsh
  "Rhys Davies", "Owen Hughes", "Gareth Evans", "Liam Thomas", "Ieuan Roberts",
  "Dylan Price", "Bryn Edwards", "Emlyn Rees", "Alun Morgan", "Huw Jenkins",
  // Irish
  "Seamus Gallagher", "Patrick Cunningham", "Declan Murphy", "Shane O'Brien", "Conor Kelly",
  "Danny Flanagan", "Liam Brady", "Kevin Ryan", "Mark Collins", "Brian Casey",
  // Dutch / Belgian
  "Pieter Bakker", "Lars de Boer", "Sander Visser", "Tom van Dijk", "Roel Hoekstra",
  "Joost Peters", "Erik van der Berg", "Nico Janssen", "Paul de Vries", "Kees Smit",
  "Stefan Claes", "Thomas Dubois", "Nicolas Denis", "Bart Leclercq", "Kevin Lefevre",
  "Arjan Tol", "Bas Dijkstra", "Daan Vink", "Floris Mulder", "Geert Vermeer",
  // German / Austrian / Swiss
  "Klaus Müller", "Dieter Weber", "Hans Zimmermann", "Wolfgang Lehmann", "Uwe Fischer",
  "Stefan Becker", "Tobias Wagner", "Patrick Hofmann", "Andreas Schulze", "Marcel Hartmann",
  "Ralf Brandt", "Jens Kuhn", "Bernd Vogt", "Christian Lang", "Michael Gross",
  "Markus Haas", "Oliver Braun", "Thomas Richter", "Simon Schwarz", "Lukas Weiß",
  // Nordic (Swedish / Danish / Norwegian / Finnish)
  "Erik Lindqvist", "Magnus Bjornsen", "Anders Holm", "Jonas Eriksson", "Carl Pedersen",
  "Mikael Strand", "Lars Nygaard", "Henrik Lund", "Tobias Dahl", "Sven Osterberg",
  "Pekka Virtanen", "Timo Korhonen", "Jari Leinonen", "Heikki Mäkinen", "Kari Hakala",
  // Polish / Czech / Slovak
  "Radoslav Kral", "Jakub Svoboda", "Tomasz Kowalski", "Martin Novak", "Patrik Blaha",
  "Lukas Polak", "Roman Cerny", "Marek Horak", "Ondrej Blazek", "Viktor Havlicek",
  // Australian / New Zealand
  "Ben Sullivan", "Jake Murray", "Tyler Ross", "Codie Henderson", "Kieran Carter",
  "Bryce Mitchell", "Shane Cooper", "Dylan Hamilton", "Lachlan Andrews", "Blake Phillips",
  "Zach Cameron", "Cody Pearce", "Nathan Walsh", "Josh Sutton", "Matt Lawson",
  // Canadian / American
  "Kyle Cooper", "Ryan Morris", "Tyler Crawford", "Brent Sullivan", "Chase Henderson",
  "Aaron Brooks", "Jordan Stone", "Brett Andrews", "Travis Coleman", "Derek Walsh",
  // Spanish / Portuguese
  "Carlos Ruiz", "Fernando Sousa", "Miguel Torres", "Pedro Silva", "Rafael Gomez",
  "Antonio Ferreira", "Manuel Correia", "Jorge Alves", "Luis Carvalho", "Ricardo Santos",
];

const QSCHOOL_SPIELER = [
  "Fallon Sherrock", "Max Hopp", "John Henderson", "Corey Cadby",
  "Darius Labanauskas", "Martin Schindler", "Ted Evetts", "Keane Barry",
];

export const EQUIPMENT_CATALOG = [
  {
    id: "darts_pro",
    name: "Pro Darts (24g Wolfram)",
    beschreibung: "+1.5 Average durch bessere Balance",
    preis: 800,
    kategorie: "Darts",
    bonus_typ: "avg",
    bonus_wert: 1.5,
  },
  {
    id: "darts_premium",
    name: "Premium Darts (26g Tungsten)",
    beschreibung: "+3.0 Average, Top-of-the-line Darts",
    preis: 2500,
    kategorie: "Darts",
    bonus_typ: "avg",
    bonus_wert: 3.0,
  },
  {
    id: "flights_pro",
    name: "Pro Flights (Kite-Shape)",
    beschreibung: "+0.5% Doppelquote durch stabilen Flug",
    preis: 200,
    kategorie: "Flights",
    bonus_typ: "checkout",
    bonus_wert: 0.5,
  },
  {
    id: "flights_premium",
    name: "Shape Flights (Custom-Cut)",
    beschreibung: "+1.5% Doppelquote",
    preis: 600,
    kategorie: "Flights",
    bonus_typ: "checkout",
    bonus_wert: 1.5,
  },
  {
    id: "shaft_pro",
    name: "Carbon Shafts",
    beschreibung: "+1.0 Average, keine Deflections",
    preis: 500,
    kategorie: "Shafts",
    bonus_typ: "avg",
    bonus_wert: 1.0,
  },
  {
    id: "board_gran",
    name: "Gran Board Pro",
    beschreibung: "+1.0% Doppelquote durch besseres Practice",
    preis: 1200,
    kategorie: "Board",
    bonus_typ: "checkout",
    bonus_wert: 1.0,
  },
  {
    id: "board_winmau",
    name: "Winmau Blade 6 Board",
    beschreibung: "+2.0 Average durch optimales Training",
    preis: 2000,
    kategorie: "Board",
    bonus_typ: "avg",
    bonus_wert: 2.0,
  },
  {
    id: "shirt_sponsor",
    name: "Sponsor-Shirt",
    beschreibung: "+£500 Startgeld pro Turnier (passiv)",
    preis: 3000,
    kategorie: "Kleidung",
    bonus_typ: "startgeld",
    bonus_wert: 500,
  },
  {
    id: "coaching",
    name: "Elite-Coaching (1 Saison)",
    beschreibung: "+2.0 Average und +1.0% Doppelquote",
    preis: 5000,
    kategorie: "Training",
    bonus_typ: "coaching",
    bonus_wert: 2.0,
  },
];

function buildDefaultBotRangliste() {
  return [
    { name: "Luke Humphries", geld: 1400000 },
    { name: "Michael van Gerwen", geld: 1000000 },
    { name: "Michael Smith", geld: 850000 },
    { name: "Gerwyn Price", geld: 650000 },
    { name: "Nathan Aspinall", geld: 500000 },
    { name: "Luke Littler", geld: 450000 },
    { name: "Rob Cross", geld: 380000 },
    { name: "Damon Heta", geld: 320000 },
    { name: "Dimitri Van den Bergh", geld: 280000 },
    { name: "Peter Wright", geld: 250000 },
    { name: "Danny Noppert", geld: 220000 },
    { name: "Chris Dobey", geld: 200000 },
    { name: "Jose de Sousa", geld: 185000 },
    { name: "Jonny Clayton", geld: 170000 },
    { name: "Gary Anderson", geld: 160000 },
    { name: "Brendan Dolan", geld: 150000 },
    { name: "Andrew Gilding", geld: 140000 },
    { name: "Callan Rydz", geld: 130000 },
    { name: "Mike De Decker", geld: 122000 },
    { name: "Dirk van Duijvenbode", geld: 115000 },
    { name: "Martin Schindler", geld: 108000 },
    { name: "Josh Rock", geld: 102000 },
    { name: "Jermaine Wattimena", geld: 96000 },
    { name: "Ryan Joyce", geld: 91000 },
    { name: "Joe Cullen", geld: 86000 },
    { name: "Ryan Searle", geld: 81000 },
    { name: "Raymond van Barneveld", geld: 77000 },
    { name: "John Henderson", geld: 73000 },
    { name: "Krzysztof Ratajski", geld: 69000 },
    { name: "Dave Chisnall", geld: 65000 },
    { name: "Mensur Suljovic", geld: 62000 },
    { name: "James Wade", geld: 59000 },
    { name: "Kim Huybrechts", geld: 56000 },
    { name: "Daryl Gurney", geld: 53000 },
    { name: "Scott Williams", geld: 50000 },
    { name: "Jim Williams", geld: 48000 },
    { name: "Jeffrey de Graaf", geld: 46000 },
    { name: "Mickey Mansell", geld: 44000 },
    { name: "Karel Sedlacek", geld: 42000 },
    { name: "Stephen Bunting", geld: 40000 },
    { name: "Ricky Evans", geld: 38000 },
    { name: "Kevin Doets", geld: 36000 },
    { name: "Florian Hempel", geld: 34000 },
    { name: "Gian van Veen", geld: 32000 },
    { name: "Ritchie Edhouse", geld: 30500 },
    { name: "Connor Scutt", geld: 29000 },
    { name: "Danny van Trijp", geld: 27500 },
    { name: "Paolo Nebrida", geld: 26000 },
    { name: "William O'Connor", geld: 25000 },
    { name: "Wessel Nijman", geld: 24000 },
    { name: "Ricardo Pietreczko", geld: 23000 },
    { name: "Matt Campbell", geld: 22000 },
    { name: "Madars Razma", geld: 21000 },
    { name: "Bradley Brooks", geld: 20000 },
    { name: "Luke Woodhouse", geld: 19200 },
    { name: "Gordon Mathers", geld: 18400 },
    { name: "Niels Zonneveld", geld: 17600 },
    { name: "Boris Krcmar", geld: 16800 },
    { name: "Rowby-John Rodriguez", geld: 16000 },
    { name: "Keane Barry", geld: 15200 },
    { name: "Ted Evetts", geld: 14500 },
    { name: "Ross Smith", geld: 13800 },
    { name: "Gary Robson", geld: 13100 },
    { name: "Martin Atkins", geld: 12400 },
    { name: "Mark Webster", geld: 11800 },
    { name: "Andy Boulton", geld: 11200 },
    { name: "Paul Hogan", geld: 10700 },
    { name: "Andy Hamilton", geld: 10200 },
    { name: "Adrian Lewis", geld: 9700 },
    { name: "Terry Jenkins", geld: 9200 },
    { name: "Dean Winstanley", geld: 8800 },
    { name: "Colin Osborne", geld: 8400 },
    { name: "Scott Waites", geld: 8000 },
    { name: "Kevin Painter", geld: 7700 },
    { name: "Paul Nicholson", geld: 7400 },
    { name: "Andy Smith", geld: 7100 },
    { name: "Noa-Lynn van Leuwen", geld: 6800 },
    { name: "Fallon Sherrock", geld: 6500 },
    { name: "Beau Greaves", geld: 6200 },
    { name: "Glen Durrant", geld: 5900 },
    { name: "Steve Beaton", geld: 5700 },
    { name: "Mervyn King", geld: 5500 },
    { name: "Tony O'Shea", geld: 5300 },
    { name: "Max Hopp", geld: 5100 },
    { name: "Corey Cadby", geld: 4900 },
    { name: "Darius Labanauskas", geld: 4700 },
    { name: "Ian White", geld: 4500 },
    { name: "Steve West", geld: 4300 },
    { name: "Jamie Caven", geld: 4100 },
    { name: "Robbie Green", geld: 3900 },
    { name: "Wayne Mardle", geld: 3800 },
    { name: "Kirk Shepherd", geld: 3700 },
    { name: "Chris Mason", geld: 3600 },
    { name: "Paul Lim", geld: 3500 },
    { name: "Wayne Jones", geld: 3400 },
    { name: "Colin Lloyd", geld: 3300 },
    { name: "Mark Dudbridge", geld: 3200 },
    { name: "Diogo Portela", geld: 3100 },
    { name: "Jason Lowe", geld: 3000 },
    { name: "John Michael", geld: 2900 },
    { name: "Lee Cocks", geld: 2800 },
    { name: "Darryl Pilgrim", geld: 2700 },
    { name: "Stuart Kellett", geld: 2600 },
    { name: "Richie Corner", geld: 2500 },
    { name: "Harry Ward", geld: 2400 },
    { name: "Tony Martin", geld: 2300 },
    { name: "Rob Hewson", geld: 2200 },
    { name: "Chris Quantock", geld: 2100 },
    { name: "Steve Douglas", geld: 2000 },
    { name: "Marko Kantele", geld: 1900 },
    { name: "Toni Alcinas", geld: 1800 },
    { name: "Alan Warriner", geld: 1700 },
    { name: "John Bowles", geld: 1600 },
    { name: "Paul Harvey", geld: 1550 },
    { name: "Martin Phillips", geld: 1500 },
    { name: "Joe Davis", geld: 1450 },
    { name: "David Pallett", geld: 1400 },
    { name: "Matt Edgar", geld: 1350 },
    { name: "Simon Preston", geld: 1300 },
    { name: "Ciaran Teehan", geld: 1250 },
    { name: "Mike Warburton", geld: 1200 },
    { name: "Carl Wilkins", geld: 1150 },
    { name: "Danny Baggish", geld: 1100 },
    { name: "Dean Rock", geld: 1050 },
    { name: "Mark McGeeney", geld: 1000 },
    { name: "Gary Stone", geld: 950 },
    { name: "Ian White", geld: 900 },
  ];
}

export async function getOrCreateCareer() {
  const rows = await db.select().from(careerTable).where(eq(careerTable.id, 1));
  if (rows.length > 0) return rows[0];

  const defaultBots = buildDefaultBotRangliste();
  const inserted = await db
    .insert(careerTable)
    .values({
      id: 1,
      spieler_name: "Spieler",
      name_set: false,
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
      turnier_verlauf: [],
      ranking_verlauf: [],
      equipment: [],
      avg_bonus: 0,
      checkout_bonus: 0,
      saison_avg_history: [],
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

// Autodarts bot level average ranges — matches the official Autodarts 11-level PPR chart
// Level 1 = PPR ~20, Level 11 = PPR ~120
const AUTODARTS_LEVEL_RANGES: Record<number, [number, number]> = {
  1:  [15,  25],
  2:  [25,  35],
  3:  [35,  45],
  4:  [45,  55],
  5:  [55,  65],
  6:  [65,  75],
  7:  [75,  85],
  8:  [85,  95],
  9:  [95, 105],
  10: [105, 115],
  11: [115, 125],
};

export function avgToAutodartsBotLevel(avg: number): number {
  // Level 1 = PPR ~20, each level ~10 PPR apart; level = round(avg/10) - 1
  return Math.max(1, Math.min(11, Math.round(avg / 10) - 1));
}

function getBotAvg(name: string, botRangliste: any[], botForm: Record<string, number>, spielerAvg: number = 60) {
  const sorted = [...botRangliste].sort((a, b) => b.geld - a.geld);
  const formBonus = botForm[name] ?? 0;
  const rank = sorted.findIndex((b) => b.name === name);
  const total = sorted.length || 127;

  // All bot averages are anchored to the player's own average.
  // Top bots are ~20 pts above; bottom bots are ~20 pts below.
  // This ensures the player always has a realistic path to the top
  // regardless of their absolute average level.
  let offset: number;
  if (rank < 0) {
    offset = rand(-5, 5);                       // unknown bot ≈ player level
  } else if (rank < 8) {
    offset = rand(18, 25);                      // top 8: clearly stronger
  } else if (rank < 16) {
    offset = rand(13, 20);                      // top 16
  } else if (rank < 32) {
    offset = rand(7, 15);                       // top 32
  } else if (rank < 64) {
    offset = rand(1, 9);                        // top 64: slightly above player
  } else if (rank < Math.floor(total * 0.75)) {
    offset = rand(-7, 3);                       // mid-field: around player's level
  } else {
    offset = rand(-20, -7);                     // bottom quarter: weaker
  }

  const base = spielerAvg + offset;
  return Math.round((Math.max(15, Math.min(125, base)) + formBonus) * 10) / 10;
}

// Helper: get avg from level for named bots (not using name pattern)
function getBotAvgForLevel(level: number, formBonus: number = 0): number {
  const [min, max] = AUTODARTS_LEVEL_RANGES[level] ?? [55, 75];
  return Math.round((rand(min, max) + formBonus) * 10) / 10;
}

// Generate Q-School bots centered on playerLevel (1–11, std dev ~1.2), with real names
function generateQSchoolBots(playerLevel: number, count: number): { name: string; level: number }[] {
  const shuffled = [...BOT_NAME_POOL].sort(() => Math.random() - 0.5);
  const bots: { name: string; level: number }[] = [];
  for (let i = 0; i < count; i++) {
    const u = Math.max(1e-10, Math.random());
    const v = Math.random();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    // σ=1.2 → tight spread: ~95% of bots within ±2 levels of the player
    const level = Math.max(1, Math.min(11, Math.round(playerLevel + z * 1.2)));
    const name = shuffled[i % shuffled.length];
    bots.push({ name, level });
  }
  return bots;
}

// ── Rolling Order-of-Merit (2 Jahre) ────────────────────────────────────────
function addToOoM(career: any, updates: any, geld: number) {
  const saison = updates.saison_jahr ?? career.saison_jahr;
  const oom_saisons: Record<string, number> = { ...(career.oom_saisons as any ?? {}) };
  const k = String(saison);
  oom_saisons[k] = (oom_saisons[k] ?? 0) + geld;
  // Keep only the last 2 seasons
  for (const s of Object.keys(oom_saisons)) {
    if (Number(s) < saison - 1) delete oom_saisons[s];
  }
  updates.oom_saisons = oom_saisons;
  updates.order_of_merit_geld = Object.values(oom_saisons).reduce((a, b) => a + b, 0);
}

function expireOoMForNewSeason(career: any, updates: any, newSaison: number) {
  const oom_saisons: Record<string, number> = { ...(career.oom_saisons as any ?? {}) };
  let expired = 0;
  for (const s of Object.keys(oom_saisons)) {
    if (Number(s) < newSaison - 1) {
      expired += oom_saisons[s];
      delete oom_saisons[s];
    }
  }
  updates.oom_saisons = oom_saisons;
  updates.order_of_merit_geld = Object.values(oom_saisons).reduce((a, b) => a + b, 0);
  return expired;
}

// ── Premier League Liga-Abend ────────────────────────────────────────────────
function createPLTabelle(playerName: string, bots: { name: string; avg: number }[]) {
  return {
    match_index: 0,
    spieler: [
      { name: playerName, avg: 0, punkte: 0, siege: 0, niederlagen: 0 },
      { name: bots[0].name, avg: bots[0].avg, punkte: 0, siege: 0, niederlagen: 0 },
      { name: bots[1].name, avg: bots[1].avg, punkte: 0, siege: 0, niederlagen: 0 },
      { name: bots[2].name, avg: bots[2].avg, punkte: 0, siege: 0, niederlagen: 0 },
    ],
    // Each round: [player_opp_idx, concurrent_pair: [a, b]]
    matchups: [[1, 2, 3], [2, 1, 3], [3, 1, 2]],
  };
}

function simulateBotMatch(avgA: number, avgB: number): "a" | "b" {
  const total = avgA + avgB;
  return Math.random() < (total > 0 ? avgA / total : 0.5) ? "a" : "b";
}

// ── Grand Slam Gruppenphase ───────────────────────────────────────────────────
function createGSGruppe(playerName: string, bots: { name: string; avg: number }[]) {
  return {
    match_index: 0,
    spieler: [
      { name: playerName, avg: 0, punkte: 0, siege: 0, niederlagen: 0 },
      { name: bots[0].name, avg: bots[0].avg, punkte: 0, siege: 0, niederlagen: 0 },
      { name: bots[1].name, avg: bots[1].avg, punkte: 0, siege: 0, niederlagen: 0 },
      { name: bots[2].name, avg: bots[2].avg, punkte: 0, siege: 0, niederlagen: 0 },
    ],
    // Player plays bots 1, 2, 3 in order. Each round also has 1 bot-bot match.
    matchups: [[1, 2, 3], [2, 1, 3], [3, 1, 2]],
    beendet: false,
    weiter: false,
  };
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

export function getGegnerForm(name: string, botForm: Record<string, number>) {
  const bonus = botForm[name] ?? 0;
  let form: string;
  if (bonus >= 3) form = "🔥 Heißlauf";
  else if (bonus >= 1.5) form = "📈 Gute Form";
  else if (bonus >= -1.5) form = "➡️ Normalform";
  else if (bonus >= -3) form = "📉 Schwächephase";
  else form = "❄️ Kältephase";
  return { form, bonus };
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

  if (t.typ === "PremierLeague") return { name: "Liga-Abend", first_to: 6, format: "legs" };
  if ((t as any).gruppenphase && aktuell >= 128) return { name: "Gruppenphase", first_to: 5, format: "sets" };

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
    } else if (t.typ === "EuropeanTour") {
      first_to = aktuell >= 8 ? 8 : aktuell === 4 ? 10 : 12;
    } else {
      first_to = aktuell >= 8 ? 10 : aktuell === 4 ? 13 : 18;
    }
    return { name, first_to, format: "legs" };
  }
}

// ─── Phase 1: Match-Herausforderungen (Side Quests) ───────────────────────────

const MATCH_CHALLENGES = [
  { text: "Gewinne das Match", ziel_typ: "sieg", ziel_wert: 1, belohnung: 300 },
  { text: "Wirf mindestens 1x die 180", ziel_typ: "180s", ziel_wert: 1, belohnung: 400 },
  { text: "Wirf mindestens 2x die 180", ziel_typ: "180s", ziel_wert: 2, belohnung: 650 },
  { text: "Wirf mindestens 3x die 180", ziel_typ: "180s", ziel_wert: 3, belohnung: 950 },
  { text: "Erreiche einen Average über 55", ziel_typ: "avg", ziel_wert: 55, belohnung: 450 },
  { text: "Erreiche einen Average über 65", ziel_typ: "avg", ziel_wert: 65, belohnung: 650 },
  { text: "Erreiche einen Average über 75", ziel_typ: "avg", ziel_wert: 75, belohnung: 900 },
  { text: "Erreiche einen Average über 85", ziel_typ: "avg", ziel_wert: 85, belohnung: 1200 },
  { text: "Erreiche einen Average über 95", ziel_typ: "avg", ziel_wert: 95, belohnung: 1600 },
  { text: "Erreiche ein High-Finish über 80", ziel_typ: "hf", ziel_wert: 80, belohnung: 500 },
  { text: "Erreiche ein High-Finish über 100", ziel_typ: "hf", ziel_wert: 100, belohnung: 750 },
  { text: "Erreiche ein High-Finish über 120", ziel_typ: "hf", ziel_wert: 120, belohnung: 1100 },
  { text: "Erreiche ein High-Finish über 150", ziel_typ: "hf", ziel_wert: 150, belohnung: 1600 },
  { text: "Doppelquote über 35%", ziel_typ: "co_pct", ziel_wert: 35, belohnung: 550 },
  { text: "Doppelquote über 45%", ziel_typ: "co_pct", ziel_wert: 45, belohnung: 850 },
  { text: "Doppelquote über 55%", ziel_typ: "co_pct", ziel_wert: 55, belohnung: 1200 },
];

function generateMatchHerausforderung(spieler_avg: number) {
  const pool = MATCH_CHALLENGES.filter((c) => {
    if (c.ziel_typ === "avg") return c.ziel_wert <= spieler_avg + 15;
    return true;
  });
  return { ...pool[Math.floor(Math.random() * pool.length)] };
}

// ─── Phase 1: Momentum helpers ────────────────────────────────────────────────

function getMomentumFaktor(serie: number): number {
  if (serie >= 5) return 0.90;
  if (serie >= 3) return 0.95;
  if (serie <= -5) return 1.10;
  if (serie <= -3) return 1.05;
  return 1.0;
}

// ─── Phase 2: Social Media & Nachrichten ─────────────────────────────────────

function seededPick<T>(arr: T[], seed: string): T {
  const hash = Array.from(seed).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  return arr[Math.abs(hash) % arr.length];
}

function generateSocialPost(
  gegner_name: string,
  spieler_name: string,
  career: any
): { autor: string; inhalt: string; quelle: string } {
  const h2hRecord = (career.h2h as any)[gegner_name] ?? { siege: 0, niederlagen: 0 };
  const serie = career.aktuelle_serie ?? 0;
  const ist_angstgegner = h2hRecord.niederlagen >= 3 && h2hRecord.niederlagen > h2hRecord.siege;
  const seed = gegner_name + String(career.aktuelles_turnier_index ?? 0) + String(career.aktuelle_runde ?? 0);

  let pool: string[];
  if (ist_angstgegner) {
    pool = [
      `Wieder mal gegen ${spieler_name}. Kenne seinen Stil in- und auswendig. Freue mich drauf 😈`,
      `${spieler_name} hat sich gut entwickelt – das gebe ich zu. Aber der direkte Vergleich spricht für mich. Let's go! 🎯`,
      `Guten Morgen alle. Heute gegen ${spieler_name}. Ich kenne jede seiner Schwächen. 😏`,
    ];
  } else if (serie >= 3) {
    pool = [
      `Man redet viel über ${spieler_name} gerade... Mal sehen ob die Strähne heute Abend hält. 😏`,
      `${spieler_name} spielt gut zuletzt – das stimmt. Aber heute testet er diese Form gegen mich. 💪`,
      `Jeder Lauf endet irgendwann. Heute wäre ein guter Zeitpunkt dafür. 🏹`,
    ];
  } else if (h2hRecord.niederlagen > 0 && h2hRecord.niederlagen >= h2hRecord.siege) {
    pool = [
      `Letzte Begegnung gegen ${spieler_name} war schmerzhaft. Heute sieht das ganz anders aus! ⚡`,
      `${spieler_name} hatte letztes Mal einfach Glück. Heute spielen wir es sauber durch. Rematch! 🏆`,
      `Immer wieder gerne gegen ${spieler_name}. Letztes Mal war ein Ausrutscher. Heute nicht. 🎯`,
    ];
  } else {
    pool = [
      `Heute steht ${spieler_name} auf meiner Seite des Brackets. Konzentriert und bereit! 🎯`,
      `Match heute gegen ${spieler_name}. Alles vorbereitet, Zeit zu liefern. 💪`,
      `Freue mich auf das Spiel gegen ${spieler_name}. Gutes Match erwartet! 👊`,
      `Fokus. Vorbereitung. Heute gegen ${spieler_name} – let's make it count! 🏹`,
      `Anpfiff! Gegen ${spieler_name} heute. Gut vorbereitet und heiß auf das Match. ✅`,
    ];
  }

  const inhalt = seededPick(pool, seed);
  const quelle = seededPick(["X / Twitter", "Instagram"], seed + "q");
  return { autor: gegner_name, inhalt, quelle };
}

const ZEITUNGS_QUELLEN = ["PDC Tour News", "Darts World", "Bulls Eye Blog", "Pro Darts Weekly"];
const ZEITUNGS_AUTOREN = ["Martin Hoffmann", "Klaus Werner", "Stefan Braun", "Thomas Reuter", "Redaktion"];

function generateZeitungsartikel(
  spieler_name: string,
  gegner_name: string,
  win: boolean,
  legs_won: number,
  legs_lost: number,
  my_avg: number,
  my_180s: number,
  my_hf: number,
  turnier_name: string,
  runde_name: string,
  serie: number,
  ist_turnier_sieg: boolean
): { titel: string; inhalt: string; quelle: string; autor: string; wichtigkeit: "normal" | "hoch" } | null {
  const quelle = ZEITUNGS_QUELLEN[Math.floor(Math.random() * ZEITUNGS_QUELLEN.length)];
  const autor = ZEITUNGS_AUTOREN[Math.floor(Math.random() * ZEITUNGS_AUTOREN.length)];

  if (ist_turnier_sieg) {
    return {
      titel: `🏆 TURNIERSIEG! ${spieler_name} gewinnt den ${turnier_name}`,
      inhalt: `In einem dominanten Auftritt sichert sich ${spieler_name} den Titel beim ${turnier_name}. Im Finale gegen ${gegner_name} setzte sich der Spieler mit ${legs_won}:${legs_lost} durch. Starker Average von ${my_avg.toFixed(2)}.`,
      quelle, autor, wichtigkeit: "hoch",
    };
  }
  if (my_hf >= 150 && win) {
    return {
      titel: `Atemberaubend! ${spieler_name} checkt ${my_hf} beim ${turnier_name}`,
      inhalt: `Beim ${turnier_name} sorgte ${spieler_name} für das Highlight des Tages. Ein ${my_hf}-Finish krönte den ${legs_won}:${legs_lost}-Sieg gegen ${gegner_name}. Average: ${my_avg.toFixed(2)}.`,
      quelle, autor, wichtigkeit: "hoch",
    };
  }
  if (my_hf >= 120 && win) {
    return {
      titel: `Spektakuläres ${my_hf}-Finish von ${spieler_name} beim ${turnier_name}`,
      inhalt: `Mit einem beeindruckenden ${my_hf}-Checkout überraschte ${spieler_name} beim ${turnier_name} und bezwang ${gegner_name} mit ${legs_won}:${legs_lost}. Average: ${my_avg.toFixed(2)}.`,
      quelle, autor, wichtigkeit: "hoch",
    };
  }
  if (my_180s >= 3 && win) {
    return {
      titel: `${my_180s}× Maximum! ${spieler_name} dominiert ${gegner_name} beim ${turnier_name}`,
      inhalt: `Mit ${my_180s} perfekten Aufnahmen zeigte ${spieler_name} eine außergewöhnliche Leistung beim ${turnier_name}. ${legs_won}:${legs_lost}-Sieg gegen ${gegner_name}. Average: ${my_avg.toFixed(2)}.`,
      quelle, autor, wichtigkeit: "hoch",
    };
  }
  if (serie >= 5 && win) {
    return {
      titel: `Heiße Strähne: ${spieler_name} feiert ${serie}. Sieg in Folge beim ${turnier_name}`,
      inhalt: `${spieler_name} ist nicht zu stoppen! Mit dem ${legs_won}:${legs_lost}-Triumph gegen ${gegner_name} beim ${turnier_name} setzt der Spieler seine beeindruckende Serie fort.`,
      quelle, autor, wichtigkeit: "hoch",
    };
  }
  if (win) {
    if (Math.random() > 0.65) return null;
    const templates = [
      { titel: `${spieler_name} souverän: ${legs_won}:${legs_lost} gegen ${gegner_name} beim ${turnier_name}`, inhalt: `Im ${runde_name} des ${turnier_name} überzeugte ${spieler_name} gegen ${gegner_name}. Average: ${my_avg.toFixed(2)}.` },
      { titel: `Solide Leistung: ${spieler_name} schlägt ${gegner_name} und zieht weiter`, inhalt: `${spieler_name} passiert die ${runde_name} beim ${turnier_name} mit einem ${legs_won}:${legs_lost}-Sieg über ${gegner_name}. Average: ${my_avg.toFixed(2)}.` },
    ];
    return { ...templates[Math.floor(Math.random() * templates.length)], quelle, autor, wichtigkeit: "normal" };
  }
  if (Math.random() > 0.4) return null;
  return {
    titel: `${spieler_name} scheidet im ${runde_name} beim ${turnier_name} aus`,
    inhalt: `${legs_won}:${legs_lost}-Niederlage für ${spieler_name} gegen ${gegner_name} beim ${turnier_name}. Average: ${my_avg.toFixed(2)}.`,
    quelle, autor, wichtigkeit: "normal",
  };
}

// ─────────────────────────────────────────────────────────────────────────────

function generiereGegner(career: any) {
  const { hat_tourcard, aktuelles_turnier_index, aktuelle_runde, turnier_baum: existingBaum } = career;
  const botRangliste = career.bot_rangliste as any[];
  const botForm = career.bot_form as Record<string, number>;

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
    const spielerAvg = career.spieler_avg ?? 60;
    const playerLevel = avgToAutodartsBotLevel(spielerAvg);
    const qBots = generateQSchoolBots(playerLevel, 119);
    // Mix real Q-School players (string[]) with named bots ({name,level}[])
    const base: ({ name: string; level?: number })[] = [
      ...QSCHOOL_SPIELER.map((name) => ({ name })),
      ...qBots,
    ];
    for (let i = base.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
    const sliced = base.slice(0, 127);
    const spielerAvg2 = career.spieler_avg ?? 60;
    const bots = sliced.map((item) => ({
      name: item.name,
      avg: item.level !== undefined
        ? getBotAvgForLevel(item.level, botForm[item.name] ?? 0)
        : getBotAvg(item.name, botRangliste, botForm, spielerAvg2),
    }));
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
  } else {
    const t = KALENDER[aktuelles_turnier_index];
    if (t.name === "World Matchplay" || t.name === "World Grand Prix" || t.name === "European Championship") size = 32;
    else if (t.typ === "PremierLeague") size = 8;
    else if (t.typ === "EuropeanTour" || t.typ === "WorldSeries") size = 32;
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

  const spielerAvg2 = career.spieler_avg ?? 60;
  const bots = pool.map((name) => ({ name, avg: getBotAvg(name, botRangliste, botForm, spielerAvg2) }));
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

function getMoreSponsorMissions() {
  const sponsoren = ["Winmau", "Target", "RedDragon", "Unicorn", "L-Style", "Paddy Power", "Betway", "Unibet", "Bodog", "CAZOO"];
  const ziele = [
    { typ: "180s", ziel: 10, belohnung: 2000, text: "Wirf zehn 180er" },
    { typ: "180s", ziel: 20, belohnung: 4000, text: "Wirf zwanzig 180er" },
    { typ: "siege", ziel: 3, belohnung: 3500, text: "Gewinne 3 Matches" },
    { typ: "siege", ziel: 5, belohnung: 6000, text: "Gewinne 5 Matches" },
    { typ: "hf", ziel: 100, belohnung: 1500, text: "Checke 100+ (Highfinish)" },
    { typ: "hf", ziel: 140, belohnung: 3000, text: "Checke ein 140+ Finish" },
    { typ: "hf", ziel: 170, belohnung: 8000, text: "Checke die legendäre 170" },
    { typ: "spiele", ziel: 10, belohnung: 2500, text: "Spiele 10 Matches" },
    { typ: "avg", ziel: 90, belohnung: 3000, text: "Erreiche 90+ Average in einem Match" },
  ];
  return { sponsoren, ziele };
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

  // Also clear PL tabelle and GS gruppe when moving to next tournament
  updates.pl_tabelle = null;
  updates.gs_gruppe = null;

  // Rolling OoM: expire seasons older than the last 2
  if (saison_jahr > career.saison_jahr) {
    const expired = expireOoMForNewSeason(career, updates, saison_jahr);
    if (expired > 0) {
      msgs.push(`📅 Neue Saison ${saison_jahr}! £${expired.toLocaleString("en-GB")} Order-of-Merit-Geld aus Saison ${saison_jahr - 2} ist abgelaufen.`);
    }
  }

  // Track ranking progression
  const ranking_verlauf: any[] = [...((career.ranking_verlauf ?? []) as any[])];
  ranking_verlauf.push({
    platz,
    saison: career.saison_jahr,
    turnier: KALENDER[career.aktuelles_turnier_index].name,
  });
  updates.ranking_verlauf = ranking_verlauf.slice(-50); // keep last 50

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
    const { sponsoren, ziele } = getMoreSponsorMissions();
    const ziel = ziele[Math.floor(Math.random() * ziele.length)];
    aktiver_sponsor = {
      name: sponsoren[Math.floor(Math.random() * sponsoren.length)],
      ziel_typ: ziel.typ,
      ziel_wert: ziel.ziel,
      aktuell: 0,
      turniere_zeit: 4,
      belohnung: ziel.belohnung,
      text: ziel.text,
    };
    msgs.push(`📝 Angebot von ${aktiver_sponsor.name}! Ziel: ${aktiver_sponsor.text} in den nächsten 4 Turnieren. Bonus: £${aktiver_sponsor.belohnung.toLocaleString()}`);
  }

  updates.aktiver_sponsor = aktiver_sponsor;
  return { msgs, updates };
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Anfänger – Autodarts Level 1",
  2: "Einsteiger – Autodarts Level 2",
  3: "Freizeit – Autodarts Level 3",
  4: "Fortgeschritten – Autodarts Level 4",
  5: "Standard – Autodarts Level 5",
  6: "Anspruchsvoll – Autodarts Level 6",
  7: "Profi – Autodarts Level 7",
  8: "Elite – Autodarts Level 8",
  9: "Legende – Autodarts Level 9",
};

// Autodarts-mapped multipliers per difficulty level
const DIFFICULTY_MULTIPLIERS: Record<number, number> = {
  1: 0.52,
  2: 0.63,
  3: 0.74,
  4: 0.87,
  5: 1.0,
  6: 1.07,
  7: 1.14,
  8: 1.21,
  9: 1.30,
};

export async function setPlayerName(name: string, spieler_avg: number = 60) {
  const trimmed = name.trim().substring(0, 30);
  const avg = Math.max(15, Math.min(125, spieler_avg));
  const level = avgToAutodartsBotLevel(avg);
  await saveCareer({ spieler_name: trimmed, name_set: true, spieler_avg: avg });
  return {
    career: await getOrCreateCareer(),
    messages: [`Willkommen, ${trimmed}! Dein Average: ${avg} → Autodarts Level ${level}. Viel Erfolg!`],
  };
}

export async function startMatch() {
  const career = await getOrCreateCareer();
  const msgs: string[] = [];
  const updates: any = {};

  if (career.hat_tourcard && career.aktuelle_runde === 0) {
    const t = KALENDER[career.aktuelles_turnier_index];
    let kosten = t.typ === "ProTour" ? 250 : t.typ === "EuropeanTour" ? 400 : t.typ === "WorldSeries" ? 600 : 500;
    if (t.name === "Premier League Night") kosten = 0;

    // Equipment bonus: shirt sponsor reduces travel costs
    const ownedEquip = career.equipment as string[];
    if (ownedEquip.includes("shirt_sponsor")) kosten = Math.max(0, kosten - 500);

    updates.bank_konto = career.bank_konto - kosten;
    if (kosten > 0) msgs.push(`💸 Reise- & Startgebühren bezahlt: -£${kosten}`);
  }

  updates.letzte_schlagzeile = null;
  updates.turnier_laeuft = true;

  // Reset round log when starting a fresh tournament
  if (career.aktuelle_runde === 0) {
    updates.turnier_runden_log = [];
  }

  // ── Determine opponent based on tournament type ──────────────────────────
  let baseAvg: number;
  let gegner_name: string;

  const currentT = KALENDER[career.aktuelles_turnier_index];
  const alleBots = [...(career.bot_rangliste as any[])].sort((a, b) => b.geld - a.geld);
  const botFormMap = career.bot_form as Record<string, number>;
  const spielerAvg = career.spieler_avg ?? 60;

  if (career.hat_tourcard && currentT.typ === "PremierLeague" && career.aktuelle_runde === 0) {
    // ── Premier League Liga-Abend: 4-Spieler-Modus initialisieren ───────────
    const top3 = alleBots.slice(0, 3).map((b: any) => ({
      name: b.name,
      avg: getBotAvg(b.name, alleBots, botFormMap, spielerAvg),
    }));
    const plTabelle = createPLTabelle(career.spieler_name, top3);
    updates.pl_tabelle = plTabelle;
    updates.turnier_baum = [];
    gegner_name = top3[0].name;
    baseAvg = top3[0].avg;
    msgs.push(`🏆 Premier League Liga-Abend! Du spielst im Round-Robin gegen: ${top3.map((b) => b.name).join(", ")}`);
  } else if (career.hat_tourcard && (currentT as any).gruppenphase && career.aktuelle_runde === 0 && !career.gs_gruppe) {
    // ── Grand Slam: Gruppenphase initialisieren ──────────────────────────────
    const pool = alleBots.slice(0, 15).map((b: any) => b.name);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const gs3 = pool.slice(0, 3).map((name: string) => ({
      name,
      avg: getBotAvg(name, alleBots, botFormMap, spielerAvg),
    }));
    const gsGruppe = createGSGruppe(career.spieler_name, gs3);
    updates.gs_gruppe = gsGruppe;
    updates.turnier_baum = [];
    gegner_name = gs3[0].name;
    baseAvg = gs3[0].avg;
    msgs.push(`📋 Grand Slam of Darts – Gruppenphase! Gegner: ${gs3.map((b) => b.name).join(", ")}`);
  } else if (career.hat_tourcard && (currentT as any).gruppenphase && career.gs_gruppe && !(career.gs_gruppe as any).beendet) {
    // ── Grand Slam: Nächster Gruppenphase-Gegner ─────────────────────────────
    const gruppe = career.gs_gruppe as any;
    const nextOppIdx = gruppe.matchups[gruppe.match_index][0];
    const nextOpp = gruppe.spieler[nextOppIdx];
    gegner_name = nextOpp.name;
    baseAvg = nextOpp.avg;
    updates.turnier_baum = [];
  } else if (career.hat_tourcard && currentT.typ === "PremierLeague" && career.pl_tabelle) {
    // ── Premier League: Nächste Runde ────────────────────────────────────────
    const pl = career.pl_tabelle as any;
    const nextOppIdx = pl.matchups[pl.match_index][0];
    const nextOpp = pl.spieler[nextOppIdx];
    gegner_name = nextOpp.name;
    baseAvg = nextOpp.avg;
    updates.turnier_baum = [];
  } else {
    // ── Normal bracket ────────────────────────────────────────────────────────
    const result = generiereGegner({ ...career, ...updates });
    gegner_name = result.gegner_name;
    baseAvg = result.gegner_avg;
    updates.turnier_baum = result.turnier_baum;
  }

  // Phase 1: Apply momentum modifier
  const serie = career.aktuelle_serie ?? 0;
  const momentumFaktor = getMomentumFaktor(serie);

  // Phase 1: Apply Angstgegner modifier (+7% if player has lost 3+ times vs this opponent)
  const h2hRecord = (career.h2h as any)[gegner_name] ?? { siege: 0, niederlagen: 0 };
  const ist_angstgegner = h2hRecord.niederlagen >= 3 && h2hRecord.niederlagen > h2hRecord.siege;
  const angstFaktor = ist_angstgegner ? 1.07 : 1.0;

  updates.gegner_name = gegner_name;
  updates.gegner_avg = Math.round(baseAvg * momentumFaktor * angstFaktor * 10) / 10;

  // Phase 1: Log momentum messages
  if (serie >= 3) msgs.push(`🔥 ${serie} Siege in Folge! Gegner respektiert dich (-${Math.round((1 - momentumFaktor) * 100)}% AVG).`);
  else if (serie <= -3) msgs.push(`❄️ ${Math.abs(serie)} Niederlagen in Folge. Gegner greift selbstsicher an (+${Math.round((momentumFaktor - 1) * 100)}% AVG).`);
  if (ist_angstgegner) msgs.push(`⚠️ Angstgegner: ${gegner_name} hat dich bereits ${h2hRecord.niederlagen}x besiegt!`);

  // Phase 1: Generate per-match challenge – only if player has an active sponsor
  if (career.aktiver_sponsor) {
    updates.match_herausforderung = generateMatchHerausforderung(career.spieler_avg ?? 60);
  } else {
    updates.match_herausforderung = null;
  }

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

  // Phase 1: Update win/loss streak
  const currentSerie = career.aktuelle_serie ?? 0;
  updates.aktuelle_serie = win
    ? (currentSerie >= 0 ? currentSerie + 1 : 1)
    : (currentSerie <= 0 ? currentSerie - 1 : -1);

  // Phase 1: Check match challenge completion
  const herausforderung = career.match_herausforderung ? { ...(career.match_herausforderung as any) } : null;
  if (herausforderung) {
    let erledigt = false;
    if (herausforderung.ziel_typ === "sieg" && win) erledigt = true;
    else if (herausforderung.ziel_typ === "180s" && my_180s >= herausforderung.ziel_wert) erledigt = true;
    else if (herausforderung.ziel_typ === "avg" && my_avg >= herausforderung.ziel_wert) erledigt = true;
    else if (herausforderung.ziel_typ === "hf" && my_hf >= herausforderung.ziel_wert) erledigt = true;
    else if (herausforderung.ziel_typ === "co_pct" && my_co_pct >= herausforderung.ziel_wert) erledigt = true;

    if (erledigt) {
      const bonus = herausforderung.belohnung;
      updates.bank_konto = (updates.bank_konto ?? career.bank_konto) + bonus;
      msgs.push(`🎯 HERAUSFORDERUNG ERFÜLLT! +£${bonus.toLocaleString("en-GB")} — ${herausforderung.text}`);
    } else {
      msgs.push(`❌ Herausforderung verfehlt: ${herausforderung.text}`);
    }
    updates.match_herausforderung = null;
  }

  // Phase 1: Angstgegner message when player finally beats the fear
  const h2hAfter = h2h[gegner_name];
  if (win && h2hAfter.niederlagen >= 3 && h2hAfter.siege === 1) {
    msgs.push(`💪 Angstgegner besiegt! Erster Sieg gegen ${gegner_name}!`);
  }

  // ── Inline helper: shared post-match processing (sponsor, achievements, phase 2) ──
  function doPostMatch(
    istTurnierSieg: boolean,
    isMajorSieg: boolean,
    neueSerie: number,
    rundenName: string,
    turniername: string,
    localAchievements: any,
  ) {
    // Sponsor progress
    let aktiver_sponsor = career.aktiver_sponsor ? { ...(career.aktiver_sponsor as any) } : null;
    if (aktiver_sponsor) {
      if (aktiver_sponsor.ziel_typ === "180s") aktiver_sponsor.aktuell += my_180s;
      else if (aktiver_sponsor.ziel_typ === "siege" && win) aktiver_sponsor.aktuell += 1;
      else if (aktiver_sponsor.ziel_typ === "hf" && my_hf >= aktiver_sponsor.ziel_wert) aktiver_sponsor.aktuell = aktiver_sponsor.ziel_wert;
      else if (aktiver_sponsor.ziel_typ === "spiele") aktiver_sponsor.aktuell += 1;
      else if (aktiver_sponsor.ziel_typ === "avg" && my_avg >= aktiver_sponsor.ziel_wert) aktiver_sponsor.aktuell = aktiver_sponsor.ziel_wert;
      if (aktiver_sponsor.aktuell >= aktiver_sponsor.ziel_wert) {
        const bonus = aktiver_sponsor.belohnung;
        updates.bank_konto = (updates.bank_konto ?? career.bank_konto) + bonus;
        msgs.push(`🤝 ZIEL ERREICHT! ${aktiver_sponsor.name} zahlt Sponsoren-Bonus: £${bonus.toLocaleString()}`);
        aktiver_sponsor = null;
      }
      updates.aktiver_sponsor = aktiver_sponsor;
    }
    // Achievements
    if (my_180s > 0 && !localAchievements.first_180?.unlocked) {
      localAchievements.first_180.unlocked = true;
      msgs.push("🎯 ONE HUNDRED AND EIGHTY! Deine erste 180 geworfen!");
    }
    if ((career.stats_180s + my_180s) >= 100 && !localAchievements.century_180s?.unlocked) {
      localAchievements.century_180s = localAchievements.century_180s || {};
      localAchievements.century_180s.unlocked = true;
      msgs.push("🎯 180 MASCHINE! Du hast 100 Maximums geworfen!");
    }
    if (my_hf >= 100 && !localAchievements.ton_finish?.unlocked) {
      localAchievements.ton_finish.unlocked = true;
      msgs.push("🎯 Ton Plus! Starkes High-Finish!");
    }
    if (my_hf >= 170 && !localAchievements.big_fish?.unlocked) {
      localAchievements.big_fish.unlocked = true;
      msgs.push("🎯 THE BIG FISH! Die magische 170 gecheckt!");
    }
    if (win && !localAchievements.first_win?.unlocked) {
      localAchievements.first_win.unlocked = true;
      msgs.push("⭐ Erstes Blut! Du hast dein allererstes Match gewonnen.");
    }
    if (istTurnierSieg && !localAchievements.first_title?.unlocked) {
      localAchievements.first_title.unlocked = true;
      msgs.push("⭐ Silberzeug! Erstes Turnier gewonnen!");
    }
    if (isMajorSieg && !localAchievements.first_major?.unlocked) {
      localAchievements.first_major = localAchievements.first_major || {};
      localAchievements.first_major.unlocked = true;
      msgs.push("👑 MAJOR CHAMPION!");
    }
    updates.achievements = localAchievements;
    // Phase 2: Follower
    let followerZuwachs = win ? 50 : 5;
    followerZuwachs += my_180s * 15;
    if (my_hf >= 150) followerZuwachs += 200;
    else if (my_hf >= 120) followerZuwachs += 100;
    else if (my_hf >= 100) followerZuwachs += 60;
    if (neueSerie === 3) followerZuwachs += 100;
    if (neueSerie === 5) followerZuwachs += 200;
    if (istTurnierSieg) followerZuwachs += 500;
    updates.social_follower = (career.social_follower ?? 0) + followerZuwachs;
    // Phase 2: Zeitungsartikel
    const artikel = generateZeitungsartikel(
      career.spieler_name, gegner_name, win, legs_won, legs_lost,
      my_avg, my_180s, my_hf, turniername, rundenName, neueSerie, istTurnierSieg
    );
    if (artikel) {
      const feed = [...((career.nachrichten_feed ?? []) as any[])];
      updates.nachrichten_feed = [
        { ...artikel, datum: new Date().toISOString(), id: Date.now().toString() },
        ...feed,
      ].slice(0, 20);
    }
  }

  // ── Phase 3: Premier League Liga-Abend handler ───────────────────────────
  if (career.hat_tourcard && KALENDER[career.aktuelles_turnier_index].typ === "PremierLeague" && career.pl_tabelle) {
    const pl: any = JSON.parse(JSON.stringify(career.pl_tabelle));
    const matchup = pl.matchups[pl.match_index];
    const oppIdx: number = matchup[0];
    const botAIdx: number = matchup[1];
    const botBIdx: number = matchup[2];

    // Player match result
    if (win) {
      pl.spieler[0].punkte += 3; pl.spieler[0].siege += 1;
      pl.spieler[oppIdx].niederlagen += 1;
    } else {
      pl.spieler[oppIdx].punkte += 3; pl.spieler[oppIdx].siege += 1;
      pl.spieler[0].niederlagen += 1;
    }
    // Concurrent bot match
    const botA = pl.spieler[botAIdx];
    const botB = pl.spieler[botBIdx];
    if (simulateBotMatch(botA.avg || 70, botB.avg || 70) === "a") {
      botA.punkte += 3; botA.siege += 1; botB.niederlagen += 1;
    } else {
      botB.punkte += 3; botB.siege += 1; botA.niederlagen += 1;
    }
    pl.match_index += 1;
    msgs.push(`📊 Ergebnis eingetragen: ${legs_won} : ${legs_lost}`);

    const neueSerie = updates.aktuelle_serie ?? 0;
    const achievements: any = { ...(career.achievements as any) };

    if (pl.match_index >= 3) {
      // Liga-Abend abgeschlossen
      pl.spieler.sort((a: any, b: any) => b.punkte - a.punkte || b.siege - a.siege);
      const playerPos = pl.spieler.findIndex((s: any) => s.name === career.spieler_name);
      const preisgeld = PL_PRIZE_POSITIONS[playerPos] ?? PL_PRIZE_POSITIONS[3];
      const plSieg = playerPos === 0;

      addToOoM(career, updates, preisgeld);
      updates.bank_konto = (updates.bank_konto ?? career.bank_konto) + preisgeld;
      msgs.push(`🏆 Liga-Abend beendet! Platz ${playerPos + 1} von 4 — £${preisgeld.toLocaleString("en-GB")} Preisgeld`);

      if (plSieg) {
        pl.spieler.forEach((s: any, i: number) => {
          if (i === 0) msgs.push(`🥇 ${s.name}: ${s.punkte} Punkte`);
          else msgs.push(`  ${["🥈","🥉","4️⃣"][i-1] ?? ""} ${s.name}: ${s.punkte} Punkte`);
        });
      }
      pl.beendet = true;
      const tv: any[] = [...((career.turnier_verlauf ?? []) as any[])];
      tv.unshift({ name: "Premier League Night", typ: "PremierLeague", runde: "Liga-Abend", ergebnis: plSieg ? "Sieg" : "Platz " + (playerPos + 1), preisgeld, saison: career.saison_jahr, avg: my_avg });
      updates.turnier_verlauf = tv.slice(0, 100);
      updates.pl_tabelle = pl;
      updates.turnier_laeuft = false;
      updates.aktuelle_runde = 0;
      updates.turnier_baum = [];

      const newOoM = updates.order_of_merit_geld ?? career.order_of_merit_geld;
      const platz = ermittlePlatz(career.bot_rangliste as any[], career.spieler_name, newOoM);
      if (platz <= 64 && !achievements.top64?.unlocked) { achievements.top64.unlocked = true; msgs.push("⭐ Etabliert! Top 64!"); }
      if (platz <= 16 && !achievements.top16?.unlocked) { achievements.top16.unlocked = true; msgs.push("⭐ Elite! Top 16!"); }
      if (platz <= 8 && !achievements.top8?.unlocked) { achievements.top8 = { ...achievements.top8, unlocked: true }; msgs.push("⭐ World Class! Top 8!"); }

      doPostMatch(plSieg, plSieg, neueSerie, "Liga-Abend", "Premier League Night", achievements);

      const { msgs: nextMsgs, updates: nextUpdates } = nextTurnier({ ...career, ...updates });
      msgs.push(...nextMsgs);
      Object.assign(updates, nextUpdates);
    } else {
      updates.pl_tabelle = pl;
      updates.aktuelle_runde = career.aktuelle_runde + 1;
      msgs.push(`➡️ Runde ${pl.match_index}/3 — Nächster Gegner: ${pl.spieler[pl.matchups[pl.match_index][0]].name}`);
      doPostMatch(false, false, neueSerie, "PL Runde " + pl.match_index, "Premier League Night", achievements);
    }

    await saveCareer(updates);
    return { career: await getOrCreateCareer(), messages: msgs };
  }

  // ── Phase 3: Grand Slam Gruppenphase handler ─────────────────────────────
  if (career.hat_tourcard && (KALENDER[career.aktuelles_turnier_index] as any).gruppenphase && career.gs_gruppe && !(career.gs_gruppe as any).beendet) {
    const gs: any = JSON.parse(JSON.stringify(career.gs_gruppe));
    const matchup = gs.matchups[gs.match_index];
    const oppIdx: number = matchup[0];
    const botAIdx: number = matchup[1];
    const botBIdx: number = matchup[2];

    // Player match result
    if (win) {
      gs.spieler[0].punkte += 3; gs.spieler[0].siege += 1;
      gs.spieler[oppIdx].niederlagen += 1;
    } else {
      gs.spieler[oppIdx].punkte += 3; gs.spieler[oppIdx].siege += 1;
      gs.spieler[0].niederlagen += 1;
    }
    // Concurrent bot match
    const gsA = gs.spieler[botAIdx];
    const gsB = gs.spieler[botBIdx];
    if (simulateBotMatch(gsA.avg || 70, gsB.avg || 70) === "a") {
      gsA.punkte += 3; gsA.siege += 1; gsB.niederlagen += 1;
    } else {
      gsB.punkte += 3; gsB.siege += 1; gsA.niederlagen += 1;
    }
    gs.match_index += 1;
    msgs.push(`📊 Ergebnis eingetragen: ${legs_won} : ${legs_lost}`);

    const neueSerie = updates.aktuelle_serie ?? 0;
    const achievements: any = { ...(career.achievements as any) };

    if (gs.match_index >= 3) {
      // Gruppe ist abgeschlossen — Top 2 kommen weiter
      gs.spieler.sort((a: any, b: any) => b.punkte - a.punkte || b.siege - a.siege);
      const playerPos = gs.spieler.findIndex((s: any) => s.name === career.spieler_name);
      const weiter = playerPos < 2;
      gs.beendet = true;
      gs.weiter = weiter;

      msgs.push(`📋 Gruppenphase beendet! Platz ${playerPos + 1} in der Gruppe — ${weiter ? "✅ Du kommst ins Achtelfinale!" : "❌ Ausgeschieden."}`);
      gs.spieler.forEach((s: any, i: number) => {
        const icon = i === 0 ? "🥇" : i === 1 ? (weiter && i === 1 ? "🥈" : "🥈") : i === 2 ? "🥉" : "4️⃣";
        msgs.push(`${icon} ${s.name}: ${s.punkte} Pkt — ${s.siege}S/${s.niederlagen}N`);
      });

      updates.gs_gruppe = gs;
      doPostMatch(false, false, neueSerie, "Gruppenphase", "Grand Slam of Darts", achievements);

      if (!weiter) {
        // Eliminiert: Trostgeld
        const trost = 5000;
        addToOoM(career, updates, trost);
        updates.bank_konto = (updates.bank_konto ?? career.bank_konto) + trost;
        msgs.push(`💰 Trostgeld: £${trost.toLocaleString("en-GB")}`);
        const tv: any[] = [...((career.turnier_verlauf ?? []) as any[])];
        tv.unshift({ name: "Grand Slam of Darts", typ: "Major", runde: "Gruppenphase", ergebnis: "Niederlage", preisgeld: trost, saison: career.saison_jahr, avg: my_avg });
        updates.turnier_verlauf = tv.slice(0, 100);
        updates.turnier_laeuft = false;
        updates.aktuelle_runde = 0;
        updates.turnier_baum = [];
        const { msgs: nextMsgs, updates: nextUpdates } = nextTurnier({ ...career, ...updates });
        msgs.push(...nextMsgs);
        Object.assign(updates, nextUpdates);
      } else {
        // Weiter ins Achtelfinale — generiere 8er-Bracket
        const alleBots = [...(career.bot_rangliste as any[])].sort((a, b) => b.geld - a.geld);
        const pool = alleBots.slice(0, 7).map((b: any) => b.name);
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        const botFormMap2 = career.bot_form as Record<string, number>;
        const bots7 = pool.map((name: string) => ({
          name,
          avg: getBotAvg(name, alleBots, botFormMap2, career.spieler_avg ?? 60),
        }));
        let bracket = [{ name: career.spieler_name, avg: 0 }, ...bots7];
        for (let i = bracket.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bracket[i], bracket[j]] = [bracket[j], bracket[i]];
        }
        updates.turnier_baum = bracket;
        updates.turnier_laeuft = true;
        updates.aktuelle_runde = career.aktuelle_runde + 1;
      }
    } else {
      updates.gs_gruppe = gs;
      updates.aktuelle_runde = career.aktuelle_runde + 1;
      msgs.push(`➡️ Gruppenphase Runde ${gs.match_index}/3 — Nächster Gegner: ${gs.spieler[gs.matchups[gs.match_index][0]].name}`);
      doPostMatch(false, false, neueSerie, "Gruppenphase", "Grand Slam of Darts", achievements);
    }

    await saveCareer(updates);
    return { career: await getOrCreateCareer(), messages: msgs };
  }

  const turnier_baum = [...(career.turnier_baum as any[])];
  const botForm: Record<string, number> = { ...(career.bot_form as any) };

  const neuerBaum: any[] = [];
  const roundMatchups: any[] = [];
  for (let i = 0; i < turnier_baum.length; i += 2) {
    const bot1 = turnier_baum[i];
    const bot2 = turnier_baum[i + 1];
    // Safety guard: odd-sized bracket → bye round, player advances automatically
    if (!bot2) {
      neuerBaum.push(bot1);
      continue;
    }
    if (bot1.name === career.spieler_name || bot2.name === career.spieler_name) {
      const playerIsP1 = bot1.name === career.spieler_name;
      const winner = win ? (playerIsP1 ? bot1 : bot2) : (playerIsP1 ? bot2 : bot1);
      neuerBaum.push(winner);
      roundMatchups.push({
        p1: bot1.name,
        p2: bot2.name,
        winner: winner.name,
        p1_legs: playerIsP1 ? legs_won : legs_lost,
        p2_legs: playerIsP1 ? legs_lost : legs_won,
        p1_avg: playerIsP1 ? Math.round(my_avg * 10) / 10 : Math.round(career.gegner_avg * 10) / 10,
      });
    } else {
      const a1 = bot1.avg * (0.9 + Math.random() * 0.2);
      const a2 = bot2.avg * (0.9 + Math.random() * 0.2);
      const c1 = Math.max(0.1, Math.min(0.9, 0.5 + (a1 - a2) * 0.02));
      const winner = Math.random() < c1 ? bot1 : bot2;
      const loser = winner === bot1 ? bot2 : bot1;
      neuerBaum.push(winner);
      botForm[winner.name] = Math.min(5, (botForm[winner.name] ?? 0) + 0.5);
      botForm[loser.name] = Math.max(-5, (botForm[loser.name] ?? 0) - 0.5);
      roundMatchups.push({ p1: bot1.name, p2: bot2.name, winner: winner.name });
    }
  }
  updates.turnier_baum = neuerBaum;
  updates.bot_form = botForm;

  // Record this round's results in the runden_log
  const rundenLogEntry = {
    runde: career.aktuelle_runde,
    rundenName: getRundenInfo(turnier_baum, career.hat_tourcard, career.aktuelles_turnier_index).name,
    ergebnisse: roundMatchups,
  };
  const runden_log = [...((career.turnier_runden_log ?? []) as any[])];
  runden_log.push(rundenLogEntry);
  updates.turnier_runden_log = runden_log;

  msgs.push(`📊 Ergebnis eingetragen: ${legs_won} : ${legs_lost}`);

  // Phase 2: Detect tournament win for articles + follower bonus
  const istTurnierSieg = win && career.hat_tourcard && neuerBaum.length === 1;
  const aktuellRundenName = getRundenInfo(turnier_baum, career.hat_tourcard, career.aktuelles_turnier_index).name;

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

  // Sponsor progress
  let aktiver_sponsor = career.aktiver_sponsor ? { ...(career.aktiver_sponsor as any) } : null;
  if (aktiver_sponsor) {
    if (aktiver_sponsor.ziel_typ === "180s") aktiver_sponsor.aktuell += my_180s;
    else if (aktiver_sponsor.ziel_typ === "siege" && win) aktiver_sponsor.aktuell += 1;
    else if (aktiver_sponsor.ziel_typ === "hf" && my_hf >= aktiver_sponsor.ziel_wert) aktiver_sponsor.aktuell = aktiver_sponsor.ziel_wert;
    else if (aktiver_sponsor.ziel_typ === "spiele") aktiver_sponsor.aktuell += 1;
    else if (aktiver_sponsor.ziel_typ === "avg" && my_avg >= aktiver_sponsor.ziel_wert) aktiver_sponsor.aktuell = aktiver_sponsor.ziel_wert;

    if (aktiver_sponsor.aktuell >= aktiver_sponsor.ziel_wert) {
      const bonus = aktiver_sponsor.belohnung;
      updates.bank_konto = (updates.bank_konto ?? career.bank_konto) + bonus;
      msgs.push(`🤝 ZIEL ERREICHT! ${aktiver_sponsor.name} zahlt Sponsoren-Bonus: £${bonus.toLocaleString()}`);
      aktiver_sponsor = null;
    }
    updates.aktiver_sponsor = aktiver_sponsor;
  }

  const achievements: any = { ...(career.achievements as any) };

  // Achievement checks
  if (my_180s > 0 && !achievements.first_180?.unlocked) {
    achievements.first_180.unlocked = true;
    msgs.push("🎯 ONE HUNDRED AND EIGHTY! Deine erste 180 geworfen!");
  }
  if ((career.stats_180s + my_180s) >= 100 && !achievements.century_180s?.unlocked) {
    achievements.century_180s = achievements.century_180s || {};
    achievements.century_180s.unlocked = true;
    msgs.push("🎯 180 MASCHINE! Du hast 100 Maximums geworfen!");
  }
  if (my_hf >= 100 && !achievements.ton_finish?.unlocked) {
    achievements.ton_finish.unlocked = true;
    msgs.push("🎯 Ton Plus! Starkes High-Finish!");
  }
  if (my_hf >= 170 && !achievements.big_fish?.unlocked) {
    achievements.big_fish.unlocked = true;
    msgs.push("🎯 THE BIG FISH! Die magische 170 gecheckt!");
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
        achievements.tourcard = achievements.tourcard || {};
        achievements.tourcard.unlocked = true;
        msgs.push("🎯 TOURCARD GEWONNEN! Willkommen bei den Profis!");
        updates.turnier_laeuft = false;
        updates.aktuelle_runde = 0;
        updates.turnier_baum = [];
        updates.q_school_punkte = neue_punkte;
      } else {
        updates.q_school_punkte = neue_punkte;
        updates.aktuelle_runde = career.aktuelle_runde + 1;
        const { gegner_name, gegner_avg, turnier_baum: newBaum } = generiereGegner({
          ...career, ...updates, turnier_baum: neuerBaum,
        });
        updates.gegner_name = gegner_name;
        updates.gegner_avg = gegner_avg;
        updates.turnier_baum = newBaum;
      }
    } else {
      updates.aktuelle_runde = career.aktuelle_runde + 1;
      const t = KALENDER[career.aktuelles_turnier_index];
      const pm = PRIZE_MONEY[t.typ] ?? PRIZE_MONEY["ProTour"];

      if (neuerBaum.length === 1) {
        const geld = pm.win;
        addToOoM(career, updates, geld);
        updates.bank_konto = (updates.bank_konto ?? career.bank_konto) + geld;
        updates.letzte_schlagzeile = generiereSchlagzeile(career.spieler_name, t.name, "Finale", true, my_avg);

        if (!achievements.first_title?.unlocked) {
          achievements.first_title.unlocked = true;
          msgs.push("⭐ Silberzeug! Erstes Turnier gewonnen!");
        }
        if (t.typ === "Major" && !achievements.first_major?.unlocked) {
          achievements.first_major = achievements.first_major || {};
          achievements.first_major.unlocked = true;
          msgs.push("👑 MAJOR CHAMPION! Du hast dein erstes Major gewonnen!");
        }
        msgs.push(`🏆 TURNIERSIEG! ${t.name} gewonnen! Preisgeld: £${geld.toLocaleString()}`);

        // Add to history
        const turnier_verlauf: any[] = [...((career.turnier_verlauf ?? []) as any[])];
        turnier_verlauf.unshift({ name: t.name, typ: t.typ, runde: "Finale", ergebnis: "Sieg", preisgeld: geld, saison: career.saison_jahr, avg: my_avg });
        updates.turnier_verlauf = turnier_verlauf.slice(0, 100);

        updates.turnier_laeuft = false;
        updates.aktuelle_runde = 0;
        updates.turnier_baum = [];
        const { msgs: nextMsgs, updates: nextUpdates } = nextTurnier({ ...career, ...updates });
        msgs.push(...nextMsgs);
        Object.assign(updates, nextUpdates);
      } else {
        const { gegner_name, gegner_avg, turnier_baum: newBaum } = generiereGegner({
          ...career, ...updates, turnier_baum: neuerBaum,
        });
        updates.gegner_name = gegner_name;
        updates.gegner_avg = gegner_avg;
        updates.turnier_baum = newBaum;
      }
    }
  } else {
    if (career.hat_tourcard) {
      const t = KALENDER[career.aktuelles_turnier_index];
      const pm = PRIZE_MONEY[t.typ] ?? PRIZE_MONEY["ProTour"];
      const trostGeld = pm.rd_exit(career.aktuelle_runde);
      addToOoM(career, updates, trostGeld);
      updates.bank_konto = (updates.bank_konto ?? career.bank_konto) + trostGeld;
      msgs.push(`❌ Ausgeschieden. Preisgeld gesichert: £${trostGeld.toLocaleString()}`);
      const rundenName = getRundenInfo(neuerBaum, true, career.aktuelles_turnier_index).name;
      updates.letzte_schlagzeile = generiereSchlagzeile(career.spieler_name, t.name, rundenName, false, my_avg, turnier_sieger);

      // Add to history
      const turnier_verlauf: any[] = [...((career.turnier_verlauf ?? []) as any[])];
      turnier_verlauf.unshift({ name: t.name, typ: t.typ, runde: rundenName, ergebnis: "Niederlage", preisgeld: trostGeld, saison: career.saison_jahr, avg: my_avg });
      updates.turnier_verlauf = turnier_verlauf.slice(0, 100);
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

  const newOoM = updates.order_of_merit_geld ?? career.order_of_merit_geld;
  const platz = ermittlePlatz(career.bot_rangliste as any[], career.spieler_name, newOoM);

  if (platz <= 64 && !achievements.top64?.unlocked) {
    achievements.top64.unlocked = true;
    msgs.push("⭐ Achievement: Etabliert! Du bist in den Top 64!");
  }
  if (platz <= 16 && !achievements.top16?.unlocked) {
    achievements.top16.unlocked = true;
    msgs.push("⭐ Achievement: Elite! Du bist in den Top 16!");
  }
  if (platz <= 8 && !achievements.top8?.unlocked) {
    achievements.top8 = achievements.top8 || { name: "World Class", desc: "Erreiche die Top 8 der Welt.", unlocked: false };
    achievements.top8.unlocked = true;
    msgs.push("⭐ Achievement: World Class! Du bist in den Top 8 der Welt!");
  }
  if (newOoM >= 1000000 && !achievements.millionaire?.unlocked) {
    achievements.millionaire = achievements.millionaire || {};
    achievements.millionaire.unlocked = true;
    msgs.push("💰 MILLIONÄR! Du hast £1.000.000 auf der Order of Merit verdient!");
  }

  updates.achievements = achievements;

  // Phase 2: Social follower updates
  let followerZuwachs = win ? 50 : 5;
  followerZuwachs += my_180s * 15;
  if (my_hf >= 150) followerZuwachs += 200;
  else if (my_hf >= 120) followerZuwachs += 100;
  else if (my_hf >= 100) followerZuwachs += 60;
  const neueSerie = updates.aktuelle_serie ?? 0;
  if (neueSerie === 3) followerZuwachs += 100;
  if (neueSerie === 5) followerZuwachs += 200;
  if (istTurnierSieg) followerZuwachs += 500;
  updates.social_follower = (career.social_follower ?? 0) + followerZuwachs;

  // Phase 2: Zeitungsartikel generieren und in Feed prependen
  const turniername = career.hat_tourcard
    ? KALENDER[career.aktuelles_turnier_index]?.name ?? ""
    : `Q-School`;
  const artikel = generateZeitungsartikel(
    career.spieler_name, gegner_name, win, legs_won, legs_lost,
    my_avg, my_180s, my_hf, turniername, aktuellRundenName,
    neueSerie, istTurnierSieg
  );
  if (artikel) {
    const feed = [...((career.nachrichten_feed ?? []) as any[])];
    updates.nachrichten_feed = [
      { ...artikel, datum: new Date().toISOString(), id: Date.now().toString() },
      ...feed,
    ].slice(0, 20);
  }

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

  // Per-player lookup for tooltips in the bracket
  const botForm = career.bot_form as Record<string, number>;
  const turnier_bot_info: Record<string, { avg: number; form: string; geld: number; level: number }> = {};
  turnier_baum.forEach((bot: any) => {
    const fv = botForm[bot.name] ?? 0;
    const form = fv >= 3 ? "🔥 Topform" : fv >= 1 ? "📈 Aufsteigend" : fv <= -3 ? "❄️ Kaltform" : fv <= -1 ? "📉 Absteigend" : "➡️ Normalform";
    const geldEntry = (career.bot_rangliste as any[]).find((b: any) => b.name === bot.name);
    turnier_bot_info[bot.name] = {
      avg: bot.avg ?? 0,
      form,
      geld: geldEntry?.geld ?? 0,
      level: avgToAutodartsBotLevel(bot.avg ?? 60),
    };
  });

  const h2h: Record<string, { siege: number; niederlagen: number }> = career.h2h ?? {};
  const h2hStats = h2h[career.gegner_name] ?? { siege: 0, niederlagen: 0 };
  const runden_info = getRundenInfo(turnier_baum, career.hat_tourcard, career.aktuelles_turnier_index);
  const walk_on_video = WALK_ON_VIDEOS[career.gegner_name] ?? null;
  const gegner_form = getGegnerForm(career.gegner_name, career.bot_form ?? {});

  return {
    spieler_name: career.spieler_name,
    name_set: career.name_set ?? false,
    hat_tourcard: career.hat_tourcard,
    q_school_punkte: career.q_school_punkte,
    order_of_merit_geld: career.order_of_merit_geld,
    bank_konto: career.bank_konto,
    saison_jahr: career.saison_jahr,
    turnier_laeuft: career.turnier_laeuft,
    aktuelle_runde: career.aktuelle_runde,
    gegner_name: career.gegner_name,
    gegner_avg: career.gegner_avg,
    gegner_form,
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
    turnier_bot_info,
    h2h_siege: h2hStats.siege,
    h2h_niederlagen: h2hStats.niederlagen,
    walk_on_video,
    ranking_verlauf: career.ranking_verlauf ?? [],
    avg_bonus: career.avg_bonus ?? 0,
    checkout_bonus: career.checkout_bonus ?? 0,
    schwierigkeitsgrad: career.schwierigkeitsgrad ?? 5,
    spieler_avg: career.spieler_avg ?? 60,
    spieler_bot_level: avgToAutodartsBotLevel(career.spieler_avg ?? 60),
    gegner_bot_level: avgToAutodartsBotLevel(career.gegner_avg ?? 75),
    gegner_platz: (() => {
      const sorted = [...(career.bot_rangliste as any[])].sort((a, b) => b.geld - a.geld);
      const idx = sorted.findIndex((b) => b.name === career.gegner_name);
      return idx >= 0 ? idx + 1 : null;
    })(),
    gegner_oom_geld: (() => {
      const bot = (career.bot_rangliste as any[]).find((b) => b.name === career.gegner_name);
      return bot ? bot.geld : null;
    })(),
    turnier_runden_log: career.turnier_runden_log ?? [],
    // Phase 1: RPG features
    aktuelle_serie: career.aktuelle_serie ?? 0,
    match_herausforderung: career.match_herausforderung ?? null,
    ist_angstgegner: (() => {
      const h2hRec = (career.h2h as any)[career.gegner_name ?? ""] ?? { siege: 0, niederlagen: 0 };
      return h2hRec.niederlagen >= 3 && h2hRec.niederlagen > h2hRec.siege;
    })(),
    // Phase 2: Social & News
    social_follower: career.social_follower ?? 0,
    nachrichten_feed: ((career.nachrichten_feed ?? []) as any[]).slice(0, 20),
    gegner_social_post: career.turnier_laeuft && career.gegner_name
      ? generateSocialPost(career.gegner_name, career.spieler_name, career)
      : null,
    // Phase 3: Premier League / Grand Slam / Rolling OoM
    pl_tabelle: career.pl_tabelle ?? null,
    gs_gruppe: career.gs_gruppe ?? null,
    oom_saisons: career.oom_saisons ?? {},
    turnier_modus: (() => {
      if (!career.hat_tourcard) return null;
      const t = KALENDER[career.aktuelles_turnier_index];
      if ((t as any).modus) return (t as any).modus;
      if (t.typ === "PremierLeague") return "premier_league";
      if ((t as any).gruppenphase) return "gruppenphase";
      return null;
    })(),
  };
}

export function buildCalendar(career: any) {
  const platz = ermittlePlatz(career.bot_rangliste, career.spieler_name, career.order_of_merit_geld);
  return KALENDER.map((t, index) => {
    const qualifiziert = !t.min_platz || platz <= t.min_platz;
    let status = "upcoming";
    if (index < career.aktuelles_turnier_index) status = "played";
    else if (index === career.aktuelles_turnier_index) status = career.turnier_laeuft ? "live" : "next";
    return { index, name: t.name, typ: t.typ, format: t.format, min_platz: t.min_platz ?? null, status, qualifiziert, gruppenphase: (t as any).gruppenphase ?? false, modus: (t as any).modus ?? null };
  });
}

export function buildEquipment(career: any) {
  const owned: string[] = career.equipment ?? [];
  return EQUIPMENT_CATALOG.map((item) => ({ ...item, owned: owned.includes(item.id) }));
}

export async function buyEquipment(id: string) {
  const career = await getOrCreateCareer();
  const item = EQUIPMENT_CATALOG.find((e) => e.id === id);
  if (!item) return { career: buildCareerState(career), messages: ["❌ Artikel nicht gefunden."] };

  const owned: string[] = [...(career.equipment as string[])];
  if (owned.includes(id)) return { career: buildCareerState(career), messages: ["Du besitzt diesen Artikel bereits."] };

  if (career.bank_konto < item.preis)
    return { career: buildCareerState(career), messages: [`❌ Nicht genug Geld! Du brauchst £${item.preis.toLocaleString()}.`] };

  owned.push(id);
  let avg_bonus = career.avg_bonus ?? 0;
  let checkout_bonus = career.checkout_bonus ?? 0;

  if (item.bonus_typ === "avg") avg_bonus += item.bonus_wert;
  if (item.bonus_typ === "checkout") checkout_bonus += item.bonus_wert;
  if (item.bonus_typ === "coaching") {
    avg_bonus += item.bonus_wert;
    checkout_bonus += 1.0;
  }

  await saveCareer({
    bank_konto: career.bank_konto - item.preis,
    equipment: owned,
    avg_bonus,
    checkout_bonus,
  });
  return { career: buildCareerState(await getOrCreateCareer()), messages: [`✅ ${item.name} gekauft! Bonus aktiv.`] };
}

// ── Autodarts Token Management ────────────────────────────────────────────────
const AUTODARTS_TOKEN_URL = "https://login.autodarts.io/realms/autodarts/protocol/openid-connect/token";
const AUTODARTS_CLIENT_ID = "autodarts-play";
const AUTODARTS_MATCHES_URL = "https://api.autodarts.io/as/v0/matches/filter?size=10&page=0&sort=-finished_at";
const AUTODARTS_LOBBIES_URL = "https://api.autodarts.io/gs/v0/lobbies";

let _cachedToken: string | null = null;
let _tokenExpiresAt: number = 0;

async function getAutodartsToken(): Promise<string> {
  const now = Date.now();
  if (_cachedToken && now < _tokenExpiresAt - 30_000) return _cachedToken;

  const refreshToken = process.env.AUTODARTS_REFRESH_TOKEN;
  if (!refreshToken) throw new Error("AUTODARTS_REFRESH_TOKEN nicht konfiguriert");

  const resp = await fetch(AUTODARTS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: AUTODARTS_CLIENT_ID,
      refresh_token: refreshToken,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token-Refresh fehlgeschlagen (${resp.status}): ${text}`);
  }
  const data = await resp.json();
  _cachedToken = data.access_token as string;
  _tokenExpiresAt = now + (data.expires_in ?? 300) * 1000;
  return _cachedToken;
}

async function autodartsGet(url: string): Promise<any> {
  const token = await getAutodartsToken();
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
  if (!resp.ok) throw new Error(`Autodarts API Fehler ${resp.status}`);
  return resp.json();
}

async function autodartsPost(url: string, body: object): Promise<any> {
  const token = await getAutodartsToken();
  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Autodarts API POST Fehler ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function autodartsDelete(url: string): Promise<void> {
  const token = await getAutodartsToken();
  await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

function parseAutodartsMatches(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data.items) return data.items;
  if (data.matches) return data.matches;
  return [];
}

function extractPlayerStats(career: any, players: any[]): { spieler: any; gegner: any } | null {
  let spieler: any = null;
  let gegner: any = null;
  for (const p of players) {
    if (p.name?.toLowerCase() === career.spieler_name.toLowerCase()) spieler = p;
    else gegner = p;
  }
  if (!spieler || !gegner) return null;
  return { spieler, gegner };
}

export async function pullFromAutodarts() {
  const career = await getOrCreateCareer();
  try {
    const data = await autodartsGet(AUTODARTS_MATCHES_URL);
    const matches = parseAutodartsMatches(data);

    if (!matches.length) return { career: buildCareerState(career), messages: ["❌ Keine Matches im Autodarts-Profil gefunden."] };

    const letztes_match = matches[0];
    const players = letztes_match.players ?? [];
    const pair = extractPlayerStats(career, players);

    if (pair) {
      const stats = pair.spieler.stats ?? {};
      const legs_won = pair.spieler.legs ?? 0;
      const legs_lost = pair.gegner.legs ?? 0;
      const my_avg = parseFloat(stats.average ?? 0);
      const my_180s = parseInt(stats["180s"] ?? 0);
      const my_hf = parseInt(stats.highestFinish ?? 0);
      const my_co_pct = parseFloat(stats.checkoutPercentage ?? 0);
      const result = await processResult(legs_won, legs_lost, my_avg, my_180s, my_hf, my_co_pct);
      result.messages.push("✅ Daten erfolgreich von Autodarts importiert!");
      return result;
    }
    return { career: buildCareerState(career), messages: ["❌ Dein Spielername wurde im letzten Match nicht gefunden."] };
  } catch (e: any) {
    return { career: buildCareerState(career), messages: [`Fehler beim Abrufen der Daten: ${e.message}`] };
  }
}

export async function pollAutodartsForNewMatch(since: string) {
  const career = await getOrCreateCareer();
  try {
    const sinceMs = new Date(since).getTime();
    const data = await autodartsGet(AUTODARTS_MATCHES_URL);
    const matches = parseAutodartsMatches(data);

    const newMatch = matches.find((m: any) => {
      const finished = m.finishedAt ?? m.createdAt;
      return finished && new Date(finished).getTime() > sinceMs;
    });

    if (!newMatch) {
      return { found: false, career: buildCareerState(career), messages: [] };
    }

    const players = newMatch.players ?? [];
    const pair = extractPlayerStats(career, players);

    if (!pair) {
      return { found: false, career: buildCareerState(career), messages: ["❌ Dein Spielername im neuen Match nicht gefunden."] };
    }

    const stats = pair.spieler.stats ?? {};
    const legs_won = pair.spieler.legs ?? 0;
    const legs_lost = pair.gegner.legs ?? 0;
    const my_avg = parseFloat(stats.average ?? 0);
    const my_180s = parseInt(stats["180s"] ?? 0);
    const my_hf = parseInt(stats.highestFinish ?? 0);
    const my_co_pct = parseFloat(stats.checkoutPercentage ?? 0);
    const result = await processResult(legs_won, legs_lost, my_avg, my_180s, my_hf, my_co_pct);
    result.messages.push("✅ Match automatisch von Autodarts importiert!");
    return { found: true, ...result };
  } catch (e: any) {
    return { found: false, career: buildCareerState(career), messages: [`Poll-Fehler: ${e.message}`] };
  }
}

export async function createAutodartsLobby() {
  const career = await getOrCreateCareer();
  const currentT = KALENDER[career.aktuelles_turnier_index ?? 0];

  const isDoubleIn = (currentT as any)?.modus === "double_in_out";
  const rundenInfo = getRundenInfo(
    career.turnier_baum as any[] ?? [],
    career.hat_tourcard,
    career.aktuelles_turnier_index ?? 0
  );
  const legs = rundenInfo.first_to;

  const lobbyBody = {
    variant: "X01",
    settings: {
      inMode: isDoubleIn ? "Double" : "Straight",
      outMode: "Double",
      bullMode: "25/50",
      maxRounds: 50,
      baseScore: 501,
    },
    bullOffMode: "Normal",
    legs,
    hasReferee: false,
    isPrivate: true,
  };

  try {
    const lobby = await autodartsPost(AUTODARTS_LOBBIES_URL, lobbyBody);
    const joinUrl = `https://play.autodarts.io/lobbies/${lobby.id}`;
    return {
      career: buildCareerState(career),
      lobby: { id: lobby.id, joinUrl, legs, isDoubleIn },
      messages: [`✅ Private Lobby erstellt! Öffne Autodarts und tritt bei.`],
    };
  } catch (e: any) {
    return { career: buildCareerState(career), lobby: null, messages: [`❌ Lobby-Erstellung fehlgeschlagen: ${e.message}`] };
  }
}

export async function deleteAutodartsLobby(lobbyId: string): Promise<void> {
  try {
    await autodartsDelete(`${AUTODARTS_LOBBIES_URL}/${lobbyId}`);
  } catch {}
}

export async function resetCareer() {
  await db.delete(careerTable).where(eq(careerTable.id, 1));
  const career = await getOrCreateCareer();
  return { career: buildCareerState(career), messages: ["🔄 Karriere wurde zurückgesetzt!"] };
}
