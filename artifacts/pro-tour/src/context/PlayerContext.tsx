import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiFetch } from "@/lib/api";

export type CurrentPlayer = {
  id: number;
  name: string;
  autodarts_username: string;
  is_admin: boolean;
};

type PlayerContextType = {
  currentPlayer: CurrentPlayer | null;
  login: (autodarts_username: string, pin: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

const STORAGE_KEY = "opt_player";

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentPlayer, setCurrentPlayer] = useState<CurrentPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentPlayer(null);
  };

  return (
    <PlayerContext.Provider value={{ currentPlayer, login, logout, isLoading }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer muss innerhalb von PlayerProvider verwendet werden");
  return ctx;
}
