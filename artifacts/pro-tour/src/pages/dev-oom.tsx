import { useQuery, useMutation } from "@tanstack/react-query";
import { BarChart3, Crown, Loader2, Trophy, RefreshCw, Swords } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useState } from "react";

type OomResult = {
  tournament_name: string;
  points: number;
  bonus: number;
  round: string;
};

type OomEntry = {
  rank: number;
  player_id: number;
  player_name: string;
  autodarts_username: string;
  total_points: number;
  bonus_total: number;
  tournaments_played: number;
  last_updated?: string;
  results: OomResult[];
};

const DEV_COL_ORDER = [
  "Development Cup 1", "Development Cup 2", "Development Cup 3",
  "Development Cup 4", "Development Cup 5", "Development Cup 6",
  "April Major", "May Major", "Grand Final",
];

function sortDevCols(cols: string[]): string[] {
  return [...cols].sort((a, b) => {
    const ai = DEV_COL_ORDER.indexOf(a);
    const bi = DEV_COL_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function isMajor(name: string): boolean {
  return name.includes("Major") || name.includes("Grand Final");
}

// Punktegrenzen passend zu den echten OOM-Werten (onlineprotour.eu)
const DEV_CUP_PTS    = [1000, 600, 400, 250, 150, 75, 25];
const DEV_MAJOR_PTS  = [1500, 900, 600, 375, 225, 125, 50];
const DEV_FINAL_PTS  = [2000, 1200, 800, 500, 300, 150, 100];
const ROUND_NAMES    = ["Sieger", "Finale", "Halbfinale", "Viertelfinale", "Achtelfinale", "Letzte 32", "Teilnahme"];

function ptsToBestRound(pts: number, typ = "dev_cup"): string {
  const table = typ === "dev_final" ? DEV_FINAL_PTS : typ === "dev_major" ? DEV_MAJOR_PTS : DEV_CUP_PTS;
  for (let i = 0; i < table.length; i++) {
    if (pts >= table[i]) return ROUND_NAMES[i];
  }
  return "Teilnahme";
}

function bestResultFromResults(results: OomResult[]): string {
  const roundOrder = ["Sieger", "Finale", "Halbfinale", "Viertelfinale", "Achtelfinale", "Letzte 32", "Teilnahme"];
  let best = "Teilnahme";
  let bestIdx = roundOrder.length - 1;
  for (const r of results) {
    const round = r.round || ptsToBestRound(r.points, isMajor(r.tournament_name) ? "dev_major" : "dev_cup");
    const idx = roundOrder.indexOf(round);
    if (idx !== -1 && idx < bestIdx) {
      best = round;
      bestIdx = idx;
    }
  }
  return best;
}

export default function DevOomPage() {
  const { data: oom, isLoading, refetch } = useQuery<OomEntry[]>({
    queryKey: ["dev-oom"],
    queryFn: () => apiFetch("/tour/dev-oom"),
  });

  const seedMutation = useMutation({
    mutationFn: () => apiFetch("/tour/dev-oom/seed", { method: "POST" }),
    onSuccess: () => refetch(),
  });

  const [showDetail, setShowDetail] = useState(false);

  const allTournamentNames = (() => {
    if (!oom) return [];
    const nameSet = new Set<string>();
    for (const entry of oom) {
      for (const r of entry.results) {
        if (r.points > 0) nameSet.add(r.tournament_name);
      }
    }
    return sortDevCols([...nameSet]);
  })();

  const lastUpdated = oom?.[0]?.last_updated;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Swords className="w-6 h-6 text-primary" /> Development Tour OOM
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Saison 2026 · Development Tour Rangliste
            {lastUpdated && (
              <span className="ml-2 text-muted-foreground/60">· Stand {lastUpdated}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {oom && oom.length > 0 && allTournamentNames.length > 0 && (
            <button
              onClick={() => setShowDetail((v) => !v)}
              className="text-xs text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
            >
              {showDetail ? "Kompaktansicht" : "Detailansicht"}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !oom?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <Swords className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-1 font-medium">Noch keine Dev Tour OOM-Daten vorhanden.</p>
          <p className="text-xs mb-4 text-muted-foreground/60">
            Dev Tour Turniere (DC1–DC6) wurden auf onlineprotour.eu ausgetragen.<br />
            Nach dem Import der Standings wird die Rangliste hier angezeigt.
          </p>
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="inline-flex items-center gap-2 text-xs text-primary border border-primary/40 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${seedMutation.isPending ? "animate-spin" : ""}`} />
            Dev OOM von onlineprotour.eu importieren
          </button>
          {seedMutation.data && (
            <p className="mt-2 text-xs text-muted-foreground">
              {(seedMutation.data as any).message ?? JSON.stringify(seedMutation.data)}
            </p>
          )}
        </div>
      ) : showDetail && allTournamentNames.length > 0 ? (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-accent/30 text-muted-foreground">
                <th className="text-left p-2 sticky left-0 bg-card/90 backdrop-blur z-10 w-8">Pl.</th>
                <th className="text-left p-2 sticky left-8 bg-card/90 backdrop-blur z-10 min-w-32">Spieler</th>
                <th className="text-right p-2 font-semibold text-foreground">Gesamt</th>
                <th className="text-center p-2">T</th>
                {allTournamentNames.map((name) => (
                  <th key={name} className={`text-right p-2 ${isMajor(name) ? "text-yellow-400" : "text-primary"}`}>
                    {name.replace("Development Cup", "DC").replace(" Major", " Maj")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {oom.map((entry, i) => {
                const resultMap = new Map(entry.results.map((r) => [r.tournament_name, r]));
                return (
                  <tr
                    key={entry.player_id}
                    className={`border-b border-border/40 hover:bg-accent/20 transition-colors ${i < 3 ? "bg-accent/5" : ""}`}
                  >
                    <td className="p-2 sticky left-0 bg-card/90 backdrop-blur z-10">
                      <RankBadge rank={entry.rank} small />
                    </td>
                    <td className="p-2 sticky left-8 bg-card/90 backdrop-blur z-10">
                      <div className="font-semibold">{entry.autodarts_username}</div>
                    </td>
                    <td className="p-2 text-right font-bold text-primary">
                      {entry.total_points.toLocaleString("de-DE")}
                    </td>
                    <td className="p-2 text-center text-muted-foreground">{entry.tournaments_played}</td>
                    {allTournamentNames.map((name) => {
                      const r = resultMap.get(name);
                      return (
                        <td key={name} className="p-2 text-right">
                          {r && r.points > 0 ? (
                            <span className={`font-medium ${r.points >= 900 ? "text-yellow-400" : r.points >= 400 ? "text-primary" : "text-muted-foreground"}`}>
                              {r.points}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border/40 text-right">
            Quelle: onlineprotour.eu
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/30 text-xs text-muted-foreground">
                <th className="text-left p-3 w-10">Pl.</th>
                <th className="text-left p-3">Spieler</th>
                <th className="text-right p-3">Punkte</th>
                <th className="text-center p-3 hidden sm:table-cell">T</th>
                <th className="text-center p-3 hidden sm:table-cell">Bestes Ergebnis</th>
              </tr>
            </thead>
            <tbody>
              {oom.map((entry, i) => {
                const best = bestResultFromResults(entry.results);
                return (
                  <tr
                    key={entry.player_id}
                    className={`border-b border-border/50 hover:bg-accent/20 transition-colors ${i < 3 ? "bg-accent/10" : ""}`}
                  >
                    <td className="p-3">
                      <RankBadge rank={entry.rank} />
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-sm">{entry.autodarts_username}</div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-bold text-primary text-sm">
                        {entry.total_points.toLocaleString("de-DE")}
                      </span>
                    </td>
                    <td className="p-3 text-center text-sm text-muted-foreground hidden sm:table-cell">{entry.tournaments_played}</td>
                    <td className="p-3 text-center hidden sm:table-cell">
                      <ResultBadge result={best} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border/40 text-right">
            Quelle: onlineprotour.eu · Stand {lastUpdated}
          </div>
        </div>
      )}

      {/* Dev Tour Points System */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" /> Development Tour Punktesystem
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left pb-2 pr-4">Runde</th>
                <th className="text-right pb-2 px-3 text-primary">🟢 Dev Cup</th>
                <th className="text-right pb-2 px-3 text-yellow-400">🟡 Pre-Finals</th>
                <th className="text-right pb-2 px-3 text-orange-400">🏆 Grand Final</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Sieger",        "1.000", "1.500", "2.000"],
                ["Finale",          "600",   "900", "1.200"],
                ["Halbfinale",      "400",   "600",   "800"],
                ["Viertelfinale",   "250",   "375",   "500"],
                ["Achtelfinale",    "150",   "225",   "300"],
                ["Letzte 32",        "75",   "125",   "150"],
                ["Teilnahme",        "25",    "50",   "100"],
              ].map(([round, ...pts]) => (
                <tr key={round} className="border-b border-border/30">
                  <td className="py-1.5 pr-4 font-medium">{round}</td>
                  {pts.map((p, i) => (
                    <td key={i} className="py-1.5 px-3 text-right text-muted-foreground">{p}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Turnierformat</p>
          <p>Dev Cup: Best of 3 · Pre-Finals: Best of 7 · Grand Final: Best of 7</p>
          <p className="mt-1">Qualifikation für Pre-Finals & Grand Final: Top 16 OoM</p>
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank, small = false }: { rank: number; small?: boolean }) {
  const size = small ? "w-6 h-6 text-xs" : "w-7 h-7 text-sm";
  if (rank === 1) return <span className={`flex items-center justify-center ${size} rounded-full bg-yellow-500/20 text-yellow-400 font-bold`}><Crown className="w-3 h-3" /></span>;
  if (rank === 2) return <span className={`${size} rounded-full bg-gray-400/20 text-gray-300 font-bold flex items-center justify-center`}>2</span>;
  if (rank === 3) return <span className={`${size} rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center`}>3</span>;
  return <span className="text-muted-foreground text-sm font-medium">{rank}</span>;
}

function ResultBadge({ result }: { result: string }) {
  const colorMap: Record<string, string> = {
    Sieger: "text-yellow-400 bg-yellow-400/10",
    Finale: "text-purple-400 bg-purple-400/10",
    Halbfinale: "text-blue-400 bg-blue-400/10",
    Viertelfinale: "text-primary bg-primary/10",
    Achtelfinale: "text-muted-foreground bg-accent",
    "Letzte 32": "text-muted-foreground bg-accent",
    Teilnahme: "text-muted-foreground bg-accent",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[result] ?? "text-muted-foreground bg-accent"}`}>
      {result}
    </span>
  );
}
