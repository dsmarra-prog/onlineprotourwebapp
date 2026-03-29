import { Layout } from "@/components/layout";
import { useGetCareer } from "@/hooks/use-career";
import { AlertCircle, BarChart2, Target, Trophy, Zap, Star, TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";

function StatBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  return (
    <div className="w-full bg-secondary rounded-full h-2 mt-1">
      <div
        className={`${color} h-2 rounded-full transition-all duration-700`}
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      />
    </div>
  );
}

function MiniChart({ data, label, color = "#00d2ff" }: { data: number[]; label: string; color?: string }) {
  if (!data || data.length < 2) {
    return (
      <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
        Nicht genug Daten
      </div>
    );
  }
  const min = Math.min(...data) * 0.95;
  const max = Math.max(...data) * 1.05;
  const range = max - min || 1;
  const width = 300;
  const height = 80;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  const last = data[data.length - 1];
  const avg = data.reduce((a, b) => a + b, 0) / data.length;

  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <span>{label}</span>
        <span className="font-mono" style={{ color }}>{last.toFixed(2)}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height: "80px" }}>
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline fill={`url(#grad-${label})`} stroke="none" points={`0,${height} ${pts.join(" ")} ${width},${height}`} />
        <polyline fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" points={pts.join(" ")} />
        <line
          x1="0" y1={height - ((avg - min) / range) * height}
          x2={width} y2={height - ((avg - min) / range) * height}
          stroke={color} strokeOpacity="0.3" strokeDasharray="4 4" strokeWidth="1"
        />
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Ø {avg.toFixed(2)}</span>
        <span>{data.length} Matches</span>
      </div>
    </div>
  );
}

