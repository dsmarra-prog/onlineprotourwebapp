import { useState, useRef, forwardRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Trophy, Star, Loader2, Target, TrendingUp, Swords, ChevronDown, ChevronUp, Medal, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toPng } from "html-to-image";
import { apiFetch, TourPlayerProfile, TourH2H, Achievement, TYP_LABELS, RUNDE_LABELS } from "@/lib/api";

type TourPlayer = { id: number; name: string; autodarts_username: string };

export default function SpielerProfil() {
  const { id } = useParams<{ id: string }>();
  const [h2hOpponent, setH2hOpponent] = useState<string>("");
  const [h2hOpen, setH2hOpen] = useState(false);
  const [generatingCard, setGeneratingCard] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: profile, isLoading, isError, error } = useQuery<TourPlayerProfile>({
    queryKey: ["player", id],
    queryFn: () => apiFetch(`/tour/players/${id}`),
    enabled: !!id,
    retry: 1,
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

  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: ["achievements", id],
    queryFn: () => apiFetch(`/tour/players/${id}/achievements`),
    enabled: !!id,
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (isError) return (
    <div className="text-center py-20 space-y-2">
      <p className="text-muted-foreground font-medium">Spieler nicht gefunden</p>
      {error instanceof Error && <p className="text-xs text-muted-foreground/60">{error.message}</p>}
      <Link href="/spieler" className="text-sm text-primary hover:underline block mt-3">← Zurück zur Spielerliste</Link>
    </div>
  );
  if (!profile) return null;

  const bonusTotal = (profile.bonus_points ?? []).reduce((s, b) => s + b.points, 0);
  const proResults = profile.tournament_results?.filter((r) => r.tour_type !== "development") ?? [];
  const devResults = profile.tournament_results?.filter((r) => r.tour_type === "development") ?? [];
  const opponents = allPlayers?.filter((p) => String(p.id) !== id) ?? [];

  async function downloadCard() {
    if (!cardRef.current) return;
    setGeneratingCard(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${profile!.name.replace(/\s/g, "_")}_OPT_Card.png`;
      a.click();
    } catch (e) {
      console.error("Card generation failed:", e);
    } finally {
      setGeneratingCard(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/spieler" className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">@{profile.autodarts_username}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 gap-1.5 text-xs"
          onClick={downloadCard}
          disabled={generatingCard}
        >
          {generatingCard ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          Karte
        </Button>
      </div>

      {/* Hidden player card for image generation */}
      <div className="absolute -left-[9999px] -top-[9999px] pointer-events-none">
        <PlayerCard ref={cardRef} profile={profile} />
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

      {/* Achievements section */}
      {achievements && (
        <AchievementSection achievements={achievements} />
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

      {/* Points chart */}
      {profile.tournament_results && profile.tournament_results.length > 0 && (
        <PointsChart results={profile.tournament_results} />
      )}

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

const PlayerCard = forwardRef<HTMLDivElement, { profile: TourPlayerProfile }>(({ profile }, ref) => {
  const winRate = profile.stats?.win_rate ?? 0;
  const avg = profile.stats?.avg_score;
  const titles = profile.stats?.titles ?? 0;

  return (
    <div
      ref={ref}
      style={{
        width: 400, padding: 28, background: "linear-gradient(135deg, #0f0f12 0%, #16162a 100%)",
        borderRadius: 20, fontFamily: "system-ui, -apple-system, sans-serif", color: "#fff",
        border: "1px solid rgba(99,102,241,0.25)", boxSizing: "border-box",
      }}
    >
      {/* Logo row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase" }}>
          Online Pro Tour
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>Saison 2026</div>
      </div>

      {/* Player avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%", background: "rgba(99,102,241,0.2)",
          border: "2px solid rgba(99,102,241,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 900, color: "#6366f1",
        }}>
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>{profile.name}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>@{profile.autodarts_username}</div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {[
          { label: "Pro OOM", value: profile.oom_points.toString(), color: "#6366f1" },
          { label: "Siege", value: (profile.stats?.matches_won ?? 0).toString(), color: "#10b981" },
          { label: "Titel", value: titles.toString(), color: "#f59e0b" },
          { label: "Winrate", value: `${winRate}%`, color: "#06b6d4" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color }}>{value}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", marginTop: 3, letterSpacing: 0.5 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Average */}
      {avg != null && (
        <div style={{
          background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Ø Three-Dart Average</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#6366f1" }}>{avg.toFixed(1)}</span>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, fontSize: 9, color: "rgba(255,255,255,0.25)", textAlign: "center", letterSpacing: 1 }}>
        onlineprotour.eu
      </div>
    </div>
  );
});

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 text-center ${highlight ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <p className={`text-lg font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function PointsChart({ results }: { results: TourPlayerProfile["tournament_results"] }) {
  const data = results.map((r) => ({
    name: r.tournament_name.replace("Players Championship", "PC").replace("Development Cup", "DC"),
    pro: r.tour_type !== "development" ? r.points : 0,
    dev: r.tour_type === "development" ? r.dev_points : 0,
  }));

  const hasProPoints = data.some((d) => d.pro > 0);
  const hasDevPoints = data.some((d) => d.dev > 0);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-sm">Punkte-Verlauf</h2>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground">
          {hasProPoints && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Pro</span>}
          {hasDevPoints && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Dev</span>}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#6b7280" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "#6b7280" }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "#1c1c1e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: "#e5e7eb", fontWeight: 600 }}
            itemStyle={{ color: "#9ca3af" }}
          />
          {hasProPoints && (
            <Bar dataKey="pro" name="Pro Punkte" fill="#6366f1" radius={[3, 3, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={data[i].pro > 0 ? "#6366f1" : "transparent"} />)}
            </Bar>
          )}
          {hasDevPoints && (
            <Bar dataKey="dev" name="Dev Punkte" fill="#60a5fa" radius={[3, 3, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={data[i].dev > 0 ? "#60a5fa" : "transparent"} />)}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const TIER_STYLES = {
  bronze: { ring: "ring-amber-700/50", bg: "bg-amber-900/20", label: "text-amber-600", dot: "bg-amber-600" },
  silver: { ring: "ring-slate-400/50", bg: "bg-slate-700/20", label: "text-slate-300", dot: "bg-slate-300" },
  gold: { ring: "ring-yellow-400/60", bg: "bg-yellow-900/20", label: "text-yellow-400", dot: "bg-yellow-400" },
};

function AchievementSection({ achievements }: { achievements: Achievement[] }) {
  const [open, setOpen] = useState(false);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const grouped = achievements.reduce<Record<string, Achievement[]>>((acc, a) => {
    if (!acc[a.category_label]) acc[a.category_label] = [];
    acc[a.category_label].push(a);
    return acc;
  }, {});

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        className="flex items-center justify-between w-full p-4"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Medal className="w-4 h-4 text-yellow-400" />
          <h2 className="font-semibold text-sm">Achievements</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 font-medium">
            {unlockedCount}/{achievements.length}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border/50">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">{category}</p>
              <div className="grid grid-cols-1 gap-2">
                {items.map((a) => {
                  const tier = TIER_STYLES[a.tier];
                  return (
                    <div
                      key={a.key}
                      className={`flex items-center gap-3 rounded-xl p-3 ring-1 transition-all ${
                        a.unlocked
                          ? `${tier.ring} ${tier.bg}`
                          : "ring-border/30 bg-muted/20 opacity-50"
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                        a.unlocked ? tier.bg : "bg-muted/30"
                      } ring-1 ${a.unlocked ? tier.ring : "ring-border/20"}`}>
                        <span className={a.unlocked ? "" : "grayscale"}>{a.emoji}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`text-sm font-semibold truncate ${a.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                            {a.name}
                          </p>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            a.unlocked ? tier.label : "text-muted-foreground"
                          } bg-current/10`}
                            style={{ backgroundColor: "transparent", border: "1px solid currentColor" }}>
                            {a.tier}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-tight">{a.description}</p>
                        {a.unlocked && a.unlocked_at && (
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            Freigeschaltet {new Date(a.unlocked_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>

                      {/* Unlock badge */}
                      {a.unlocked && (
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tier.dot}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
