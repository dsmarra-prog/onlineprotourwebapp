import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Calendar, CheckCircle2, Clock, Trophy, Zap, Star, ChevronRight, PlusCircle, Lock } from "lucide-react";
import { useState } from "react";

type ScheduleEntry = {
  id: number;
  season: number;
  tour_type: string;
  kategorie: string;
  phase: string;
  phase_order: number;
  event_name: string;
  datum: string;
  tag: string;
  uhrzeit: string;
  mode: string;
  qualification: string | null;
  status: string;
  external_id: number | null;
};

const KATEGORIE_LABEL: Record<string, string> = {
  pc: "Players Championship",
  m1: "Major",
  m2: "Grand Final",
  dev_cup: "Development Cup",
  dev_major: "Dev Major",
};

const KATEGORIE_COLOR: Record<string, string> = {
  pc: "bg-primary/10 text-primary border border-primary/20",
  m1: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  m2: "bg-red-500/10 text-red-400 border border-red-500/20",
  dev_cup: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  dev_major: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
};

const TOUR_BADGE: Record<string, string> = {
  pro: "PRO",
  development: "DEV",
};

const TOUR_BADGE_COLOR: Record<string, string> = {
  pro: "bg-primary/20 text-primary",
  development: "bg-blue-500/20 text-blue-400",
};

const POINTS_TABLE = {
  pc: [
    { label: "Sieger", pts: 1000 },
    { label: "Finale", pts: 600 },
    { label: "Halbfinale", pts: 400 },
    { label: "Viertelfinale", pts: 250 },
    { label: "Achtelfinale", pts: 150 },
    { label: "Letzte 32", pts: 75 },
    { label: "Teilnahme", pts: 25 },
  ],
  m1: [
    { label: "Sieger", pts: 1500 },
    { label: "Finale", pts: 900 },
    { label: "Halbfinale", pts: 600 },
    { label: "Viertelfinale", pts: 375 },
    { label: "Achtelfinale", pts: 225 },
    { label: "Letzte 32", pts: 125 },
    { label: "Teilnahme", pts: 50 },
  ],
  m2: [
    { label: "Sieger", pts: 2000 },
    { label: "Finale", pts: 1200 },
    { label: "Halbfinale", pts: 800 },
    { label: "Viertelfinale", pts: 500 },
    { label: "Achtelfinale", pts: 300 },
    { label: "Letzte 32", pts: 150 },
    { label: "Teilnahme", pts: 100 },
  ],
};

function parseDatum(datum: string): Date {
  const [d, m, y] = datum.split(".");
  return new Date(Number(y), Number(m) - 1, Number(d));
}