function RankingChart({ data }: { data: any[] }) {
  if (!data || data.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
        Nicht genug Daten – spiele mehr Turniere!
      </div>
    );
  }

  const plaetze = data.map((d) => d.platz);
  const minP = Math.min(...plaetze);
  const maxP = Math.max(...plaetze);
  const range = maxP - minP || 1;
  const width = 400;
  const height = 100;

  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = ((d.platz - minP) / range) * height;
    return `${x},${y}`;
  });

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: "100px" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="rankGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <polyline fill="url(#rankGrad)" stroke="none" points={`0,${height} ${pts.join(" ")} ${width},${height}`} />
        <polyline fill="none" stroke="#00d2ff" strokeWidth="2" strokeLinejoin="round" points={pts.join(" ")} />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * width;
          const y = ((d.platz - minP) / range) * height;
          return <circle key={i} cx={x} cy={y} r="3" fill="#00d2ff" />;
        })}
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>Rang {maxP} (schlechter)</span>
        <span>Rang {minP} (besser)</span>
      </div>
      <div className="flex gap-2 mt-2 flex-wrap">
        {data.slice(-5).map((d, i) => (
          <span key={i} className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">
            Platz {d.platz}
          </span>
        ))}
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function StatsPage() {
  const { data: career, isLoading, error } = useGetCareer();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !career) {
    return (
      <Layout>
        <div className="text-center py-20 text-destructive">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Fehler beim Laden.</p>
        </div>
      </Layout>
    );
  }

  const winPct = career.stats_spiele > 0 ? ((career.stats_siege / career.stats_spiele) * 100).toFixed(1) : "0.0";
  const legPct =
    career.stats_legs_won + career.stats_legs_lost > 0
      ? ((career.stats_legs_won / (career.stats_legs_won + career.stats_legs_lost)) * 100).toFixed(1)
      : "0.0";

  const avgHistory: number[] = (career as any).stats_avg_history ?? [];
  const coHistory: number[] = (career as any).stats_checkout_percent_history ?? [];
  const rankHistory: any[] = career.ranking_verlauf ?? [];

  const bestSingleAvg: number = (career as any).stats_best_single_avg ?? 0;
  const mostOneEightyGame: number = (career as any).stats_most_180s_game ?? 0;
  const coAttempted: number = (career as any).stats_total_co_attempted ?? 0;
  const coHit: number = (career as any).stats_total_co_hit ?? 0;
  const realCoPct = coAttempted > 0 ? ((coHit / coAttempted) * 100).toFixed(1) : "–";

  const besteSpiele: any[] = (career as any).beste_spiele ?? [];
  const letzteMatchIds: any[] = (career as any).letzte_match_ids ?? [];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-white">Statistiken</h1>
          <p className="text-muted-foreground mt-1">Karrierezahlen von {career.spieler_name}</p>
        </div>

        {/* Key Stats Row — 8 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Karriere-Average", value: career.gesamt_avg.toFixed(2), icon: BarChart2, color: "text-primary" },
            { label: "Bester Match-Avg", value: bestSingleAvg > 0 ? bestSingleAvg.toFixed(2) : "–", icon: Star, color: "text-cyan-300" },
            { label: "Doppel-Quote", value: `${career.gesamt_co.toFixed(2)}%`, icon: Target, color: "text-green-400" },
            { label: "Siegquote", value: `${winPct}%`, icon: Trophy, color: "text-yellow-400" },
            { label: "Legs gewonnen", value: `${legPct}%`, icon: Zap, color: "text-orange-400" },
            { label: "180er gesamt", value: String(career.stats_180s), icon: Award, color: "text-red-400" },
            { label: "Rekord 180/Match", value: mostOneEightyGame > 0 ? `${mostOneEightyGame}×` : "–", icon: Award, color: "text-pink-400" },
            { label: "Höchstes Finish", value: career.stats_highest_finish > 0 ? String(career.stats_highest_finish) : "–", icon: TrendingUp, color: "text-yellow-300" },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-5 text-center hover:border-primary/30 transition-colors"
            >
              <Icon className={`w-8 h-8 mx-auto mb-2 ${color}`} />
              <p className={`text-3xl font-mono font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Match Stats */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-display font-bold mb-6">Match-Statistiken</h2>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Siege</span>
                  <span className="font-mono font-bold text-green-400">{career.stats_siege}</span>
                </div>
                <StatBar value={career.stats_siege} max={Math.max(career.stats_spiele, 1)} color="bg-green-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Niederlagen</span>
                  <span className="font-mono font-bold text-red-400">{career.stats_spiele - career.stats_siege}</span>
                </div>
                <StatBar value={career.stats_spiele - career.stats_siege} max={Math.max(career.stats_spiele, 1)} color="bg-red-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Legs gewonnen</span>
                  <span className="font-mono font-bold text-primary">{career.stats_legs_won}</span>
                </div>
                <StatBar value={career.stats_legs_won} max={Math.max(career.stats_legs_won + career.stats_legs_lost, 1)} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Legs verloren</span>
                  <span className="font-mono font-bold text-muted-foreground">{career.stats_legs_lost}</span>
                </div>
                <StatBar value={career.stats_legs_lost} max={Math.max(career.stats_legs_won + career.stats_legs_lost, 1)} color="bg-muted-foreground/40" />
              </div>

              <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-mono font-bold text-yellow-400">{career.stats_180s}</p>
                  <p className="text-xs text-muted-foreground mt-1">Maximums (180)</p>
                </div>
                <div className="text-center">
                  <p className={`text-3xl font-mono font-bold ${career.stats_highest_finish >= 170 ? "text-yellow-400" : career.stats_highest_finish >= 100 ? "text-primary" : "text-white"}`}>
                    {career.stats_highest_finish || "–"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Höchstes Finish</p>
                </div>
              </div>

              {/* Extended stats */}
              <div className="pt-4 border-t border-border grid grid-cols-3 gap-3">
                <div className="text-center bg-secondary/30 rounded-xl p-3">
                  <p className="text-xl font-mono font-bold text-cyan-300">{bestSingleAvg > 0 ? bestSingleAvg.toFixed(1) : "–"}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Bester Match-Avg</p>
                </div>
                <div className="text-center bg-secondary/30 rounded-xl p-3">
                  <p className="text-xl font-mono font-bold text-pink-400">{mostOneEightyGame > 0 ? `${mostOneEightyGame}×` : "–"}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Max 180/Match</p>
                </div>
                <div className="text-center bg-secondary/30 rounded-xl p-3">
                  <p className="text-xl font-mono font-bold text-green-400">{realCoPct}{realCoPct !== "–" ? "%" : ""}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Doppelquote (kumulativ)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-display font-bold mb-4">Average-Verlauf</h2>
              <MiniChart data={avgHistory} label="Three-dart Average" color="#00d2ff" />
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-display font-bold mb-4">Doppelquoten-Verlauf</h2>
              <MiniChart data={coHistory} label="Doppel-Quote %" color="#22c55e" />
            </div>
          </div>
        </div>

        {/* Ranking History */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-display font-bold mb-6">Weltranglistenverlauf</h2>
          <RankingChart data={rankHistory} />
        </div>

        {/* Wall of Fame – Beste Spiele */}
        {besteSpiele.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" /> Wall of Fame – Beste Spiele
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Deine Top-Performances nach Average sortiert</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-3 text-muted-foreground font-medium w-8">#</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Turnier</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Gegner</th>
                    <th className="text-center p-3 text-muted-foreground font-medium">Erg.</th>
                    <th className="text-center p-3 text-muted-foreground font-medium">Avg</th>
                    <th className="text-center p-3 text-muted-foreground font-medium">180s</th>
                    <th className="text-center p-3 text-muted-foreground font-medium">HF</th>
                    <th className="text-center p-3 text-muted-foreground font-medium">Datum</th>
                    <th className="text-center p-3 text-muted-foreground font-medium">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {besteSpiele.map((s: any, i: number) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`hover:bg-secondary/20 transition-colors ${i === 0 ? "bg-yellow-400/5" : ""}`}
                    >
                      <td className="p-3">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-muted-foreground font-mono">{i + 1}</span>}
                      </td>
                      <td className="p-3 font-medium text-white text-xs">{s.turnier_name}</td>
                      <td className="p-3 text-muted-foreground text-xs">{s.gegner_name}</td>
                      <td className="p-3 text-center">
                        <span className={`font-mono text-xs font-bold ${s.win ? "text-green-400" : "text-red-400"}`}>{s.ergebnis}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-mono font-bold ${s.avg >= 90 ? "text-yellow-300" : s.avg >= 75 ? "text-primary" : "text-white"}`}>
                          {s.avg?.toFixed(2) ?? "–"}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-red-400">{s.s180s > 0 ? `${s.s180s}×` : "–"}</td>
                      <td className="p-3 text-center font-mono text-orange-300">{s.hf > 0 ? s.hf : "–"}</td>
                      <td className="p-3 text-center text-xs text-muted-foreground">{s.datum ? formatDate(s.datum) : "–"}</td>
                      <td className="p-3 text-center">
                        {s.autodarts_id ? (
                          <a
                            href={`https://app.autodarts.io/matches/${s.autodarts_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-xs text-primary hover:text-cyan-300 underline underline-offset-2 transition-colors"
                          >
                            ↗ Match
                          </a>
                        ) : <span className="text-muted-foreground/40 text-xs">–</span>}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Letzte Autodarts-Matches */}
        {letzteMatchIds.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                🔗 Letzte Autodarts-Matches
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Direkt-Links zu deinen letzten Spielen auf Autodarts</p>
            </div>
            <div className="divide-y divide-border/50">
              {letzteMatchIds.slice(0, 10).map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{m.turnier} vs. {m.gegner}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.datum ? formatDate(m.datum) : "–"} · {m.ergebnis}</p>
                  </div>
                  <a
                    href={`https://app.autodarts.io/matches/${m.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 shrink-0 text-xs bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    ↗ Autodarts
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
