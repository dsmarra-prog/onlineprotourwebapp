import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Shield, Trophy, BarChart3, Users, Settings, Radio, Zap, RefreshCw,
  CheckCircle2, AlertTriangle, Loader2, ChevronRight, Plus, Trash2,
  MessageCircle, ExternalLink, Bell, TrendingUp, Clock, Send, Target,
  Link2Off, Wifi, WifiOff, Copy, Check, ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, TourTournament, TourPlayer, TYP_LABELS } from "@/lib/api";
import { usePlayer } from "@/context/PlayerContext";

type Tab = "turniere" | "oom" | "spieler" | "discord" | "disputes" | "chat";

type DiscordSettings = {
  webhook_url: string | null;
  bot_token: string | null;
  channel_id: string | null;
};

type Dispute = {
  id: number;
  match_id: number;
  player_id: number;
  player_name: string;
  reason: string;
  status: string;
  created_at: string;
};

export default function AdminPanel() {
  const { currentPlayer, sessionPin } = usePlayer();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("turniere");
  const [discordForm, setDiscordForm] = useState<DiscordSettings>({ webhook_url: "", bot_token: "", channel_id: "" });
  const [discordLoaded, setDiscordLoaded] = useState(false);

  const adminAuth = () => ({ admin_player_id: currentPlayer?.id, admin_player_pin: sessionPin });

  if (!currentPlayer?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
        <Shield className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-muted-foreground font-medium">Kein Zugriff</p>
        <p className="text-sm text-muted-foreground/60">Diesen Bereich können nur Admins betreten.</p>
        <Link href="/" className="text-sm text-primary hover:underline">Zur Startseite</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Admin-Panel</h1>
          <p className="text-sm text-muted-foreground">Turnierverwaltung, OOM, Spieler & Einstellungen</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-accent/30 p-1 rounded-xl overflow-x-auto">
        {([
          { id: "turniere", label: "Turniere", icon: Trophy },
          { id: "oom", label: "OOM", icon: BarChart3 },
          { id: "spieler", label: "Spieler", icon: Users },
          { id: "discord", label: "Discord", icon: Radio },
          { id: "disputes", label: "Disputes", icon: MessageCircle },
          { id: "chat", label: "Chat", icon: Send },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-1 justify-center ${
              tab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "turniere" && <TourniereTab adminAuth={adminAuth} />}
      {tab === "oom" && <OomTab adminAuth={adminAuth} />}
      {tab === "spieler" && <SpielerTab adminAuth={adminAuth} />}
      {tab === "discord" && (
        <DiscordTab
          adminAuth={adminAuth}
          form={discordForm}
          setForm={setDiscordForm}
          loaded={discordLoaded}
          setLoaded={setDiscordLoaded}
        />
      )}
      {tab === "disputes" && <DisputesTab adminAuth={adminAuth} />}
      {tab === "chat" && <ChatTab adminAuth={adminAuth} />}
    </div>
  );
}

// ─── Turniere Tab ─────────────────────────────────────────────────────────────

function TourniereTab({ adminAuth }: { adminAuth: () => object }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { currentPlayer, sessionPin } = usePlayer();

  const { data: tournaments = [], isLoading } = useQuery<TourTournament[]>({
    queryKey: ["tournaments"],
    queryFn: () => apiFetch("/tour/tournaments"),
  });

  const seedMut = useMutation({
    mutationFn: () =>
      apiFetch("/tour/tournaments/seed-from-schedule", {
        method: "POST",
        body: JSON.stringify({ admin_player_id: currentPlayer?.id, admin_player_pin: sessionPin }),
      }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      const created = data.created?.length ?? 0;
      const skipped = data.skipped?.length ?? 0;
      toast({ title: `${created} Turnier(e) angelegt, ${skipped} bereits vorhanden` });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/tour/tournaments/${id}`, { method: "DELETE", body: JSON.stringify(adminAuth()) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      toast({ title: "Turnier gelöscht" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const statusColor = (s: string) =>
    s === "laufend" ? "text-primary bg-primary/10 border-primary/30" :
    s === "abgeschlossen" ? "text-muted-foreground bg-muted border-border" :
    "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";

  const statusLabel = (s: string) =>
    s === "laufend" ? "Laufend" : s === "abgeschlossen" ? "Abgeschlossen" : "Offen";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Alle Turniere ({tournaments.length})</h2>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => seedMut.mutate()}
          disabled={seedMut.isPending}
        >
          {seedMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Aus Spielplan anlegen
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Noch keine Turniere. Klicke "Aus Spielplan anlegen".</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tournaments.map((t) => (
            <div key={t.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{t.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${statusColor(t.status)}`}>
                    {statusLabel(t.status)}
                  </span>
                  {(t as any).is_test && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border text-orange-400 bg-orange-400/10 border-orange-400/30">Test</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span>{TYP_LABELS[t.typ] ?? t.typ}</span>
                  <span>{t.datum}{t.uhrzeit ? ` · ${t.uhrzeit}` : ""}</span>
                  <span>{t.player_count}/{t.max_players} Spieler</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/turniere/${t.id}`}>
                  <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-red-400 hover:bg-red-400/10"
                  onClick={() => {
                    if (confirm(`Turnier "${t.name}" wirklich löschen?`)) deleteMut.mutate(t.id);
                  }}
                  disabled={deleteMut.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── OOM Tab ──────────────────────────────────────────────────────────────────

function OomTab({ adminAuth }: { adminAuth: () => object }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: tournaments = [] } = useQuery<TourTournament[]>({
    queryKey: ["tournaments"],
    queryFn: () => apiFetch("/tour/tournaments"),
  });

  const completedTournaments = tournaments.filter((t) => t.status === "abgeschlossen" && !(t as any).is_test);

  const computeOomMut = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/tour/tournaments/${id}/compute-oom`, { method: "POST", body: JSON.stringify(adminAuth()) }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["oom"] });
      qc.invalidateQueries({ queryKey: ["dev-oom"] });
      toast({ title: `OOM aktualisiert`, description: `${data.updates} Spieler mit Punkten aus "${data.tournament_name}" versorgt` });
    },
    onError: (e: Error) => toast({ title: "Fehler beim OOM-Update", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Punkte aus Turnier berechnen & OOM aktualisieren</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Berechnet anhand der Turnierergebnisse (Runden-Tiefe jedes Spielers) die OOM-Punkte und schreibt sie in die jeweilige OOM (Pro oder Dev). Bereits bestehende Punkte aus anderen Turnieren bleiben erhalten.
        </p>

        {completedTournaments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
            Keine abgeschlossenen Turniere vorhanden
          </div>
        ) : (
          <div className="space-y-2">
            {completedTournaments.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 bg-accent/20 border border-border/50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{TYP_LABELS[t.typ] ?? t.typ} · {t.datum} · {t.player_count} Spieler</p>
                </div>
                <Button
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => computeOomMut.mutate(t.id)}
                  disabled={computeOomMut.isPending}
                >
                  {computeOomMut.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  OOM berechnen
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link href="/oom" className="flex-1">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
            <BarChart3 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Pro OOM anzeigen</p>
              <p className="text-xs text-muted-foreground">Aktuelle Rangliste</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </div>
        </Link>
        <Link href="/dev-oom" className="flex-1">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-sm font-semibold">Dev OOM anzeigen</p>
              <p className="text-xs text-muted-foreground">Aktuelle Rangliste</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </div>
        </Link>
      </div>
    </div>
  );
}

// ─── Spieler Tab ──────────────────────────────────────────────────────────────

function SpielerTab({ adminAuth }: { adminAuth: () => object }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { currentPlayer } = usePlayer();

  const { data: players = [], isLoading } = useQuery<TourPlayer[]>({
    queryKey: ["players"],
    queryFn: () => apiFetch("/tour/players"),
  });

  const syncAvatarsMut = useMutation({
    mutationFn: () => apiFetch("/tour/admin/sync-avatars", { method: "POST", body: JSON.stringify(adminAuth()) }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["players"] });
      toast({ title: "Avatare synchronisiert", description: `${data.synced ?? "?"} Spieler aktualisiert` });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const grantAdminMut = useMutation({
    mutationFn: (playerId: number) =>
      apiFetch("/tour/admin/grant-admin", {
        method: "POST",
        body: JSON.stringify({ player_id: playerId, ...adminAuth() }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["players"] }); toast({ title: "Admin-Rechte vergeben" }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const revokeAdminMut = useMutation({
    mutationFn: (playerId: number) =>
      apiFetch("/tour/admin/revoke-admin", {
        method: "POST",
        body: JSON.stringify({ player_id: playerId, ...adminAuth() }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["players"] }); toast({ title: "Admin-Rechte entzogen" }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Registrierte Spieler ({players.length})</h2>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => syncAvatarsMut.mutate()}
          disabled={syncAvatarsMut.isPending}
        >
          {syncAvatarsMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Avatare sync
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {players.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-xl px-3 py-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{p.name}</span>
                  {(p as any).is_admin && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-medium">Admin</span>
                  )}
                  {p.id === currentPlayer?.id && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-medium">Du</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">@{p.autodarts_username}</p>
              </div>
              <div className="flex gap-1.5">
                <Link href={`/spieler/${p.id}`}>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
                {p.id !== currentPlayer?.id && (
                  (p as any).is_admin ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-red-400 hover:bg-red-400/10"
                      onClick={() => revokeAdminMut.mutate(p.id)}
                      disabled={revokeAdminMut.isPending}
                    >
                      Entziehen
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-green-400 hover:bg-green-400/10"
                      onClick={() => grantAdminMut.mutate(p.id)}
                      disabled={grantAdminMut.isPending}
                    >
                      Admin
                    </Button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Discord Tab ──────────────────────────────────────────────────────────────

function DiscordTab({
  adminAuth,
  form,
  setForm,
  loaded,
  setLoaded,
}: {
  adminAuth: () => object;
  form: DiscordSettings;
  setForm: (f: DiscordSettings) => void;
  loaded: boolean;
  setLoaded: (v: boolean) => void;
}) {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<DiscordSettings>({
    queryKey: ["discord-settings"],
    queryFn: () => apiFetch("/tour/admin/discord-settings"),
  });

  useEffect(() => {
    if (settings && !loaded) {
      setForm({ webhook_url: settings.webhook_url ?? "", bot_token: settings.bot_token ?? "", channel_id: settings.channel_id ?? "" });
      setLoaded(true);
    }
  }, [settings, loaded, setForm, setLoaded]);

  const saveMut = useMutation({
    mutationFn: () =>
      apiFetch("/tour/admin/discord-settings", {
        method: "POST",
        body: JSON.stringify({ ...form, ...adminAuth() }),
      }),
    onSuccess: () => toast({ title: "Discord-Einstellungen gespeichert" }),
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const testMut = useMutation({
    mutationFn: () =>
      apiFetch("/tour/admin/discord-test", { method: "POST", body: JSON.stringify(adminAuth()) }),
    onSuccess: () => toast({ title: "Test-Nachricht gesendet!" }),
    onError: (e: Error) => toast({ title: "Fehler beim Test", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Discord-Integration</h2>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Webhook-URL</label>
            <input
              type="text"
              value={form.webhook_url ?? ""}
              onChange={(e) => setForm({ ...form, webhook_url: e.target.value })}
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Bot-Token (optional)</label>
            <input
              type="password"
              value={form.bot_token ?? ""}
              onChange={(e) => setForm({ ...form, bot_token: e.target.value })}
              placeholder="Bot-Token für Threads & DMs"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Channel-ID</label>
            <input
              type="text"
              value={form.channel_id ?? ""}
              onChange={(e) => setForm({ ...form, channel_id: e.target.value })}
              placeholder="Discord Channel-ID"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Speichern
          </Button>
          <Button variant="outline" onClick={() => testMut.mutate()} disabled={testMut.isPending}>
            {testMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="bg-accent/20 border border-border/50 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Wofür wird Discord genutzt?</p>
        <p>· Automatische Check-In-Erinnerungen 30 Min. vor Turnierstart</p>
        <p>· Match-Benachrichtigungen wenn ein Spiel zugewiesen wird</p>
        <p>· OOM-Update-Ankündigungen nach Turnieren</p>
      </div>

      <AutodartsAdminSection adminAuth={adminAuth} />
    </div>
  );
}

function AutodartsAdminSection({ adminAuth }: { adminAuth: () => { admin_player_id: number | undefined; admin_player_pin: string | null } }) {
  const { toast } = useToast();
  const { currentPlayer, sessionPin } = usePlayer();
  const qc = useQueryClient();
  const [connectStep, setConnectStep] = useState<"idle" | "script">("idle");
  const [manualToken, setManualToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);

  const { data: adStatus } = useQuery<{ configured: boolean }>({
    queryKey: ["autodarts-global-status"],
    queryFn: () => apiFetch("/tour/autodarts-global-status"),
  });

  const manualConnectMut = useMutation({
    mutationFn: (token: string) =>
      apiFetch("/tour/admin/autodarts-connect-global", {
        method: "POST",
        body: JSON.stringify({ ...adminAuth(), token }),
      }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["autodarts-global-status"] });
      toast({ title: data.message ?? "Verbunden!" });
      setManualToken("");
      setConnectStep("idle");
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const disconnectMut = useMutation({
    mutationFn: () =>
      apiFetch("/tour/admin/autodarts-disconnect-global", {
        method: "POST",
        body: JSON.stringify(adminAuth()),
      }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["autodarts-global-status"] });
      toast({ title: data.message ?? "Getrennt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const isConnected = adStatus?.configured === true;

  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : import.meta.env.BASE_URL + "/";
  const callbackUrl = `${window.location.origin}${base}autodarts-callback`;

  const connectScript = currentPlayer && sessionPin
    ? `(()=>{const CB='${callbackUrl}';let ok=false;function relay(t){if(ok)return;ok=true;window.location.href=CB+'?t='+encodeURIComponent(t);}function findKC(){for(const k of Object.keys(window)){try{const w=window[k];if(w&&typeof w.updateToken==='function'&&w.refreshToken)return w;}catch{}}const root=document.getElementById('root')||document.body;const fk=Object.keys(root).find(k=>k.startsWith('__reactFiber')||k.startsWith('__reactInternalInstance'));if(!fk)return null;const q=[root[fk]];for(let i=0;i<8000&&q.length;i++){const f=q.shift();if(!f)continue;if(f.type&&f.type._context){const v=f.type._context._currentValue||{};for(const c of[v,v.keycloak,v.authClient]){if(c&&typeof c.updateToken==='function'&&c.refreshToken)return c;}}if(f.memoizedProps){for(const c of[f.memoizedProps.keycloak,f.memoizedProps.authClient]){if(c&&typeof c.updateToken==='function'&&c.refreshToken)return c;}}let h=f.memoizedState;while(h){const s=h.memoizedState||{};for(const c of[s,s.keycloak,s.authClient]){if(c&&typeof c.updateToken==='function'&&c.refreshToken)return c;}h=h.next;}if(f.child)q.push(f.child);if(f.sibling)q.push(f.sibling);}return null;}const kc=findKC();if(kc&&kc.refreshToken){console.log('Token gefunden, Weiterleitung...');relay(kc.refreshToken);}else{const oF=window.fetch;window.fetch=async function(u,v){const r=await oF.apply(this,arguments);if(typeof u==='string'&&u.includes('openid-connect/token')){try{const d=await r.clone().json();if(d.refresh_token)relay(d.refresh_token);}catch{}}return r;};const oO=XMLHttpRequest.prototype.open,oS=XMLHttpRequest.prototype.send;XMLHttpRequest.prototype.open=function(m,u){this._u=String(u||'');return oO.apply(this,arguments);};XMLHttpRequest.prototype.send=function(){this.addEventListener('load',()=>{if(this._u.includes('openid-connect/token')){try{const d=JSON.parse(this.responseText);if(d.refresh_token)relay(d.refresh_token);}catch{}}});return oS.apply(this,arguments);};for(const k of Object.keys(window)){try{const w=window[k];if(w&&typeof w.updateToken==='function'&&w.refreshToken){relay(w.refreshToken);return;}}catch{}}alert('Bitte lade die Seite einmal neu (F5) und klicke das Lesezeichen dann nochmal.');}})();`
    : "";

  const handleStartConnect = () => {
    if (!currentPlayer || !sessionPin) return;
    localStorage.setItem("autodarts_connect", JSON.stringify({
      player_id: currentPlayer.id,
      pin: sessionPin,
      mode: "global",
    }));
    window.open("https://play.autodarts.io", "_blank");
    setConnectStep("script");
  };

  const handleCopy = () => {
    if (!connectScript) return;
    navigator.clipboard.writeText(connectScript).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const bookmarkletHref = connectScript ? `javascript:${connectScript}` : "#";

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-sm">Autodarts-Verbindung (Global)</h2>
        {isConnected ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-400/10 border border-green-400/30 text-green-400 font-medium ml-auto flex items-center gap-1">
            <Wifi className="w-3 h-3" /> Verbunden
          </span>
        ) : (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 font-medium ml-auto flex items-center gap-1">
            <WifiOff className="w-3 h-3" /> Nicht verbunden
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Verbinde <strong>ein</strong> Autodarts-Konto für die gesamte Pro Tour.
        Alle Spieler profitieren automatisch — niemand muss sich einzeln verbinden.
        Match-Ergebnisse werden automatisch synchronisiert und Lobbys über dieses Konto erstellt.
      </p>

      {isConnected ? (
        <>
          <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/5 border border-green-400/20 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Score-Synchronisation ist aktiv. Match-Ergebnisse werden automatisch von Autodarts abgerufen.</span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={handleStartConnect}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Neu verbinden
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => disconnectMut.mutate()}
              disabled={disconnectMut.isPending}
            >
              {disconnectMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2Off className="w-3.5 h-3.5" />}
              Trennen
            </Button>
          </div>
        </>
      ) : (
        <Button className="w-full gap-2" onClick={handleStartConnect}>
          <ExternalLink className="w-4 h-4" /> Autodarts-Konto verbinden
        </Button>
      )}

      {connectStep === "script" && (
        <div className="space-y-3 border-t border-border pt-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="text-green-400 font-semibold">play.autodarts.io wurde geöffnet.</span> Logge dich ein und folge den 3 Schritten:
            </p>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shrink-0">1</span>
              Lesezeichen einmalig speichern
            </p>
            <p className="text-xs text-muted-foreground">
              Zeige die Lesezeichen-Leiste an <span className="font-mono bg-muted px-1 rounded text-foreground">Strg+Shift+B</span>, dann ziehe diesen Knopf dorthin:
            </p>
            <div className="flex justify-center">
              <a
                href={bookmarkletHref}
                onClick={(e) => e.preventDefault()}
                draggable
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm cursor-grab active:cursor-grabbing select-none shadow-lg hover:bg-primary/90 transition-colors"
              >
                🎯 Autodarts Connector
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
              <span className="w-5 h-5 rounded-full bg-muted text-foreground text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div className="text-xs text-muted-foreground">
                Einloggen auf <span className="font-mono text-foreground">play.autodarts.io</span> (falls noch nicht geschehen)
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
              <span className="w-5 h-5 rounded-full bg-muted text-foreground text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div className="text-xs text-muted-foreground">
                Lesezeichen <span className="font-semibold text-foreground">🎯 Autodarts Connector</span> anklicken — du wirst automatisch zurückgeleitet
              </div>
            </div>
          </div>

          <button
            onClick={() => setFallbackOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${fallbackOpen ? "rotate-180" : ""}`} />
            Kein Lesezeichen möglich? Alternative Methoden
          </button>

          {fallbackOpen && (
            <div className="space-y-3 border-t border-border pt-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Option A — Browser-Konsole</p>
                <ol className="text-xs text-muted-foreground space-y-1 pl-1">
                  <li className="flex gap-2"><span className="text-primary font-bold shrink-0">1.</span><span>Auf play.autodarts.io einloggen</span></li>
                  <li className="flex gap-2"><span className="text-primary font-bold shrink-0">2.</span><span><span className="font-mono bg-muted px-1 rounded">F12</span> → <span className="font-mono bg-muted px-1 rounded">Console</span></span></li>
                  <li className="flex gap-2"><span className="text-primary font-bold shrink-0">3.</span><span>Code einfügen und Enter drücken:</span></li>
                </ol>
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted border border-border hover:border-primary/30 transition-colors"
                >
                  <span className="font-mono text-xs text-muted-foreground truncate text-left">{connectScript.slice(0, 50)}…</span>
                  <span className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-primary">
                    {copied ? <><Check className="w-3.5 h-3.5" /> Kopiert!</> : <><Copy className="w-3.5 h-3.5" /> Kopieren</>}
                  </span>
                </button>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground">Option B — Token manuell einfügen</p>
                <Textarea
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="eyJhbGciO..."
                  className="font-mono text-xs h-16 resize-none"
                />
                <Button
                  size="sm"
                  className="w-full"
                  disabled={manualToken.trim().length < 20 || manualConnectMut.isPending}
                  onClick={() => manualConnectMut.mutate(manualToken.trim())}
                >
                  {manualConnectMut.isPending ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> Wird verbunden…</>
                  ) : (
                    <><Target className="w-3.5 h-3.5 mr-2" /> Manuell verbinden</>
                  )}
                </Button>
              </div>
            </div>
          )}

          <button onClick={() => setConnectStep("idle")} className="text-xs text-muted-foreground underline">
            ← Zurück
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Disputes Tab ─────────────────────────────────────────────────────────────

function DisputesTab({ adminAuth }: { adminAuth: () => object }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { currentPlayer, sessionPin } = usePlayer();

  const { data: disputes = [], isLoading } = useQuery<Dispute[]>({
    queryKey: ["admin-disputes"],
    queryFn: () => apiFetch(`/tour/admin/disputes?player_id=${currentPlayer?.id}&pin=${sessionPin}`),
  });

  const resolveMut = useMutation({
    mutationFn: ({ id, resolution }: { id: number; resolution: string }) =>
      apiFetch(`/tour/admin/disputes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ admin_note: resolution, status: "resolved", player_id: currentPlayer?.id, pin: sessionPin }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-disputes"] });
      toast({ title: "Dispute behoben" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const open = disputes.filter((d) => d.status === "open" || d.status === "pending");
  const closed = disputes.filter((d) => d.status === "resolved" || d.status === "closed");

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {open.length === 0 && closed.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-50" />
          <p className="text-sm font-medium">Keine offenen Disputes</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Super! Alles ruhig.</p>
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <h2 className="font-semibold text-sm">Offen ({open.length})</h2>
              </div>
              {open.map((d) => (
                <DisputeCard key={d.id} dispute={d} onResolve={(res) => resolveMut.mutate({ id: d.id, resolution: res })} isPending={resolveMut.isPending} />
              ))}
            </div>
          )}
          {closed.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <h2 className="font-semibold text-sm">Erledigt ({closed.length})</h2>
              </div>
              {closed.slice(0, 5).map((d) => (
                <DisputeCard key={d.id} dispute={d} resolved />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DisputeCard({
  dispute,
  onResolve,
  isPending,
  resolved,
}: {
  dispute: Dispute;
  onResolve?: (resolution: string) => void;
  isPending?: boolean;
  resolved?: boolean;
}) {
  const [resolution, setResolution] = useState("");

  return (
    <div className={`bg-card border rounded-xl p-4 space-y-3 ${resolved ? "border-border/50 opacity-60" : "border-yellow-500/30"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Match #{dispute.match_id} · {dispute.player_name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{dispute.reason}</p>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${
          resolved ? "text-green-400 bg-green-400/10 border-green-400/30" : "text-yellow-400 bg-yellow-400/10 border-yellow-400/30"
        }`}>
          {resolved ? "Erledigt" : "Offen"}
        </span>
      </div>
      {!resolved && onResolve && (
        <div className="flex gap-2">
          <input
            type="text"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Begründung / Entscheidung eingeben..."
            className="flex-1 px-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <Button
            size="sm"
            className="shrink-0"
            onClick={() => onResolve(resolution)}
            disabled={isPending || !resolution.trim()}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Lösen"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: number;
  player_id: number;
  player_name: string;
  message: string;
  created_at: string;
};

function ChatTab({ adminAuth }: { adminAuth: () => object }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { currentPlayer, sessionPin } = usePlayer();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["admin-chat"],
    queryFn: () => apiFetch("/tour/admin/chat/list", {
      method: "POST",
      body: JSON.stringify(adminAuth()),
    }),
    refetchInterval: 5000,
    enabled: !!currentPlayer?.id && !!sessionPin,
  });

  useEffect(() => {
    if (messages.length > prevCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  const sendMut = useMutation({
    mutationFn: (message: string) =>
      apiFetch("/tour/admin/chat", {
        method: "POST",
        body: JSON.stringify({ message, ...adminAuth() }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-chat"] });
      setInput("");
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const handleSend = () => {
    if (!input.trim()) return;
    sendMut.mutate(input.trim());
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    return isToday ? time : `${d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} ${time}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Send className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-sm">Admin-Chat</h2>
        <span className="text-xs text-muted-foreground">Nur für Admins sichtbar</span>
      </div>

      <div
        ref={scrollRef}
        className="bg-card border border-border rounded-xl p-3 space-y-2 h-[400px] overflow-y-auto"
      >
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40">
            <MessageCircle className="w-10 h-10 mb-2" />
            <p className="text-sm">Noch keine Nachrichten</p>
            <p className="text-xs">Schreib die erste Nachricht!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.player_id === currentPlayer?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  isMe
                    ? "bg-primary/15 border border-primary/30"
                    : "bg-accent/40 border border-border/50"
                }`}>
                  {!isMe && (
                    <p className="text-[10px] font-semibold text-primary mb-0.5">{msg.player_name}</p>
                  )}
                  <p className="text-sm break-words">{msg.message}</p>
                  <p className="text-[9px] text-muted-foreground/50 text-right mt-0.5">{formatTime(msg.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Nachricht schreiben..."
          className="flex-1 px-3 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <Button
          onClick={handleSend}
          disabled={sendMut.isPending || !input.trim()}
          className="px-4"
        >
          {sendMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
