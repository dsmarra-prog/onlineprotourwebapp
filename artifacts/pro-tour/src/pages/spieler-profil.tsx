import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Trophy, Star, Loader2, Target, TrendingUp, Swords, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch, TourPlayerProfile, TourH2H, TYP_LABELS, RUNDE_LABELS } from "@/lib/api";

type TourPlayer = { id: number; name: string; autodarts_username: string };

export default function SpielerProfil() {
  const { id } = useParams<{ id: string }>();
  const [h2hOpponent, setH2hOpponent] = useState<string>("");
  const [h2hOpen, setH2hOpen] = useState(false);

  const { data: profile, isLoading } = useQuery<TourPlayerProfile>({
    queryKey: ["player", id],
    queryFn: () => apiFetch(`/tour/players/${id}`),
  });

  const { data: allPlayers } = useQuery<TourPlayer[]>({
    queryKey: ["players"],
    queryFn: () => apiFetch("/tour/players"),
    enabled: h2hOpen,
  });

  const { data: h2h, isLoading: h2hLoading } = useQuery<TourH2H>({
    queryKey: ["h2h", id, h2hOpponent],
    queryFn: () => apiFetch(`/tour/players/${id}/h2h/${h2hOpponent}`),
    enabled: !!h2hOpponent,
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!profile) return <div className="text-center py-20 text-muted-foreground">Spieler nicht gefunden</div>;

  const bonusTotal = (profile.bonus_points ?? []).reduce((s, b) => s + b.points, 0);
  const proResults = profile.tournament_results?.filter((r) => r.tour_type !== "development") ?? [];
  const devResults = profile.tournament_results?.filter((r) => r.tour_type === "development") ?? [];
  const opponents = allPlayers?.filter((p) => String(p.id) !== id) ?? [];

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

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Pro OOM" value={(profile.oom_points ?? 0).toLocaleString("de-DE")} highlight />
        <StatCard label="Dev OOM" value={(profile.dev_oom_points ?? 0).toLocaleString("de-DE")} />
        <StatCard label="Matches" value={`${profile.stats?.matches_won ?? 0}W / ${profile.stats?.matches_lost ?? 0}L`} />
        <StatCard label="Winrate" value={`${profile.stats?.win_rate ?? 0}%`} />
      </div>

      {/* Detailed stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xl font-bold">{profile.stats?.avg_score != null ? profile.stats.avg_score.toFixed(1) : "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">Ø Average</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xl font-bold">{profile.stats?.legs_won ?? 0} : {profile.stats?.legs_lost ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Legs (W : L)</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-yellow-400">{profile.stats?.titles ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Turniertitel</p>
        </div>
      </div>

      {/* Extended autodarts stats */}
      {(profile.stats?.first9_avg != null || profile.stats?.double_rate != null) && (
        <div className="grid grid-cols-2 gap-3">
          {profile.stats?.first9_avg != null && (
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-primary">{profile.stats.first9_avg.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground mt-1">First 9 Average</p>
            </div>
          )}
          {profile.stats?.double_rate != null && (
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-green-400">{profile.stats.double_rate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                Doppelquote
                {profile.stats.doubles_hit != null && profile.stats.doubles_att != null && (
                  <span className="block text-[10px] opacity-60">{profile.stats.doubles_hit}/{profile.stats.doubles_att} Doubles</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* H2H section */}
      <div className="bg-card border border-border rounded-xl p-4">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setH2hOpen((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Head-to-Head Vergleich</h2>
          </div>
          {h2hOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {h2hOpen && (
          <div className="mt-4 space-y-4">
            <Select value={h2hOpponent} onValueChange={setH2hOpponent}>
              <SelectTrigger>
                <SelectValue placeholder="Gegner auswählen…" />
              </SelectTrigger>
              <SelectContent>
                {opponents.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name} (@{p.autodarts_username})</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {h2hLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}

            {h2h && !h2hLoading && (
              <div className="space-y-3">
                {/* Score summary */}
                <div className="flex items-center justify-center gap-6 py-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="text-center">
                    <p className="text-3xl font-black text-primary">{h2h.wins}</p>
                    <p className="text-xs text-muted-foreground">{h2h.player.name}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground font-medium">Legs</p>
                    <p className="text-sm font-bold">{h2h.leg_wins} : {h2h.leg_losses}</p>
                    <p className="text-xs text-muted-foreground">Matches</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-muted-foreground">{h2h.losses}</p>
                    <p className="text-xs text-muted-foreground">{h2h.opponent.name}</p>
                  </div>
                </div>

                {/* Match history */}
                {h2h.history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">Noch keine gemeinsamen Matches</p>
                ) : (
                  <div className="space-y-2">
                    {h2h.history.map((m) => (
                      <div key={m.match_id} className={`flex items-center justify-between p-2.5 rounded-lg border ${m.won ? "bg-primary/5 border-primary/20" : "bg-accent/30 border-border/50"}`}>
                        <div>
                          <p className="text-xs font-medium">{m.tournament_name}</p>
                          <p className="text-[10px] text-muted-foreground">{RUNDE_LABELS[m.runde] ?? m.runde} · {m.datum}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${m.won ? "text-primary" : "text-muted-foreground"}`}>
                            {m.my_score} : {m.opp_score}
                          </p>
                          {m.my_avg != null && (
                            <p className="text-[10px] text-muted-foreground">⌀{m.my_avg?.toFixed(1)} vs ⌀{m.opp_avg?.toFixed(1)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!h2hOpponent && (
              <p className="text-sm text-muted-foreground text-center py-2">Wähle einen Gegner um den direkten Vergleich zu sehen.</p>
            )}
          </div>
        )}
      </div>

      {/* Pro Tour results */}
      {proResults.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" /> Pro Tour Ergebnisse
          </h2>
          <div className="space-y-2">
            {proResults.map((r) => (
              <Link key={r.tournament_id} href={`/turniere/${r.tournament_id}`} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border/50 hover:border-primary/30 transition-colors">
                <div>
                  <p className="font-medium text-sm">{r.tournament_name}</p>
                  <p className="text-xs text-muted-foreground">{TYP_LABELS[r.typ] ?? r.typ} · {r.datum}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.matches_won}W / {r.matches_lost}L
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{r.round}</p>
                  <p className="font-bold text-sm text-primary">{r.points.toLocaleString("de-DE")}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Dev Tour results */}
      {devResults.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" /> Development Tour Ergebnisse
          </h2>
          <div className="space-y-2">
            {devResults.map((r) => (
              <Link key={r.tournament_id} href={`/turniere/${r.tournament_id}`} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border/50 hover:border-blue-400/30 transition-colors">
                <div>
                  <p className="font-medium text-sm">{r.tournament_name}</p>
                  <p className="text-xs text-muted-foreground">{TYP_LABELS[r.typ] ?? r.typ} · {r.datum}</p>
                  <p className="text-xs text-muted-foreground">{r.matches_won}W / {r.matches_lost}L</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{r.round}</p>
                  <p className="font-bold text-sm text-blue-400">{r.dev_points.toLocaleString("de-DE")}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {profile.tournament_results?.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-sm text-center py-4">Noch keine Turnierteilnahmen</p>
        </div>
      )}

      {/* Bonus points */}
      {profile.bonus_points?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" /> Bonuspunkte (+{bonusTotal})
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
      <p className={`text-lg font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
