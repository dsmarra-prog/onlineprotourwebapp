import { useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, TourTournamentDetail, TourMatch, RUNDE_LABELS } from "@/lib/api";
import { Target, Radio, RefreshCw, Trophy, ExternalLink } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";

const STATUS_LABEL: Record<string, string> = {
  offen: "Anmeldung offen",
  aktiv: "Läuft",
  abgeschlossen: "Abgeschlossen",
  geplant: "Geplant",
};

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex flex-col items-center bg-accent/40 border border-border/50 rounded px-2 py-0.5">
      <span className="text-[9px] text-muted-foreground/70 uppercase tracking-wider leading-none">{label}</span>
      <span className="text-xs font-bold text-foreground leading-none mt-0.5">{value}</span>
    </span>
  );
}

function PublicMatchCard({ match }: { match: TourMatch }) {
  if (match.is_bye) return null;

  const isComplete = match.status === "abgeschlossen";
  const isLive = match.status === "live";
  const isPending = !match.player1_id || !match.player2_id;

  const p1Win = isComplete && match.winner_id === match.player1_id;
  const p2Win = isComplete && match.winner_id === match.player2_id;

  const hasStats = isComplete && (
    match.avg_p1 !== null || match.count_180s_p1 !== null || match.high_checkout_p1 !== null
  );

  return (
    <div
      className={`rounded-xl border p-3 transition-all ${
        isComplete
          ? "bg-accent/15 border-border/40"
          : isLive
          ? "bg-primary/5 border-primary/50 shadow-[0_0_8px_rgba(0,210,255,0.12)]"
          : "bg-card border-border/50"
      } ${isPending ? "opacity-50" : ""}`}
    >
      {isLive && (
        <div className="flex items-center gap-1 mb-2 text-xs text-primary font-medium">
          <Radio className="w-3 h-3 animate-pulse" />
          Live
        </div>
      )}

      {/* Player rows */}
      <div className="space-y-1.5">
        {[
          {
            name: match.player1_name ?? "TBD",
            avatar: match.player1_avatar,
            score: match.score_p1,
            avg: match.avg_p1,
            count180s: match.count_180s_p1,
            highCo: match.high_checkout_p1,
            isWin: p1Win,
          },
          {
            name: match.player2_name ?? "TBD",
            avatar: match.player2_avatar,
            score: match.score_p2,
            avg: match.avg_p2,
            count180s: match.count_180s_p2,
            highCo: match.high_checkout_p2,
            isWin: p2Win,
          },
        ].map((p, i) => (
          <div key={i} className={`flex items-center gap-2 ${isComplete && !p.isWin ? "opacity-55" : ""}`}>
            <PlayerAvatar name={p.name} avatarUrl={p.avatar} size="xs" />
            <span className={`flex-1 text-sm truncate ${p.isWin ? "font-bold text-foreground" : "text-muted-foreground"}`}>
              {p.name}
              {p.isWin && <Trophy className="inline w-3 h-3 text-yellow-400 ml-1 -mt-0.5" />}
            </span>
            {isComplete && p.score !== null && (
              <span className={`tabular-nums text-sm font-bold w-5 text-center ${p.isWin ? "text-foreground" : "text-muted-foreground/60"}`}>
                {p.score}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Extended stats */}
      {hasStats && (
        <div className="mt-2.5 flex gap-2 flex-wrap">
          {match.avg_p1 !== null && match.avg_p2 !== null && (
            <>
              <StatPill label={match.player1_name?.split(" ")[0] ?? "P1"} value={match.avg_p1.toFixed(1)} />
              <span className="text-muted-foreground/40 text-xs self-center">avg</span>
              <StatPill label={match.player2_name?.split(" ")[0] ?? "P2"} value={match.avg_p2.toFixed(1)} />
            </>
          )}
          {(match.count_180s_p1 !== null && match.count_180s_p1 > 0) && (
            <StatPill label="180s P1" value={match.count_180s_p1} />
          )}
          {(match.count_180s_p2 !== null && match.count_180s_p2 > 0) && (
            <StatPill label="180s P2" value={match.count_180s_p2} />
          )}
          {(match.high_checkout_p1 !== null && match.high_checkout_p1 > 0) && (
            <StatPill label="HiCo P1" value={match.high_checkout_p1} />
          )}
          {(match.high_checkout_p2 !== null && match.high_checkout_p2 > 0) && (
            <StatPill label="HiCo P2" value={match.high_checkout_p2} />
          )}
        </div>
      )}
    </div>
  );
}

export default function TurnierPublicPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data, isLoading, refetch } = useQuery<TourTournamentDetail>({
    queryKey: ["tournament-public", id],
    queryFn: () => apiFetch(`/tour/tournaments/${id}`),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const t = data?.tournament;
  const matches = data?.matches ?? [];
  const rounds = data?.rounds ?? [];

  const isActive = t?.status === "aktiv";

  const sortedRounds = [...rounds].sort((a, b) => {
    const order = ["R1", "R2", "R3", "R4", "QF", "SF", "GF", "F", "3P", "FINAL"];
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const liveMatches = matches.filter((m) => m.status === "live");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Target className="w-8 h-8 text-primary animate-pulse" />
          <span className="text-sm">Laden…</span>
        </div>
      </div>
    );
  }

  if (!t) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Turnier nicht gefunden.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Trophy className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{t.name}</p>
              <p className="text-xs text-muted-foreground">
                {STATUS_LABEL[t.status] ?? t.status}
                {t.datum && ` · ${new Date(t.datum).toLocaleDateString("de-DE")}`}
                {t.uhrzeit && ` · ${t.uhrzeit} Uhr`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isActive && (
              <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> Live
              </span>
            )}
            <a
              href="https://onlineprotour.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              onlineprotour.eu <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Live matches highlight */}
        {liveMatches.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 text-primary animate-pulse" />
              <h2 className="text-sm font-semibold">Live Matches</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {liveMatches.map((m) => <PublicMatchCard key={m.id} match={m} />)}
            </div>
          </section>
        )}

        {/* Rounds */}
        {sortedRounds.map((runde) => {
          const roundMatches = matches
            .filter((m) => m.runde === runde && !m.is_bye)
            .sort((a, b) => a.match_nr - b.match_nr);
          if (roundMatches.length === 0) return null;

          const completedCount = roundMatches.filter((m) => m.status === "abgeschlossen").length;
          const allDone = completedCount === roundMatches.length;

          return (
            <section key={runde}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold">{RUNDE_LABELS[runde] ?? runde}</h2>
                <span className="text-xs text-muted-foreground">
                  {completedCount}/{roundMatches.length}
                </span>
                {allDone && <span className="text-[10px] text-green-400 bg-green-400/10 border border-green-400/20 px-1.5 py-0.5 rounded-full">Fertig</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roundMatches.map((m) => <PublicMatchCard key={m.id} match={m} />)}
              </div>
            </section>
          );
        })}

        {/* Players list */}
        {data?.players && data.players.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-3">Teilnehmer ({data.players.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {data.players
                .sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999))
                .map((p) => (
                  <div key={p.player_id} className="flex items-center gap-2 bg-card border border-border/50 rounded-lg px-3 py-2">
                    {p.seed && <span className="text-xs text-muted-foreground/60 w-4 shrink-0">#{p.seed}</span>}
                    <PlayerAvatar name={p.name} avatarUrl={p.avatar_url} size="xs" />
                    <span className="text-xs font-medium truncate">{p.name}</span>
                  </div>
                ))}
            </div>
          </section>
        )}

        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-muted-foreground/50">
            Automatische Aktualisierung alle 15 Sekunden · Powered by{" "}
            <a href="https://onlineprotour.eu" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              onlineprotour.eu
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
