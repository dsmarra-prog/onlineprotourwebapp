import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { useGetCareer } from "@/hooks/use-career";
import { AlertCircle, Crown } from "lucide-react";

const LEVEL_COLORS: Record<number, string> = {
  1: "text-slate-400",
  2: "text-slate-300",
  3: "text-lime-400",
  4: "text-yellow-400",
  5: "text-orange-400",
  6: "text-orange-500",
  7: "text-red-400",
  8: "text-red-500",
  9: "text-pink-400",
};

const LEVEL_LABELS: Record<number, string> = {
  1: "L1", 2: "L2", 3: "L3", 4: "L4", 5: "L5",
  6: "L6", 7: "L7", 8: "L8", 9: "L9",
};

interface OomEntry {
  platz: number;
  name: string;
  geld: number;
  bot_level: number | null;
  is_player: boolean;
}

function useGetOom() {
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  return useQuery<{ entries: OomEntry[]; spieler_name: string }>({
    queryKey: ["career-oom"],
    queryFn: async () => {
      const res = await fetch(`${base}/api/career/oom`);
      if (!res.ok) throw new Error("OoM konnte nicht geladen werden");
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}

function rankColor(platz: number) {
  if (platz === 1) return "text-yellow-400";
  if (platz === 2) return "text-slate-300";
  if (platz === 3) return "text-amber-600";
  return "text-muted-foreground";
}

function rankBg(platz: number, isPlayer: boolean) {
  if (isPlayer) return "bg-primary/10 border-primary/60 shadow-[0_0_15px_rgba(0,210,255,0.1)]";
  if (platz === 1) return "bg-yellow-400/5 border-yellow-400/20";
  if (platz <= 3) return "bg-secondary/30 border-border/40";
  if (platz <= 10) return "bg-secondary/20 border-border/30";
  return "bg-transparent border-border/20";
}

export default function OrderOfMeritPage() {
  const { data, isLoading, error } = useGetOom();
  const { data: career } = useGetCareer();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="text-center py-20 text-destructive">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Order of Merit konnte nicht geladen werden.</p>
        </div>
      </Layout>
    );
  }

  const playerEntry = data.entries.find((e) => e.is_player);
  const playerRank = playerEntry?.platz ?? "–";

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-white">Order of Merit</h1>
            <p className="text-muted-foreground mt-1">Vollständige PDC Weltrangliste nach Preisgeld</p>
          </div>
          {playerEntry && (
            <div className="bg-primary/10 border border-primary/40 rounded-2xl px-5 py-3 text-center">
              <p className="text-3xl font-mono font-bold text-primary">Platz {playerRank}</p>
              <p className="text-xs text-muted-foreground">{career?.spieler_name}</p>
              <p className="text-sm font-mono text-white mt-1">£{playerEntry.geld.toLocaleString("en-GB")}</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 bg-secondary/20 rounded-xl p-3 border border-border/30">
          <span className="text-xs text-muted-foreground font-medium">Autodarts Bot-Level:</span>
          {[1,2,3,4,5,6,7,8,9].map((lvl) => (
            <span key={lvl} className={`text-xs font-mono font-bold ${LEVEL_COLORS[lvl]}`}>
              {LEVEL_LABELS[lvl]}
            </span>
          ))}
          <span className="text-xs text-muted-foreground ml-2">(zeigt Spielstärke des Gegners)</span>
        </div>

        {/* Full ranking table */}
        <div className="space-y-1">
          {data.entries.map((entry, i) => (
            <motion.div
              key={`${entry.name}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.01, 0.5) }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${rankBg(entry.platz, entry.is_player)}`}
            >
              {/* Rank */}
              <span className={`w-8 text-right font-mono text-sm font-bold shrink-0 ${rankColor(entry.platz)}`}>
                {entry.platz === 1 && <Crown className="w-4 h-4 inline-block mb-0.5" />}
                {entry.platz !== 1 && entry.platz}
              </span>

              {/* Name */}
              <span className={`flex-1 font-medium truncate text-sm ${entry.is_player ? "text-primary font-bold" : "text-foreground"}`}>
                {entry.name}
                {entry.is_player && <span className="ml-2 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider">Du</span>}
              </span>

              {/* Bot Level Badge */}
              {entry.bot_level != null && !entry.is_player && (
                <span className={`text-xs font-mono font-bold shrink-0 ${LEVEL_COLORS[entry.bot_level]}`}>
                  {LEVEL_LABELS[entry.bot_level]}
                </span>
              )}

              {/* Prize Money */}
              <span className={`font-mono text-sm shrink-0 ${entry.geld > 0 ? "text-white" : "text-muted-foreground"}`}>
                £{entry.geld.toLocaleString("en-GB")}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
