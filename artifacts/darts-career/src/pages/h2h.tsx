import { Layout } from "@/components/layout";
import { useGetH2H } from "@/hooks/use-career";
import { AlertCircle, Users, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function H2HPage() {
  const { data, isLoading, error } = useGetH2H();
  const [search, setSearch] = useState("");

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
          <p>Fehler beim Laden.</p>
        </div>
      </Layout>
    );
  }

  const records = data.records ?? [];
  const filtered = records.filter((r: any) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalSiege = records.reduce((s: number, r: any) => s + r.siege, 0);
  const totalNiederlagen = records.reduce((s: number, r: any) => s + r.niederlagen, 0);
  const totalSpiele = totalSiege + totalNiederlagen;
  const winPct = totalSpiele > 0 ? ((totalSiege / totalSpiele) * 100).toFixed(1) : "0.0";

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-white">Head-to-Head</h1>
          <p className="text-muted-foreground mt-1">Alle Duelle im Überblick</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 text-center">
            <p className="text-3xl font-mono font-bold text-green-400">{totalSiege}</p>
            <p className="text-xs text-muted-foreground mt-1">Siege gesamt</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 text-center">
            <p className="text-3xl font-mono font-bold text-red-400">{totalNiederlagen}</p>
            <p className="text-xs text-muted-foreground mt-1">Niederlagen gesamt</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 text-center">
            <p className="text-3xl font-mono font-bold text-primary">{winPct}%</p>
            <p className="text-xs text-muted-foreground mt-1">Gesamt-Siegquote</p>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Gegner suchen..."
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />

        {/* Records */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{records.length === 0 ? "Noch keine Matches gespielt." : "Kein Gegner gefunden."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r: any, i: number) => {
              const total = r.siege + r.niederlagen;
              const pct = total > 0 ? (r.siege / total) * 100 : 0;
              const dominiert = r.siege > r.niederlagen;
              return (
                <motion.div
                  key={r.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${dominiert ? "bg-green-500/20" : "bg-red-500/20"}`}>
                        {dominiert ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <span className="font-medium text-white">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xl font-mono font-bold ${dominiert ? "text-green-400" : "text-red-400"}`}>
                        {r.siege}
                      </span>
                      <span className="text-muted-foreground">:</span>
                      <span className="text-xl font-mono font-bold text-muted-foreground">{r.niederlagen}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: pct >= 60 ? "#22c55e" : pct >= 40 ? "#00d2ff" : "#ef4444",
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono w-12 text-right">{pct.toFixed(0)}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
