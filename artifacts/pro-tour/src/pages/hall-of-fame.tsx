import { useQuery } from "@tanstack/react-query";
import { Crown, Loader2, Trophy, Swords, Star, Link as LinkIcon } from "lucide-react";
import { Link } from "wouter";
import { apiFetch, TYP_LABELS } from "@/lib/api";
import { useState } from "react";

type HofEntry = {
  tournament_id: number;
  tournament_name: string;
  typ: string;
  tour_type: string;
  datum: string;
  champion_id: number;
  champion_name: string;
  champion_username: string;
  runner_up: string | null;
  score: string | null;
  avg_winner: number | null;
};

const TYP_ORDER: Record<string, number> = {
  m2: 0, dev_final: 1, m1: 2, dev_major: 3, pc: 4, dev_cup: 5,
};

const TYP_BADGE: Record<string, string> = {
  m2: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  m1: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  dev_final: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  dev_major: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  pc: "text-primary bg-primary/10 border-primary/30",
  dev_cup: "text-blue-400 bg-blue-400/10 border-blue-400/30",
};

function isMajor(typ: string) {
  return typ === "m1" || typ === "m2" || typ === "dev_major" || typ === "dev_final";
}

// Count wins per player
function buildWinMap(entries: HofEntry[]) {
  const map: Record<string, number> = {};
  for (const e of entries) {
    map[e.champion_username] = (map[e.champion_username] ?? 0) + 1;
  }
  return map;
}

export default function HallOfFamePage() {
  const { data: entries, isLoading } = useQuery<HofEntry[]>({
    queryKey: ["hall-of-fame"],
    queryFn: () => apiFetch("/tour/hall-of-fame"),
  });

  const [tab, setTab] = useState<"pro" | "dev">("pro");

  const proEntries = entries?.filter((e) => e.tour_type !== "development") ?? [];
  const devEntries = entries?.filter((e) => e.tour_type === "development") ?? [];
  const shown = tab === "pro" ? proEntries : devEntries;

  // Most successful players
  const winMap = buildWinMap(shown);
  const topWinners = Object.entries(winMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-400" /> Hall of Fame
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Saison 2026 · Turniersieger der Online Pro Tour</p>
      </div>

      {/* Tour tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("pro")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            tab === "pro"
              ? "bg-primary/15 text-primary border-primary/30"
              : "text-muted-foreground border-border hover:bg-accent"
          }`}
        >
          <Trophy className="w-4 h-4" /> Pro Tour
          {proEntries.length > 0 && (
            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
              {proEntries.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("dev")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            tab === "dev"
              ? "bg-blue-400/15 text-blue-400 border-blue-400/30"
              : "text-muted-foreground border-border hover:bg-accent"
          }`}
        >
          <Swords className="w-4 h-4" /> Dev Tour
          {devEntries.length > 0 && (
            <span className="text-xs bg-blue-400/20 text-blue-400 px-1.5 py-0.5 rounded-full">
              {devEntries.length}
            </span>
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : shown.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Noch keine Turniersieger eingetragen.</p>
          <p className="text-xs mt-1 opacity-60">Sobald Turniere abgeschlossen sind, erscheinen die Sieger hier.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Most titles */}
          {topWinners.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-400" /> Meiste Titel
              </h2>
              <div className="flex flex-wrap gap-2">
                {topWinners.map(([username, wins], i) => {
                  const entry = shown.find((e) => e.champion_username === username);
                  return (
                    <Link
                      key={username}
                      href={entry ? `/spieler/${entry.champion_id}` : "#"}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/50 border border-border hover:border-primary/30 transition-colors"
                    >
                      <span className={`text-lg font-black ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-muted-foreground"}`}>
                        {i === 0 ? "👑" : `#${i + 1}`}
                      </span>
                      <div>
                        <p className="text-sm font-semibold leading-none">@{username}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{wins} Titel</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Champions list */}
          <div className="space-y-3">
            {shown.map((entry) => (
              <div
                key={entry.tournament_id}
                className={`bg-card border rounded-xl p-4 transition-colors ${isMajor(entry.typ) ? "border-yellow-400/20 bg-yellow-400/5" : "border-border"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${TYP_BADGE[entry.typ] ?? "text-muted-foreground bg-accent border-border"}`}>
                        {TYP_LABELS[entry.typ] ?? entry.typ}
                      </span>
                      <span className="text-xs text-muted-foreground">{entry.datum}</span>
                    </div>
                    <Link href={`/turniere/${entry.tournament_id}`} className="group flex items-center gap-1 mt-1">
                      <h3 className="font-bold text-base group-hover:text-primary transition-colors">{entry.tournament_name}</h3>
                      <LinkIcon className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    {entry.runner_up && (
                      <p className="text-xs text-muted-foreground mt-1">Finalist: @{entry.runner_up}</p>
                    )}
                  </div>

                  {/* Champion */}
                  <Link href={`/spieler/${entry.champion_id}`} className="flex-shrink-0 text-right group">
                    <div className="flex items-center gap-2 justify-end">
                      <div>
                        <p className="text-xs text-muted-foreground">Sieger</p>
                        <p className="font-bold text-sm group-hover:text-primary transition-colors">
                          @{entry.champion_username}
                        </p>
                        {(entry.score || entry.avg_winner) && (
                          <div className="flex items-center gap-2 justify-end mt-0.5">
                            {entry.score && (
                              <span className="text-xs font-mono text-primary">{entry.score}</span>
                            )}
                            {entry.avg_winner != null && entry.avg_winner > 0 && (
                              <span className="text-[10px] text-muted-foreground">⌀{entry.avg_winner.toFixed(1)}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center">
                        <Crown className="w-4 h-4 text-yellow-400" />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
