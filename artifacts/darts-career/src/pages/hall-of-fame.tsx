import { Layout } from "@/components/layout";
import { useGetTournamentHistory, useGetCareer } from "@/hooks/use-career";
import { AlertCircle, Star, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { KALENDER_META } from "@/lib/kalender-meta";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

// Trophy SVG silhouette component
function TrophySVG({ color, glow }: { color: string; glow: string }) {
  return (
    <svg viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <filter id={`glow-${glow}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={glow !== "none" ? `url(#glow-${glow})` : undefined}>
        {/* Cup body */}
        <path
          d="M20 8 L60 8 L55 42 Q50 55 40 58 Q30 55 25 42 Z"
          fill={color}
          opacity="0.9"
        />
        {/* Handles */}
        <path d="M20 8 Q8 8 8 22 Q8 36 20 38" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M60 8 Q72 8 72 22 Q72 36 60 38" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Stem */}
        <rect x="35" y="58" width="10" height="16" fill={color} rx="2" />
        {/* Base */}
        <rect x="24" y="74" width="32" height="8" fill={color} rx="3" />
        {/* Star on cup */}
        <path d="M40 18 L42 24 L48 24 L43 28 L45 34 L40 30 L35 34 L37 28 L32 24 L38 24 Z"
          fill="white" opacity="0.5" />
      </g>
    </svg>
  );
}

function MedalSVG({ color, glow }: { color: string; glow: string }) {
  return (
    <svg viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <filter id={`glow2-${glow}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter={glow !== "none" ? `url(#glow2-${glow})` : undefined}>
        <line x1="35" y1="5" x2="28" y2="38" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="45" y1="5" x2="52" y2="38" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <circle cx="40" cy="58" r="24" fill={color} opacity="0.9" />
        <circle cx="40" cy="58" r="18" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <path d="M40 46 L42.5 53 L50 53 L44 57.5 L46.5 65 L40 60.5 L33.5 65 L36 57.5 L30 53 L37.5 53 Z"
          fill="white" opacity="0.5" />
      </g>
    </svg>
  );
}

const TROPHY_COLORS = {
  Major: { won: "#FFD700", silhouette: "#2a2a2a", glow: "gold", border: "border-yellow-400/40", bg: "bg-yellow-400/10" },
  WorldSeries: { won: "#C0C0C0", silhouette: "#1f1f1f", glow: "silver", border: "border-slate-400/40", bg: "bg-slate-400/10" },
  EuropeanTour: { won: "#9b59b6", silhouette: "#1f1f1f", glow: "purple", border: "border-purple-400/40", bg: "bg-purple-400/10" },
  ProTour: { won: "#3498db", silhouette: "#1f1f1f", glow: "blue", border: "border-blue-400/40", bg: "bg-blue-400/10" },
};

export default function HallOfFamePage() {
  const { data: histData, isLoading: histLoading } = useGetTournamentHistory();
  const { data: career, isLoading: careerLoading } = useGetCareer();

  const isLoading = histLoading || careerLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!histData || !career) {
    return (
      <Layout>
        <div className="text-center py-20 text-destructive">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Fehler beim Laden.</p>
        </div>
      </Layout>
    );
  }

  // Build set of won tournament names
  const wonTurniere = new Set(
    (histData.history ?? [])
      .filter((h: any) => h.ergebnis === "Sieg")
      .map((h: any) => h.name)
  );

  const totalTitel = wonTurniere.size;
  const majorTitel = (histData.history ?? []).filter(
    (h: any) => h.ergebnis === "Sieg" && h.typ === "Major"
  ).length;

  const besteSpiele: any[] = (career as any).beste_spiele ?? [];

  // Group by type
  const byType: Record<string, typeof KALENDER_META> = {
    Major: KALENDER_META.filter((t) => t.typ === "Major"),
    WorldSeries: KALENDER_META.filter((t) => t.typ === "WorldSeries"),
    EuropeanTour: KALENDER_META.filter((t) => t.typ === "EuropeanTour"),
    ProTour: KALENDER_META.filter((t) => t.typ === "ProTour"),
  };

  const typeLabels: Record<string, string> = {
    Major: "🏆 Majors",
    WorldSeries: "🌍 World Series",
    EuropeanTour: "🇪🇺 European Tour",
    ProTour: "🎯 Players Championship",
  };

  return (
    <Layout>
      <div className="space-y-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-display font-bold text-white mb-2">Hall of Fame</h1>
          <p className="text-muted-foreground">{career.spieler_name}'s Trophäenkabinett</p>
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="text-center">
              <p className="text-4xl font-mono font-bold text-yellow-400">{totalTitel}</p>
              <p className="text-xs text-muted-foreground mt-1">Gesamttitel</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className="text-4xl font-mono font-bold text-primary">{majorTitel}</p>
              <p className="text-xs text-muted-foreground mt-1">Major-Titel</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className="text-4xl font-mono font-bold text-muted-foreground">{KALENDER_META.length - totalTitel}</p>
              <p className="text-xs text-muted-foreground mt-1">Noch zu gewinnen</p>
            </div>
          </div>
        </div>

        {/* Trophy cabinet by type */}
        {Object.entries(byType).map(([typ, turniere]) => {
          const colors = TROPHY_COLORS[typ as keyof typeof TROPHY_COLORS];
          const wonInGroup = turniere.filter((t) => wonTurniere.has(t.name)).length;
          return (
            <div key={typ}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-display font-bold">{typeLabels[typ]}</h2>
                <span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                  {wonInGroup}/{turniere.length}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {turniere.map((t, i) => {
                  const isWon = wonTurniere.has(t.name);
                  return (
                    <motion.div
                      key={t.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      title={t.name}
                      className={`relative flex flex-col items-center rounded-xl p-2 border transition-all cursor-default ${
                        isWon
                          ? `${colors.bg} ${colors.border} shadow-lg`
                          : "bg-secondary/10 border-border/30 opacity-40 grayscale"
                      }`}
                    >
                      <div className="w-12 h-14">
                        {typ === "Major" || typ === "WorldSeries" ? (
                          <TrophySVG
                            color={isWon ? colors.won : colors.silhouette}
                            glow={isWon ? colors.glow : "none"}
                          />
                        ) : (
                          <MedalSVG
                            color={isWon ? colors.won : colors.silhouette}
                            glow={isWon ? colors.glow : "none"}
                          />
                        )}
                      </div>
                      <p className="text-[9px] text-center leading-tight mt-1 text-muted-foreground line-clamp-2">
                        {t.name.replace("Players Championship ", "PC ").replace("European Tour ", "ET ")}
                      </p>
                      {isWon && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-[8px] font-bold text-black">✓</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ── Beste Spiele – Performance Wall of Fame ─────────────────────── */}
        {besteSpiele.length > 0 && (
          <div>
            <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-400" /> Performance Hall of Fame
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {besteSpiele.map((s: any, i: number) => {
                const medals = ["🥇", "🥈", "🥉"];
                const medal = medals[i] ?? `#${i + 1}`;
                const avgColor = s.avg >= 100 ? "text-yellow-300" : s.avg >= 85 ? "text-primary" : s.avg >= 70 ? "text-cyan-300" : "text-white";
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`bg-card border rounded-2xl p-5 hover:border-primary/40 transition-all ${
                      i === 0 ? "border-yellow-400/40 bg-yellow-400/5 shadow-[0_0_24px_rgba(250,200,0,0.08)]"
                      : i === 1 ? "border-slate-400/30 bg-slate-400/5"
                      : i === 2 ? "border-orange-700/30 bg-orange-700/5"
                      : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-2xl">{medal}</span>
                        <p className="text-xs text-muted-foreground mt-1">{s.turnier_name}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-mono font-black ${avgColor}`}>{s.avg?.toFixed(2) ?? "–"}</p>
                        <p className="text-[10px] text-muted-foreground">Average</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-sm font-bold font-mono ${s.win ? "text-green-400" : "text-red-400"}`}>{s.ergebnis}</span>
                      <span className="text-muted-foreground text-sm">vs.</span>
                      <span className="text-sm font-medium text-white truncate">{s.gegner_name}</span>
                    </div>
                    <div className="flex gap-3 text-xs">
                      {s.s180s > 0 && (
                        <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1">
                          <span className="text-red-400 font-bold">{s.s180s}×</span>
                          <span className="text-muted-foreground">180</span>
                        </div>
                      )}
                      {s.hf > 0 && (
                        <div className="flex items-center gap-1 bg-orange-400/10 border border-orange-400/20 rounded-lg px-2 py-1">
                          <span className="text-orange-300 font-bold">{s.hf}</span>
                          <span className="text-muted-foreground">HF</span>
                        </div>
                      )}
                      {s.co_pct > 0 && (
                        <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 rounded-lg px-2 py-1">
                          <span className="text-green-400 font-bold">{s.co_pct?.toFixed(0)}%</span>
                          <span className="text-muted-foreground">DQ</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                      <span className="text-xs text-muted-foreground">{s.datum ? formatDate(s.datum) : "–"}</span>
                      {s.autodarts_id ? (
                        <a
                          href={`https://app.autodarts.io/matches/${s.autodarts_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:text-cyan-300 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Match ansehen
                        </a>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {besteSpiele.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-30 text-yellow-400" />
            <h3 className="text-lg font-display font-bold text-muted-foreground">Performance Hall of Fame</h3>
            <p className="text-sm text-muted-foreground mt-2">Spiele dein erstes Match um hier einzusteigen!</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
