import { Layout } from "@/components/layout";
import { useGetCalendar } from "@/hooks/use-career";
import { AlertCircle, Calendar, CheckCircle, Clock, Play, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const TYPE_COLORS: Record<string, string> = {
  ProTour: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  EuropeanTour: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  WorldSeries: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Major: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  played: <CheckCircle className="w-5 h-5 text-muted-foreground" />,
  live: <Play className="w-5 h-5 text-primary animate-pulse" />,
  next: <Clock className="w-5 h-5 text-yellow-400" />,
  upcoming: <Calendar className="w-5 h-5 text-muted-foreground/50" />,
};

type FilterType = "all" | "ProTour" | "EuropeanTour" | "WorldSeries" | "Major";

export default function CalendarPage() {
  const { data, isLoading, error } = useGetCalendar();
  const [filter, setFilter] = useState<FilterType>("all");

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

  const entries = data.entries ?? [];
  const played = entries.filter((e: any) => e.status === "played").length;
  const total = entries.length;
  const filtered = entries.filter((e: any) => filter === "all" || e.typ === filter);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-white">Saison-Kalender</h1>
            <p className="text-muted-foreground mt-1">{played} / {total} Turniere gespielt</p>
          </div>
          {/* Season progress */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="flex-1 bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(played / total) * 100}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap">{Math.round((played / total) * 100)}%</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "ProTour", "EuropeanTour", "WorldSeries", "Major"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                filter === f
                  ? "bg-primary text-black border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-white"
              }`}
            >
              {f === "all" ? "Alle" : f === "ProTour" ? "Players Championship" : f}
            </button>
          ))}
        </div>

        {/* Calendar List */}
        <div className="space-y-2">
          {filtered.map((entry: any, i: number) => (
            <motion.div
              key={entry.index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                entry.status === "live"
                  ? "bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(0,210,255,0.1)]"
                  : entry.status === "next"
                  ? "bg-yellow-500/5 border-yellow-500/30"
                  : entry.status === "played"
                  ? "bg-card border-border/50 opacity-70"
                  : entry.qualifiziert
                  ? "bg-card border-border"
                  : "bg-card border-border opacity-40"
              }`}
            >
              <div className="w-6 shrink-0">{STATUS_ICONS[entry.status]}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium ${entry.status === "played" ? "text-muted-foreground" : "text-white"}`}>
                    {entry.name}
                  </span>
                  {entry.status === "live" && (
                    <span className="text-xs bg-primary text-black px-2 py-0.5 rounded-full font-bold">LIVE</span>
                  )}
                  {entry.status === "next" && (
                    <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-bold">NÄCHSTES</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded border ${TYPE_COLORS[entry.typ] ?? "bg-secondary text-muted-foreground border-border"}`}>
                    {entry.typ}
                  </span>
                  {entry.format === "sets" && (
                    <span className="text-xs text-muted-foreground">Sets-Format</span>
                  )}
                  {entry.min_platz && (
                    <span className="text-xs text-muted-foreground">
                      {entry.qualifiziert ? "✓ Qualifiziert" : `Min. Top ${entry.min_platz}`}
                    </span>
                  )}
                  {entry.min_platz && !entry.qualifiziert && (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="text-right text-xs text-muted-foreground shrink-0">
                #{entry.index + 1}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
