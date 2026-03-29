import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, UserPlus, CheckCircle, Loader2, Target, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, TourPlayer } from "@/lib/api";

export default function EinstellungenPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [registered, setRegistered] = useState<TourPlayer | null>(null);

  const [form, setForm] = useState({
    name: "",
    autodarts_username: "",
    pin: "",
    pin_confirm: "",
  });

  const [tokenForm, setTokenForm] = useState({ pin: "", refresh_token: "" });
  const [tokenSectionOpen, setTokenSectionOpen] = useState(false);

  const registerMut = useMutation({
    mutationFn: () =>
      apiFetch<TourPlayer>("/tour/players/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          autodarts_username: form.autodarts_username,
          pin: form.pin,
        }),
      }),
    onSuccess: (player) => {
      setRegistered(player);
      qc.invalidateQueries({ queryKey: ["players"] });
      toast({ title: "Erfolgreich registriert!", description: `Willkommen bei der Online Pro Tour, ${player.name}!` });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

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

  const pinsMatch = form.pin === form.pin_confirm;
  const canRegister = form.name.trim() && form.autodarts_username.trim() && form.pin.length >= 4 && pinsMatch;
  const canUpdateToken = tokenForm.pin.length >= 4 && tokenForm.refresh_token.trim().length > 20;

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Mein Account
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Registriere dich für die Online Pro Tour</p>
      </div>

      {registered ? (
        <div className="bg-card border border-primary/30 rounded-xl p-6 text-center">
          <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-1">Registrierung erfolgreich!</h2>
          <p className="text-muted-foreground text-sm">Du bist jetzt als <span className="text-foreground font-semibold">{registered.name}</span> bei der Online Pro Tour registriert.</p>
          <div className="mt-4 p-3 rounded-lg bg-accent/50 text-sm text-left">
            <div className="flex justify-between"><span className="text-muted-foreground">Autodarts:</span><span>@{registered.autodarts_username}</span></div>
            <div className="flex justify-between mt-1"><span className="text-muted-foreground">Spieler-ID:</span><span>#{registered.id}</span></div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Dein PIN wird benötigt, wenn du an Turnieren antrittst. Merke ihn dir gut!</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Neuen Account erstellen</h2>
          </div>

          <div className="space-y-1">
            <Label>Dein Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Wie heißt du?"
            />
          </div>

          <div className="space-y-1">
            <Label className="flex items-center gap-1.5">
              <Target className="w-3 h-3" /> Autodarts-Benutzername
            </Label>
            <Input
              value={form.autodarts_username}
              onChange={(e) => setForm((f) => ({ ...f, autodarts_username: e.target.value }))}
              placeholder="Dein Autodarts-Username"
            />
            <p className="text-xs text-muted-foreground">Exakt wie in Autodarts angezeigt</p>
          </div>

          <div className="space-y-1">
            <Label>PIN (mind. 4 Zeichen)</Label>
            <Input
              type="password"
              value={form.pin}
              onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
              placeholder="PIN festlegen"
            />
          </div>

          <div className="space-y-1">
            <Label>PIN bestätigen</Label>
            <Input
              type="password"
              value={form.pin_confirm}
              onChange={(e) => setForm((f) => ({ ...f, pin_confirm: e.target.value }))}
              placeholder="PIN wiederholen"
              className={form.pin_confirm && !pinsMatch ? "border-red-500" : ""}
            />
            {form.pin_confirm && !pinsMatch && (
              <p className="text-xs text-red-400">PINs stimmen nicht überein</p>
            )}
          </div>

          <Button
            className="w-full"
            disabled={!canRegister || registerMut.isPending}
            onClick={() => registerMut.mutate()}
          >
            {registerMut.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Registrieren...</>
            ) : (
              <><UserPlus className="w-4 h-4 mr-2" /> Jetzt registrieren</>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Mit deiner Registrierung akzeptierst du die Turnierregeln. Dein PIN kann nicht zurückgesetzt werden.
          </p>
        </div>
      )}

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
              So holst du dir den Token:
            </p>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Öffne <span className="text-foreground font-mono">play.autodarts.io</span> im Browser (eingeloggt)</li>
              <li>Öffne die Entwicklerkonsole (<span className="font-mono">F12</span>) → Tab <span className="font-mono">Application</span></li>
              <li>Links: <span className="font-mono">Local Storage → https://play.autodarts.io</span></li>
              <li>Suche einen Eintrag mit <span className="font-mono">kc-callback</span> oder öffne <span className="font-mono">Session Storage</span></li>
              <li>Alternativ: Network-Tab → Filter <span className="font-mono">token</span> → POST-Request an <span className="font-mono">openid-connect/token</span> → Response → <span className="font-mono">refresh_token</span> kopieren</li>
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

      {/* Info box */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-3">Wie funktioniert's?</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</div>
            <p>Registriere dich mit deinem Autodarts-Benutzernamen und einem PIN</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</div>
            <p>Der Admin trägt dich für Turniere ein</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</div>
            <p>Spiele deine Matches über Autodarts und verfolge deine Ergebnisse live</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">4</div>
            <p>Sammle Preisgelder in der Order of Merit Rangliste</p>
          </div>
        </div>
      </div>
    </div>
  );
}
