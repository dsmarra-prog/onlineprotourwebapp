import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import {
  ArrowLeft, Play, UserPlus, UserMinus, Check, Loader2, Lock, Target,
  Zap, Radio, CheckCircle2, Search, MonitorPlay, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, TourTournamentDetail, TourPlayer, TourMatch, TYP_LABELS, RUNDE_LABELS } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type SyncMatchStatus =
  | { match_id: number; status: "not_found" }
  | { match_id: number; status: "live"; legs1: number; legs2: number; avg1: number; avg2: number; autodarts_id: string }
  | { match_id: number; status: "auto_completed"; winner_id: number; legs1: number; legs2: number; avg1: number; avg2: number };

type SyncResult = { synced: number; matches: SyncMatchStatus[]; error?: string };

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TurnierDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [adminPin, setAdminPin] = useState("");
  const [resultOpen, setResultOpen] = useState<number | null>(null);
  const [resultForm, setResultForm] = useState({ winner_id: "", score_p1: "", score_p2: "" });
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const prevSyncedRef = useRef(0);

  const { data: detail, isLoading } = useQuery<TourTournamentDetail>({
    queryKey: ["tournament", id],
    queryFn: () => apiFetch(`/tour/tournaments/${id}`),
  });

  const { data: allPlayers } = useQuery<TourPlayer[]>({
    queryKey: ["players"],
    queryFn: () => apiFetch("/tour/players"),
  });

  // ── Auto-sync: poll Autodarts every 15 s when tournament is live ──
  const isRunning = detail?.tournament.status === "laufend";
  const { data: syncResult } = useQuery<SyncResult>({
    queryKey: ["autodarts-sync", id],
    queryFn: () => apiFetch(`/tour/tournaments/${id}/autodarts-sync`, { method: "POST" }),
    enabled: isRunning,
    refetchInterval: 15_000,
    staleTime: 0,
  });

  // Build live match status map
  const liveStatus = new Map<number, SyncMatchStatus>();
  if (syncResult?.matches) {
    for (const s of syncResult.matches) liveStatus.set(s.match_id, s);
  }

  // Notify and refetch when a result is auto-detected
  useEffect(() => {
    if (!syncResult) return;
    if (syncResult.synced > prevSyncedRef.current) {
      const completed = syncResult.matches.filter((m) => m.status === "auto_completed");
      for (const m of completed) {
        toast({
          title: "✅ Ergebnis automatisch erkannt",
          description: `Match automatisch via Autodarts ausgewertet`,
        });
      }
      qc.invalidateQueries({ queryKey: ["tournament", id] });
      qc.invalidateQueries({ queryKey: ["oom"] });
    }
    prevSyncedRef.current = syncResult.synced;
  }, [syncResult]);

  // Mutations
  const startMut = useMutation({
    mutationFn: () => apiFetch(`/tour/tournaments/${id}/start`, {
      method: "POST",
      body: JSON.stringify({ admin_pin: adminPin }),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tournament", id] }); toast({ title: "Turnier gestartet! Bracket generiert." }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const addPlayerMut = useMutation({
    mutationFn: (player_id: number) => apiFetch(`/tour/tournaments/${id}/entries`, {
      method: "POST",
      body: JSON.stringify({ player_id, admin_pin: adminPin }),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tournament", id] }); setAddPlayerOpen(false); toast({ title: "Spieler hinzugefügt" }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const removePlayerMut = useMutation({
    mutationFn: (player_id: number) => apiFetch(`/tour/tournaments/${id}/entries/${player_id}`, {
      method: "DELETE",
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tournament", id] }); toast({ title: "Spieler entfernt" }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const resultMut = useMutation({
    mutationFn: ({ matchId, ...data }: any) => apiFetch(`/tour/matches/${matchId}/result`, {
      method: "POST",
      body: JSON.stringify({ ...data, admin_pin: adminPin }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournament", id] });
      qc.invalidateQueries({ queryKey: ["oom"] });
      setResultOpen(null);
      toast({ title: "Ergebnis eingetragen" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  // ── Render ──
  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!detail) return <div className="text-center py-20 text-muted-foreground">Turnier nicht gefunden</div>;

  const { tournament, players, matches, rounds } = detail;
  const roundOrder = ["R64", "R32", "R16", "QF", "SF", "F"];
  const sortedRounds = [...new Set(matches.map((m) => m.runde))].sort(
    (a, b) => roundOrder.indexOf(a) - roundOrder.indexOf(b)
  );

  const entriedIds = players.map((p) => p.player_id);
  const availablePlayers = allPlayers?.filter((p) => !entriedIds.includes(p.id)) ?? [];

  const statusBadge = tournament.status === "laufend"
    ? "text-primary bg-primary/10 border-primary/30"
    : tournament.status === "abgeschlossen"
    ? "text-muted-foreground bg-muted border-border"
    : "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";

  const pendingMatchCount = matches.filter(
    (m) => m.status === "ausstehend" && m.player1_id && m.player2_id && !m.is_bye
  ).length;
  const liveCount = [...liveStatus.values()].filter((s) => s.status === "live").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/turniere" className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{tournament.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusBadge}`}>
              {tournament.status === "laufend" ? "Laufend" : tournament.status === "abgeschlossen" ? "Abgeschlossen" : "Offen"}
            </span>
            {isRunning && (
              <span className="text-xs text-primary flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" />
                {liveCount > 0 ? `${liveCount} Match${liveCount > 1 ? "es" : ""} live` : "Überwachung aktiv"}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{TYP_LABELS[tournament.typ]} · Best of {tournament.legs_format} · {tournament.datum}</p>
        </div>
      </div>

      {/* Auto-sync status bar */}
      {isRunning && pendingMatchCount > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-primary font-medium">Automatische Erkennung aktiv</span>
            <span className="text-muted-foreground">· alle 15 Sek. wird Autodarts abgefragt</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Search className="w-3 h-3" />
              {pendingMatchCount} ausstehend
            </span>
            {liveCount > 0 && (
              <span className="flex items-center gap-1 text-primary">
                <Radio className="w-3 h-3 animate-pulse" />
                {liveCount} live
              </span>
            )}
          </div>
        </div>
      )}

      {/* Admin PIN */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Admin-PIN (für manuelle Eingabe)</span>
        </div>
        <Input
          type="password"
          value={adminPin}
          onChange={(e) => setAdminPin(e.target.value)}
          placeholder="PIN eingeben"
          className="max-w-xs"
        />
      </div>

      {/* Players section for open tournaments */}
      {tournament.status === "offen" && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Gemeldete Spieler ({players.length}/{tournament.max_players})</h2>
            <div className="flex gap-2">
              <Dialog open={addPlayerOpen} onOpenChange={setAddPlayerOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Spieler hinzufügen
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader><DialogTitle>Spieler hinzufügen</DialogTitle></DialogHeader>
                  <div className="space-y-3 mt-2">
                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger><SelectValue placeholder="Spieler wählen" /></SelectTrigger>
                      <SelectContent>
                        {availablePlayers.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name} ({p.autodarts_username})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button className="w-full" disabled={!selectedPlayer || addPlayerMut.isPending}
                      onClick={() => addPlayerMut.mutate(parseInt(selectedPlayer))}>
                      Hinzufügen
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                size="sm"
                onClick={() => startMut.mutate()}
                disabled={startMut.isPending || players.length < 2 || !adminPin}
              >
                {startMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-3.5 h-3.5 mr-1" />Turnier starten</>}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {players.map((p, i) => (
              <div key={p.player_id} className="flex items-center justify-between p-2 rounded-lg bg-accent/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">@{p.autodarts_username}</span>
                </div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                  onClick={() => removePlayerMut.mutate(p.player_id)}>
                  <UserMinus className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            {players.length === 0 && <p className="text-muted-foreground text-sm text-center py-2">Noch keine Spieler gemeldet</p>}
          </div>
        </div>
      )}

      {/* Bracket */}
      {(tournament.status === "laufend" || tournament.status === "abgeschlossen") && sortedRounds.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold">Turnierbaum</h2>
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max pb-4">
              {sortedRounds.map((runde) => {
                const roundMatches = matches
                  .filter((m) => m.runde === runde)
                  .sort((a, b) => a.match_nr - b.match_nr);
                return (
                  <div key={runde} className="flex flex-col gap-3 min-w-[220px]">
                    <div className="text-xs font-semibold text-muted-foreground text-center py-1 border-b border-border">
                      {RUNDE_LABELS[runde] || runde}
                    </div>
                    <div className="flex flex-col gap-2">
                      {roundMatches.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          legsFormat={tournament.legs_format}
                          liveStatus={liveStatus.get(match.id)}
                          onResult={() => {
                            setResultOpen(match.id);
                            setResultForm({ winner_id: "", score_p1: "", score_p2: "" });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Manual result dialog */}
      {resultOpen !== null && (
        <Dialog open={true} onOpenChange={() => setResultOpen(null)}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Ergebnis eintragen</DialogTitle></DialogHeader>
            {(() => {
              const match = matches.find((m) => m.id === resultOpen);
              if (!match) return null;
              const live = liveStatus.get(match.id);
              return (
                <div className="space-y-4 mt-2">
                  {live?.status === "live" && (
                    <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
                      <span className="text-primary font-medium">Live erkannt:</span>
                      <span>{match.player1_name} {(live as any).legs1} : {(live as any).legs2} {match.player2_name}</span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label>Sieger</Label>
                    <Select value={resultForm.winner_id} onValueChange={(v) => setResultForm((f) => ({ ...f, winner_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Sieger wählen" /></SelectTrigger>
                      <SelectContent>
                        {match.player1_id && <SelectItem value={String(match.player1_id)}>{match.player1_name}</SelectItem>}
                        {match.player2_id && <SelectItem value={String(match.player2_id)}>{match.player2_name}</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>{match.player1_name} – Legs</Label>
                      <Input type="number" value={resultForm.score_p1}
                        onChange={(e) => setResultForm((f) => ({ ...f, score_p1: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>{match.player2_name} – Legs</Label>
                      <Input type="number" value={resultForm.score_p2}
                        onChange={(e) => setResultForm((f) => ({ ...f, score_p2: e.target.value }))} />
                    </div>
                  </div>
                  <Button className="w-full" disabled={!resultForm.winner_id || resultMut.isPending}
                    onClick={() => resultMut.mutate({
                      matchId: resultOpen,
                      winner_id: parseInt(resultForm.winner_id),
                      score_p1: parseInt(resultForm.score_p1) || 0,
                      score_p2: parseInt(resultForm.score_p2) || 0,
                    })}>
                    {resultMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" />Ergebnis speichern</>}
                  </Button>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({
  match,
  legsFormat,
  liveStatus,
  onResult,
}: {
  match: TourMatch;
  legsFormat: number;
  liveStatus?: SyncMatchStatus;
  onResult: () => void;
}) {
  const [lobbyUrl, setLobbyUrl] = useState<string | null>(null);
  const [creatingLobby, setCreatingLobby] = useState(false);

  const createLobby = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCreatingLobby(true);
    try {
      const data = await apiFetch(`/tour/matches/${match.id}/create-lobby`, { method: "POST" });
      if (data.joinUrl) setLobbyUrl(data.joinUrl);
    } catch {
      // ignore
    } finally {
      setCreatingLobby(false);
    }
  };

  if (match.is_bye) {
    return (
      <div className="p-3 rounded-lg bg-accent/20 border border-border/50 opacity-60">
        <div className="text-xs text-muted-foreground mb-1">Freilos</div>
        <div className="text-sm font-medium">{match.player1_name ?? "TBD"}</div>
      </div>
    );
  }

  const isComplete = match.status === "abgeschlossen";
  const isPending = !match.player1_id || !match.player2_id;
  const isLive = liveStatus?.status === "live";
  const live = isLive ? (liveStatus as any) : null;

  // Border styling
  let borderClass = "border-border";
  if (isComplete) borderClass = "border-border/50";
  else if (isLive) borderClass = "border-primary/60 shadow-[0_0_8px_rgba(0,210,255,0.15)]";
  else if (isPending) borderClass = "border-border/30";

  // Background
  let bgClass = "bg-card";
  if (isComplete) bgClass = "bg-accent/20";
  else if (isLive) bgClass = "bg-primary/5";
  else if (isPending) bgClass = "bg-card opacity-60";

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${bgClass} ${borderClass} ${
        !isComplete && !isPending ? "hover:border-primary/40 cursor-pointer" : ""
      }`}
      onClick={() => !isComplete && !isPending && onResult()}
    >
      {/* Live indicator */}
      {isLive && (
        <div className="flex items-center gap-1 mb-2 text-xs text-primary">
          <Radio className="w-3 h-3 animate-pulse" />
          <span className="font-medium">Live erkannt</span>
          <span className="ml-auto font-bold tabular-nums">
            {live.legs1} : {live.legs2}
          </span>
        </div>
      )}

      {/* Match not found yet indicator */}
      {!isComplete && !isPending && !isLive && liveStatus?.status === "not_found" && (
        <div className="flex items-center gap-1 mb-1.5 text-xs text-muted-foreground/70">
          <Search className="w-3 h-3" />
          <span>Suche in Autodarts…</span>
        </div>
      )}

      <div className="space-y-1.5">
        <PlayerRow
          name={match.player1_name ?? "TBD"}
          score={isLive ? live.legs1 : match.score_p1}
          avg={isLive ? live.avg1 : null}
          isWinner={match.winner_id === match.player1_id}
          isComplete={isComplete}
          isLive={isLive}
        />
        <PlayerRow
          name={match.player2_name ?? "TBD"}
          score={isLive ? live.legs2 : match.score_p2}
          avg={isLive ? live.avg2 : null}
          isWinner={match.winner_id === match.player2_id}
          isComplete={isComplete}
          isLive={isLive}
        />
      </div>

      {/* Footer hint */}
      {isComplete && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground/60">
          <CheckCircle2 className="w-3 h-3 text-primary" />
          <span>Abgeschlossen</span>
          {(match as any).autodarts_match_id && <span className="ml-auto text-[10px]">via Autodarts</span>}
        </div>
      )}
      {/* Lobby button / join URL — only for scheduled matches with both players */}
      {!isComplete && !isPending && (
        <div className="mt-2 pt-2 border-t border-border/30" onClick={(e) => e.stopPropagation()}>
          {lobbyUrl ? (
            <a
              href={lobbyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold rounded-md py-1.5 px-2 bg-primary text-black hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Lobby beitreten
            </a>
          ) : (
            <button
              onClick={createLobby}
              disabled={creatingLobby}
              className="flex items-center justify-center gap-1.5 w-full text-xs text-primary/80 hover:text-primary rounded-md py-1.5 px-2 border border-primary/20 hover:border-primary/50 transition-colors disabled:opacity-50"
            >
              {creatingLobby ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <MonitorPlay className="w-3 h-3" />
              )}
              {creatingLobby ? "Erstelle Lobby…" : "Autodarts Lobby erstellen"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PlayerRow({
  name, score, avg, isWinner, isComplete, isLive,
}: {
  name: string;
  score: number | null;
  avg: number | null;
  isWinner: boolean;
  isComplete: boolean;
  isLive: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${isWinner ? "text-foreground" : isComplete ? "text-muted-foreground" : ""}`}>
      <span className={`text-sm ${isWinner ? "font-semibold" : "font-normal"}`}>
        {isWinner && <span className="text-primary mr-1">●</span>}
        {name}
      </span>
      <div className="flex items-center gap-2">
        {avg !== null && avg > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums">⌀{avg}</span>
        )}
        {score !== null && (
          <span className={`text-sm font-bold tabular-nums ${isLive ? "text-primary" : isWinner ? "text-primary" : ""}`}>
            {score}
          </span>
        )}
      </div>
    </div>
  );
}
