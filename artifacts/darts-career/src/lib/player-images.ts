// Maps common player names to their exact Wikipedia page titles
// (disambiguated titles where necessary)
const WIKI_TITLES: Record<string, string> = {
  "Luke Humphries": "Luke Humphries",
  "Michael van Gerwen": "Michael van Gerwen",
  "Michael Smith": "Michael Smith (darts player)",
  "Gerwyn Price": "Gerwyn Price",
  "Nathan Aspinall": "Nathan Aspinall",
  "Luke Littler": "Luke Littler",
  "Rob Cross": "Rob Cross (darts player)",
  "Damon Heta": "Damon Heta",
  "Dimitri Van den Bergh": "Dimitri Van den Bergh",
  "Peter Wright": "Peter Wright (darts player)",
  "Danny Noppert": "Danny Noppert",
  "Chris Dobey": "Chris Dobey",
  "Jose de Sousa": "José de Sousa (darts player)",
  "Jonny Clayton": "Jonny Clayton",
  "Gary Anderson": "Gary Anderson (darts player)",
  "Brendan Dolan": "Brendan Dolan",
  "Andrew Gilding": "Andrew Gilding",
  "Callan Rydz": "Callan Rydz",
  "Mike De Decker": "Mike De Decker",
  "Dirk van Duijvenbode": "Dirk van Duijvenbode",
  "Martin Schindler": "Martin Schindler (darts player)",
  "Josh Rock": "Josh Rock",
  "Jermaine Wattimena": "Jermaine Wattimena",
  "Ryan Joyce": "Ryan Joyce",
  "Joe Cullen": "Joe Cullen (darts player)",
  "Ryan Searle": "Ryan Searle",
  "Raymond van Barneveld": "Raymond van Barneveld",
  "John Henderson": "John Henderson (darts player)",
  "Krzysztof Ratajski": "Krzysztof Ratajski",
  "Dave Chisnall": "Dave Chisnall",
  "Mensur Suljovic": "Mensur Suljovic",
  "James Wade": "James Wade (darts player)",
  "Kim Huybrechts": "Kim Huybrechts",
  "Daryl Gurney": "Daryl Gurney",
  "Scott Williams": "Scott Williams (darts player)",
  "Jim Williams": "Jim Williams (darts player)",
  "Jeffrey de Graaf": "Jeffrey de Graaf",
  "Mickey Mansell": "Mickey Mansell",
  "Karel Sedlacek": "Karel Sedlacek",
  "Stephen Bunting": "Stephen Bunting",
  "Ricky Evans": "Ricky Evans (darts player)",
  "Kevin Doets": "Kevin Doets",
  "Florian Hempel": "Florian Hempel",
  "Gian van Veen": "Gian van Veen",
  "Ritchie Edhouse": "Ritchie Edhouse",
  "Connor Scutt": "Connor Scutt",
  "Danny van Trijp": "Danny van Trijp",
  "Paolo Nebrida": "Paolo Nebrida",
  "William O'Connor": "William O'Connor (darts player)",
  "Wessel Nijman": "Wessel Nijman",
  "Ricardo Pietreczko": "Ricardo Pietreczko",
  "Matt Campbell": "Matt Campbell (darts player)",
  "Madars Razma": "Madars Razma",
  "Luke Woodhouse": "Luke Woodhouse (darts player)",
  "Niels Zonneveld": "Niels Zonneveld",
  "Boris Krcmar": "Boris Krcmar",
  "Rowby-John Rodriguez": "Rowby-John Rodriguez",
  "Keane Barry": "Keane Barry",
  "Ted Evetts": "Ted Evetts",
  "Ross Smith": "Ross Smith (darts player)",
  "Gary Robson": "Gary Robson (darts player)",
  "Andy Boulton": "Andy Boulton",
  "Andy Hamilton": "Andy Hamilton (darts player)",
  "Adrian Lewis": "Adrian Lewis (darts player)",
  "Dean Winstanley": "Dean Winstanley",
  "Colin Osborne": "Colin Osborne (darts player)",
  "Scott Waites": "Scott Waites",
  "Kevin Painter": "Kevin Painter",
  "Paul Nicholson": "Paul Nicholson (darts player)",
  "Noa-Lynn van Leuwen": "Noa-Lynn van Leuwen",
  "Fallon Sherrock": "Fallon Sherrock",
  "Beau Greaves": "Beau Greaves",
  "Glen Durrant": "Glen Durrant",
  "Steve Beaton": "Steve Beaton",
  "Mervyn King": "Mervyn King (darts player)",
  "Tony O'Shea": "Tony O'Shea",
  "Max Hopp": "Max Hopp",
  "Corey Cadby": "Corey Cadby",
  "Darius Labanauskas": "Darius Labanauskas",
  "Ian White": "Ian White (darts player)",
  "Steve West": "Steve West (darts player)",
  "Jamie Caven": "Jamie Caven",
  "Robbie Green": "Robbie Green (darts player)",
  "Wayne Mardle": "Wayne Mardle",
  "Kirk Shepherd": "Kirk Shepherd",
  "Chris Mason": "Chris Mason (darts player)",
  "Paul Lim": "Paul Lim (darts player)",
  "Wayne Jones": "Wayne Jones (darts player)",
  "Colin Lloyd": "Colin Lloyd (darts player)",
  "Mark Webster": "Mark Webster (darts player)",
  "Mark McGeeney": "Mark McGeeney",
  "Gary Stone": "Gary Stone (darts player)",
};

// Module-level cache: null = not found / error, string = URL
const imageCache = new Map<string, string | null>();
const pendingFetches = new Map<string, Promise<string | null>>();

async function fetchWikipediaImage(name: string): Promise<string | null> {
  const title = WIKI_TITLES[name];
  if (!title) return null;

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: { "Accept": "application/json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

export function getPlayerImageUrl(name: string): string | null | undefined {
  // undefined = not yet fetched, null = not available, string = URL
  if (imageCache.has(name)) return imageCache.get(name)!;
  if (!WIKI_TITLES[name]) {
    imageCache.set(name, null);
    return null;
  }
  return undefined; // still loading
}

export function preloadPlayerImage(name: string): Promise<string | null> {
  if (imageCache.has(name)) return Promise.resolve(imageCache.get(name)!);
  if (pendingFetches.has(name)) return pendingFetches.get(name)!;

  const promise = fetchWikipediaImage(name).then((url) => {
    imageCache.set(name, url);
    pendingFetches.delete(name);
    return url;
  });
  pendingFetches.set(name, promise);
  return promise;
}

export const HAS_WIKI = (name: string) => name in WIKI_TITLES;