export default function SpielplanPage() {
  const qc = useQueryClient();
  const { data: schedule, isLoading } = useQuery<ScheduleEntry[]>({
    queryKey: ["schedule"],
    queryFn: () => apiFetch("/tour/schedule"),
  });

  const [adminPin, setAdminPin] = useState("");
  const [showSeedPanel, setShowSeedPanel] = useState(false);

  const seedTournamentsMutation = useMutation({
    mutationFn: (pin: string) =>
      apiFetch("/tour/tournaments/seed-from-schedule", { method: "POST", body: JSON.stringify({ admin_pin: pin }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });

  const today = new Date();

  // Auto-seed if empty
  useQuery({
    queryKey: ["schedule-seed"],
    queryFn: async () => {
      const existing = await apiFetch("/tour/schedule");
      if (!existing || existing.length === 0) {
        return apiFetch("/tour/schedule/seed", { method: "POST" });
      }
      return null;
    },
    staleTime: Infinity,
  });

  const grouped = schedule?.reduce<Record<string, ScheduleEntry[]>>((acc, e) => {
    if (!acc[e.phase]) acc[e.phase] = [];
    acc[e.phase].push(e);
    return acc;
  }, {}) ?? {};

  const phaseOrder = schedule
    ? [...new Map(schedule.map((e) => [e.phase, e.phase_order])).entries()]
        .sort((a, b) => a[1] - b[1])
        .map((e) => e[0])
    : [];

  const nextEvent = schedule?.find((e) => {
    const d = parseDatum(e.datum);
    return d >= today && e.status === "upcoming";
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" /> Spielplan – Season 1
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tourkalender 2026 · Pro Tour & Development Tour
          </p>
        </div>
        <button
          onClick={() => setShowSeedPanel((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary border border-border hover:border-primary/30 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Turniere anlegen
        </button>
      </div>

      {showSeedPanel && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Anstehende Turniere aus Kalender anlegen
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Legt alle noch nicht vorhandenen "upcoming" Turniere aus dem Spielplan in der Datenbank an, sodass Spieler sich registrieren können.
          </p>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">Admin-PIN</label>
              <input
                type="password"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Admin-PIN eingeben"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={() => { if (adminPin) seedTournamentsMutation.mutate(adminPin); }}
              disabled={!adminPin || seedTournamentsMutation.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Anlegen
            </button>
          </div>
          {seedTournamentsMutation.data && (
            <div className="mt-3 text-xs">
              {(seedTournamentsMutation.data as any).created?.length > 0 && (
                <p className="text-green-400">✓ Angelegt: {(seedTournamentsMutation.data as any).created.join(", ")}</p>
              )}
              {(seedTournamentsMutation.data as any).skipped?.length > 0 && (
                <p className="text-muted-foreground">↷ Bereits vorhanden: {(seedTournamentsMutation.data as any).skipped.join(", ")}</p>
              )}
            </div>
          )}
          {seedTournamentsMutation.isError && (
            <p className="mt-2 text-xs text-red-400">Fehler beim Anlegen der Turniere.</p>
          )}
        </div>
      )}

      {nextEvent && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary font-medium uppercase tracking-wide">Nächstes Event</p>
            <p className="font-bold">{nextEvent.event_name}</p>
            <p className="text-sm text-muted-foreground">
              {nextEvent.datum} · {nextEvent.tag} · {nextEvent.uhrzeit} Uhr · {nextEvent.mode}
              {nextEvent.qualification && ` · ${nextEvent.qualification}`}
            </p>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${TOUR_BADGE_COLOR[nextEvent.tour_type]}`}>
            {TOUR_BADGE[nextEvent.tour_type]}
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Lade Spielplan...</div>
      ) : schedule?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Spielplan wird geladen...</div>
      ) : (
        <div className="space-y-8">
          {phaseOrder.map((phase) => {
            const events = grouped[phase] ?? [];
            const allDone = events.every((e) => e.status === "abgeschlossen");
            const hasUpcoming = events.some((e) => e.status === "upcoming");

            return (
              <div key={phase}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${allDone ? "bg-green-500" : hasUpcoming ? "bg-primary animate-pulse" : "bg-muted"}`} />
                  <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{phase}</h2>
                  {allDone && (
                    <span className="text-xs text-green-400 font-medium">· alle gespielt</span>
                  )}
                </div>

                <div className="space-y-2">
                  {events.map((event) => {
                    const eventDate = parseDatum(event.datum);
                    const isPast = event.status === "abgeschlossen";
                    const isNext = nextEvent?.id === event.id;

                    return (
                      <div
                        key={event.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isNext
                            ? "bg-primary/8 border-primary/30"
                            : isPast
                            ? "bg-card/40 border-border/50 opacity-70"
                            : "bg-card border-border hover:border-primary/30"
                        }`}
                      >
                        <div className="w-14 text-center flex-shrink-0">
                          {isPast ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <Clock className="w-5 h-5 text-primary mx-auto" />
                          )}
                        </div>

                        <div className="w-24 flex-shrink-0 text-center">
                          <p className="text-xs font-bold">{event.datum.slice(0, 5)}</p>
                          <p className="text-xs text-muted-foreground">{event.tag} · {event.uhrzeit}</p>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${TOUR_BADGE_COLOR[event.tour_type]}`}>
                              {TOUR_BADGE[event.tour_type]}
                            </span>
                            <p className="font-medium text-sm">{event.event_name}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${KATEGORIE_COLOR[event.kategorie] ?? ""}`}>
                              {KATEGORIE_LABEL[event.kategorie] ?? event.kategorie}
                            </span>
                            <span className="text-xs text-muted-foreground">{event.mode}</span>
                            {event.qualification && (
                              <span className="text-xs text-yellow-400">★ {event.qualification}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Points System */}
      <div className="border-t border-border pt-8">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" /> Punktesystem
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { key: "pc", label: "Players Championship", badge: "🟢", sub: "Standard · Bo5" },
            { key: "m1", label: "Majors (Spring Open, Grand Prix)", badge: "🟡", sub: "Qualifikation: Top 32 OoM" },
            { key: "m2", label: "Finals (Home Matchplay)", badge: "🔴", sub: "Qualifikation: Top 32 OoM" },
          ].map(({ key, label, badge, sub }) => (
            <div key={key} className="bg-card border border-border rounded-xl p-4">
              <p className="font-semibold text-sm mb-1">{badge} {label}</p>
              <p className="text-xs text-muted-foreground mb-3">{sub}</p>
              <div className="space-y-1">
                {POINTS_TABLE[key as keyof typeof POINTS_TABLE].map((row) => (
                  <div key={row.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-bold text-primary">{row.pts.toLocaleString("de-DE")}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-card border border-border rounded-xl p-4">
          <p className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" /> Bonuspunkte
          </p>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 font-bold">🎯 9-Darter</span>
              <span className="text-primary font-bold">+500</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-orange-400 font-bold">🐟 Big Fish (170)</span>
              <span className="text-primary font-bold">+100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
