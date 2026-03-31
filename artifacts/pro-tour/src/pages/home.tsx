import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Trophy, Users, BarChart3, Zap, Calendar, Radio, ExternalLink, Target, Clock } from "lucide-react";
import { apiFetch, TourTournament, TourOomEntry, TYP_LABELS, LiveTickerMatch, RUNDE_LABELS } from "@/lib/api";
import { PlayerAvatar } from "@/components/PlayerAvatar";

export default function HomeDashboard() {
  const { data: tournaments } = useQuery<TourTournament[]>({
    queryKey: ["tournaments"],
    queryFn: () => apiFetch("/tour/tournaments"),
  });

  const { data: oom } = useQuery<TourOomEntry[]>({
    queryKey: ["oom"],
    queryFn: () => apiFetch("/tour/oom"),
  });

  const { data: ticker } = useQuery<LiveTickerMatch[]>({
    queryKey: ["live-ticker"],
    queryFn: () => apiFetch("/tour/live-ticker"),
    refetchInterval: 15_000,
    staleTime: 0,
  });

  const laufend = tournaments?.filter((t) => t.status === "laufend" && !t.is_test) ?? [];
  const offen = tournaments?.filter((t) => t.status === "offen" && !t.is_test) ?? [];
  const top5 = oom?.slice(0, 5) ?? [];

  // All matches in ticker: with scores = in-game, without = lobby/waiting
  const inGame = ticker?.filter((m) => m.score_p1 != null || m.score_p2 != null) ?? [];
  const waiting = ticker?.filter((m) => m.score_p1 == null && m.score_p2 == null) ?? [];
  const totalActive = ticker?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary tracking-wide">Online Pro Tour</h1>
        <p className="text-muted-foreground text-sm mt-1">Echtzeit-Dart-Turnierplattform für Autodarts-Spieler</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard icon={Trophy} label="Turniere gesamt" value={tournaments?.length ?? 0} href="/turniere" />
        <StatCard icon={Users} label="Spieler" value={oom?.length ?? 0} href="/spieler" />
        <StatCard icon={Zap} label="Aktive Turniere" value={laufend.length} accent href="/turniere" />
      </div>

      {/* Live Ticker — shown whenever there are active matches */}
      {totalActive > 0 && (
        <div className="bg-card border border-primary/30 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-primary/20 bg-primary/5">
            <Radio className="w-4 h-4 text-primary animate-pulse" />
            <h2 className="font-semibold text-sm text-primary">Live Matches</h2>
            <span className="text-xs text-muted-foreground">
              {inGame.length > 0 ? `${inGame.length} im Spiel` : ""}
              {inGame.length > 0 && waiting.length > 0 ? " · " : ""}
              {waiting.length > 0 ? `${waiting.length} in der Lobby` : ""}
            </span>
            <span className="text-xs text-muted-foreground/60 ml-auto">alle 15s</span>
          </div>

          <div className="divide-y divide-border/30">
            {/* In-game matches first — prominent */}
            {inGame.map((m) => (
              <TickerRow key={m.match_id} match={m} phase="live" />
            ))}
            {/* Lobby/waiting matches */}
            {waiting.map((m) => (
              <TickerRow key={m.match_id} match={m} phase="waiting" />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Active tournaments */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Laufende Turniere</h2>
            <Link href="/turniere" className="ml-auto text-xs text-primary hover:underline">Alle →</Link>
          </div>
          {laufend.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Keine aktiven Turniere</p>
          ) : (
            <div className="space-y-2">
              {laufend.map((t) => (
                <Link key={t.id} href={`/turniere/${t.id}`} className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{TYP_LABELS[t.typ]} · {t.player_count} Spieler</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                    <Radio className="w-2.5 h-2.5 animate-pulse" /> Live
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* OOM Top 5 */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Order of Merit — Top 5</h2>
          </div>
          {top5.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Noch keine Daten</p>
          ) : (
            <div className="space-y-2">
              {top5.map((entry) => (
                <Link key={entry.player_id} href={`/spieler/${entry.player_id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                    entry.rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
                    entry.rank === 2 ? "bg-gray-400/20 text-gray-300" :
                    entry.rank === 3 ? "bg-orange-500/20 text-orange-400" :
                    "bg-accent text-muted-foreground"
                  }`}>{entry.rank}</span>
                  <span className="flex-1 text-sm font-medium truncate">{entry.player_name}</span>
                  <span className="text-sm font-bold text-primary tabular-nums">{entry.total_points.toLocaleString("de-DE")} Pkt</span>
                </Link>
              ))}
            </div>
          )}
          <Link href="/oom" className="block text-center text-xs text-primary hover:underline mt-3">
            Vollständige Tabelle →
          </Link>
        </div>
      </div>

      {/* Upcoming tournaments */}
      {offen.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Anstehende Turniere</h2>
            <Link href="/turniere" className="ml-auto text-xs text-primary hover:underline">Alle →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {offen.slice(0, 4).map((t) => (
              <Link key={t.id} href={`/turniere/${t.id}`} className="p-3 rounded-lg bg-accent/30 hover:bg-accent/60 transition-colors border border-border">
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{TYP_LABELS[t.typ]}</p>
                <p className="text-xs text-muted-foreground">{t.datum} · {t.player_count}/{t.max_players} Spieler</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TickerRow({ match, phase }: { match: LiveTickerMatch; phase: "live" | "waiting" }) {
  const roundLabel = RUNDE_LABELS[match.runde] ?? match.runde;
  const isLive = phase === "live";

  return (
    <Link
      href={`/turniere/${match.tournament_id}`}
      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
        isLive ? "hover:bg-primary/5" : "hover:bg-accent/30"
      }`}
    >
      {/* Phase indicator */}
      <div className="shrink-0">
        {isLive ? (
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        )}
      </div>

      {/* Match info */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-muted-foreground/60 mb-1">
          {match.tournament_name} · {roundLabel}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium truncate max-w-[90px] ${isLive ? "text-foreground" : "text-muted-foreground"}`}>
            {match.player1}
          </span>
          <span className={`text-base font-black tabular-nums shrink-0 ${isLive ? "text-primary" : "text-muted-foreground/50"}`}>
            {match.score_p1 ?? "–"}&thinsp;:&thinsp;{match.score_p2 ?? "–"}
          </span>
          <span className={`text-sm font-medium truncate max-w-[90px] ${isLive ? "text-foreground" : "text-muted-foreground"}`}>
            {match.player2}
          </span>
        </div>
        {isLive && (match.avg_p1 != null || match.avg_p2 != null) && (
          <div className="text-[10px] text-muted-foreground mt-0.5">
            ⌀ {match.avg_p1?.toFixed(1) ?? "?"} vs {match.avg_p2?.toFixed(1) ?? "?"}
          </div>
        )}
        {!isLive && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50 mt-0.5">
            <Clock className="w-2.5 h-2.5" />
            Lobby läuft
          </div>
        )}
      </div>

      {/* Autodarts link */}
      {match.autodarts_match_id && isLive && (
        <a
          href={`https://play.autodarts.io/matches/${match.autodarts_match_id}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 text-primary/50 hover:text-primary transition-colors"
          title="In Autodarts öffnen"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
      {match.autodarts_match_id && !isLive && (
        <a
          href={`https://play.autodarts.io/lobbies/${match.autodarts_match_id}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 text-muted-foreground/40 hover:text-primary transition-colors"
          title="Lobby in Autodarts öffnen"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </Link>
  );
}

function StatCard({ icon: Icon, label, value, accent, href }: {
  icon: any; label: string; value: number; accent?: boolean; href?: string;
}) {
  const content = (
    <>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{label}</span>
      </div>
      <p className={`text-xl sm:text-2xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </>
  );
  const cls = `rounded-xl border p-3 sm:p-4 transition-colors ${accent ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "border-border bg-card hover:bg-accent/50"} ${href ? "cursor-pointer" : ""}`;
  if (href) {
    return <Link href={href} className={cls}>{content}</Link>;
  }
  return <div className={cls}>{content}</div>;
}
