import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, Loader2, User, Trophy } from "lucide-react";
import { apiFetch, TourPlayer } from "@/lib/api";

export default function SpielerPage() {
  const { data: players, isLoading } = useQuery<TourPlayer[]>({
    queryKey: ["players"],
    queryFn: () => apiFetch("/tour/players"),
  });

  const ranked = players?.filter((p) => p.oom_points > 0) ?? [];
  const unranked = players?.filter((p) => p.oom_points === 0) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Spieler
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Registrierte Online Pro Tour Spieler</p>
      </div>

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
      ) : (
        <div className="space-y-6">
          {ranked.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> OOM-Rangliste
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {ranked.map((p) => (
                  <PlayerCard key={p.id} player={p} />
                ))}
              </div>
            </div>
          )}

          {unranked.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
                Noch nicht platziert
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {unranked.map((p) => (
                  <PlayerCard key={p.id} player={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlayerCard({ player: p }: { player: TourPlayer }) {
  const isRanked = p.oom_points > 0;
  const isPro = p.oom_tour_type === "pro";
  const isDev = p.oom_tour_type === "development";

  return (
    <Link
      href={`/spieler/${p.id}`}
      className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/40 hover:bg-card/80 transition-all"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        {isRanked && p.oom_rank <= 3 ? (
          <span className="text-base font-bold text-primary">
            {p.oom_rank === 1 ? "🥇" : p.oom_rank === 2 ? "🥈" : "🥉"}
          </span>
        ) : (
          <User className="w-5 h-5 text-primary" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{p.name}</p>
        <p className="text-xs text-muted-foreground">@{p.autodarts_username}</p>
      </div>

      <div className="text-right flex flex-col items-end gap-1">
        {isRanked ? (
          <>
            <div className="flex items-center gap-1.5">
              {isPro && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25">
                  PRO
                </span>
              )}
              {isDev && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/25">
                  DEV
                </span>
              )}
              <span className="text-xs text-muted-foreground">#{p.oom_rank}</span>
            </div>
            <p className="font-bold text-sm text-primary">
              {p.oom_points.toLocaleString("de-DE")} Pkt.
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground italic">unplatziert</p>
        )}
      </div>
    </Link>
  );
}
