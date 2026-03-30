import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import {
  ArrowLeft, Play, UserPlus, UserMinus, Check, Loader2, Lock, Target,
  Zap, Radio, CheckCircle2, Search, MonitorPlay, ExternalLink, Activity,
  TrendingUp, X, Trash2, Clock, ThumbsUp, ThumbsDown, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, TourTournamentDetail, TourPlayer, TourMatch, TYP_LABELS, RUNDE_LABELS } from "@/lib/api";
import { usePlayer } from "@/context/PlayerContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type SyncMatchStatus =
  | { match_id: number; status: "not_found" }
  | { match_id: number; status: "live"; legs1: number; legs2: number; avg1: number; avg2: number; autodarts_id: string }
  | { match_id: number; status: "auto_completed"; winner_id: number; legs1: number; legs2: number; avg1: number; avg2: number };

type SyncResult = { synced: number; matches: SyncMatchStatus[]; error?: string };

// ─── Live Match Detail Modal ───────────────────────────────────────────────────

function LiveMatchModal({
  match,
  liveData,
  legsFormat,
  onClose,
  onManualResult,
}: {
  match: TourMatch;
  liveData: Extract<SyncMatchStatus, { status: "live" }>;
  legsFormat: number;
  onClose: () => void;
  onManualResult: () => void;
}) {
  const winLegs = Math.ceil(legsFormat / 2);
  // When the game is in progress, the lobby is consumed → link to the live match instead
  const gameUrl = liveData.autodarts_id
    ? `https://play.autodarts.io/matches/${liveData.autodarts_id}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-primary/40 rounded-2xl shadow-[0_0_40px_rgba(0,210,255,0.15)] w-full max-w-sm p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">Live Match</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score Display */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="text-xs text-muted-foreground text-center mb-3">
            Best of {legsFormat} · Erster zu {winLegs} Legs
          </div>
          {/* "Leg läuft" indicator when first leg is in progress (0:0 but avg already streaming) */}
          {liveData.legs1 === 0 && liveData.legs2 === 0 && (liveData.avg1 > 0 || liveData.avg2 > 0) && (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-primary mb-3">
              <Radio className="w-3 h-3 animate-pulse" />
              <span className="font-medium">Leg 1 läuft gerade…</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            {/* Player 1 */}
            <div className={`flex-1 text-center ${liveData.legs1 > liveData.legs2 ? "opacity-100" : "opacity-60"}`}>
              <div className={`text-5xl font-black tabular-nums ${liveData.legs1 > liveData.legs2 ? "text-primary" : "text-foreground"}`}>
                {liveData.legs1}
              </div>
              <div className="text-xs font-semibold mt-1 truncate">{match.player1_name}</div>
              {liveData.avg1 > 0 && (
                <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                  <TrendingUp className="w-2.5 h-2.5" />
                  ⌀ {liveData.avg1}
                </div>
              )}
            </div>
            {/* Divider */}
            <div className="text-2xl font-black text-muted-foreground/40">:</div>
            {/* Player 2 */}
            <div className={`flex-1 text-center ${liveData.legs2 > liveData.legs1 ? "opacity-100" : "opacity-60"}`}>
              <div className={`text-5xl font-black tabular-nums ${liveData.legs2 > liveData.legs1 ? "text-primary" : "text-foreground"}`}>
                {liveData.legs2}
              </div>
              <div className="text-xs font-semibold mt-1 truncate">{match.player2_name}</div>
              {liveData.avg2 > 0 && (
                <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                  <TrendingUp className="w-2.5 h-2.5" />
                  ⌀ {liveData.avg2}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Averages info */}
        {(liveData.avg1 > 0 || liveData.avg2 > 0) && (
          <div className="bg-accent/30 rounded-lg px-4 py-2.5">
            <div className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Autodarts Average (gesamt)
            </div>
            <div className="flex justify-between text-xs">
              <div>
                <span className="font-medium">{match.player1_name}</span>
                {liveData.avg1 > 0 && <span className="ml-2 text-primary font-bold">{liveData.avg1}</span>}
              </div>
              <div>
                {liveData.avg2 > 0 && <span className="mr-2 text-primary font-bold">{liveData.avg2}</span>}
                <span className="font-medium">{match.player2_name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {gameUrl && (
            <a
              href={gameUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full text-sm font-semibold rounded-xl py-2.5 px-4 bg-primary text-black hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Spiel in Autodarts öffnen
            </a>
          )}
          <button
            onClick={onManualResult}
            className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-foreground rounded-xl py-2 px-4 border border-border/50 hover:border-border transition-colors"
          >
            Ergebnis manuell eintragen
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground/50 text-center">
          Wird automatisch alle 15 Sek. aktualisiert
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TurnierDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { currentPlayer } = usePlayer();
  const [adminPin, setAdminPin] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState<number | null>(null);
  const [liveModalMatch, setLiveModalMatch] = useState<number | null>(null);
  const [resultForm, setResultForm] = useState({ winner_id: "", score_p1: "", score_p2: "" });
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const prevSyncedRef = useRef(0);
  // Self-registration
  const [selfRegOpen, setSelfRegOpen] = useState(false);
  const [selfRegPin, setSelfRegPin] = useState("");
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [rsvpPin, setRsvpPin] = useState("");

  const { data: detail, isLoading } = useQuery<TourTournamentDetail>({
    queryKey: ["tournament", id],
    queryFn: () => apiFetch(`/tour/tournaments/${id}`),
  });

  const { data: allPlayers } = useQuery<TourPlayer[]>({
    queryKey: ["players"],
    queryFn: () => apiFetch("/tour/players"),
  });

  type PendingEntry = { id: number; player_id: number; name: string; autodarts_username: string };
  const { data: pendingRegistrations = [] } = useQuery<PendingEntry[]>({
    queryKey: ["pending-registrations", id],
    queryFn: () => apiFetch(`/tour/tournaments/${id}/pending-registrations`),
    enabled: !!currentPlayer?.is_admin,
    refetchInterval: 30_000,
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
      // Close live modal if the match was auto-completed
      if (liveModalMatch !== null) {
        const wasCompleted = completed.some((m) => m.match_id === liveModalMatch);
        if (wasCompleted) setLiveModalMatch(null);
      }
    }
    prevSyncedRef.current = syncResult.synced;
  }, [syncResult]);

  // Helper: build auth body based on whether current player is admin
  const adminAuth = () =>
    currentPlayer?.is_admin
      ? { admin_player_id: currentPlayer.id, admin_player_pin: adminPin }
      : { admin_pin: adminPin };

  // Mutations
  const startMut = useMutation({
    mutationFn: () => apiFetch(`/tour/tournaments/${id}/start`, {
      method: "POST",
      body: JSON.stringify(adminAuth()),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tournament", id] }); toast({ title: "Turnier gestartet! Bracket generiert." }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const addPlayerMut = useMutation({
    mutationFn: (player_id: number) => apiFetch(`/tour/tournaments/${id}/entries`, {
      method: "POST",
      body: JSON.stringify({ player_id, ...adminAuth() }),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tournament", id] }); setAddPlayerOpen(false); toast({ title: "Spieler hinzugefügt" }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const removePlayerMut = useMutation({
    mutationFn: (player_id: number) => apiFetch(`/tour/tournaments/${id}/entries/${player_id}`, {
      method: "DELETE",
      body: JSON.stringify(adminAuth()),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tournament", id] }); toast({ title: "Spieler entfernt" }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const rsvpMut = useMutation({
    mutationFn: () => apiFetch(`/tour/tournaments/${id}/entries/${currentPlayer?.id}/confirm`, {
      method: "POST",
      body: JSON.stringify({ pin: rsvpPin }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournament", id] });
      setRsvpOpen(false);
      setRsvpPin("");
      toast({ title: "Teilnahme bestätigt!" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: () => apiFetch(`/tour/tournaments/${id}`, {
      method: "DELETE",
      body: JSON.stringify(adminAuth()),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      toast({ title: "Turnier gelöscht" });
      navigate("/turniere");
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const selfRegisterMut = useMutation({
    mutationFn: () => apiFetch(`/tour/tournaments/${id}/self-register`, {
      method: "POST",
      body: JSON.stringify({ player_id: currentPlayer?.id, pin: selfRegPin }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournament", id] });
      qc.invalidateQueries({ queryKey: ["pending-registrations", id] });
      setSelfRegOpen(false);
      setSelfRegPin("");
      toast({ title: "Anfrage gesendet!", description: "Deine Anmeldung wartet auf Admin-Freigabe." });
    },
    onError: (e: Error) => toast({ title: "Anmeldung fehlgeschlagen", description: e.message, variant: "destructive" }),
  });

  const approveRegMut = useMutation({
    mutationFn: (entryId: number) => apiFetch(`/tour/tournaments/${id}/pending-registrations/${entryId}/approve`, {
      method: "POST", body: JSON.stringify(adminAuth()),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pending-registrations", id] }); qc.invalidateQueries({ queryKey: ["tournament", id] }); toast({ title: "Anmeldung freigegeben ✅" }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const rejectRegMut = useMutation({
    mutationFn: (entryId: number) => apiFetch(`/tour/tournaments/${id}/pending-registrations/${entryId}/reject`, {
      method: "POST", body: JSON.stringify(adminAuth()),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pending-registrations", id] }); toast({ title: "Anmeldung abgelehnt" }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const resultMut = useMutation({
    mutationFn: ({ matchId, ...data }: any) => apiFetch(`/tour/matches/${matchId}/result`, {
      method: "POST",
      body: JSON.stringify({ ...data, ...adminAuth() }),
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
  const isCurrentPlayerRegistered = currentPlayer ? entriedIds.includes(currentPlayer.id) : false;
  const hasCurrentPlayerPending = currentPlayer ? pendingRegistrations.some((p) => p.player_id === currentPlayer.id) : false;
  const canSelfRegister = currentPlayer && !isCurrentPlayerRegistered && !hasCurrentPlayerPending && tournament.status === "offen" && players.length < tournament.max_players;

  const statusBadge = tournament.status === "laufend"
    ? "text-primary bg-primary/10 border-primary/30"
    : tournament.status === "abgeschlossen"
    ? "text-muted-foreground bg-muted border-border"
    : "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";

  const pendingMatchCount = matches.filter(
    (m) => m.status === "ausstehend" && m.player1_id && m.player2_id && !m.is_bye
  ).length;
  const liveCount = [...liveStatus.values()].filter((s) => s.status === "live").length;

  // Live modal data
  const liveModalMatchData = liveModalMatch !== null ? matches.find((m) => m.id === liveModalMatch) : null;
  const liveModalStatus = liveModalMatch !== null ? liveStatus.get(liveModalMatch) : undefined;

  return (
    <div className="space-y-6">
      {/* Live Match Modal */}
      {liveModalMatchData && liveModalStatus?.status === "live" && (
        <LiveMatchModal
          match={liveModalMatchData}
          liveData={liveModalStatus as Extract<SyncMatchStatus, { status: "live" }>}
          legsFormat={tournament.legs_format}
          onClose={() => setLiveModalMatch(null)}
          onManualResult={() => {
            setLiveModalMatch(null);
            setResultOpen(liveModalMatchData.id);
            setResultForm({ winner_id: "", score_p1: "", score_p2: "" });
          }}
        />
      )}

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
            {(tournament as any).is_test && (
              <span className="text-xs px-2 py-0.5 rounded-full border font-medium text-orange-400 bg-orange-400/10 border-orange-400/30">
                Testturnier · kein OOM
              </span>
            )}
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
          <span className="text-sm font-medium">
            {currentPlayer?.is_admin ? "Dein PIN (Admin-Zugang)" : "Admin-PIN (für manuelle Eingabe)"}
          </span>
          {currentPlayer?.is_admin && (
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-semibold">Admin</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="password"
            value={adminPin}
            onChange={(e) => setAdminPin(e.target.value)}
            placeholder={currentPlayer?.is_admin ? "Dein Spieler-PIN" : "Turnier-Admin-PIN"}
            className="max-w-xs"
          />
          {adminPin && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-red-400/30 gap-1.5"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Turnier löschen
            </Button>
          )}
        </div>
        {currentPlayer?.is_admin && (
          <p className="text-xs text-muted-foreground mt-2">Als Admin kannst du alle Turniere verwalten — gib einfach deinen eigenen PIN ein.</p>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-red-400">Turnier wirklich löschen?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Das Turnier <span className="text-foreground font-medium">{tournament?.name}</span> wird zusammen mit allen Anmeldungen und Spielen <span className="text-red-400 font-medium">unwiderruflich gelöscht</span>.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>
                Abbrechen
              </Button>
              <Button
                className="flex-1 bg-red-500/20 text-red-400 border border-red-400/30 hover:bg-red-500/30"
                disabled={deleteMut.isPending}
                onClick={() => deleteMut.mutate()}
              >
                {deleteMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-1.5" />Endgültig löschen</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending registration indicator */}
      {hasCurrentPlayerPending && !isCurrentPlayerRegistered && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-400">Anmeldung ausstehend</p>
            <p className="text-xs text-muted-foreground">Deine Anmeldungsanfrage wartet auf Admin-Freigabe.</p>
          </div>
        </div>
      )}

      {/* Admin: pending registrations panel */}
      {currentPlayer?.is_admin && pendingRegistrations.length > 0 && (
        <div className="bg-card border border-yellow-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold">Ausstehende Anmeldungen ({pendingRegistrations.length})</span>
          </div>
          {pendingRegistrations.map((pr) => (
            <div key={pr.id} className="flex items-center justify-between gap-3 bg-muted/40 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {pr.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{pr.name}</p>
                  <p className="text-xs text-muted-foreground">@{pr.autodarts_username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-green-400 hover:bg-green-400/10"
                  onClick={() => approveRegMut.mutate(pr.id)}
                  disabled={approveRegMut.isPending || rejectRegMut.isPending}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-red-400 hover:bg-red-400/10"
                  onClick={() => rejectRegMut.mutate(pr.id)}
                  disabled={approveRegMut.isPending || rejectRegMut.isPending}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Self-register banner for open tournaments */}
      {canSelfRegister && (
        <div className="bg-primary/5 border border-primary/30 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <span className="text-sm">Du bist noch nicht für dieses Turnier angemeldet.</span>
          </div>
          <Dialog open={selfRegOpen} onOpenChange={(o) => { setSelfRegOpen(o); if (!o) setSelfRegPin(""); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="shrink-0">Jetzt anmelden</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Für Turnier anmelden</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <p className="text-sm text-muted-foreground">
                  Du meldest dich als <span className="text-foreground font-medium">{currentPlayer?.name}</span> für <span className="text-foreground font-medium">{tournament.name}</span> an. Der Admin muss die Anmeldung freigeben.
                </p>
                <div className="space-y-1.5">
                  <Label>Bestätige mit deinem PIN</Label>
                  <Input
                    type="password"
                    value={selfRegPin}
                    onChange={(e) => setSelfRegPin(e.target.value)}
                    placeholder="••••"
                    autoFocus
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={selfRegPin.length < 4 || selfRegisterMut.isPending}
                  onClick={() => selfRegisterMut.mutate()}
                >
                  {selfRegisterMut.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sende Anfrage…</>
                  ) : (
                    <><UserPlus className="w-4 h-4 mr-2" /> Anmeldung beantragen</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Already registered indicator + RSVP */}
      {isCurrentPlayerRegistered && tournament.status === "offen" && (() => {
        const myEntry = players.find((p) => p.player_id === currentPlayer?.id);
        const isConfirmed = myEntry?.confirmed ?? false;

        // Compute whether we're within 30 minutes of start
        let confirmWindowOpen = false;
        if (tournament.uhrzeit && tournament.datum) {
          let dateStr = tournament.datum;
          if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
            const [d, m, y] = dateStr.split(".");
            dateStr = `${y}-${m}-${d}`;
          }
          const startTime = new Date(`${dateStr}T${tournament.uhrzeit}:00`);
          const diffMin = (startTime.getTime() - Date.now()) / 60000;
          confirmWindowOpen = diffMin <= 30;
        }

        return (
          <div className={`border rounded-xl px-4 py-3 flex items-center justify-between gap-4 ${isConfirmed ? "bg-green-500/5 border-green-500/20" : "bg-primary/5 border-primary/20"}`}>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${isConfirmed ? "text-green-400" : "text-primary"}`} />
              <span className={isConfirmed ? "text-green-400" : "text-primary"}>
                {isConfirmed
                  ? "Teilnahme bestätigt ✓"
                  : confirmWindowOpen
                    ? "Bitte jetzt Teilnahme bestätigen!"
                    : `Du bist angemeldet — Bestätigung ab 30 Min. vor Start${tournament.uhrzeit ? ` (${tournament.uhrzeit} Uhr)` : ""}`}
              </span>
            </div>
            {!isConfirmed && confirmWindowOpen && (
              <Dialog open={rsvpOpen} onOpenChange={(o) => { setRsvpOpen(o); if (!o) setRsvpPin(""); }}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="shrink-0 border-primary/40 text-primary">Jetzt bestätigen</Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader><DialogTitle>Teilnahme bestätigen</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <p className="text-sm text-muted-foreground">
                      Bestätige deine Teilnahme für <span className="text-foreground font-medium">{tournament.name}</span>.
                    </p>
                    <div className="space-y-1.5">
                      <Label>Dein PIN</Label>
                      <Input type="password" value={rsvpPin} onChange={(e) => setRsvpPin(e.target.value)} placeholder="••••" autoFocus />
                    </div>
                    <Button className="w-full" disabled={rsvpPin.length < 4 || rsvpMut.isPending} onClick={() => rsvpMut.mutate()}>
                      {rsvpMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      Teilnahme bestätigen
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        );
      })()}

      {/* Players section for open tournaments */}
      {tournament.status === "offen" && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Gemeldete Spieler ({players.length}/{tournament.max_players})</h2>
            <div className="flex gap-2">
              {/* Admin: add player */}
              {adminPin && (
                <Dialog open={addPlayerOpen} onOpenChange={setAddPlayerOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" /> Spieler hinzufügen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader><DialogTitle>Spieler hinzufügen (Admin)</DialogTitle></DialogHeader>
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
              )}
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">@{p.autodarts_username}</span>
                  {currentPlayer?.id === p.player_id && (
                    <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-full font-medium">Du</span>
                  )}
                  {(p as any).confirmed ? (
                    <span className="text-[10px] text-green-400 bg-green-400/10 border border-green-400/20 px-1.5 py-0.5 rounded-full font-medium">✓ Bestätigt</span>
                  ) : (
                    <span className="text-[10px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-1.5 py-0.5 rounded-full font-medium">Ausstehend</span>
                  )}
                </div>
                {/* Admin-only remove button — only visible when admin PIN is entered */}
                {adminPin && (
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                    onClick={() => removePlayerMut.mutate(p.player_id)}
                    disabled={removePlayerMut.isPending}
                    title="Spieler entfernen (Admin)">
                    <UserMinus className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
            {players.length === 0 && <p className="text-muted-foreground text-sm text-center py-2">Noch keine Spieler gemeldet</p>}
          </div>
          {!adminPin && players.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">Admin-PIN eingeben um Spieler zu entfernen oder das Turnier zu starten.</p>
          )}
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
                          onLiveClick={() => setLiveModalMatch(match.id)}
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
                      {((live as any).avg1 > 0 || (live as any).avg2 > 0) && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          ⌀ {(live as any).avg1} / {(live as any).avg2}
                        </span>
                      )}
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
  onLiveClick,
}: {
  match: TourMatch;
  legsFormat: number;
  liveStatus?: SyncMatchStatus;
  onResult: () => void;
  onLiveClick: () => void;
}) {
  const { currentPlayer } = usePlayer();
  const persistedLobbyUrl = match.status !== "abgeschlossen" && match.autodarts_match_id
    ? `https://play.autodarts.io/lobbies/${match.autodarts_match_id}`
    : null;
  const [localLobbyUrl, setLocalLobbyUrl] = useState<string | null>(null);
  const lobbyUrl = persistedLobbyUrl ?? localLobbyUrl;
  const [creatingLobby, setCreatingLobby] = useState(false);

  const createLobby = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCreatingLobby(true);
    try {
      const data = await apiFetch(`/tour/matches/${match.id}/create-lobby`, {
        method: "POST",
        body: JSON.stringify({ player_id: currentPlayer?.id }),
      });
      if (data.joinUrl) setLocalLobbyUrl(data.joinUrl);
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

  let borderClass = "border-border";
  if (isComplete) borderClass = "border-border/50";
  else if (isLive) borderClass = "border-primary/60 shadow-[0_0_8px_rgba(0,210,255,0.15)]";
  else if (isPending) borderClass = "border-border/30";

  let bgClass = "bg-card";
  if (isComplete) bgClass = "bg-accent/20";
  else if (isLive) bgClass = "bg-primary/5";
  else if (isPending) bgClass = "bg-card opacity-60";

  const handleClick = () => {
    if (isComplete || isPending) return;
    if (isLive) {
      onLiveClick();
    } else {
      onResult();
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${bgClass} ${borderClass} ${
        !isComplete && !isPending ? "hover:border-primary/40 cursor-pointer" : ""
      }`}
      onClick={handleClick}
    >
      {/* Live indicator */}
      {isLive && (
        <div className="flex items-center gap-1 mb-2 text-xs text-primary">
          <Radio className="w-3 h-3 animate-pulse" />
          <span className="font-medium">Live</span>
          <span className="text-[10px] text-muted-foreground ml-1">· klicken für Details</span>
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
          avg={isLive && live.avg1 > 0 ? live.avg1 : isComplete && match.avg_p1 ? match.avg_p1 : null}
          isWinner={match.winner_id === match.player1_id}
          isComplete={isComplete}
          isLive={isLive}
        />
        <PlayerRow
          name={match.player2_name ?? "TBD"}
          score={isLive ? live.legs2 : match.score_p2}
          avg={isLive && live.avg2 > 0 ? live.avg2 : isComplete && match.avg_p2 ? match.avg_p2 : null}
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
          {match.autodarts_match_id && <span className="ml-auto text-[10px]">via Autodarts</span>}
        </div>
      )}
      {/* Lobby / Game button */}
      {!isComplete && !isPending && (
        <div className="mt-2 pt-2 border-t border-border/30" onClick={(e) => e.stopPropagation()}>
          {isLive && live?.autodarts_id ? (
            // Game in progress → link to live match (lobby is consumed)
            <a
              href={`https://play.autodarts.io/matches/${live.autodarts_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold rounded-md py-1.5 px-2 bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Spiel in Autodarts öffnen
            </a>
          ) : lobbyUrl ? (
            // In lobby phase → join link
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
            // No lobby yet → create one
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
      <span className={`text-sm ${isWinner ? "font-semibold" : "font-normal"} truncate max-w-[120px]`}>
        {isWinner && <span className="text-primary mr-1">●</span>}
        {name}
      </span>
      <div className="flex items-center gap-2">
        {avg !== null && (
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
