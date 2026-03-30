import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Settings, CheckCircle, Loader2, Target, KeyRound, RefreshCw, ShieldCheck, LogOut,
  User, Link2, Link2Off, ChevronDown, Wifi, WifiOff, Copy, Check, ExternalLink,
  Terminal, ClipboardPaste, MessageSquare, Bell, GitBranch, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { usePlayer } from "@/context/PlayerContext";

type TourPlayer = { id: number; name: string; autodarts_username: string; oom_name: string | null; is_admin: boolean };

function AdminOomNamesPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { currentPlayer } = usePlayer();
  const [open, setOpen] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [editing, setEditing] = useState<Record<number, string>>({});

  const { data: players, refetch } = useQuery<TourPlayer[]>({
    queryKey: ["all-players-oom-names"],
    queryFn: () => apiFetch("/tour/players"),
    enabled: open,
    staleTime: 30_000,
  });

  const saveMut = useMutation({
    mutationFn: ({ id, oom_name }: { id: number; oom_name: string }) =>
      apiFetch<{ ok: boolean; message: string }>(`/tour/players/${id}/oom-name`, {
        method: "PATCH",
        body: JSON.stringify({
          oom_name,
          admin_player_id: currentPlayer?.id,
          admin_player_pin: adminPin,
        }),
      }),
    onSuccess: (d, vars) => {
      toast({ title: d.message });
      setEditing((e) => { const n = { ...e }; delete n[vars.id]; return n; });
      refetch();
      qc.invalidateQueries({ queryKey: ["players"] });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="bg-card border border-primary/20 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Admin: OOM-Namen zuweisen</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-semibold">Admin</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-4 pt-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Wenn ein Spieler bei der OOM unter einem anderen Namen (z.B. Discord-Name) geführt wird, trage ihn hier ein. Felder leer lassen = Autodarts-Username wird verwendet.
          </p>
          <div className="space-y-1">
            <Label className="text-xs">Dein Admin-PIN</Label>
            <Input
              type="password"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              placeholder="••••"
              className="h-8 text-sm max-w-[140px]"
            />
          </div>
          <div className="space-y-2">
            {players?.map((p) => {
              const val = editing[p.id] ?? (p.oom_name ?? "");
              const changed = val !== (p.oom_name ?? "");
              return (
                <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-accent/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">@{p.autodarts_username}</p>
                  </div>
                  <Input
                    value={val}
                    onChange={(e) => setEditing((ed) => ({ ...ed, [p.id]: e.target.value }))}
                    placeholder="OOM-Name (Discord)"
                    className="h-7 text-xs w-40"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className={`h-7 text-xs px-2 ${changed ? "border-primary/50 text-primary" : "opacity-40"}`}
                    disabled={!changed || !adminPin || adminPin.length < 4 || saveMut.isPending}
                    onClick={() => saveMut.mutate({ id: p.id, oom_name: val })}
                  >
                    {saveMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [adminSecret, setAdminSecret] = useState("");
  const [open, setOpen] = useState(false);

  const { data: players, refetch } = useQuery<TourPlayer[]>({
    queryKey: ["all-players-admin"],
    queryFn: () => apiFetch("/tour/players"),
    enabled: open,
    staleTime: 30_000,
  });

  const grantMut = useMutation({
    mutationFn: (player_id: number) =>
      apiFetch<{ ok: boolean; message: string }>("/tour/admin/grant-admin", {
        method: "POST",
        body: JSON.stringify({ admin_secret: adminSecret, player_id }),
      }),
    onSuccess: (d) => { toast({ title: d.message }); refetch(); qc.invalidateQueries({ queryKey: ["all-players-admin"] }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const revokeMut = useMutation({
    mutationFn: (player_id: number) =>
      apiFetch<{ ok: boolean; message: string }>("/tour/admin/revoke-admin", {
        method: "POST",
        body: JSON.stringify({ admin_secret: adminSecret, player_id }),
      }),
    onSuccess: (d) => { toast({ title: d.message }); refetch(); qc.invalidateQueries({ queryKey: ["all-players-admin"] }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="bg-card border border-primary/20 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Admin: Rollenverwaltung</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-semibold">Admin</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-4 pt-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Vergib oder entziehe Admin-Rechte. Admins können alle Turniere verwalten. Das Admin-Secret findest du in den Server-Einstellungen (Replit Secrets).
          </p>
          <div className="space-y-1">
            <Label className="text-xs">Admin-Secret</Label>
            <Input type="password" value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)} placeholder="Admin-Secret eingeben" className="h-8 text-sm" />
          </div>
          <div className="space-y-2">
            {players?.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-accent/20">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">@{p.autodarts_username}</span>
                  {p.is_admin && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">Admin</span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className={`h-6 text-xs gap-1 ${p.is_admin ? "text-red-400 border-red-400/30 hover:bg-red-400/10" : "text-green-400 border-green-400/30 hover:bg-green-400/10"}`}
                  disabled={!adminSecret || grantMut.isPending || revokeMut.isPending}
                  onClick={() => p.is_admin ? revokeMut.mutate(p.id) : grantMut.mutate(p.id)}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {p.is_admin ? "Entziehen" : "Admin machen"}
                </Button>
              </div>
            ))}
            {players?.length === 0 && <p className="text-xs text-muted-foreground">Keine Spieler gefunden.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EinstellungenPage() {
  const { toast } = useToast();
  const { currentPlayer, logout } = usePlayer();
  const queryClient = useQueryClient();

  // ── Admin token section ──────────────────────────────────────────────────
  const [tokenForm, setTokenForm] = useState({ pin: "", refresh_token: "" });
  const [tokenSectionOpen, setTokenSectionOpen] = useState(false);

  // ── Discord settings ─────────────────────────────────────────────────────
  const [discordOpen, setDiscordOpen] = useState(false);
  const [discordForm, setDiscordForm] = useState({
    admin_pin: "",
    webhook_url: "",
    bot_token: "",
    channel_id: "",
  });

  const { data: discordStatus } = useQuery({
    queryKey: ["discord-settings"],
    queryFn: () => apiFetch<{
      webhook_url: string;
      bot_token_set: boolean;
      channel_id: string;
      webhook_from_env?: boolean;
      bot_from_env?: boolean;
    }>("/tour/admin/discord-settings"),
    staleTime: 60_000,
  });

  const discordSaveMut = useMutation({
    mutationFn: () =>
      apiFetch<{ ok: boolean }>("/tour/admin/discord-settings", {
        method: "POST",
        body: JSON.stringify(discordForm),
      }),
    onSuccess: () => {
      toast({ title: "Discord gespeichert", description: "Einstellungen wurden aktualisiert." });
      queryClient.invalidateQueries({ queryKey: ["discord-settings"] });
      setDiscordForm((f) => ({ ...f, admin_pin: "", bot_token: "" }));
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const discordTestMut = useMutation({
    mutationFn: () =>
      apiFetch<{ ok: boolean }>("/tour/admin/discord-test", {
        method: "POST",
        body: JSON.stringify({ admin_pin: discordForm.admin_pin }),
      }),
    onSuccess: () => toast({ title: "Testnachricht gesendet!", description: "Schau in deinen Discord-Channel." }),
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  // Pre-fill form with current saved values when panel opens or data loads
  useEffect(() => {
    if (!discordStatus) return;
    setDiscordForm((f) => ({
      ...f,
      webhook_url: discordStatus.webhook_url || f.webhook_url,
      channel_id: discordStatus.channel_id || f.channel_id,
      // bot_token left empty intentionally — never returned from server
    }));
  }, [discordStatus]);

  const tokenMut = useMutation({
    mutationFn: () =>
      apiFetch<{ ok: boolean; message: string }>("/tour/admin/autodarts-token", {
        method: "POST",
        body: JSON.stringify({ pin: tokenForm.pin, refresh_token: tokenForm.refresh_token.trim() }),
      }),
    onSuccess: (data) => {
      toast({ title: "Token aktualisiert", description: data.message });
      setTokenForm({ pin: "", refresh_token: "" });
      setTokenSectionOpen(false);
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const canUpdateToken = tokenForm.pin.length >= 4 && tokenForm.refresh_token.trim().length > 20;

  // ── Discord ID ───────────────────────────────────────────────────────────
  const [discordId, setDiscordId] = useState("");
  const [discordPin, setDiscordPin] = useState("");

  const discordMut = useMutation({
    mutationFn: () =>
      apiFetch<{ ok: boolean; message: string }>(`/tour/players/${currentPlayer!.id}/discord-id`, {
        method: "PATCH",
        body: JSON.stringify({ discord_id: discordId.trim() || null, player_pin: discordPin }),
      }),
    onSuccess: (data) => {
      toast({ title: data.message });
      setDiscordPin("");
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  // ── Push Notifications ───────────────────────────────────────────────────
  const [pushPin, setPushPin] = useState("");
  const [pushLoading, setPushLoading] = useState(false);

  const { data: pushStatus, refetch: refetchPush } = useQuery({
    queryKey: ["push-status", currentPlayer?.id],
    queryFn: () => apiFetch<{ subscribed: boolean }>(`/tour/players/${currentPlayer!.id}/push-status`),
    enabled: !!currentPlayer,
    staleTime: 30_000,
  });

  const { data: vapidKey } = useQuery({
    queryKey: ["vapid-key"],
    queryFn: () => apiFetch<{ public_key: string }>("/tour/vapid-public-key"),
    staleTime: Infinity,
  });

  const pushSubscribe = async () => {
    if (!currentPlayer || !vapidKey?.public_key || pushPin.length < 4) return;
    setPushLoading(true);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        toast({ title: "Push nicht unterstützt", description: "Dein Browser unterstützt keine Push-Benachrichtigungen.", variant: "destructive" });
        return;
      }
      const reg = await navigator.serviceWorker.register("/pro-tour/sw.js");
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast({ title: "Berechtigung verweigert", description: "Bitte erlaube Benachrichtigungen in den Browser-Einstellungen.", variant: "destructive" });
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey.public_key,
      });
      const json = sub.toJSON();

      await apiFetch(`/tour/players/${currentPlayer.id}/push-subscribe`, {
        method: "POST",
        body: JSON.stringify({ pin: pushPin, endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth }),
      });
      toast({ title: "Push-Benachrichtigungen aktiviert!" });
      setPushPin("");
      refetchPush();
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    } finally {
      setPushLoading(false);
    }
  };

  const pushUnsubscribe = async () => {
    if (!currentPlayer) return;
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration("/pro-tour/sw.js");
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) await sub.unsubscribe();
        }
      }
      await apiFetch(`/tour/players/${currentPlayer.id}/push-unsubscribe`, { method: "DELETE" });
      toast({ title: "Push-Benachrichtigungen deaktiviert" });
      refetchPush();
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    }
  };

  // ── Player Autodarts connection ──────────────────────────────────────────
  const [disconnectPin, setDisconnectPin] = useState("");
  const [connectPin, setConnectPin] = useState("");
  const [connectStep, setConnectStep] = useState<"form" | "script">("form");
  const [connectMode, setConnectMode] = useState<"auto" | "manual">("auto");
  const [manualToken, setManualToken] = useState("");
  const [copied, setCopied] = useState(false);

  const manualConnectMut = useMutation({
    mutationFn: () =>
      apiFetch<{ ok: boolean; message?: string; error?: string }>(
        `/tour/players/${currentPlayer!.id}/autodarts-connect`,
        { method: "POST", body: JSON.stringify({ token: manualToken.trim(), pin: connectPin }) }
      ),
    onSuccess: (data) => {
      if (data.ok) {
        toast({ title: "Verbunden!", description: data.message ?? "Autodarts erfolgreich verbunden." });
        setConnectStep("form");
        setManualToken("");
        queryClient.invalidateQueries({ queryKey: ["autodarts-status", currentPlayer?.id] });
      } else {
        toast({ title: "Fehler", description: data.error, variant: "destructive" });
      }
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const { data: adStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["autodarts-status", currentPlayer?.id],
    queryFn: () => apiFetch<{ connected: boolean }>(`/tour/players/${currentPlayer!.id}/autodarts-status`),
    enabled: !!currentPlayer,
    staleTime: 30_000,
  });

  const disconnectMut = useMutation({
    mutationFn: () =>
      apiFetch<{ ok: boolean }>(`/tour/players/${currentPlayer!.id}/autodarts-disconnect`, {
        method: "POST",
        body: JSON.stringify({ pin: disconnectPin }),
      }),
    onSuccess: () => {
      toast({ title: "Getrennt", description: "Autodarts-Verbindung wurde entfernt." });
      setDisconnectPin("");
      queryClient.invalidateQueries({ queryKey: ["autodarts-status", currentPlayer?.id] });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : import.meta.env.BASE_URL + "/";
  const callbackUrl = `${window.location.origin}${base}autodarts-callback`;

  // Relay script: first tries to read the refreshToken directly from the React fiber tree
  // (no network request needed), then falls back to network interception.
  const connectScript = currentPlayer && connectPin.length >= 4
    ? `(()=>{const CB='${callbackUrl}';let ok=false;function relay(t){if(ok)return;ok=true;window.location.href=CB+'?t='+encodeURIComponent(t);}function findKC(){for(const k of Object.keys(window)){try{const w=window[k];if(w&&typeof w.updateToken==='function'&&w.refreshToken)return w;}catch{}}const root=document.getElementById('root')||document.body;const fk=Object.keys(root).find(k=>k.startsWith('__reactFiber')||k.startsWith('__reactInternalInstance'));if(!fk)return null;const q=[root[fk]];for(let i=0;i<8000&&q.length;i++){const f=q.shift();if(!f)continue;if(f.type&&f.type._context){const v=f.type._context._currentValue||{};for(const c of[v,v.keycloak,v.authClient]){if(c&&typeof c.updateToken==='function'&&c.refreshToken)return c;}}if(f.memoizedProps){for(const c of[f.memoizedProps.keycloak,f.memoizedProps.authClient]){if(c&&typeof c.updateToken==='function'&&c.refreshToken)return c;}}let h=f.memoizedState;while(h){const s=h.memoizedState||{};for(const c of[s,s.keycloak,s.authClient]){if(c&&typeof c.updateToken==='function'&&c.refreshToken)return c;}h=h.next;}if(f.child)q.push(f.child);if(f.sibling)q.push(f.sibling);}return null;}const kc=findKC();if(kc&&kc.refreshToken){console.log('Token gefunden, Weiterleitung...');relay(kc.refreshToken);}else{const oF=window.fetch;window.fetch=async function(u,v){const r=await oF.apply(this,arguments);if(typeof u==='string'&&u.includes('openid-connect/token')){try{const d=await r.clone().json();if(d.refresh_token)relay(d.refresh_token);}catch{}}return r;};const oO=XMLHttpRequest.prototype.open,oS=XMLHttpRequest.prototype.send;XMLHttpRequest.prototype.open=function(m,u){this._u=String(u||'');return oO.apply(this,arguments);};XMLHttpRequest.prototype.send=function(){this.addEventListener('load',()=>{if(this._u.includes('openid-connect/token')){try{const d=JSON.parse(this.responseText);if(d.refresh_token)relay(d.refresh_token);}catch{}}});return oS.apply(this,arguments);};for(const k of Object.keys(window)){try{const w=window[k];if(w&&typeof w.updateToken==='function'){w.updateToken(99999);break;}}catch{}}console.log('Token nicht direkt lesbar – klicke auf eine Lobby auf dieser Seite...');}})();`
    : "";

  const handleStartConnect = () => {
    if (!currentPlayer || connectPin.length < 4) return;
    localStorage.setItem("autodarts_connect", JSON.stringify({
      player_id: currentPlayer.id,
      pin: connectPin,
    }));
    window.open("https://play.autodarts.io", "_blank");
    setConnectStep("script");
  };

  const handleCopyScript = () => {
    if (!connectScript) return;
    navigator.clipboard.writeText(connectScript).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isConnected = adStatus?.connected ?? false;

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Mein Account
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Dein Profil bei der Online Pro Tour</p>
      </div>

      {/* Player profile card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="font-bold text-lg">{currentPlayer?.name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3" /> @{currentPlayer?.autodarts_username}
            </div>
          </div>
          <div className="ml-auto">
            <div className="text-xs text-muted-foreground">Spieler-ID</div>
            <div className="text-sm font-mono font-semibold">#{currentPlayer?.id}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            Du bist eingeloggt. Dein PIN wird benötigt wenn du dich für Turniere anmeldest.
          </p>
        </div>

        <Button variant="outline" className="w-full gap-2 text-muted-foreground" onClick={logout}>
          <LogOut className="w-4 h-4" /> Ausloggen
        </Button>
      </div>

      {/* Push Benachrichtigungen */}
      {currentPlayer && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Push-Benachrichtigungen</span>
            </div>
            {pushStatus?.subscribed && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-500/10 text-green-400 border border-green-500/20">Aktiv</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Erhalte eine Benachrichtigung direkt im Browser wenn dein Match bereit ist — auch wenn du die App im Hintergrund hast.
          </p>
          {pushStatus?.subscribed ? (
            <Button variant="outline" size="sm" className="w-full text-muted-foreground gap-2" onClick={pushUnsubscribe}>
              <Bell className="w-3.5 h-3.5" /> Benachrichtigungen deaktivieren
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">Dein PIN zur Bestätigung</Label>
                <Input type="password" value={pushPin} onChange={(e) => setPushPin(e.target.value)} placeholder="••••" className="h-8 text-sm" />
              </div>
              <Button size="sm" className="w-full gap-2" disabled={pushPin.length < 4 || pushLoading} onClick={pushSubscribe}>
                {pushLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                Benachrichtigungen aktivieren
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Discord ID */}
      {currentPlayer && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-sm">Discord-ID für @Mentions</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Trage deine Discord-Nutzer-ID ein, damit du 30 Minuten vor Turnierstart automatisch in Discord markiert wirst.<br />
            <span className="text-muted-foreground/60">Zu finden unter: Discord → Einstellungen → Erweitert → Entwicklermodus → Rechtsklick auf deinen Namen → ID kopieren</span>
          </p>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Discord-Nutzer-ID (reine Zahlenfolge)</Label>
              <Input
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value.replace(/\D/g, ""))}
                placeholder="z.B. 123456789012345678"
                className="h-8 text-sm font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dein PIN zur Bestätigung</Label>
              <Input type="password" value={discordPin} onChange={(e) => setDiscordPin(e.target.value)} placeholder="••••" className="h-8 text-sm" />
            </div>
            <Button
              size="sm"
              className="w-full gap-2"
              disabled={discordPin.length < 4 || discordMut.isPending}
              onClick={() => discordMut.mutate()}
            >
              {discordMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
              {discordId.trim() ? "Discord-ID speichern" : "Discord-ID entfernen"}
            </Button>
          </div>
        </div>
      )}

      {/* Autodarts Account verbinden */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {statusLoading ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : isConnected ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="font-semibold text-sm">Autodarts verbinden</span>
          </div>
          {!statusLoading && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isConnected
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-muted text-muted-foreground border border-border"
            }`}>
              {isConnected ? "Verbunden" : "Nicht verbunden"}
            </span>
          )}
        </div>

        <div className="border-t border-border px-4 pb-4 pt-4 space-y-4">
          {isConnected ? (
            <>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                <Link2 className="w-4 h-4 text-green-400 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Dein Autodarts-Account ist verbunden. Du kannst Lobbys für deine Matches selbst erstellen.
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Um die Verbindung zu trennen, gib deinen PIN ein:
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="PIN"
                  value={disconnectPin}
                  onChange={(e) => setDisconnectPin(e.target.value)}
                  className="max-w-[120px]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  disabled={disconnectPin.length < 4 || disconnectMut.isPending}
                  onClick={() => disconnectMut.mutate()}
                >
                  {disconnectMut.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><Link2Off className="w-4 h-4 mr-1.5" /> Trennen</>
                  )}
                </Button>
              </div>

              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs text-muted-foreground">Token abgelaufen? Hier neu verbinden:</p>
                <ConnectFlow
                  pin={connectPin} onPinChange={setConnectPin}
                  step={connectStep} onStart={handleStartConnect}
                  onBack={() => { setConnectStep("form"); setConnectMode("auto"); setManualToken(""); }}
                  script={connectScript} copied={copied} onCopy={handleCopyScript}
                  mode={connectMode} onModeChange={setConnectMode}
                  manualToken={manualToken} onManualTokenChange={setManualToken}
                  onManualSubmit={() => manualConnectMut.mutate()}
                  manualPending={manualConnectMut.isPending}
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Verbinde deinen Autodarts-Account, um Lobby-Links für deine Matches selbst zu erstellen —
                auch wenn der Admin nicht online ist.
              </p>
              <ConnectFlow
                pin={connectPin} onPinChange={setConnectPin}
                step={connectStep} onStart={handleStartConnect}
                onBack={() => { setConnectStep("form"); setConnectMode("auto"); setManualToken(""); }}
                script={connectScript} copied={copied} onCopy={handleCopyScript}
                mode={connectMode} onModeChange={setConnectMode}
                manualToken={manualToken} onManualTokenChange={setManualToken}
                onManualSubmit={() => manualConnectMut.mutate()}
                manualPending={manualConnectMut.isPending}
              />
            </>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-3">Wie funktioniert's?</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          {[
            "Öffne ein Turnier und klicke auf \"Jetzt anmelden\" um dich selbst einzutragen",
            "Bestätige die Anmeldung mit deinem PIN",
            "Erstelle eine Autodarts-Lobby direkt aus dem Turnier heraus",
            "Spiele deine Matches — die Ergebnisse werden automatisch erkannt",
          ].map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {i + 1}
              </div>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Admin: Rollenverwaltung */}
      {currentPlayer?.is_admin && <AdminPanel />}
      {currentPlayer?.is_admin && <AdminOomNamesPanel />}

      {/* Admin: Discord Settings */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/30 transition-colors"
          onClick={() => setDiscordOpen((o) => !o)}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#5865F2]" />
            <span className="font-semibold text-sm">Admin: Discord Integration</span>
            {discordStatus?.webhook_url && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                Aktiv
              </span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${discordOpen ? "rotate-180" : ""}`} />
        </button>

        {discordOpen && (
          <div className="px-4 pb-4 space-y-5 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Verbinde die Pro Tour mit deinem Discord-Server. Anmeldungen, Ergebnisse und OOM-Updates werden
              automatisch in einen Channel gepostet. Optional: Match-Threads für Spielverabredungen.
            </p>

            {/* Status */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`flex items-center gap-1.5 p-2 rounded-lg border ${discordStatus?.webhook_url ? "bg-green-500/5 border-green-500/20 text-green-400" : "bg-muted border-border text-muted-foreground"}`}>
                <Bell className="w-3.5 h-3.5 shrink-0" />
                <div className="flex flex-col">
                  <span>{discordStatus?.webhook_url ? "Webhook aktiv" : "Webhook nicht gesetzt"}</span>
                  {discordStatus?.webhook_from_env && (
                    <span className="text-[10px] text-muted-foreground">via Umgebungsvariable</span>
                  )}
                </div>
              </div>
              <div className={`flex items-center gap-1.5 p-2 rounded-lg border ${discordStatus?.bot_token_set ? "bg-green-500/5 border-green-500/20 text-green-400" : "bg-muted border-border text-muted-foreground"}`}>
                <GitBranch className="w-3.5 h-3.5 shrink-0" />
                <div className="flex flex-col">
                  <span>{discordStatus?.bot_token_set ? "Bot-Token aktiv" : "Kein Bot-Token"}</span>
                  {discordStatus?.bot_from_env && (
                    <span className="text-[10px] text-muted-foreground">via Umgebungsvariable</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-3 h-3" /> Admin-PIN
              </Label>
              <Input
                type="password"
                placeholder="Admin-PIN"
                value={discordForm.admin_pin}
                onChange={(e) => setDiscordForm((f) => ({ ...f, admin_pin: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Webhook-URL <span className="text-muted-foreground font-normal">(für Benachrichtigungen)</span></Label>
              <Input
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={discordForm.webhook_url}
                onChange={(e) => setDiscordForm((f) => ({ ...f, webhook_url: e.target.value }))}
                className="font-mono text-xs"
              />
              {discordStatus?.webhook_url && (
                <p className="text-xs text-muted-foreground">Aktuell: <span className="font-mono">{discordStatus.webhook_url}</span></p>
              )}
              <p className="text-xs text-muted-foreground/60">
                Discord-Server → Kanal-Einstellungen → Integrationen → Webhooks → Neuen Webhook erstellen
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Bot-Token <span className="text-muted-foreground font-normal">(optional, für Match-Threads)</span></Label>
              <Input
                type="password"
                placeholder={discordStatus?.bot_token_set ? "✓ Token bereits gesetzt — nur eingeben um zu ändern" : "MTI3..."}
                value={discordForm.bot_token}
                onChange={(e) => setDiscordForm((f) => ({ ...f, bot_token: e.target.value }))}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Channel-ID <span className="text-muted-foreground font-normal">(für Match-Threads)</span></Label>
              <Input
                placeholder={discordStatus?.channel_id || "123456789012345678"}
                value={discordForm.channel_id}
                onChange={(e) => setDiscordForm((f) => ({ ...f, channel_id: e.target.value }))}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground/60">
                Rechtsklick auf den Channel → "ID kopieren" (Entwicklermodus muss aktiv sein)
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={discordForm.admin_pin.length < 4 || discordSaveMut.isPending}
                onClick={() => discordSaveMut.mutate()}
              >
                {discordSaveMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Speichern
              </Button>
              <Button
                variant="outline"
                disabled={discordForm.admin_pin.length < 4 || !discordStatus?.webhook_url || discordTestMut.isPending}
                onClick={() => discordTestMut.mutate()}
                title="Testnachricht senden"
              >
                {discordTestMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Admin: Autodarts Global Token Update */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/30 transition-colors"
          onClick={() => setTokenSectionOpen((o) => !o)}
        >
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Admin: Globaler Autodarts Token</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${tokenSectionOpen ? "rotate-180" : ""}`} />
        </button>

        {tokenSectionOpen && (
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Der globale Token ist der Fallback für alle Spieler ohne eigene Verbindung.
              Nur nötig falls kein Spieler seinen Account verbunden hat.
            </p>

            <div className="space-y-1">
              <Label className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" /> Admin-PIN
              </Label>
              <Input
                type="password"
                value={tokenForm.pin}
                onChange={(e) => setTokenForm((f) => ({ ...f, pin: e.target.value }))}
                placeholder="Admin-PIN eingeben"
              />
            </div>

            <div className="space-y-1">
              <Label>Autodarts Refresh Token</Label>
              <Textarea
                value={tokenForm.refresh_token}
                onChange={(e) => setTokenForm((f) => ({ ...f, refresh_token: e.target.value }))}
                placeholder="eyJhbGciOi..."
                className="font-mono text-xs h-24 resize-none"
              />
            </div>

            <Button
              className="w-full"
              disabled={!canUpdateToken || tokenMut.isPending}
              onClick={() => tokenMut.mutate()}
            >
              {tokenMut.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Wird gespeichert...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" /> Token aktualisieren</>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectFlow({
  pin, onPinChange, step, onStart, onBack, script, copied, onCopy,
  mode, onModeChange, manualToken, onManualTokenChange, onManualSubmit, manualPending,
}: {
  pin: string;
  onPinChange: (v: string) => void;
  step: "form" | "script";
  onStart: () => void;
  onBack: () => void;
  script: string;
  copied: boolean;
  onCopy: () => void;
  mode: "auto" | "manual";
  onModeChange: (m: "auto" | "manual") => void;
  manualToken: string;
  onManualTokenChange: (v: string) => void;
  onManualSubmit: () => void;
  manualPending: boolean;
}) {
  if (step === "form") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Pro Tour PIN eingeben</Label>
          <Input
            type="password"
            placeholder="PIN eingeben"
            value={pin}
            onChange={(e) => onPinChange(e.target.value)}
            className="max-w-[160px]"
          />
        </div>
        <Button
          className="w-full gap-2"
          disabled={pin.length < 4}
          onClick={onStart}
        >
          <ExternalLink className="w-4 h-4" /> Mit Autodarts verbinden
        </Button>
        <p className="text-xs text-muted-foreground/60 italic">
          Dein Passwort wird nie an die Pro Tour übertragen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <button
          onClick={() => onModeChange("auto")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === "auto"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" /> Console-Script
        </button>
        <button
          onClick={() => onModeChange("manual")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === "manual"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardPaste className="w-3.5 h-3.5" /> Manuell einfügen
        </button>
      </div>

      {mode === "auto" ? (
        <>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <CheckCircle className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              play.autodarts.io wurde geöffnet. Folge den Schritten:
            </p>
          </div>

          <ol className="text-xs text-muted-foreground space-y-2">
            <li className="flex gap-2">
              <span className="text-primary font-bold shrink-0">1.</span>
              <span>Einloggen auf <span className="font-mono text-foreground">play.autodarts.io</span></span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold shrink-0">2.</span>
              <span><span className="font-mono bg-muted px-1 rounded">F12</span> → Reiter <span className="font-mono bg-muted px-1 rounded">Console</span></span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold shrink-0">3.</span>
              <span>Befehl einfügen und <span className="font-mono bg-muted px-1 rounded">Enter</span> drücken</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold shrink-0">4.</span>
              <span>Du wirst automatisch zurückgeleitet. Falls nicht: <span className="text-foreground">Manuell einfügen</span> oben wählen.</span>
            </li>
          </ol>

          <button
            onClick={onCopy}
            className="w-full flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted border border-border hover:border-primary/30 transition-colors"
          >
            <span className="font-mono text-xs text-muted-foreground truncate text-left">
              {script.slice(0, 55)}…
            </span>
            <span className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-primary">
              {copied ? <><Check className="w-4 h-4" /> Kopiert!</> : <><Copy className="w-4 h-4" /> Kopieren</>}
            </span>
          </button>
        </>
      ) : (
        <>
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-2">
            <p className="text-xs font-semibold text-amber-400">Token aus dem Netzwerk-Tab kopieren</p>
            <ol className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold shrink-0">1.</span>
                <span>Öffne <span className="font-mono text-foreground">play.autodarts.io</span> und logge dich ein</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold shrink-0">2.</span>
                <span><span className="font-mono bg-muted px-1 rounded">F12</span> → Reiter <span className="font-mono bg-muted px-1 rounded">Network</span> (Netzwerk)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold shrink-0">3.</span>
                <span>Seite neu laden (<span className="font-mono bg-muted px-1 rounded">F5</span>), dann im Filter <span className="font-mono bg-muted px-1 rounded">token</span> eingeben</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold shrink-0">4.</span>
                <span>POST-Request zu <span className="font-mono text-foreground">login.autodarts.io</span> anklicken → Tab <span className="font-mono bg-muted px-1 rounded">Response</span></span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold shrink-0">5.</span>
                <span>Den Wert von <span className="font-mono bg-muted px-1 rounded text-foreground">refresh_token</span> kopieren und unten einfügen</span>
              </li>
            </ol>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">refresh_token einfügen</Label>
            <Textarea
              value={manualToken}
              onChange={(e) => onManualTokenChange(e.target.value)}
              placeholder="eyJhbGciO..."
              className="font-mono text-xs h-20 resize-none"
            />
          </div>

          <Button
            className="w-full"
            disabled={manualToken.trim().length < 20 || manualPending}
            onClick={onManualSubmit}
          >
            {manualPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Wird verbunden...</>
            ) : (
              <><Link2 className="w-4 h-4 mr-2" /> Jetzt verbinden</>
            )}
          </Button>
        </>
      )}

      <button onClick={onBack} className="text-xs text-muted-foreground underline">
        ← Zurück
      </button>
    </div>
  );
}
