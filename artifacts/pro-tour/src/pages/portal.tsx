import { useState } from "react";
import { Target, UserPlus, LogIn, Loader2, CheckCircle, Eye, EyeOff, ScrollText, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePlayer } from "@/context/PlayerContext";
import { apiFetch, TourPlayer } from "@/lib/api";

type Mode = "login" | "register";

const RULES_SECTIONS = [
    {
      title: '§1 Allgemeines & Geltungsbereich',
      items: [
        { label: 'Ziel', text: 'Die Autodarts Pro Tour (nachfolgend „Tour“ genannt) ist eine Online-Dartstour, die an die originale PDC Tour angelehnt ist und unter Fairplay-Bedingungen simulieren soll.' },
        { label: 'Akzeptanz', text: 'Mit der Anmeldung zu einem Turnier akzeptiert jeder Spieler dieses Regelwerk vollumfänglich.' },
        { label: 'Fairplay', text: 'Unsportliches Verhalten, Beleidigungen im Chat oder Betrugsversuche führen zum sofortigen Ausschluss (Disqualifikation) und ggf. zu einer dauerhaften Sperre.' },
        { label: 'Turnierleitung', text: 'Den Anweisungen der Admins ist jederzeit Folge zu leisten. In Streitfällen, die nicht durch dieses Regelwerk abgedeckt sind, trifft die Turnierleitung eine endgültige Tatsachenentscheidung.' },
      ],
    },
    {
      title: '§2 Teilnahmevoraussetzungen & Technik',
      items: [
        { label: 'Hardware', text: 'Gespielt wird auf einem Standard-Steel-Dartboard (Sisal). Ein funktionierendes Autodarts-System ist Pflicht. Die Spieler haben sicherzustellen, dass dieses zum Start des Turniers funktionstüchtig ist.' },
        { label: 'Software & Accounts', text: 'Gespielt wird über die Plattform Autodarts.io. Jeder Spieler benötigt einen Discord-Account. WICHTIG: Der Nickname auf Discord muss identisch mit dem Nickname auf Autodarts.io sein (oder diesen im Namen enthalten), um eine klare Zuordnung in der Rangliste zu gewährleisten.' },
        { label: 'Internetverbindung', text: 'Der Spieler ist für eine stabile Internetverbindung verantwortlich.' },
      ],
    },
    {
      title: '§3 Turnierablauf & Anmeldung',
      items: [
        { label: 'Check-In', text: 'Für jedes Turnier gibt es eine Check-In-Phase (meist 30 Minuten vor Start). Wer nicht eincheckt, wird aus dem Turnierbaum entfernt.' },
        { label: 'Turnierbaum (Bracket)', text: 'Der Turnierbaum wird über Discord veröffentlicht.' },
        { label: 'Wartezeiten', text: 'Nach Freigabe der Runde haben die Spieler 10 Minuten Zeit, ihr Match zu beginnen. Erscheint ein Gegner nicht, ist dies im Channel des Turnieres zu melden. Nach Ablauf der Frist gewinnt der anwesende Spieler per Walkover (Def Win).' },
      ],
    },
    {
      title: '§4 Das Match (Spielregeln)',
      items: [
        { label: 'Lobby-Erstellung', text: 'Der im Bracket oben stehende Spieler eröffnet die Lobby auf Autodarts und teilt den Link im Channel #match-links oder per DM an den Gegner.' },
        { label: 'Ausbullen', text: 'Um zu entscheiden, wer das Match beginnt, wird auf das Bullseye geworfen. Der Spieler, der die Lobby erstellt hat, wirft zuerst. Wer näher am Zentrum ist, beginnt das Match. Bei Gleichstand (25-25 oder 50-50) wird die Reihenfolge getauscht und erneut geworfen.' },
        { label: 'Spielmodus', text: 'Gespielt wird 501 Double Out. Die Distanz (Best of X Legs) wird in der Turnierankündigung festgelegt.' },
      ],
    },
    {
      title: '§5 Scoring & Autodarts-Besonderheiten',
      items: [
        { label: 'Score-Kontrolle', text: 'Der Spieler ist verpflichtet, den von der Software angezeigten Score zu prüfen, bevor er die Pfeile aus dem Board zieht.' },
        { label: 'Korrektur', text: 'Zählt das System falsch? Pfeile stecken lassen! Den Score in der Software/App manuell korrigieren. Erst dann die Pfeile ziehen. Wurden die Pfeile bereits gezogen und der Score ist falsch, gilt das, was das System anzeigt (Tatsachenentscheidung) - es sei denn, der Gegner stimmt einer Korrektur fairerweise zu.' },
        { label: 'Bounce-Outs / Robin Hoods', text: 'Pfeile, die aus dem Board fallen oder in einem anderen Pfeil stecken, zählen 0 Punkte, auch wenn die Kamera sie kurzzeitig erfasst hat. Der Score muss manuell auf den korrekten Wert korrigiert werden (zählen dürfen nur Pfeile, die im Board stecken).' },
      ],
    },
    {
      title: '§6 Verbindungsabbrüche & Störungen',
      items: [
        { label: 'Lag / Video-Probleme', text: 'Ist das Bild des Gegners eingefroren (Frozen Cam), ist das Spiel sofort zu pausieren - nicht weiterwerfen - und der Gegner über Discord/Voice zu informieren.' },
        { label: 'Disconnect', text: 'Verliert ein Spieler die Verbindung, wird das Spiel pausiert. Der Spieler hat 5 Minuten Zeit, die Verbindung wiederherzustellen. Gelingt dies nicht, wird das Match als Niederlage gewertet. Der aktuelle Spielstand wird dabei berücksichtigt (bei Gruppenphasen wichtig für die Leg-Differenz).' },
      ],
    },
    {
      title: '§7 Ergebnismeldung',
      items: [
        { label: 'Siegerpflicht', text: 'Der Gewinner des Matches ist verantwortlich für die Meldung des Ergebnisses.' },
        { label: 'Format', text: 'Das Ergebnis ist im entsprechenden Channel zu posten. Format: [Sieger Name] [Score] [Verlierer Name]. Optional aber erwünscht: Link zu den Match-Stats.' },
        { label: 'Rangliste (Order of Merit)', text: 'Die Punkte werden in der Regel innerhalb von 24 Stunden nach Turnierende in die Order of Merit eingetragen.' },
      ],
    },
    {
      title: '§8 Order of Merit (Platzierungskriterien)',
      items: [
        { label: 'Gesamtpunktzahl', text: 'Zunächst ist die reine Summe aller in der Saison/Serie gesammelten Punkte ausschlaggebend.' },
        { label: 'Anzahl der gespielten Turniere', text: 'Herrscht Punktgleichheit, entscheidet die Anzahl der Turnierteilnahmen (wer an mehr Turnieren teilgenommen hat, wird bevorzugt).' },
        { label: 'Bestleistung', text: 'Ist auch die Anzahl der Turniere identisch, zählt das beste Einzelergebnis in einem Turnier (High-Score der Platzierung).' },
        { label: 'Entscheidungsmatch', text: 'Sollte nach Anwendung aller vorherigen Kriterien immer noch absoluter Gleichstand herrschen, wird ein direktes Entscheidungsspiel im Modus First to 3 ausgetragen, um die Platzierung zu ermitteln.' },
      ],
    },
];

