import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BarChart3, Crown, Loader2, Trophy } from "lucide-react";
import { apiFetch, TourOomEntry, TYP_LABELS } from "@/lib/api";

export default function OomPage() {
  const { data: oom, isLoading } = useQuery<TourOomEntry[]>({
    queryKey: ["oom"],
    queryFn: () => apiFetch("/tour/oom"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> Order of Merit
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Rangliste basierend auf Preisgeldern der letzten Turniere</p>
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
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/30 text-xs text-muted-foreground">
                <th className="text-left p-3 w-10">Pl.</th>
                <th className="text-left p-3">Spieler</th>
                <th className="text-center p-3">Turniere</th>
                <th className="text-center p-3">Bestes Ergebnis</th>
                <th className="text-right p-3">Preisgelder</th>
              </tr>
            </thead>
            <tbody>
              {oom.map((entry, i) => (
                <tr key={entry.player_id} className={`border-b border-border/50 hover:bg-accent/20 transition-colors ${i < 3 ? "bg-accent/10" : ""}`}>
                  <td className="p-3">
                    <RankBadge rank={entry.rank} />
                  </td>
                  <td className="p-3">
                    <Link href={`/spieler/${entry.player_id}`} className="hover:text-primary transition-colors">

                        <div className="font-semibold text-sm">{entry.player_name}</div>
                        <div className="text-xs text-muted-foreground">@{entry.autodarts_username}</div>
                    </Link>
                  </td>
                  <td className="p-3 text-center text-sm">{entry.tournaments_played}</td>
                  <td className="p-3 text-center">
                    <ResultBadge result={entry.best_result} />
                  </td>
                  <td className="p-3 text-right">
                    <span className="font-bold text-primary">£{entry.total_points.toLocaleString("en-GB")}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Points table */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" /> Punkte-Tabelle
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left pb-2 pr-4">Runde</th>
                <th className="text-right pb-2 px-3">Players Ch.</th>
                <th className="text-right pb-2 px-3">European Tour</th>
                <th className="text-right pb-2 px-3">World Series</th>
                <th className="text-right pb-2 px-3">Major</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Sieger", "10.000", "25.000", "25.000", "100.000"],
                ["Finale", "6.000", "15.000", "15.000", "60.000"],
                ["Halbfinale", "3.000", "8.000", "8.000", "35.000"],
                ["Viertelfinale", "1.500", "4.000", "4.000", "20.000"],
                ["Letzte 16", "750", "2.000", "2.000", "10.000"],
                ["Letzte 32", "375", "1.000", "1.000", "5.000"],
                ["Letzte 64", "200", "500", "500", "2.500"],
              ].map(([round, ...points]) => (
                <tr key={round} className="border-b border-border/30">
                  <td className="py-1.5 pr-4 font-medium">{round}</td>
                  {points.map((p, i) => (
                    <td key={i} className="py-1.5 px-3 text-right text-muted-foreground">£{p}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-sm"><Crown className="w-3.5 h-3.5" /></span>;
  if (rank === 2) return <span className="w-7 h-7 rounded-full bg-gray-400/20 text-gray-300 font-bold text-sm flex items-center justify-center">2</span>;
  if (rank === 3) return <span className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 font-bold text-sm flex items-center justify-center">3</span>;
  return <span className="text-muted-foreground text-sm font-medium">{rank}</span>;
}

function ResultBadge({ result }: { result: string }) {
  const color = result === "Sieger" || result === "F" ? "text-yellow-400 bg-yellow-400/10"
    : result === "SF" ? "text-purple-400 bg-purple-400/10"
    : result === "QF" ? "text-blue-400 bg-blue-400/10"
    : "text-muted-foreground bg-accent";
  const label = result === "F" ? "Finale" : result === "SF" ? "Halbfinale" : result === "QF" ? "Viertelfinale" : result;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>;
}
