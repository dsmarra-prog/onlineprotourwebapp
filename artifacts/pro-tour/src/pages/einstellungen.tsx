import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Settings, CheckCircle, Loader2, Target, KeyRound, RefreshCw, ShieldCheck, LogOut,
  User, Link2, Link2Off, ChevronDown, Wifi, WifiOff, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { usePlayer } from "@/context/PlayerContext";

function generateCodeVerifier(): string {
  const array = new Uint8Array(48);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export default function EinstellungenPage() {
  const { toast } = useToast();
  const { currentPlayer, logout } = usePlayer();
  const queryClient = useQueryClient();

  // ── Admin token section ──────────────────────────────────────────────────
  const [tokenForm, setTokenForm] = useState({ pin: "", refresh_token: "" });
  const [tokenSectionOpen, setTokenSectionOpen] = useState(false);

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

  // ── Player Autodarts connection ──────────────────────────────────────────
  const [disconnectPin, setDisconnectPin] = useState("");
  const [connectPin, setConnectPin] = useState("");
  const [oauthLoading, setOauthLoading] = useState(false);

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

  const handleOAuthConnect = async () => {
    if (!currentPlayer || connectPin.length < 4) return;
    setOauthLoading(true);
    try {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const redirectUri = `${window.location.origin}${import.meta.env.BASE_URL}autodarts-callback`.replace(/\/\//g, "/").replace(":/", "://");

      sessionStorage.setItem("autodarts_oauth", JSON.stringify({
        code_verifier: codeVerifier,
        player_id: currentPlayer.id,
        pin: connectPin,
        redirect_uri: redirectUri,
      }));

      const params = new URLSearchParams({
        client_id: "autodarts-play",
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });

      window.location.href = `https://login.autodarts.io/realms/autodarts/protocol/openid-connect/auth?${params}`;
    } catch (e) {
      toast({ title: "Fehler", description: String(e), variant: "destructive" });
      setOauthLoading(false);
    }
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
                <OAuthConnectForm pin={connectPin} onPinChange={setConnectPin} onConnect={handleOAuthConnect} loading={oauthLoading} />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Verbinde deinen Autodarts-Account, um Lobby-Links für deine Matches selbst zu erstellen —
                auch wenn der Admin nicht online ist.
              </p>
              <OAuthConnectForm pin={connectPin} onPinChange={setConnectPin} onConnect={handleOAuthConnect} loading={oauthLoading} />
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

function OAuthConnectForm({ pin, onPinChange, onConnect, loading }: {
  pin: string;
  onPinChange: (v: string) => void;
  onConnect: () => void;
  loading: boolean;
}) {
  const pinReady = pin.length >= 4;

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
        disabled={!pinReady || loading}
        onClick={onConnect}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Weiterleitung…</>
        ) : (
          <><ExternalLink className="w-4 h-4" /> Mit Autodarts verbinden</>
        )}
      </Button>

      <p className="text-xs text-muted-foreground/60 italic">
        Du wirst zu autodarts.io weitergeleitet und automatisch zurückgeleitet.
        Dein Passwort wird dabei nie an die Pro Tour übertragen.
      </p>
    </div>
  );
}
