import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Radio, ExternalLink, TrendingUp, Target, Clock, Trophy,
  RefreshCw, Wifi, WifiOff,
} from "lucide-react";
import { apiFetch, RUNDE_LABELS } from "@/lib/api";
import { PlayerAvatar } from "@/components/PlayerAvatar";

type TickerEntry = {
  tournament_id: number;
  tournament_name: string;
  legs_format: number;
  match_id: number;
  runde: string;
  player1_id: number;
  player2_id: number;
  player1: string;
  player2: string;
  player1_avatar: string | null;
  player2_avatar: string | null;
  score_p1: number | null;
  score_p2: number | null;
  avg_p1: number | null;
  avg_p2: number | null;
  status: string;
  autodarts_match_id: string | null;
};

function ScoreDisplay({
  entry,
}: {
  entry: TickerEntry;
}) {
  const winLegs = Math.ceil(entry.legs_format / 2);
  const s1 = entry.score_p1 ?? 0;
  const s2 = entry.score_p2 ?? 0;
  const hasScore = s1 > 0 || s2 > 0;
  const a1 = entry.avg_p1 ?? 0;
  const a2 = entry.avg_p2 ?? 0;

  return (
    <div className="flex items-stretch gap-2">
      {/* Player 1 */}
      <div className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl ${s1 > s2 ? "bg-primary/10 border border-primary/30" : "bg-accent/30 border border-border/40"}`}>
        <PlayerAvatar name={entry.player1} avatarUrl={entry.player1_avatar} size="md" />
        <div className="mt-2 text-xs font-semibold text-center truncate w-full text-center">{entry.player1}</div>
        {hasScore && (
          <div className={`text-3xl font-black tabular-nums mt-1 ${s1 > s2 ? "text-primary" : "text-foreground/60"}`}>
            {s1}
          </div>
        )}
        {a1 > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
            <TrendingUp className="w-2.5 h-2.5" />
            ⌀ {a1}
          </div>
        )}
      </div>

      {/* Centre */}
      <div className="flex flex-col items-center justify-center gap-1 px-1">
        {hasScore ? (
          <div className="text-xl font-black text-muted-foreground/40">:</div>
        ) : (
          <div className="text-xs text-muted-foreground/60 font-medium">vs</div>
        )}
        <div className="text-[9px] text-muted-foreground/50 text-center">
          Bo{entry.legs_format}
        </div>
        <div className="text-[9px] text-muted-foreground/50 text-center">
          First to {winLegs}
        </div>
      </div>

      {/* Player 2 */}
      <div className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl ${s2 > s1 ? "bg-primary/10 border border-primary/30" : "bg-accent/30 border border-border/40"}`}>
        <PlayerAvatar name={entry.player2} avatarUrl={entry.player2_avatar} size="md" />
        <div className="mt-2 text-xs font-semibold text-center truncate w-full text-center">{entry.player2}</div>
        {hasScore && (
          <div className={`text-3xl font-black tabular-nums mt-1 ${s2 > s1 ? "text-primary" : "text-foreground/60"}`}>
            {s2}
          </div>
        )}
        {a2 > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
            <TrendingUp className="w-2.5 h-2.5" />
            ⌀ {a2}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ entry }: { entry: TickerEntry }) {
  const isLive = (entry.score_p1 ?? 0) > 0 || (entry.score_p2 ?? 0) > 0 || (entry.avg_p1 ?? 0) > 0;
  const roundLabel = RUNDE_LABELS[entry.runde] ?? entry.runde;

  return (
    <div className={`bg-card border rounded-xl p-4 space-y-3 ${isLive ? "border-primary/50 shadow-[0_0_12px_rgba(0,210,255,0.12)]" : "border-border/60"}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isLive ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/30 px-1.5 py-0.5 rounded-full shrink-0">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-accent/40 border border-border/40 px-1.5 py-0.5 rounded-full shrink-0">
              <Clock className="w-2.5 h-2.5" />
              Ausstehend
            </span>
          )}
          <Link
            href={`/turniere/${entry.tournament_id}`}
            className="text-xs font-medium text-muted-foreground hover:text-foreground truncate transition-colors"
          >
            {entry.tournament_name}
          </Link>
        </div>
        <span className="text-[10px] text-muted-foreground/60 shrink-0">{roundLabel}</span>
      </div>

      {/* Score */}
      <ScoreDisplay entry={entry} />

      {/* Autodarts link */}
      {entry.autodarts_match_id && (
        <a
          href={`https://play.autodarts.io/matches/${entry.autodarts_match_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold rounded-lg py-2 px-3 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          In Autodarts zuschauen
        </a>
      )}
    </div>
  );
}

export default function LivePage() {
  const { data: ticker = [], dataUpdatedAt, isFetching } = useQuery<TickerEntry[]>({
    queryKey: ["live-ticker"],
    queryFn: () => apiFetch("/tour/live-ticker"),
    refetchInterval: 12_000,
    staleTime: 0,
  });

  const liveMatches = ticker.filter(
    (e) => (e.score_p1 ?? 0) > 0 || (e.score_p2 ?? 0) > 0 || (e.avg_p1 ?? 0) > 0
  );
  const pendingMatches = ticker.filter(
    (e) => !((e.score_p1 ?? 0) > 0 || (e.score_p2 ?? 0) > 0 || (e.avg_p1 ?? 0) > 0)
  );

  const updatedAt = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className={`w-6 h-6 ${liveMatches.length > 0 ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
            Live-Ticker
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Alle aktiven Matches — automatisch aktualisiert</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isFetching ? (
            <RefreshCw className="w-4 h-4 text-primary animate-spin" />
          ) : ticker.length > 0 ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-muted-foreground/40" />
          )}
          {updatedAt && (
            <span className="text-[10px] text-muted-foreground/50">{updatedAt}</span>
          )}
        </div>
      </div>

      {/* No active tournaments */}
      {ticker.length === 0 && !isFetching && (
        <div className="text-center py-16 space-y-3">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground/20" />
          <div className="text-muted-foreground font-medium">Gerade kein Turnier aktiv</div>
          <p className="text-sm text-muted-foreground/60">
            Sobald ein Turnier läuft, erscheinen hier alle Matches live.
          </p>
          <Link
            href="/turniere"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
          >
            <Trophy className="w-3.5 h-3.5" />
            Alle Turniere anzeigen
          </Link>
        </div>
      )}

      {/* Live matches */}
      {liveMatches.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
            <h2 className="text-sm font-semibold text-primary">
              {liveMatches.length} {liveMatches.length === 1 ? "Match live" : "Matches live"}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {liveMatches.map((e) => (
              <MatchCard key={e.match_id} entry={e} />
            ))}
          </div>
        </section>
      )}

      {/* Pending/upcoming matches */}
      {pendingMatches.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground">
              {pendingMatches.length} {pendingMatches.length === 1 ? "Match ausstehend" : "Matches ausstehend"}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {pendingMatches.map((e) => (
              <MatchCard key={e.match_id} entry={e} />
            ))}
          </div>
        </section>
      )}

      {/* Live indicator footer */}
      {ticker.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/50 pb-2">
          <Target className="w-3 h-3" />
          Automatische Aktualisierung alle 12 Sekunden
        </div>
      )}
    </div>
  );
}
