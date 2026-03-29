import { db, careerTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const WALK_ON_VIDEOS: Record<string, string> = {
  // Only verified real YouTube IDs — fakes removed
  "Michael van Gerwen": "zaJ1AC4wT3Y",
  "Luke Littler":       "I66tENw1feA",
  "Luke Humphries":     "x9bHvQc_VnU",
  "Gerwyn Price":       "HbDDzJvGguc",
  "Michael Smith":      "kLKK21m9tOo",
  "Peter Wright":       "HSTa28UTMUQ",
  "Gary Anderson":      "MWkDjHrMjvI",
  "Jonny Clayton":      "zFBkl4Y3cdo",
  "Jose de Sousa":      "fOJQiHKbFRU",
  "Rob Cross":          "g9sWxBF-78M",
  "Dimitri Van den Bergh": "t6_rVl63CXQ",
  "Nathan Aspinall":    "V7aeO3EFMHE",
  "Damon Heta":         "CmXOuX5dM34",
  "Raymond van Barneveld": "mVRHGVpbYgQ",
  "James Wade":         "nPXyHv5Lvfc",
  "Phil Taylor":        "4xgPnmJkKcU",
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

// ─── Echte PDC-Preisgelder ────────────────────────────────────────────────────
// rd[r] = Preisgeld beim Ausscheiden in Runde r (0-indiziert ab Turnierbeginn)
// Das letzte Element = Finalist-Preis; win = Siegerpreis

const TURNIER_PREISE: Record<string, { win: number; rd: number[] }> = {
  // ProTour Players Championships (128 Spieler)
  ProTour:                      { win: 15_000,  rd: [0, 250, 500, 1_000, 2_000, 4_000, 7_500] },
  // European Tour (64 Spieler)
  EuropeanTour:                 { win: 25_000,  rd: [0, 750, 1_500, 3_000, 6_000, 12_500] },
  // World Series of Darts (32 Spieler)
  WorldSeries:                  { win: 40_000,  rd: [0, 1_500, 3_500, 8_000, 20_000] },
  // Premier League – Nacht (8 Spieler, Gruppenphase)
  PremierLeague:                { win: 275_000, rd: [25_000] },

  // ── Majors (je nach Turniername individuell) ──────────────────────────────
  // UK Open (128 Spieler, legs)
  "UK Open":                    { win: 100_000, rd: [500, 1_000, 2_500, 5_000, 10_000, 20_000, 45_000] },
  // World Matchplay (32 Spieler, legs)
  "World Matchplay":            { win: 200_000, rd: [8_000, 15_000, 30_000, 60_000, 100_000] },
  // World Grand Prix (32 Spieler, sets, double-in/out)
  "World Grand Prix":           { win: 175_000, rd: [7_500, 15_000, 30_000, 60_000, 100_000] },
  // European Championship (32 Spieler, sets)
  "European Championship":      { win: 150_000, rd: [3_500, 7_000, 15_000, 32_500, 70_000] },
  // Grand Slam of Darts (32 Spieler + Gruppenphase, sets)
  "Grand Slam of Darts":        { win: 175_000, rd: [3_500, 7_000, 14_000, 30_000, 75_000] },
  // Players Championship Finals (64 Spieler, legs)
  "Players Championship Finals":{ win: 150_000, rd: [3_000, 7_000, 15_000, 30_000, 70_000, 100_000] },
  // PDC World Championship (96 Spieler, sets)
  "PDC World Championship":     { win: 500_000, rd: [5_000, 7_500, 12_500, 20_000, 50_000, 100_000, 200_000] },
};

// Premier League – Preisgeld nach Finalplatzierung (1. bis 4.)
// Finale: 275.000 / 125.000 / 60.000 / 25.000 je Nacht (vereinfacht als Nacht-Anteil)
const PL_PRIZE_POSITIONS = [275_000, 125_000, 60_000, 25_000];

function getTurnierPreisgeld(t: { name: string; typ: string }, runde: number): number {
  const table = TURNIER_PREISE[t.name] ?? TURNIER_PREISE[t.typ];
  if (!table) return 0;
  return table.rd[Math.min(runde, table.rd.length - 1)] ?? 0;
}
function getTurnierSiegerpreis(t: { name: string; typ: string }): number {
  return (TURNIER_PREISE[t.name] ?? TURNIER_PREISE[t.typ])?.win ?? 15_000;
}

// ─── Echte PDC-Spiellängen pro Turnier ───────────────────────────────────────
// Lookup: Turniername → { [spielerAnzahl]: { first_to, format } }
const TURNIER_FORMAT_TABLE: Record<string, Record<number, { first_to: number; format: string }>> = {
  // Players Championship (128 Spieler, legs, alle Runden BO11 außer SF/F)
  ProTour: {
    128: { first_to: 6, format: "legs" },
    64:  { first_to: 6, format: "legs" },
    32:  { first_to: 6, format: "legs" },
    16:  { first_to: 6, format: "legs" },
    8:   { first_to: 6, format: "legs" },
    4:   { first_to: 7, format: "legs" },
    2:   { first_to: 8, format: "legs" },
  },
  // European Tour (64 Spieler, legs)
  EuropeanTour: {
    64: { first_to: 6, format: "legs" },
    32: { first_to: 6, format: "legs" },
    16: { first_to: 6, format: "legs" },
    8:  { first_to: 6, format: "legs" },
    4:  { first_to: 7, format: "legs" },
    2:  { first_to: 8, format: "legs" },
  },
  // World Series (32 Spieler, legs)
  WorldSeries: {
    32: { first_to: 6, format: "legs" },
    16: { first_to: 6, format: "legs" },
    8:  { first_to: 6, format: "legs" },
    4:  { first_to: 7, format: "legs" },
    2:  { first_to: 8, format: "legs" },
  },
  // UK Open (128 Spieler, legs – wächst pro Runde)
  "UK Open": {
    128: { first_to: 6,  format: "legs" },
    64:  { first_to: 6,  format: "legs" },
    32:  { first_to: 6,  format: "legs" },
    16:  { first_to: 7,  format: "legs" },
    8:   { first_to: 8,  format: "legs" },
    4:   { first_to: 9,  format: "legs" },
    2:   { first_to: 10, format: "legs" },
  },
  // World Matchplay (32 Spieler, legs – echte PDC-Längen)
  "World Matchplay": {
    32: { first_to: 10, format: "legs" },
    16: { first_to: 11, format: "legs" },
    8:  { first_to: 13, format: "legs" },
    4:  { first_to: 14, format: "legs" },
    2:  { first_to: 18, format: "legs" },
  },
  // World Grand Prix (32 Spieler, sets, double-in/out)
  "World Grand Prix": {
    32: { first_to: 3, format: "sets" },
    16: { first_to: 3, format: "sets" },
    8:  { first_to: 4, format: "sets" },
    4:  { first_to: 5, format: "sets" },
    2:  { first_to: 7, format: "sets" },
  },
  // European Championship (32 Spieler, sets)
  "European Championship": {
    32: { first_to: 4, format: "sets" },
    16: { first_to: 4, format: "sets" },
    8:  { first_to: 5, format: "sets" },
    4:  { first_to: 6, format: "sets" },
    2:  { first_to: 7, format: "sets" },
  },
  // Grand Slam of Darts (Gruppenphase + KO ab L16, sets)
  "Grand Slam of Darts": {
    128: { first_to: 3, format: "sets" },
    16:  { first_to: 3, format: "sets" },
    8:   { first_to: 4, format: "sets" },
    4:   { first_to: 5, format: "sets" },
    2:   { first_to: 7, format: "sets" },
  },
  // Players Championship Finals (64 Spieler, legs)
  "Players Championship Finals": {
    64: { first_to: 6,  format: "legs" },
    32: { first_to: 7,  format: "legs" },
    16: { first_to: 9,  format: "legs" },
    8:  { first_to: 9,  format: "legs" },
    4:  { first_to: 10, format: "legs" },
    2:  { first_to: 11, format: "legs" },
  },
  // PDC World Championship (96 Spieler, sets – Sätze werden länger)
  "PDC World Championship": {
    96: { first_to: 3, format: "sets" },
    48: { first_to: 3, format: "sets" },
    32: { first_to: 4, format: "sets" },
    16: { first_to: 4, format: "sets" },
    8:  { first_to: 5, format: "sets" },
    4:  { first_to: 6, format: "sets" },
    2:  { first_to: 7, format: "sets" },
  },
};

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

// Simulates remaining tournament bracket and returns prize money per bot name.
// Called once per tournament end to make the bot_rangliste geld feel alive.
function simulateBotPreisverteilung(
  turnier_baum: any[],   // bracket at the START of the player's last round
  neuerBaum: any[],      // survivors after the player's last round
  playerName: string,
  currentRound: number,
  turnierEntry: { name: string; typ: string }
): Record<string, number> {
  const payouts: Record<string, number> = {};

  // Bots that lost in this round get the prize for that round
  for (const bot of turnier_baum) {
    if (bot.name === playerName) continue;
    if (!neuerBaum.find((n: any) => n.name === bot.name)) {
      payouts[bot.name] = (payouts[bot.name] ?? 0) + getTurnierPreisgeld(turnierEntry, currentRound);
    }
  }

  // Simulate remaining rounds, tracking which round each bot exits
  let sim = neuerBaum.filter((b: any) => b.name !== playerName);
  let roundNum = currentRound + 1;
  while (sim.length > 1) {
    const next: any[] = [];
    for (let i = 0; i < sim.length; i += 2) {
      const b1 = sim[i];
      const b2 = sim[i + 1];
      if (!b2) { next.push(b1); continue; }
      const p1 = Math.max(0.1, Math.min(0.9, 0.5 + (b1.avg - b2.avg) * 0.02));
      if (Math.random() < p1) {
        payouts[b2.name] = (payouts[b2.name] ?? 0) + getTurnierPreisgeld(turnierEntry, roundNum);
        next.push(b1);
      } else {
        payouts[b1.name] = (payouts[b1.name] ?? 0) + getTurnierPreisgeld(turnierEntry, roundNum);
        next.push(b2);
      }
    }
    sim = next;
    roundNum++;
  }
  // Tournament winner gets full prize
  if (sim.length === 1) {
    payouts[sim[0].name] = (payouts[sim[0].name] ?? 0) + getTurnierSiegerpreis(turnierEntry);
  }
  return payouts;
}

// Helper: get avg from level for named bots (not using name pattern)
function getBotAvgForLevel(level: number, formBonus: number = 0): number {
  const [min, max] = AUTODARTS_LEVEL_RANGES[level] ?? [55, 75];
  return Math.round((rand(min, max) + formBonus) * 10) / 10;
}

// Generate Q-School bots: mostly weaker than the player (centre = playerLevel - 1.5, σ=0.9)
// Q-School is a qualifying event — the player should be competitive, not overwhelmed.
function generateQSchoolBots(playerLevel: number, count: number): { name: string; level: number }[] {
  const shuffled = [...BOT_NAME_POOL].sort(() => Math.random() - 0.5);
  const bots: { name: string; level: number }[] = [];
  // Centre distribution 1.5 levels below player; cap max at playerLevel (no bot stronger)
  const center = playerLevel - 1.5;
  for (let i = 0; i < count; i++) {
    const u = Math.max(1e-10, Math.random());
    const v = Math.random();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    const raw = center + z * 0.9;
    // Hard cap: no Q-School bot is stronger than the player's own level
    const level = Math.max(1, Math.min(playerLevel, Math.round(raw)));
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
    96:  "Letzte 96",
    64:  "Letzte 64",
    48:  "Letzte 48",
    32:  "Letzte 32",
    16:  "Achtelfinale",
    8:   "Viertelfinale",
    4:   "Halbfinale",
    2:   "Finale",
  };
  const aktuell = turnier_baum.length || 128;
  const name = rundenNamen[aktuell] ?? `Runde ${aktuell}`;

  if (!hat_tourcard) return { name, first_to: 5, format: "legs" };

  const t = KALENDER[aktuelles_turnier_index];

  if (t.typ === "PremierLeague") return { name: "Liga-Abend", first_to: 7, format: "legs" };

  // Grand Slam Gruppenphase
  if ((t as any).gruppenphase && aktuell >= 128) return { name: "Gruppenphase", first_to: 3, format: "sets" };

  // Look up by tournament name, then by typ
  const formatMap = TURNIER_FORMAT_TABLE[t.name] ?? TURNIER_FORMAT_TABLE[t.typ];
  if (formatMap) {
    const fmt = formatMap[aktuell];
    if (fmt) return { name, first_to: fmt.first_to, format: fmt.format };
    // Nearest smaller key as fallback
    const keys = Object.keys(formatMap).map(Number).sort((a, b) => b - a);
    for (const k of keys) {
      if (aktuell >= k) return { name, first_to: formatMap[k].first_to, format: formatMap[k].format };
    }
  }

  // Final fallback
  return { name, first_to: 6, format: t.format ?? "legs" };
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
  const gesamtSiege = h2hRecord.siege + h2hRecord.niederlagen;

  let pool: string[];
  if (ist_angstgegner) {
    pool = [
      `Wieder mal gegen ${spieler_name}. Kenne seinen Stil in- und auswendig. Freue mich drauf 😈`,
      `${spieler_name} hat sich gut entwickelt – das gebe ich zu. Aber der direkte Vergleich spricht für mich. Let's go! 🎯`,
      `Guten Morgen alle. Heute gegen ${spieler_name}. Ich kenne jede seiner Schwächen. 😏`,
      `${spieler_name} als nächster Gegner. Interessant. Wir kennen uns inzwischen ganz gut. 👀`,
      `Das wird heute Abend ein spannendes Duell. ${spieler_name} ist kein Gegner zum Unterschätzen – aber ich bin bereit. 🔥`,
      `Matchday! Gegen ${spieler_name}. Alles passiert aus einem Grund. Lass uns liefern. 💯`,
    ];
  } else if (serie >= 5) {
    pool = [
      `${spieler_name} läuft derzeit heiß. Aber jede Siegesserie braucht einen Gegner, der sie bricht. Das bin ich. 🏹`,
      `Fünf Siege in Folge? Respekt, ${spieler_name}. Heute ist Nummer sechs fällig – oder die Serie endet hier. 😤`,
      `Man redet viel über ${spieler_name} gerade... Mal sehen ob die Strähne heute Abend hält. 😏`,
      `Ich mag Underdog-Rollen. ${spieler_name} ist in Form – perfekt. Ich erst recht. 🎯`,
      `Heute ist kein normaler Matchday. ${spieler_name} vs. mich. Serie vs. Stopper. Bin dabei. ⚡`,
    ];
  } else if (serie >= 3) {
    pool = [
      `Man redet viel über ${spieler_name} gerade... Mal sehen ob die Strähne heute Abend hält. 😏`,
      `${spieler_name} spielt gut zuletzt – das stimmt. Aber heute testet er diese Form gegen mich. 💪`,
      `Jeder Lauf endet irgendwann. Heute wäre ein guter Zeitpunkt dafür. 🏹`,
      `${spieler_name} in Form. Ich auch. Wird ein gutes Match. Let's see. 🎯`,
      `Matchday! Gut ausgeruht, gut vorbereitet. ${spieler_name} wartet – ich auch. 👊`,
    ];
  } else if (h2hRecord.niederlagen > 0 && h2hRecord.niederlagen >= h2hRecord.siege) {
    pool = [
      `Letzte Begegnung gegen ${spieler_name} war schmerzhaft. Heute sieht das ganz anders aus! ⚡`,
      `${spieler_name} hatte letztes Mal einfach Glück. Heute spielen wir es sauber durch. Rematch! 🏆`,
      `Immer wieder gerne gegen ${spieler_name}. Letztes Mal war ein Ausrutscher. Heute nicht. 🎯`,
      `H2H gegen ${spieler_name}: ich schulde noch was. Zahle heute zurück. 😤`,
      `Rematch-Time! ${spieler_name} war beim letzten Mal besser. Heute kommt meine Antwort. 🔥`,
      `Ich habe unser letztes Match analysiert. Ich weiß genau was ich anders machen werde. ${spieler_name} wird überrascht sein. 📊`,
    ];
  } else if (gesamtSiege === 0) {
    pool = [
      `Erstes Aufeinandertreffen mit ${spieler_name}. Bin gespannt! Neues Match, neue Chance. 🎯`,
      `${spieler_name} als Gegner – kenne seine Statistiken, kenne seinen Stil. Bereit! 📊`,
      `Heute zum ersten Mal gegen ${spieler_name}. Das wird interessant. Lass es uns angehen. 💪`,
      `Debüt gegen ${spieler_name} heute. Freue mich auf ein tolles Match! 🎉`,
    ];
  } else {
    pool = [
      `Heute steht ${spieler_name} auf meiner Seite des Brackets. Konzentriert und bereit! 🎯`,
      `Match heute gegen ${spieler_name}. Alles vorbereitet, Zeit zu liefern. 💪`,
      `Freue mich auf das Spiel gegen ${spieler_name}. Gutes Match erwartet! 👊`,
      `Fokus. Vorbereitung. Heute gegen ${spieler_name} – let's make it count! 🏹`,
      `Anpfiff! Gegen ${spieler_name} heute. Gut vorbereitet und heiß auf das Match. ✅`,
      `Matchday-Vibes. Gegen ${spieler_name}. Ich liebe diesen Sport. 🎯`,
      `${spieler_name} heute. Kaffee getrunken, Pfeile gewärmt, bereit. Let's go! ☕🎯`,
      `Guter Schlaf, gutes Frühstück, guter Gegner. ${spieler_name} – wir sehen uns auf der Bühne. 🏟️`,
      `Heute gegen ${spieler_name}. Meine Pfeile sind scharf. Bin ich. 😏`,
      `Ein Tag, ein Gegner, ein Ziel: ${spieler_name} schlagen. Fokussiert und ready. 🔥`,
      `${spieler_name} ist ein starker Gegner. Bin ich auch. Das wird gut. 👏`,
      `Reise abgeschlossen, Hotel ok, Board eingestellt. Heute gegen ${spieler_name}. Komm schon. 🎯`,
    ];
  }

  const inhalt = seededPick(pool, seed);
  const quelle = seededPick(["X / Twitter", "Instagram", "TikTok", "Facebook"], seed + "q");
  return { autor: gegner_name, inhalt, quelle };
}

const ZEITUNGS_QUELLEN = [
  "PDC Tour News", "Darts World", "Bulls Eye Blog", "Pro Darts Weekly",
  "Arrows & Aces", "Double Out Daily", "The Darts Chronicle", "Tungsten Tribune",
  "180 Report", "Checkout Weekly", "Dart Sport Magazin", "PDC Fan Blog",
  "Arrows Post", "Stage Fright Weekly", "Treble Top Times",
];
const ZEITUNGS_AUTOREN = [
  "Martin Hoffmann", "Klaus Werner", "Stefan Braun", "Thomas Reuter", "Redaktion",
  "Angela Müller", "Bernd Schulze", "Christine Koch", "Dirk Lange", "Eva Richter",
  "Frank Bergmann", "Gabi Sommer", "Hendrik Vogt", "Ines Kraft", "Jürgen Feld",
];

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
  const ergebnis = `${legs_won}:${legs_lost}`;
  const avgStr = my_avg.toFixed(2);

  // ── Turniersieg ───────────────────────────────────────────────────────────
  if (ist_turnier_sieg) {
    const sieg_templates = [
      { titel: `🏆 TURNIERSIEG! ${spieler_name} gewinnt den ${turnier_name}`, inhalt: `In einem dominanten Auftritt sichert sich ${spieler_name} den Titel beim ${turnier_name}. Im Finale gegen ${gegner_name} setzte sich der Spieler mit ${ergebnis} durch. Starker Average von ${avgStr} unterstreicht die Klasse des Siegers.` },
      { titel: `Champione! ${spieler_name} krönt sich beim ${turnier_name}`, inhalt: `Es gibt einen neuen Champion! ${spieler_name} schlug ${gegner_name} im Finale mit ${ergebnis} und schreibt damit Geschichte. Average: ${avgStr}. Eine Leistung, die Fans noch lange in Erinnerung bleiben wird.` },
      { titel: `${spieler_name} triumphiert beim ${turnier_name} – Finale gegen ${gegner_name}`, inhalt: `Unvergesslicher Abend beim ${turnier_name}: ${spieler_name} besiegt ${gegner_name} mit ${ergebnis} und sichert sich den Titel. Mit einem Average von ${avgStr} war der Sieg hochverdient.` },
      { titel: `Großartig! ${spieler_name} ist Sieger beim ${turnier_name}`, inhalt: `${spieler_name} hat es geschafft! Im Finale ließ der Spieler ${gegner_name} keine Chance (${ergebnis}) und holte sich den begehrten Titel beim ${turnier_name}. Karrierehighlight mit Average ${avgStr}.` },
      { titel: `König der Bühne: ${spieler_name} gewinnt ${turnier_name}`, inhalt: `Was für ein Auftritt! ${spieler_name} dominierte das Finale gegen ${gegner_name} mit ${ergebnis} beim ${turnier_name}. Die Zuschauer erlebten Darts auf höchstem Niveau – Average des Siegers: ${avgStr}.` },
    ];
    return { ...sieg_templates[Math.floor(Math.random() * sieg_templates.length)], quelle, autor, wichtigkeit: "hoch" };
  }

  // ── 170er Finish (Big Fish) ───────────────────────────────────────────────
  if (my_hf === 170 && win) {
    return {
      titel: `THE BIG FISH! ${spieler_name} checkt den Maximum-Checkout beim ${turnier_name}`,
      inhalt: `Geschichte geschrieben! ${spieler_name} vollbrachte beim ${turnier_name} das seltene 170-Finish gegen ${gegner_name}. Das Tagesmaximum im Checkout – eine Leistung, die die Fans von den Stühlen riss. Endergebnis: ${ergebnis}, Average: ${avgStr}.`,
      quelle, autor, wichtigkeit: "hoch",
    };
  }

  // ── High Finish 150+ ──────────────────────────────────────────────────────
  if (my_hf >= 150 && win) {
    const hf_templates = [
      { titel: `Atemberaubend! ${spieler_name} checkt ${my_hf} beim ${turnier_name}`, inhalt: `Beim ${turnier_name} sorgte ${spieler_name} für das Highlight des Tages. Ein ${my_hf}-Finish krönte den ${ergebnis}-Sieg gegen ${gegner_name}. Average: ${avgStr}. Solche Momente machen Darts zu einem Spektakel!` },
      { titel: `${my_hf}-Hammer! ${spieler_name} lässt die Halle beben`, inhalt: `Mit einem spektakulären ${my_hf}-Checkout beim ${turnier_name} sorgte ${spieler_name} für Begeisterungsstürme. Der ${ergebnis}-Sieg gegen ${gegner_name} war verdient – der Checkout unvergesslich. Average: ${avgStr}.` },
      { titel: `Klass-Checkout! ${spieler_name} mit ${my_hf} gegen ${gegner_name}`, inhalt: `${spieler_name} zeigte beim ${turnier_name} warum er zu den Besten gehört: ${my_hf}-Finish, ${ergebnis}-Sieg gegen ${gegner_name}. Average von ${avgStr} unterstreicht die Tagesform des Spielers.` },
    ];
    return { ...hf_templates[Math.floor(Math.random() * hf_templates.length)], quelle, autor, wichtigkeit: "hoch" };
  }

  // ── High Finish 120-149 ───────────────────────────────────────────────────
  if (my_hf >= 120 && win) {
    const hf_templates = [
      { titel: `Spektakuläres ${my_hf}-Finish von ${spieler_name} beim ${turnier_name}`, inhalt: `Mit einem beeindruckenden ${my_hf}-Checkout überraschte ${spieler_name} beim ${turnier_name} und bezwang ${gegner_name} mit ${ergebnis}. Average: ${avgStr}.` },
      { titel: `${spieler_name} mit starkem ${my_hf}-Checkout – ${ergebnis} gegen ${gegner_name}`, inhalt: `Beim ${turnier_name} bewies ${spieler_name} einmal mehr seine Klasse: Ein ${my_hf}-Finish krönte den verdienten ${ergebnis}-Sieg über ${gegner_name}. Average: ${avgStr}.` },
      { titel: `Wow! ${my_hf}-Finish von ${spieler_name} sorgt für Aufsehen beim ${turnier_name}`, inhalt: `${spieler_name} brachte die Fans beim ${turnier_name} zum Staunen: ${my_hf}-Checkout, ${ergebnis} gegen ${gegner_name}. Average: ${avgStr}. Eine Leistung der Extraklasse.` },
    ];
    return { ...hf_templates[Math.floor(Math.random() * hf_templates.length)], quelle, autor, wichtigkeit: "hoch" };
  }

  // ── Viele 180er ──────────────────────────────────────────────────────────
  if (my_180s >= 5) {
    return {
      titel: `${my_180s}× Maximum – ${spieler_name} liefert ein Feuerwerk beim ${turnier_name}`,
      inhalt: `Sensationelle Scoring-Leistung von ${spieler_name} beim ${turnier_name}: Fünf oder mehr 180er im selben Match gegen ${gegner_name}! Der ${ergebnis}-Sieg war begleitet von einem begeisterten Publikum. Average: ${avgStr}.`,
      quelle, autor, wichtigkeit: "hoch",
    };
  }
  if (my_180s >= 3 && win) {
    const max_templates = [
      { titel: `${my_180s}× Maximum! ${spieler_name} dominiert ${gegner_name} beim ${turnier_name}`, inhalt: `Mit ${my_180s} perfekten Aufnahmen zeigte ${spieler_name} eine außergewöhnliche Leistung beim ${turnier_name}. ${ergebnis}-Sieg gegen ${gegner_name}. Average: ${avgStr}.` },
      { titel: `Maximale Power: ${spieler_name} trifft ${my_180s}× die 180 beim ${turnier_name}`, inhalt: `${spieler_name} war beim ${turnier_name} in Höchstform und warf ${my_180s} Maximalaufnahmen. Der ${ergebnis}-Triumph über ${gegner_name} war eindrucksvoll. Average: ${avgStr}.` },
    ];
    return { ...max_templates[Math.floor(Math.random() * max_templates.length)], quelle, autor, wichtigkeit: "hoch" };
  }

  // ── Siegesserie ───────────────────────────────────────────────────────────
  if (serie >= 7 && win) {
    return {
      titel: `${serie}. Sieg in Folge! ${spieler_name} dominiert die PDC-Tour`,
      inhalt: `${spieler_name} ist die Sensation der Saison! Mit dem ${ergebnis}-Sieg gegen ${gegner_name} beim ${turnier_name} stellt der Spieler eine Serie auf, die seinesgleichen sucht. Average: ${avgStr}. Wer stoppt diese Maschine?`,
      quelle, autor, wichtigkeit: "hoch",
    };
  }
  if (serie >= 5 && win) {
    return {
      titel: `Heiße Strähne: ${spieler_name} feiert ${serie}. Sieg in Folge beim ${turnier_name}`,
      inhalt: `${spieler_name} ist nicht zu stoppen! Mit dem ${ergebnis}-Triumph gegen ${gegner_name} beim ${turnier_name} setzt der Spieler seine beeindruckende Serie fort. Die Konkurrenz schaut nervös zu. Average: ${avgStr}.`,
      quelle, autor, wichtigkeit: "hoch",
    };
  }

  // ── Sehr hoher Average ────────────────────────────────────────────────────
  if (my_avg >= 100 && win) {
    return {
      titel: `Dreistellig! ${spieler_name} mit ${avgStr}-Average beim ${turnier_name}`,
      inhalt: `Elite-Leistung von ${spieler_name} beim ${turnier_name}: Mit einem dreistelligen Average von ${avgStr} war der ${ergebnis}-Sieg gegen ${gegner_name} nahezu perfektes Darts. Braucht dieser Spieler einen Spitznamen?`,
      quelle, autor, wichtigkeit: "hoch",
    };
  }
  if (my_avg >= 90 && win) {
    return {
      titel: `${avgStr}-Average! ${spieler_name} spielt sich in Form beim ${turnier_name}`,
      inhalt: `Starke Vorstellung von ${spieler_name} beim ${turnier_name}: ${avgStr}-Average und ${ergebnis} gegen ${gegner_name}. Das Scoring war auf Top-Niveau – der Spieler ist voll im Rhythmus.`,
      quelle, autor, wichtigkeit: "normal",
    };
  }

  // ── Normale Siege ─────────────────────────────────────────────────────────
  if (win) {
    if (Math.random() > 0.65) return null;
    const win_templates = [
      { titel: `${spieler_name} souverän: ${ergebnis} gegen ${gegner_name} beim ${turnier_name}`, inhalt: `Im ${runde_name} des ${turnier_name} überzeugte ${spieler_name} gegen ${gegner_name}. Der ${ergebnis}-Sieg war verdient. Average: ${avgStr}.` },
      { titel: `Solide Leistung: ${spieler_name} schlägt ${gegner_name} und zieht weiter`, inhalt: `${spieler_name} passiert die ${runde_name} beim ${turnier_name} mit einem ${ergebnis}-Sieg über ${gegner_name}. Average: ${avgStr}. Weiter geht's!` },
      { titel: `${spieler_name} kämpft sich durch: ${ergebnis} gegen ${gegner_name}`, inhalt: `Es war kein einfacher Tag, aber ${spieler_name} brachte es durch: ${ergebnis} gegen ${gegner_name} beim ${turnier_name}. Average: ${avgStr}.` },
      { titel: `Pflichtaufgabe erfüllt: ${spieler_name} gewinnt ${runde_name} beim ${turnier_name}`, inhalt: `${spieler_name} hat beim ${turnier_name} im ${runde_name} abgeliefert. ${gegner_name} wurde mit ${ergebnis} bezwungen. Average ${avgStr} – konzentrierte Leistung.` },
      { titel: `${spieler_name} marschiert weiter: ${ergebnis} im ${runde_name}`, inhalt: `Beim ${turnier_name} zeigte ${spieler_name} eine konzentrierte Vorstellung und schlug ${gegner_name} klar mit ${ergebnis}. Average von ${avgStr} stimmt zuversichtlich für die nächste Runde.` },
      { titel: `Starker Abend: ${spieler_name} überwindet ${gegner_name}`, inhalt: `${spieler_name} zeigte beim ${turnier_name} im ${runde_name} eine konstante Leistung und besiegte ${gegner_name} mit ${ergebnis}. Der Average von ${avgStr} spricht für gute Form.` },
    ];
    return { ...win_templates[Math.floor(Math.random() * win_templates.length)], quelle, autor, wichtigkeit: "normal" };
  }

  // ── Niederlagen ───────────────────────────────────────────────────────────
  if (Math.random() > 0.45) return null;
  const loss_templates = [
    { titel: `${spieler_name} scheidet im ${runde_name} beim ${turnier_name} aus`, inhalt: `${ergebnis}-Niederlage für ${spieler_name} gegen ${gegner_name} beim ${turnier_name}. Average: ${avgStr}. Das Ausscheiden im ${runde_name} wird schmerzen – aber es geht weiter.` },
    { titel: `Enttäuschung pur: ${spieler_name} scheitert früh bei ${turnier_name}`, inhalt: `"Da war mehr drin." Nach dem frühen Aus in der ${runde_name} hagelt es Kritik von Experten. ${gegner_name} war einfach stärker (${ergebnis}). Average: ${avgStr}. Ab ans Practice Board!` },
    { titel: `${gegner_name} zu stark: ${spieler_name} verliert beim ${turnier_name}`, inhalt: `${gegner_name} hatte heute beim ${turnier_name} den besseren Tag. ${spieler_name} verlor das Match im ${runde_name} mit ${ergebnis}. Average ${avgStr} reichte nicht aus. Zurück in die Vorbereitung.` },
    { titel: `Bitter! ${spieler_name} verpasst Weiterkommen beim ${turnier_name}`, inhalt: `${spieler_name} ist raus. Im ${runde_name} des ${turnier_name} setzte sich ${gegner_name} mit ${ergebnis} durch. Der Average von ${avgStr} war zu wenig für ein Weiterkommen.` },
    { titel: `${spieler_name} kämpft, verliert aber: ${ergebnis} gegen ${gegner_name}`, inhalt: `${spieler_name} gab alles, am Ende war ${gegner_name} stärker. Das ${ergebnis} beim ${turnier_name} zeigt: Es gibt noch Arbeit zu erledigen. Average: ${avgStr}.` },
    { titel: `Frühes Ende beim ${turnier_name} für ${spieler_name}`, inhalt: `Keine Kür beim ${turnier_name}: ${spieler_name} scheitert im ${runde_name} an ${gegner_name} (${ergebnis}). Der Average von ${avgStr} spiegelt eine durchwachsene Leistung wider. Nächste Gelegenheit kommt bestimmt.` },
  ];
  return { ...loss_templates[Math.floor(Math.random() * loss_templates.length)], quelle, autor, wichtigkeit: "normal" };
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

const SPONSOR_POOL = [
  { name: "Winmau",       logo: "🎯", kategorie: "Dartsausrüster" },
  { name: "Target",       logo: "🏹", kategorie: "Dartsausrüster" },
  { name: "Red Dragon",   logo: "🐉", kategorie: "Dartsausrüster" },
  { name: "Unicorn",      logo: "🦄", kategorie: "Dartsausrüster" },
  { name: "L-Style",      logo: "🇯🇵", kategorie: "Flights & Shafts" },
  { name: "Paddy Power",  logo: "🍀", kategorie: "Wettanbieter" },
  { name: "Betway",       logo: "💜", kategorie: "Wettanbieter" },
  { name: "Unibet",       logo: "🎲", kategorie: "Wettanbieter" },
  { name: "Bodog",        logo: "💰", kategorie: "Wettanbieter" },
  { name: "CAZOO",        logo: "🚗", kategorie: "Automobilhandel" },
  { name: "Lidl",         logo: "🛒", kategorie: "Einzelhandel" },
  { name: "Monster",      logo: "🟢", kategorie: "Energy Drink" },
  { name: "Red Bull",     logo: "🐂", kategorie: "Energy Drink" },
  { name: "Sky Sports",   logo: "📺", kategorie: "Medien" },
  { name: "Coral",        logo: "🪸", kategorie: "Wettanbieter" },
];

const ZIEL_POOL = [
  { typ: "180s",  ziel: 8,   belohnung: 1800, text: "Wirf 8x die 180" },
  { typ: "180s",  ziel: 15,  belohnung: 3200, text: "Wirf 15x die 180" },
  { typ: "180s",  ziel: 25,  belohnung: 5500, text: "Wirf 25x die 180" },
  { typ: "siege", ziel: 2,   belohnung: 2500, text: "Gewinne 2 Matches" },
  { typ: "siege", ziel: 4,   belohnung: 4500, text: "Gewinne 4 Matches" },
  { typ: "siege", ziel: 6,   belohnung: 7000, text: "Gewinne 6 Matches" },
  { typ: "hf",    ziel: 100, belohnung: 1500, text: "Checke ein 100+ Finish" },
  { typ: "hf",    ziel: 140, belohnung: 3500, text: "Checke ein 140+ Finish" },
  { typ: "hf",    ziel: 170, belohnung: 10000,text: "Checke die legendäre 170" },
  { typ: "spiele",ziel: 8,   belohnung: 2000, text: "Spiele 8 Matches" },
  { typ: "spiele",ziel: 15,  belohnung: 3800, text: "Spiele 15 Matches" },
  { typ: "avg",   ziel: 85,  belohnung: 2800, text: "Erreiche 85+ Average" },
  { typ: "avg",   ziel: 95,  belohnung: 5000, text: "Erreiche 95+ Average" },
];

function generiereEinSponsorAngebot(): any {
  const sponsor = SPONSOR_POOL[Math.floor(Math.random() * SPONSOR_POOL.length)];
  const ziel = ZIEL_POOL[Math.floor(Math.random() * ZIEL_POOL.length)];
  return {
    name: sponsor.name,
    logo: sponsor.logo,
    kategorie: sponsor.kategorie,
    ziel_typ: ziel.typ,
    ziel_wert: ziel.ziel,
    aktuell: 0,
    turniere_zeit: 5,
    belohnung: ziel.belohnung,
    text: ziel.text,
  };
}

export function acceptSponsor(career: any, index: number | null): { msgs: string[]; updates: any } {
  const msgs: string[] = [];
  const updates: any = { sponsor_angebote: null };
  if (index === null) {
    msgs.push("🚫 Alle Sponsorenangebote abgelehnt.");
    return { msgs, updates };
  }
  const angebote = career.sponsor_angebote as any[];
  const chosen = angebote?.[index];
  if (!chosen) return { msgs, updates };
  updates.aktiver_sponsor = chosen;
  msgs.push(`✅ Vertrag mit ${chosen.name} unterzeichnet! Ziel: ${chosen.text} in den nächsten 5 Turnieren. Bonus: £${chosen.belohnung.toLocaleString("en-GB")}`);
  return { msgs, updates };
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

    // Apply 50% decay to all bot_rangliste geld (simulates rolling 2-year OoM window)
    // Bots' older earnings fade out, keeping the ranking dynamic each season
    const currentBots = (updates.bot_rangliste ?? career.bot_rangliste) as any[];
    updates.bot_rangliste = currentBots.map((bot: any) => ({
      ...bot,
      geld: Math.round(bot.geld * 0.5),
    }));
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

  // Generate sponsor OFFERS for player to choose from (instead of auto-assign)
  let sponsor_angebote = career.sponsor_angebote ?? null;
  if (!aktiver_sponsor && !sponsor_angebote && career.hat_tourcard && Math.random() < 0.4) {
    // Deduplicate: generate 3 unique offers from different sponsors
    const anzahl = 3;
    const used = new Set<string>();
    const angebote: any[] = [];
    let versuche = 0;
    while (angebote.length < anzahl && versuche < 30) {
      versuche++;
      const a = generiereEinSponsorAngebot();
      if (!used.has(a.name)) {
        used.add(a.name);
        angebote.push(a);
      }
    }
    sponsor_angebote = angebote;
    msgs.push(`📩 ${anzahl} Sponsorenangebote eingegangen! Wähle jetzt deinen Vertrag.`);
  }

  updates.aktiver_sponsor = aktiver_sponsor;
  updates.sponsor_angebote = sponsor_angebote;
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

// ── Gegner-Reaktion Generator ────────────────────────────────────────────────
function generateGegnerReaktion(
  gegner_name: string,
  spieler_name: string,
  win: boolean,
  avg: number,
  h2h: { siege: number; niederlagen: number },
): { name: string; zitat: string; ton: "respekt" | "trotz" | "enttaeuscht" | "warnung" | "neutral" | "stolz" } {
  const erstbegegnung = h2h.siege + h2h.niederlagen <= 1;
  const dominiertVomSpieler = h2h.siege >= 3 && h2h.siege > h2h.niederlagen * 2;
  const angstgegnerFuerSpieler = h2h.niederlagen >= 3 && h2h.niederlagen > h2h.siege;

  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  if (win) {
    // Player beat the opponent
    if (erstbegegnung) {
      return { name: gegner_name, ton: "respekt", zitat: pick([
        `${spieler_name} hat mich überrascht. Gutes Spiel, aber das nächste Mal sieht es anders aus.`,
        `Respekt an ${spieler_name}. Heute war der Tag von ihm — beim nächsten Mal bin ich bereit.`,
        `Ich hab ${spieler_name} unterschätzt. Fehler gemacht, den ich nicht wieder machen werde.`,
      ]) };
    }
    if (angstgegnerFuerSpieler) {
      return { name: gegner_name, ton: "trotz", zitat: pick([
        `Ich hab ihn schon öfter besiegt und ich werd ihn wieder besiegen. Das hier war ein Ausrutscher.`,
        `${spieler_name} hat heute gewonnen. Aber ich kenne sein Spiel in- und auswendig.`,
        `Kein Grund zur Panik. Jeder verliert mal. Ich komme stärker zurück.`,
      ]) };
    }
    if (avg >= 90) {
      return { name: gegner_name, ton: "respekt", zitat: pick([
        `${spieler_name} hat heute absolut sensationell gespielt. Gegen so einen Average kann ich nichts machen.`,
        `Mit einem Average von über 90 — was soll ich da sagen? Heute war ${spieler_name} der bessere Spieler.`,
        `Glückwunsch. Das war Weltklasse-Darts von ${spieler_name}.`,
      ]) };
    }
    if (dominiertVomSpieler) {
      return { name: gegner_name, ton: "enttaeuscht", zitat: pick([
        `Ich muss ehrlich sein — ${spieler_name} ist im Moment einfach besser als ich. Das tut weh.`,
        `Das fängt an, mich zu nerven. Ich muss ernsthaft an meinem Spiel arbeiten.`,
        `${spieler_name} hat heute wieder gewonnen. Ich suche nach Antworten.`,
      ]) };
    }
    return { name: gegner_name, ton: "neutral", zitat: pick([
      `Gut gespielt, ${spieler_name}. Heute war dein Tag.`,
      `${spieler_name} hat verdient gewonnen. Ich war nicht auf meinem besten Niveau.`,
      `Eine Niederlage, die schmerzt. Aber ich werde zurückschlagen.`,
    ]) };
  } else {
    // Opponent beat the player
    if (erstbegegnung) {
      return { name: gegner_name, ton: "neutral", zitat: pick([
        `${spieler_name} ist ein solider Spieler. Ich hab heute gewonnen, aber das war keine einfache Partie.`,
        `Guter erster Auftritt von ${spieler_name}. Er wird in Zukunft noch gefährlicher werden.`,
        `Ich hab heute gewonnen, aber ${spieler_name} hat mich mehr gefordert als erwartet.`,
      ]) };
    }
    if (angstgegnerFuerSpieler) {
      return { name: gegner_name, ton: "stolz", zitat: pick([
        `${spieler_name} weiß genau, wie es sich anfühlt, gegen mich zu verlieren. Und das bleibt so.`,
        `Ich kenne sein Spiel in- und auswendig. Das macht den Unterschied.`,
        `Wieder gewonnen. Ich glaube, ${spieler_name} hat mir noch was gutzumachen.`,
      ]) };
    }
    if (avg >= 85) {
      return { name: gegner_name, ton: "warnung", zitat: pick([
        `${spieler_name} spielt immer besser. Heute hab ich gewonnen — aber er wird bald ganz oben sein.`,
        `Ich hab gewonnen, aber ${spieler_name} macht mir langsam Respekt. Der Typ ist gefährlich.`,
        `Knapper als erwartet. ${spieler_name} wird irgendwann schwer zu schlagen sein.`,
      ]) };
    }
    return { name: gegner_name, ton: "neutral", zitat: pick([
      `Ein solider Sieg. ${spieler_name} muss noch mehr Konstanz entwickeln.`,
      `Ich hab heute gewonnen. ${spieler_name} kämpft, aber es hat nicht gereicht.`,
      `${spieler_name} wird aus dieser Niederlage lernen — ich auch aus dem Match.`,
    ]) };
  }
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

  // Reset round log when starting a fresh tournament + snapshot current rank for delta display
  if (career.aktuelle_runde === 0) {
    updates.turnier_runden_log = [];
    updates.letzter_rang = ermittlePlatz(career.bot_rangliste, career.spieler_name, career.order_of_merit_geld);
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
  my_co_pct: number,
  autodarts_match_id?: string
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

  // ── Extended stats ───────────────────────────────────────────────────────
  if (my_avg > (career.stats_best_single_avg ?? 0)) {
    updates.stats_best_single_avg = my_avg;
    if (my_avg >= 80) msgs.push(`📈 Neuer persönlicher Rekord-Average: ${my_avg.toFixed(2)}!`);
  }
  if (my_180s > (career.stats_most_180s_game ?? 0)) {
    updates.stats_most_180s_game = my_180s;
    if (my_180s >= 3) msgs.push(`🎯 Neuer 180er-Rekord in einem Match: ${my_180s}×!`);
  }
  // Track co attempts+hits cumulatively
  const legsTotal = legs_won + legs_lost;
  if (legsTotal > 0 && my_co_pct > 0) {
    const coAttempted = Math.round(legsTotal * (100 / Math.max(my_co_pct, 1)));
    const coHit = legs_won + legs_lost > 0 ? Math.round(coAttempted * (my_co_pct / 100)) : 0;
    updates.stats_total_co_attempted = (career.stats_total_co_attempted ?? 0) + coAttempted;
    updates.stats_total_co_hit = (career.stats_total_co_hit ?? 0) + coHit;
  }

  // ── Wall of Fame: Top 10 best games ──────────────────────────────────────
  const turnier = KALENDER[career.aktuelles_turnier_index ?? 0];
  const spiel_eintrag = {
    datum: new Date().toISOString(),
    turnier_name: turnier?.name ?? "Unbekannt",
    gegner_name,
    ergebnis: `${legs_won}:${legs_lost}`,
    avg: my_avg,
    s180s: my_180s,
    hf: my_hf,
    co_pct: my_co_pct,
    win,
    autodarts_id: autodarts_match_id ?? null,
  };
  const bestSpiele: any[] = [...((career.beste_spiele ?? []) as any[])];
  bestSpiele.push(spiel_eintrag);
  // Sort by avg desc, keep top 10 best games (only wins qualify for wall of fame unless no wins yet)
  const nurSiege = bestSpiele.filter((s) => s.win);
  const sortedFame = (nurSiege.length >= 3 ? nurSiege : bestSpiele)
    .sort((a, b) => b.avg - a.avg || b.hf - a.hf || b.s180s - a.s180s)
    .slice(0, 10);
  updates.beste_spiele = sortedFame;

  // ── Match ID history for autodarts links ─────────────────────────────────
  if (autodarts_match_id) {
    const matchIds: any[] = [...((career.letzte_match_ids ?? []) as any[])];
    matchIds.unshift({
      id: autodarts_match_id,
      datum: new Date().toISOString(),
      gegner: gegner_name,
      ergebnis: `${legs_won}:${legs_lost}`,
      turnier: turnier?.name ?? "Unbekannt",
    });
    updates.letzte_match_ids = matchIds.slice(0, 15);
  }

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

  // ── Gegner-Reaktion nach dem Match ───────────────────────────────────────
  const reaktion = generateGegnerReaktion(
    gegner_name,
    career.spieler_name,
    win,
    my_avg,
    h2hAfter,
  );
  updates.letzte_gegner_reaktion = reaktion;

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

      if (neuerBaum.length === 1) {
        const geld = getTurnierSiegerpreis(t);
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

        // Distribute prize money to all bots in the bracket (player won = no remaining sim needed)
        // Bots that lost in this round (the final) get runner-up prize
        {
          const payouts = simulateBotPreisverteilung(turnier_baum, neuerBaum, career.spieler_name, career.aktuelle_runde, t);
          const updatedBots = (career.bot_rangliste as any[]).map((bot: any) => {
            const bonus = payouts[bot.name] ?? 0;
            return bonus > 0 ? { ...bot, geld: bot.geld + bonus } : bot;
          });
          updates.bot_rangliste = updatedBots;
        }
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
      const trostGeld = getTurnierPreisgeld(t, career.aktuelle_runde);
      addToOoM(career, updates, trostGeld);
      updates.bank_konto = (updates.bank_konto ?? career.bank_konto) + trostGeld;
      msgs.push(`❌ Ausgeschieden. Preisgeld gesichert: £${trostGeld.toLocaleString()}`);
      const rundenName = getRundenInfo(neuerBaum, true, career.aktuelles_turnier_index).name;
      updates.letzte_schlagzeile = generiereSchlagzeile(career.spieler_name, t.name, rundenName, false, my_avg, turnier_sieger);

      // Add to history
      const turnier_verlauf: any[] = [...((career.turnier_verlauf ?? []) as any[])];
      turnier_verlauf.unshift({ name: t.name, typ: t.typ, runde: rundenName, ergebnis: "Niederlage", preisgeld: trostGeld, saison: career.saison_jahr, avg: my_avg });
      updates.turnier_verlauf = turnier_verlauf.slice(0, 100);

      // Distribute prize money to remaining bots by simulating the rest of the bracket
      const botPayouts = simulateBotPreisverteilung(turnier_baum, neuerBaum, career.spieler_name, career.aktuelle_runde, t);
      updates.bot_rangliste = (career.bot_rangliste as any[]).map((bot: any) => {
        const bonus = botPayouts[bot.name] ?? 0;
        return bonus > 0 ? { ...bot, geld: bot.geld + bonus } : bot;
      });
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
    sponsor_angebote: (career.sponsor_angebote as any[]) ?? null,
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
    ist_lieblingsgegner: (() => {
      const h2hRec = (career.h2h as any)[career.gegner_name ?? ""] ?? { siege: 0, niederlagen: 0 };
      return h2hRec.siege >= 3 && h2hRec.siege > h2hRec.niederlagen * 1.5;
    })(),
    // Rivalitätssystem: all rivals (angstgegner + lieblingsgegner) from full H2H
    rivalitaeten: (() => {
      const h2hAll = career.h2h as Record<string, { siege: number; niederlagen: number }>;
      const angst: any[] = [];
      const liebling: any[] = [];
      for (const [name, rec] of Object.entries(h2hAll)) {
        const diff = rec.niederlagen - rec.siege;
        if (rec.niederlagen >= 3 && diff >= 2) {
          angst.push({ name, siege: rec.siege, niederlagen: rec.niederlagen, bilanz: diff });
        }
        const winDiff = rec.siege - rec.niederlagen;
        if (rec.siege >= 3 && winDiff >= 2) {
          liebling.push({ name, siege: rec.siege, niederlagen: rec.niederlagen, bilanz: winDiff });
        }
      }
      angst.sort((a, b) => b.bilanz - a.bilanz);
      liebling.sort((a, b) => b.bilanz - a.bilanz);
      return { angstgegner: angst.slice(0, 5), lieblingsgegner: liebling.slice(0, 5) };
    })(),
    // OoM Rang-Pfeile: delta between rank at tournament start and now
    letzter_rang: career.letzter_rang ?? null,
    rang_veraenderung: (() => {
      if (!career.letzter_rang) return null;
      const currentRang = ermittlePlatz(career.bot_rangliste, career.spieler_name, career.order_of_merit_geld);
      return career.letzter_rang - currentRang; // positive = improved (moved up), negative = dropped
    })(),
    // Opponent quote after last match
    letzte_gegner_reaktion: career.letzte_gegner_reaktion ?? null,
    // Extended stats
    stats_best_single_avg: career.stats_best_single_avg ?? 0,
    stats_most_180s_game: career.stats_most_180s_game ?? 0,
    stats_total_co_attempted: career.stats_total_co_attempted ?? 0,
    stats_total_co_hit: career.stats_total_co_hit ?? 0,
    beste_spiele: (career.beste_spiele ?? []) as any[],
    letzte_match_ids: (career.letzte_match_ids ?? []) as any[],
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
let _cachedRefreshTokenSource: string | null = null; // which refresh token we cached for

async function fetchNewToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
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
  return resp.json();
}

async function getAutodartsToken(): Promise<string> {
  const now = Date.now();

  // Prefer user-stored refresh token from DB; fall back to env secret
  const career = await getOrCreateCareer();
  const refreshToken = career.autodarts_refresh_token ?? process.env.AUTODARTS_REFRESH_TOKEN ?? null;
  if (!refreshToken) throw new Error("Kein Autodarts-Account verbunden. Bitte unter Einstellungen verbinden.");

  // Invalidate cache if the refresh token source changed
  if (_cachedToken && now < _tokenExpiresAt - 30_000 && _cachedRefreshTokenSource === refreshToken) {
    return _cachedToken;
  }

  const data = await fetchNewToken(refreshToken);
  _cachedToken = data.access_token as string;
  _tokenExpiresAt = now + (data.expires_in ?? 300) * 1000;
  _cachedRefreshTokenSource = refreshToken;
  return _cachedToken;
}

export async function connectAutodarts(refreshToken: string, username: string) {
  // Test the token first
  const data = await fetchNewToken(refreshToken.trim());
  if (!data.access_token) throw new Error("Ungültiger Refresh-Token");
  // Invalidate cache so new token is used immediately
  _cachedToken = null;
  _cachedRefreshTokenSource = null;
  await saveCareer({
    autodarts_refresh_token: refreshToken.trim(),
    autodarts_username: username.trim() || null,
    spieler_name: username.trim() || undefined,
    name_set: username.trim() ? true : undefined,
  });
  return { ok: true };
}

export async function getAutodartsConnectionStatus() {
  const career = await getOrCreateCareer();
  const hasToken = !!(career.autodarts_refresh_token ?? process.env.AUTODARTS_REFRESH_TOKEN);
  return {
    connected: hasToken,
    username: career.autodarts_username ?? (hasToken ? career.spieler_name : null),
    using_env: !career.autodarts_refresh_token && !!process.env.AUTODARTS_REFRESH_TOKEN,
  };
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
      const match_id = letztes_match.id ?? letztes_match.gameId ?? undefined;
      const result = await processResult(legs_won, legs_lost, my_avg, my_180s, my_hf, my_co_pct, match_id);
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
    const match_id = newMatch.id ?? newMatch.gameId ?? undefined;
    const result = await processResult(legs_won, legs_lost, my_avg, my_180s, my_hf, my_co_pct, match_id);
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
