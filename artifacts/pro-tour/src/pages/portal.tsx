import { useState } from "react";
import { Target, UserPlus, LogIn, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePlayer } from "@/context/PlayerContext";
import { apiFetch, TourPlayer } from "@/lib/api";

type Mode = "login" | "register";

export default function Portal() {
  const { login } = usePlayer();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("login");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState<{ name: string } | null>(null);

  const [loginForm, setLoginForm] = useState({ autodarts_username: "", pin: "" });
  const [regForm, setRegForm] = useState({ name: "", autodarts_username: "", pin: "", pin_confirm: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.autodarts_username.trim() || !loginForm.pin) return;
    setLoading(true);
    try {
      await login(loginForm.autodarts_username.trim(), loginForm.pin);
    } catch (err: any) {
      toast({ title: "Anmeldung fehlgeschlagen", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regForm.pin !== regForm.pin_confirm) {
      toast({ title: "PINs stimmen nicht überein", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const player = await apiFetch<TourPlayer>("/tour/players/register", {
        method: "POST",
        body: JSON.stringify({
          name: regForm.name.trim(),
          autodarts_username: regForm.autodarts_username.trim(),
          pin: regForm.pin,
        }),
      });
      setRegistered({ name: player.name });
      toast({ title: "Registrierung erfolgreich!", description: `Willkommen, ${player.name}! Du kannst dich jetzt einloggen.` });
      setMode("login");
      setLoginForm({ autodarts_username: regForm.autodarts_username.trim(), pin: "" });
      setRegForm({ name: "", autodarts_username: "", pin: "", pin_confirm: "" });
    } catch (err: any) {
      toast({ title: "Registrierung fehlgeschlagen", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const pinsMatch = regForm.pin === regForm.pin_confirm;
  const canRegister = regForm.name.trim() && regForm.autodarts_username.trim() && regForm.pin.length >= 4 && pinsMatch;
  const canLogin = loginForm.autodarts_username.trim() && loginForm.pin.length >= 4;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-wide uppercase">Online Pro Tour</h1>
          <p className="text-muted-foreground text-sm">Echtzeit-Dart-Turnierplattform</p>
        </div>

        {/* Success hint after registration */}
        {registered && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-4 py-2.5 text-sm text-primary">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Willkommen, <strong>{registered.name}</strong>! Jetzt einloggen.</span>
          </div>
        )}

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          {/* Tab switcher */}
          <div className="grid grid-cols-2 border-b border-border">
            <button
              onClick={() => setMode("login")}
              className={`py-3 text-sm font-medium transition-colors ${
                mode === "login"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <LogIn className="w-3.5 h-3.5" /> Einloggen
              </span>
            </button>
            <button
              onClick={() => setMode("register")}
              className={`py-3 text-sm font-medium transition-colors ${
                mode === "register"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Registrieren
              </span>
            </button>
          </div>

          <div className="p-6">
            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Autodarts-Benutzername</Label>
                  <Input
                    autoFocus
                    value={loginForm.autodarts_username}
                    onChange={(e) => setLoginForm((f) => ({ ...f, autodarts_username: e.target.value }))}
                    placeholder="dein-username"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>PIN</Label>
                  <div className="relative">
                    <Input
                      type={showPin ? "text" : "password"}
                      value={loginForm.pin}
                      onChange={(e) => setLoginForm((f) => ({ ...f, pin: e.target.value }))}
                      placeholder="••••"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={!canLogin || loading}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Einloggen…</>
                  ) : (
                    <><LogIn className="w-4 h-4 mr-2" /> Einloggen</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Noch kein Account?{" "}
                  <button type="button" onClick={() => setMode("register")} className="text-primary hover:underline">
                    Hier registrieren
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Dein Name</Label>
                  <Input
                    autoFocus
                    value={regForm.name}
                    onChange={(e) => setRegForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Wie heißt du?"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Target className="w-3 h-3" /> Autodarts-Benutzername
                  </Label>
                  <Input
                    value={regForm.autodarts_username}
                    onChange={(e) => setRegForm((f) => ({ ...f, autodarts_username: e.target.value }))}
                    placeholder="Exakt wie in Autodarts"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">Muss exakt mit deinem Autodarts-Account übereinstimmen</p>
                </div>
                <div className="space-y-1.5">
                  <Label>PIN festlegen (mind. 4 Zeichen)</Label>
                  <Input
                    type="password"
                    value={regForm.pin}
                    onChange={(e) => setRegForm((f) => ({ ...f, pin: e.target.value }))}
                    placeholder="••••"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>PIN bestätigen</Label>
                  <Input
                    type="password"
                    value={regForm.pin_confirm}
                    onChange={(e) => setRegForm((f) => ({ ...f, pin_confirm: e.target.value }))}
                    placeholder="••••"
                    disabled={loading}
                    className={regForm.pin_confirm && !pinsMatch ? "border-red-500" : ""}
                  />
                  {regForm.pin_confirm && !pinsMatch && (
                    <p className="text-xs text-red-400">PINs stimmen nicht überein</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={!canRegister || loading}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Registrieren…</>
                  ) : (
                    <><UserPlus className="w-4 h-4 mr-2" /> Account erstellen</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Bereits registriert?{" "}
                  <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline">
                    Einloggen
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Dein PIN wird für Turnieranmeldungen benötigt. Merke ihn dir gut — er kann nicht zurückgesetzt werden.
        </p>
      </div>
    </div>
  );
}
