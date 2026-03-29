import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Trophy, Star, Loader2 } from "lucide-react";
import { apiFetch, TourPlayerProfile, TYP_LABELS } from "@/lib/api";

export default function SpielerProfil() {
  const { id } = useParams<{ id: string }>();

  const { data: profile, isLoading } = useQuery<TourPlayerProfile>({
    queryKey: ["player", id],
    queryFn: () => apiFetch(`/tour/players/${id}`),
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!profile) return <div className="text-center py-20 text-muted-foreground">Spieler nicht gefunden</div>;

  const bonusTotal = (profile.bonus_points ?? []).reduce((s, b) => s + b.points, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/spieler" className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">@{profile.autodarts_username}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="OOM-Punkte" value={(profile.oom_points ?? 0).toLocaleString("de-DE")} highlight />
        <StatCard label="Turniere" value={String(profile.tournament_results?.length ?? 0)} />
        <StatCard label="Bonuspunkte" value={`+${bonusTotal}`} />
      </div>

      {/* Tournament results */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" /> Turnier-Ergebnisse
        </h2>
        {!profile.tournament_results?.length ? (
          <p className="text-muted-foreground text-sm text-center py-4">Noch keine Turnierteilnahmen</p>
        ) : (
          <div className="space-y-2">
            {[...profile.tournament_results]
              .sort((a, b) => b.points - a.points)
              .map((r) => (
                <div key={r.tournament_id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border/50">
                  <div>
                    <p className="font-medium text-sm">{r.tournament_name}</p>
                    <p className="text-xs text-muted-foreground">{TYP_LABELS[r.typ] ?? r.typ}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{r.round}</p>
                    <p className="font-bold text-sm text-primary">{r.points.toLocaleString("de-DE")}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Bonus points */}
      {profile.bonus_points?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" /> Bonuspunkte
          </h2>
          <div className="space-y-2">
            {profile.bonus_points.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-yellow-400/5 border border-yellow-400/10 text-sm">
                <span className="text-yellow-400">
                  {b.bonus_type === "9darter" ? "🎯 9-Darter" : "🐟 Big Fish (170 Finish)"}
                </span>
                <span className="font-bold text-primary">+{b.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