function RulesOverlay({
  onAccept,
  onDecline,
  loading,
}: {
  onAccept: () => void;
  onDecline: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <ScrollText className="w-5 h-5 text-primary shrink-0" />
        <div>
          <h2 className="font-bold text-sm">Regelwerk der Online Pro Tour</h2>
          <p className="text-xs text-muted-foreground">Bitte lies die Regeln sorgfältig und akzeptiere sie, um dich zu registrieren.</p>
        </div>
      </div>

      {/* Scrollable rules content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {RULES_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-3">
            <h3 className="font-bold text-sm text-primary border-b border-primary/20 pb-1.5">
              {section.title}
            </h3>
            <div className="space-y-2.5">
              {section.items.map((item) => (
                <div key={item.label} className="bg-card border border-border/60 rounded-lg px-3 py-2.5">
                  <div className="text-xs font-semibold text-foreground mb-0.5">{item.label}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Bottom padding so content isn't hidden behind the action bar */}
        <div className="h-4" />
      </div>

      {/* Fixed action bar */}
      <div className="shrink-0 px-4 py-4 border-t border-border bg-card/90 backdrop-blur-sm space-y-2">
        <p className="text-xs text-muted-foreground text-center">
          Mit &quot;Akzeptieren&quot; bestätigst du, dass du diese Regeln gelesen hast und ihnen zustimmst.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDecline}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Ablehnen
          </button>
          <button
            onClick={onAccept}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-black text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {loading ? "Wird registriert…" : "Akzeptieren & registrieren"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Portal() {
  const { login } = usePlayer();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("login");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState<{ name: string } | null>(null);
  const [showRules, setShowRules] = useState(false);

  const [loginForm, setLoginForm] = useState({ autodarts_username: "", pin: "" });
  const [regForm, setRegForm] = useState({ name: "", autodarts_username: "", oom_name: "", pin: "", pin_confirm: "" });

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

  const handleRegisterFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (regForm.pin !== regForm.pin_confirm) {
      toast({ title: "PINs stimmen nicht überein", variant: "destructive" });
      return;
    }
    setShowRules(true);
  };

  const doRegister = async () => {
    setLoading(true);
    try {
      const player = await apiFetch<TourPlayer>("/tour/players/register", {
        method: "POST",
        body: JSON.stringify({
          name: regForm.name.trim(),
          autodarts_username: regForm.autodarts_username.trim(),
          oom_name: regForm.oom_name.trim() || undefined,
          pin: regForm.pin,
        }),
      });
      setShowRules(false);
      setRegistered({ name: player.name });
      toast({ title: "Registrierung erfolgreich!", description: `Willkommen, ${player.name}! Du kannst dich jetzt einloggen.` });
      setMode("login");
      setLoginForm({ autodarts_username: regForm.autodarts_username.trim(), pin: "" });
      setRegForm({ name: "", autodarts_username: "", oom_name: "", pin: "", pin_confirm: "" });
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
    <>
      {/* Rules overlay — shown after form submit, before API call */}
      {showRules && (
        <RulesOverlay
          onAccept={doRegister}
          onDecline={() => setShowRules(false)}
          loading={loading}
        />
      )}

      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center mb-2">
              <img
                src="/pro-tour/opt-logo.png"
                alt="Online Pro Tour"
                className="w-44 h-44 object-contain drop-shadow-2xl"
              />
            </div>
            <p className="text-muted-foreground text-sm">Echtzeit-Dart-Turnierplattform</p>
          </div>

          {/* Success guide after registration */}
          {registered && (
            <div className="bg-card border border-primary/30 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span className="font-semibold">Willkommen, {registered.name}! 🎯</span>
              </div>
              <p className="text-xs text-muted-foreground">Registrierung erfolgreich. Bitte logge dich ein und verbinde dann dein Autodarts-Konto — so wird dein Spielername automatisch erkannt.</p>

              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Autodarts verbinden — Schritt für Schritt</p>
                {[
                  {
                    step: 1,
                    title: "Einloggen & Einstellungen öffnen",
                    desc: "Nach dem Login oben rechts auf dein Profilbild oder \"Einstellungen\" klicken.",
                  },
                  {
                    step: 2,
                    title: "Autodarts-Seite öffnen",
                    desc: "Öffne play.autodarts.io in einem neuen Tab und logge dich dort mit deinem Autodarts-Konto ein.",
                  },
                  {
                    step: 3,
                    title: "Entwicklerkonsole öffnen",
                    desc: "Drücke F12 (oder Rechtsklick → Untersuchen). Gehe auf den Tab \"Application\" (Chrome) oder \"Speicher\" (Firefox).",
                  },
                  {
                    step: 4,
                    title: "Refresh-Token kopieren",
                    desc: "Klicke links auf \"Local Storage\" → \"https://play.autodarts.io\" → suche den Eintrag \"kc-token\" oder \"refresh_token\". Kopiere den langen Wert.",
                  },
                  {
                    step: 5,
                    title: "In Einstellungen einfügen",
                    desc: "Füge den kopierten Token in das Feld \"Eigenes Autodarts-Konto verbinden\" ein und bestätige mit deinem PIN.",
                  },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      {step}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground/60 italic">Diese Verbindung ist optional, aber empfohlen — sie ermöglicht das automatische Erkennen deiner Matches.</p>
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
                <form onSubmit={handleRegisterFormSubmit} className="space-y-4">
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
                    <Label className="flex items-center gap-1.5">
                      OOM-Name <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input
                      value={regForm.oom_name}
                      onChange={(e) => setRegForm((f) => ({ ...f, oom_name: e.target.value }))}
                      placeholder="Nur wenn abweichend von Anzeigename"
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">Name auf der Order of Merit — nur ausfüllen wenn er sich von deinem Anzeigenamen unterscheidet</p>
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
                    <><UserPlus className="w-4 h-4 mr-2" /> Weiter zum Regelwerk</>
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
    </>
  );
}
