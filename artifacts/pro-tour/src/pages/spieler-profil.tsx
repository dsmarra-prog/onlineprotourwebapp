import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Trophy, Target, Loader2 } from "lucide-react";
import { apiFetch, TourPlayerProfile, TYP_LABELS } from "@/lib/api";

export default function SpielerProfil() {
  const { id } = useParams<{ id: string }>();

  const { data: profile, isLoading } = useQuery<TourPlayerProfile>({
    queryKey: ["player", id],
    queryFn: () => apiFetch(`/tour/players/${id}`),
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!profile) return <div className="text-center py-20 text-muted-foreground">Spieler nicht gefunden</div>;

  const { player, tournament_results, wins, losses } = profile;
  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/spieler" className="p-1.5 rounded-lg hover:bg-accent transition-colors">

            <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{player.name}</h1>
          <p className="text-sm text-muted-foreground">@{player.autodarts_username}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="OOM-Preisgeld" value={`£${player.oom_points.toLocaleString("en-GB")}`} highlight />
        <StatCard label="Siege" value={String(wins)} />
        <StatCard label="Niederlagen" value={String(losses)} />
        <StatCard label="Gewinnrate" value={`${winRate}%`} />
      </div>

      {/* Tournament results */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" /> Turnier-Ergebnisse
        </h2>
        {tournament_results.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Noch keine Turnierteilnahmen</p>
        ) : (
          <div className="space-y-2">
            {tournament_results
              .sort((a, b) => b.points - a.points)
              .map((r) => (
                <div key={r.tournament_id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border/50">
                  <div>
                    <p className="font-medium text-sm">{r.tournament_name}</p>
                    <p className="text-xs text-muted-foreground">{TYP_LABELS[r.tournament_type]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{r.best_round}</p>
                    <p className="font-bold text-sm text-primary">£{r.points.toLocaleString("en-GB")}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 text-center ${highlight ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <p className={`text-xl font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
