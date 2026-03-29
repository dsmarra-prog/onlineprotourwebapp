import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Settings, CheckCircle, Loader2, Target, KeyRound, RefreshCw, ShieldCheck, LogOut, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { usePlayer } from "@/context/PlayerContext";

export default function EinstellungenPage() {
  const { toast } = useToast();
  const { currentPlayer, logout } = usePlayer();
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

      {/* How it works */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-3">Wie funktioniert's?</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</div>
            <p>Öffne ein Turnier und klicke auf "Jetzt anmelden" um dich selbst einzutragen</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</div>
            <p>Bestätige die Anmeldung mit deinem PIN</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</div>
            <p>Spiele deine Matches über Autodarts — die Ergebnisse werden automatisch erkannt</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">4</div>
            <p>Sammle Preisgelder in der Order of Merit Rangliste</p>
          </div>
        </div>
      </div>

      {/* Admin: Autodarts Token Update */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/30 transition-colors"
          onClick={() => setTokenSectionOpen((o) => !o)}
        >
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Admin: Autodarts Token</span>
          </div>
          <RefreshCw className={`w-4 h-4 text-muted-foreground transition-transform ${tokenSectionOpen ? "rotate-180" : ""}`} />
        </button>

        {tokenSectionOpen && (
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Falls die Lobby-Erstellung nicht funktioniert, muss der Autodarts-Token erneuert werden.
            </p>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Öffne <span className="text-foreground font-mono">play.autodarts.io</span> im Browser (eingeloggt)</li>
              <li>Öffne die Entwicklerkonsole (<span className="font-mono">F12</span>) → Tab <span className="font-mono">Application</span></li>
              <li>Links: <span className="font-mono">Local Storage → https://play.autodarts.io</span></li>
              <li>Network-Tab → Filter <span className="font-mono">token</span> → POST an <span className="font-mono">openid-connect/token</span> → Response → <span className="font-mono">refresh_token</span> kopieren</li>
            </ol>

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
