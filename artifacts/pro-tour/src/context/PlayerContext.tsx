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
const tutorialKey = (id: number) => `opt_tutorial_seen_${id}`;

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentPlayer, setCurrentPlayer] = useState<CurrentPlayer | null>(null);
  const [sessionPin, setSessionPin] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCurrentPlayer(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = async (autodarts_username: string, pin: string) => {
    const player = await apiFetch<CurrentPlayer>("/tour/players/login", {
      method: "POST",
      body: JSON.stringify({ autodarts_username, pin }),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
    setCurrentPlayer(player);
    setSessionPin(pin);
    if (!localStorage.getItem(tutorialKey(player.id))) {
      setShowTutorial(true);
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
    setCurrentPlayer(null);
    setSessionPin("");
    setShowTutorial(false);
  };

  return (
    <PlayerContext.Provider value={{ currentPlayer, sessionPin, showTutorial, dismissTutorial, login, logout, isLoading }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer muss innerhalb von PlayerProvider verwendet werden");
  return ctx;
}
