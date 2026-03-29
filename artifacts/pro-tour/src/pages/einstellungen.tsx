import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, UserPlus, CheckCircle, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const pinsMatch = form.pin === form.pin_confirm;
  const canRegister = form.name.trim() && form.autodarts_username.trim() && form.pin.length >= 4 && pinsMatch;

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
