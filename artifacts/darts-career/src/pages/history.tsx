import { Layout } from "@/components/layout";
import { useGetTournamentHistory } from "@/hooks/use-career";
import { AlertCircle, BookOpen, Trophy, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const TYPE_COLORS: Record<string, string> = {
  ProTour: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  EuropeanTour: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  WorldSeries: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Major: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export default function HistoryPage() {
  const { data, isLoading, error } = useGetTournamentHistory();
  const [filter, setFilter] = useState<string>("all");

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

  const history: any[] = data.history ?? [];
  const wins = history.filter((h) => h.ergebnis === "Sieg");
  const totalEarned = history.reduce((s, h) => s + (h.preisgeld ?? 0), 0);

  const filtered = filter === "all" ? history : filter === "wins" ? wins : history.filter((h) => h.ergebnis !== "Sieg");

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-white">Turnierverlauf</h1>
          <p className="text-muted-foreground mt-1">Alle vergangenen Turnierergebnisse</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 text-center">
            <p className="text-3xl font-mono font-bold text-primary">{history.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Turniere gespielt</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 text-center">
            <p className="text-3xl font-mono font-bold text-yellow-400">{wins.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Turniersiege</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 text-center">
            <p className="text-2xl font-mono font-bold text-green-400">£{totalEarned.toLocaleString("en-GB")}</p>
            <p className="text-xs text-muted-foreground mt-1">Preisgeld verdient</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {[
            { key: "all", label: "Alle" },
            { key: "wins", label: "Siege" },
            { key: "losses", label: "Niederlagen" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                filter === key
                  ? "bg-primary text-black border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* History List */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{history.length === 0 ? "Noch keine Turniere gespielt." : "Keine Einträge für diesen Filter."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry: any, i: number) => {
              const isSieg = entry.ergebnis === "Sieg";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    isSieg
                      ? "bg-yellow-500/5 border-yellow-500/20"
                      : "bg-card border-border/60"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isSieg ? "bg-yellow-400/20" : "bg-red-500/10"
                  }`}>
                    {isSieg ? (
                      <Trophy className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-sm ${isSieg ? "text-yellow-400" : "text-white"}`}>
                        {entry.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${TYPE_COLORS[entry.typ] ?? "bg-secondary text-muted-foreground border-border"}`}>
                        {entry.typ}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{entry.runde}</span>
                      {entry.avg > 0 && <span>Avg: {entry.avg.toFixed(2)}</span>}
                      <span>Saison {entry.saison}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`font-mono font-bold text-sm ${isSieg ? "text-yellow-400" : "text-green-400"}`}>
                      +£{(entry.preisgeld ?? 0).toLocaleString("en-GB")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{entry.ergebnis}</p>
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
