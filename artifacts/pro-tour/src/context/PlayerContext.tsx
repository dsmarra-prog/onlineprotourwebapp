import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiFetch } from "@/lib/api";

export type CurrentPlayer = {
  id: number;
  name: string;
  autodarts_username: string;
  is_admin: boolean;
  avatar_url?: string | null;
};

type PlayerContextType = {
  currentPlayer: CurrentPlayer | null;
  sessionPin: string;
  showTutorial: boolean;
  dismissTutorial: () => void;
  login: (autodarts_username: string, pin: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

const STORAGE_KEY = "opt_player";
const PIN_KEY = "opt_pin";
const tutorialKey = (id: number) => `opt_tutorial_seen_${id}`;

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentPlayer, setCurrentPlayer] = useState<CurrentPlayer | null>(null);
  const [sessionPin, setSessionPin] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [pinReentry, setPinReentry] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedPin = localStorage.getItem(PIN_KEY);
      if (stored) {
        const player = JSON.parse(stored) as CurrentPlayer;
        setCurrentPlayer(player);
        if (storedPin) {
          setSessionPin(storedPin);
        } else {
          setPinReentry(true);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PIN_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = async (autodarts_username: string, pin: string) => {
    const player = await apiFetch<CurrentPlayer>("/tour/players/login", {
      method: "POST",
      body: JSON.stringify({ autodarts_username, pin }),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
    localStorage.setItem(PIN_KEY, pin);
    setCurrentPlayer(player);
    setSessionPin(pin);
    setPinReentry(false);
    if (!localStorage.getItem(tutorialKey(player.id))) {
      setShowTutorial(true);
    }
  };

  const handlePinReentry = async () => {
    if (!currentPlayer || !pinInput.trim()) return;
    setPinLoading(true);
    setPinError("");
    try {
      await login(currentPlayer.autodarts_username, pinInput.trim());
      setPinInput("");
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("nicht gefunden") || msg.includes("not found")) {
        setPinError("Spieler nicht gefunden. Bitte melde dich neu an.");
      } else if (msg.includes("PIN") || msg.includes("Falscher")) {
        setPinError("Falscher PIN. Bitte erneut versuchen.");
      } else {
        setPinError(msg || "Fehler beim Anmelden. Bitte erneut versuchen.");
      }
    } finally {
      setPinLoading(false);
    }
  };

  const dismissTutorial = () => {
    if (currentPlayer) {
      localStorage.setItem(tutorialKey(currentPlayer.id), "1");
    }
    setShowTutorial(false);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PIN_KEY);
    setCurrentPlayer(null);
    setSessionPin("");
    setShowTutorial(false);
    setPinReentry(false);
    setPinInput("");
    setPinError("");
  };

  return (
    <PlayerContext.Provider value={{ currentPlayer, sessionPin, showTutorial, dismissTutorial, login, logout, isLoading }}>
      {children}
      {pinReentry && currentPlayer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <p className="text-lg font-bold">PIN erforderlich</p>
              <p className="text-sm text-muted-foreground">
                Willkommen zurück, <span className="font-semibold text-foreground">{currentPlayer.name}</span>!<br />
                Bitte gib deinen PIN zur Bestätigung ein.
              </p>
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              placeholder="PIN eingeben"
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value); setPinError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handlePinReentry()}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-center text-xl tracking-widest font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              autoFocus
            />
            {pinError && <p className="text-sm text-destructive text-center">{pinError}</p>}
            <div className="flex gap-2">
              <button
                onClick={logout}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-accent transition-colors"
              >
                Abmelden
              </button>
              <button
                onClick={handlePinReentry}
                disabled={pinLoading || !pinInput.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {pinLoading ? "Prüfen…" : "Bestätigen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer muss innerhalb von PlayerProvider verwendet werden");
  return ctx;
}
