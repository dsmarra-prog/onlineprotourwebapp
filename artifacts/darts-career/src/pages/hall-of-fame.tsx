import { Layout } from "@/components/layout";
import { useGetTournamentHistory, useGetCareer } from "@/hooks/use-career";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { KALENDER_META } from "@/lib/kalender-meta";

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
      </div>
    </Layout>
  );
}
