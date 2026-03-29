import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Trophy, Users, BarChart3, Zap, Calendar, Star } from "lucide-react";
import { apiFetch, TourTournament, TourOomEntry, TYP_LABELS } from "@/lib/api";

export default function HomeDashboard() {
  const { data: tournaments } = useQuery<TourTournament[]>({
    queryKey: ["tournaments"],
    queryFn: () => apiFetch("/tour/tournaments"),
  });

  const { data: oom } = useQuery<TourOomEntry[]>({
    queryKey: ["oom"],
    queryFn: () => apiFetch("/tour/oom"),
  });

  const laufend = tournaments?.filter((t) => t.status === "laufend" && !t.is_test) ?? [];
  const offen = tournaments?.filter((t) => t.status === "offen" && !t.is_test) ?? [];
  const top5 = oom?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary tracking-wide">Online Pro Tour</h1>
        <p className="text-muted-foreground text-sm mt-1">Echtzeit-Dart-Turnierplattform für Autodarts-Spieler</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Trophy} label="Turniere gesamt" value={tournaments?.length ?? 0} />
        <StatCard icon={Users} label="Spieler" value={oom?.length ?? 0} />
        <StatCard icon={Zap} label="Aktive Turniere" value={laufend.length} accent />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Active tournaments */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Laufende Turniere</h2>
          </div>
          {laufend.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Keine aktiven Turniere</p>
          ) : (
            <div className="space-y-2">
              {laufend.map((t) => (
                <Link key={t.id} href={`/turniere/${t.id}`} className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">

                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{TYP_LABELS[t.typ]} · {t.player_count} Spieler</p>
                    </div>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">Live</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* OOM Top 5 */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Order of Merit — Top 5</h2>
          </div>
          {top5.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Noch keine Daten</p>
          ) : (
            <div className="space-y-2">
              {top5.map((entry) => (
                <Link key={entry.player_id} href={`/spieler/${entry.player_id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">

                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      entry.rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
                      entry.rank === 2 ? "bg-gray-400/20 text-gray-300" :
                      entry.rank === 3 ? "bg-orange-500/20 text-orange-400" :
                      "bg-accent text-muted-foreground"
                    }`}>{entry.rank}</span>
                    <span className="flex-1 text-sm font-medium">{entry.player_name}</span>
                    <span className="text-sm font-bold text-primary">£{entry.total_points.toLocaleString("en-GB")}</span>
                </Link>
              ))}
            </div>
          )}
          <Link href="/oom" className="block text-center text-xs text-primary hover:underline mt-3">
            Vollständige Tabelle →
          </Link>
        </div>
      </div>

      {/* Upcoming tournaments */}
      {offen.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Anstehende Turniere</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {offen.slice(0, 4).map((t) => (
              <Link key={t.id} href={`/turniere/${t.id}`} className="p-3 rounded-lg bg-accent/30 hover:bg-accent/60 transition-colors border border-border">

                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{TYP_LABELS[t.typ]}</p>
                  <p className="text-xs text-muted-foreground">{t.datum} · {t.player_count}/{t.max_players} Spieler</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: {
  icon: any; label: string; value: number; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
