import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BarChart3, Crown, Loader2, Trophy, Star } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useState } from "react";

type OomResult = {
  tournament_id: number;
  tournament_name: string;
  typ: string;
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
  best_result: string;
  results: OomResult[];
};

const ROUND_LABEL: Record<string, string> = {
  Sieger: "🥇",
  Finale: "🥈",
  Halbfinale: "🥉",
  Viertelfinale: "QF",
  Achtelfinale: "AF",
  "Letzte 32": "L32",
  Teilnahme: "TN",
};

const TYP_COLOR: Record<string, string> = {
  pc: "text-primary",
  m1: "text-yellow-400",
  m2: "text-red-400",
  dev_cup: "text-blue-400",
  dev_major: "text-purple-400",
};

export default function OomPage() {
  const { data: oom, isLoading } = useQuery<OomEntry[]>({
    queryKey: ["oom"],
    queryFn: () => apiFetch("/tour/oom"),
  });

  const [showDetail, setShowDetail] = useState(false);

  // Collect all unique tournaments across all players (ordered)
  const allTournaments = (() => {
    if (!oom) return [];
    const map = new Map<number, { id: number; name: string; typ: string }>();
    for (const entry of oom) {
      for (const r of entry.results) {
        if (!map.has(r.tournament_id)) {
          map.set(r.tournament_id, { id: r.tournament_id, name: r.tournament_name, typ: r.typ });
        }
      }
    }
    return [...map.values()];
  })();

  // Short label for tournament column headers
  function shortName(name: string): string {
    return name
      .replace("Players Championship ", "PC")
      .replace("Spring Open 2026", "M1")
      .replace("Grand Prix (Di/Do)", "M2")
      .replace("Home Matchplay", "HM")
      .replace("Development Cup ", "DC")
      .replace("Grand Final", "GF")
      .replace("April Major", "AM")
      .replace("May Major", "MM");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Order of Merit
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Saison 2026 · Pro Tour Rangliste
          </p>
        </div>
        {oom && oom.length > 0 && allTournaments.length > 0 && (
          <button
            onClick={() => setShowDetail((v) => !v)}
            className="text-xs text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
          >
            {showDetail ? "Kompaktansicht" : "Detailansicht"}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !oom?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Noch keine Daten. Spiele ein Turnier!</p>
        </div>
      ) : showDetail && allTournaments.length > 0 ? (
        // ── Detailed view with per-tournament columns ──
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-accent/30 text-muted-foreground">
                <th className="text-left p-2 sticky left-0 bg-card/90 backdrop-blur z-10 w-8">Pl.</th>
                <th className="text-left p-2 sticky left-8 bg-card/90 backdrop-blur z-10 min-w-32">Spieler</th>
                <th className="text-right p-2 font-semibold text-foreground">Gesamt</th>
                <th className="text-right p-2">Bonus</th>
                <th className="text-center p-2">T</th>
                {allTournaments.map((t) => (
                  <th key={t.id} className={`text-right p-2 ${TYP_COLOR[t.typ] ?? "text-primary"}`}>
                    {shortName(t.name)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {oom.map((entry, i) => {
                const resultMap = new Map(entry.results.map((r) => [r.tournament_id, r]));
                return (
                  <tr
                    key={entry.player_id}
                    className={`border-b border-border/40 hover:bg-accent/20 transition-colors ${i < 3 ? "bg-accent/5" : ""}`}
                  >
                    <td className="p-2 sticky left-0 bg-card/90 backdrop-blur z-10">
                      <RankBadge rank={entry.rank} small />
                    </td>
                    <td className="p-2 sticky left-8 bg-card/90 backdrop-blur z-10">
                      <Link href={`/spieler/${entry.player_id}`} className="hover:text-primary transition-colors">
                        <div className="font-semibold">{entry.player_name}</div>
                        <div className="text-muted-foreground text-[10px]">@{entry.autodarts_username}</div>
                      </Link>
                    </td>
                    <td className="p-2 text-right font-bold text-primary">
                      {entry.total_points.toLocaleString("de-DE")}
                    </td>
                    <td className="p-2 text-right text-muted-foreground">
                      {entry.bonus_total > 0 ? (
                        <span className="text-yellow-400 font-medium">+{entry.bonus_total}</span>
                      ) : "—"}
                    </td>
                    <td className="p-2 text-center text-muted-foreground">{entry.tournaments_played}</td>
                    {allTournaments.map((t) => {
                      const r = resultMap.get(t.id);
                      return (
                        <td key={t.id} className="p-2 text-right">
                          {r ? (
                            <span className={`font-medium ${r.points >= 1000 ? "text-yellow-400" : r.points >= 400 ? "text-primary" : "text-muted-foreground"}`}>
                              {r.points}
                              {r.bonus > 0 && <span className="text-yellow-400">★</span>}
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
          <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border/40">
            ★ = Bonus erhalten (9-Darter +500 / Big Fish 170 +100)
          </div>
        </div>
      ) : (
        // ── Compact view ──
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/30 text-xs text-muted-foreground">
                <th className="text-left p-3 w-10">Pl.</th>
                <th className="text-left p-3">Spieler</th>
                <th className="text-center p-3">T</th>
                <th className="text-center p-3">Bestes Ergebnis</th>
                <th className="text-right p-3">Bonus</th>
                <th className="text-right p-3">Punkte</th>
              </tr>
            </thead>
            <tbody>
              {oom.map((entry, i) => (
                <tr
                  key={entry.player_id}
                  className={`border-b border-border/50 hover:bg-accent/20 transition-colors ${i < 3 ? "bg-accent/10" : ""}`}
                >
                  <td className="p-3">
                    <RankBadge rank={entry.rank} />
                  </td>
                  <td className="p-3">
                    <Link href={`/spieler/${entry.player_id}`} className="hover:text-primary transition-colors">
                      <div className="font-semibold text-sm">{entry.player_name}</div>
                      <div className="text-xs text-muted-foreground">@{entry.autodarts_username}</div>
                    </Link>
                  </td>
                  <td className="p-3 text-center text-sm text-muted-foreground">{entry.tournaments_played}</td>
                  <td className="p-3 text-center">
                    <ResultBadge result={entry.best_result} />
                  </td>
                  <td className="p-3 text-right text-xs">
                    {entry.bonus_total > 0 ? (
                      <span className="text-yellow-400 font-medium flex items-center justify-end gap-0.5">
                        <Star className="w-3 h-3" />+{entry.bonus_total}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <span className="font-bold text-primary text-sm">
                      {entry.total_points.toLocaleString("de-DE")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Points System Summary */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" /> Punktesystem
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left pb-2 pr-4">Runde</th>
                <th className="text-right pb-2 px-3 text-primary">🟢 PC</th>
                <th className="text-right pb-2 px-3 text-yellow-400">🟡 Major</th>
                <th className="text-right pb-2 px-3 text-red-400">🔴 Final</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Sieger", "1.000", "1.500", "2.000"],
                ["Finale", "600", "900", "1.200"],
                ["Halbfinale", "400", "600", "800"],
                ["Viertelfinale", "250", "375", "500"],
                ["Achtelfinale", "150", "225", "300"],
                ["Letzte 32", "75", "125", "150"],
                ["Teilnahme", "25", "50", "100"],
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
        <div className="mt-3 pt-3 border-t border-border/40 flex gap-4 text-xs text-muted-foreground">
          <span>🎯 9-Darter: <strong className="text-primary">+500</strong></span>
          <span>🐟 Big Fish (170): <strong className="text-primary">+100</strong></span>
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
