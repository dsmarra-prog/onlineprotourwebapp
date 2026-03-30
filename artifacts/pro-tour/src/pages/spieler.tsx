import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, Loader2, User, Search, X } from "lucide-react";
import { apiFetch, TourPlayer } from "@/lib/api";

export default function SpielerPage() {
  const [search, setSearch] = useState("");

  const { data: players, isLoading } = useQuery<TourPlayer[]>({
    queryKey: ["players"],
    queryFn: () => apiFetch("/tour/players"),
  });

  const filtered = players?.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.autodarts_username.toLowerCase().includes(q);
  }) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Spieler
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Registrierte Online Pro Tour Spieler</p>
      </div>

      {/* Search */}
      {players && players.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Spieler suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !players?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Noch keine Spieler registriert.</p>
          <Link href="/einstellungen" className="text-primary hover:underline text-sm mt-2 block">
            Jetzt registrieren →
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Kein Spieler gefunden für „{search}"</p>
          <button onClick={() => setSearch("")} className="text-primary hover:underline text-sm mt-2">
            Suche zurücksetzen
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/spieler/${p.id}`}
              className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/40 hover:bg-card/80 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{p.name}</p>
                <p className="text-xs text-muted-foreground">@{p.autodarts_username}</p>
              </div>

              <div className="text-right flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  {p.oom_tour_type === "pro" && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25">
                      PRO
                    </span>
                  )}
                  {p.oom_tour_type === "development" && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/25">
                      DEV
                    </span>
                  )}
                </div>
                {p.oom_points > 0 ? (
                  <p className="font-bold text-sm text-primary">
                    {p.oom_points.toLocaleString("de-DE")} Pkt.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">–</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {search && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {filtered.length} von {players?.length} Spielern
        </p>
      )}
    </div>
  );
}
