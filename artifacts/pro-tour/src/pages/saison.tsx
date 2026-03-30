import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Trophy, Medal, Target, TrendingUp, Star, Calendar, Users, Loader2, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";

type OomEntry = {
  rank: number;
  autodarts_username: string;
  display_name: string | null;
  total_points: number;
  bonus_points: number;
  tournaments_played: number;
  breakdown: { t: string; p: number }[];
};

type LeaderboardEntry = {
  player_id: number;
  player_name: string;
  value: number;
  count?: number;
};

type LeaderboardData = {
  avgBoard: LeaderboardEntry[];
  s180Board: LeaderboardEntry[];
  checkoutBoard: LeaderboardEntry[];
};

type TournamentData = {
  id: number;
  name: string;
  typ: string;
  datum: string;
  status: string;
  tour_type: string;
  max_players: number;
  player_count: number;
};

const MEDAL_COLORS = ["text-yellow-400", "text-slate-300", "text-amber-600"];
const MEDAL_BG = ["bg-yellow-400/10 border-yellow-400/20", "bg-slate-400/10 border-slate-400/20", "bg-amber-600/10 border-amber-600/20"];

export default function SaisonPage() {
  const { data: oomData, isLoading: oomLoading } = useQuery<OomEntry[]>({
    queryKey: ["oom"],
    queryFn: () => apiFetch("/tour/oom"),
  });

  const { data: devOomData } = useQuery<OomEntry[]>({
    queryKey: ["dev-oom"],
    queryFn: () => apiFetch("/tour/dev-oom"),
  });

  const { data: leaderboard } = useQuery<LeaderboardData>({
    queryKey: ["leaderboard"],
    queryFn: () => apiFetch("/tour/stats/leaderboard"),
  });

  const { data: tournaments } = useQuery<TournamentData[]>({
    queryKey: ["tournaments"],
    queryFn: () => apiFetch("/tour/tournaments"),
  });

  if (oomLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const proTop3 = (oomData ?? []).slice(0, 3);
  const devTop3 = (devOomData ?? []).slice(0, 3);
  const completedTournaments = (tournaments ?? []).filter((t) => t.status === "abgeschlossen" && !("is_test" in t && t.is_test));
  const proTournaments = completedTournaments.filter((t) => t.tour_type === "pro");
  const devTournaments = completedTournaments.filter((t) => t.tour_type === "development");

  const totalMatches = (oomData ?? []).reduce((sum, p) => sum + p.tournaments_played, 0);
  const totalPlayers = (oomData ?? []).length + (devOomData ?? []).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Saison 2026</h1>
          <p className="text-xs text-muted-foreground">Online Pro Tour · Saisonrückblick</p>
        </div>
      </div>

      {/* Season stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-primary">{completedTournaments.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Turniere gespielt</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-primary">{totalPlayers}</p>
          <p className="text-xs text-muted-foreground mt-1">Aktive Spieler</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-primary">{totalMatches}</p>
          <p className="text-xs text-muted-foreground mt-1">Teilnahmen gesamt</p>
        </div>
      </div>

      {/* Pro Tour Podium */}
      {proTop3.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <h2 className="font-semibold text-sm">Pro Tour – Führungsrunde</h2>
          </div>
          <div className="flex items-end justify-center gap-3 mb-4">
            {[1, 0, 2].map((idx) => {
              const player = proTop3[idx];
              if (!player) return null;
              const rank = idx + 1;
              const heights = ["h-32", "h-24", "h-20"];
              const height = heights[rank - 1];
              return (
                <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                  <div className={`text-xs font-bold ${MEDAL_COLORS[rank - 1]}`}>
                    {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                  </div>
                  <div className="text-xs font-medium text-center leading-tight max-w-[80px]">
                    {player.display_name ?? player.autodarts_username}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{player.total_points} Pkt.</div>
                  <div className={`w-full ${height} border ${MEDAL_BG[rank - 1]} rounded-t-lg flex items-center justify-center`}>
                    <span className={`text-xl font-black ${MEDAL_COLORS[rank - 1]}`}>#{rank}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {proTop3.map((player, i) => (
            <div key={i} className={`flex items-center gap-3 py-2 border-b border-border last:border-0`}>
              <span className={`text-sm font-bold w-6 text-center ${MEDAL_COLORS[i]}`}>#{i + 1}</span>
              <Link href={`/spieler`} className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{player.display_name ?? player.autodarts_username}</p>
                <p className="text-xs text-muted-foreground">@{player.autodarts_username}</p>
              </Link>
              <span className="text-sm font-bold text-primary">{player.total_points}</span>
            </div>
          ))}
        </div>
      )}

      {/* Dev Tour Podium */}
      {devTop3.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-blue-400" />
            <h2 className="font-semibold text-sm">Development Tour – Führungsrunde</h2>
          </div>
          {devTop3.map((player, i) => (
            <div key={i} className={`flex items-center gap-3 py-2 border-b border-border last:border-0`}>
              <span className={`text-sm font-bold w-6 text-center ${MEDAL_COLORS[i]}`}>#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{player.display_name ?? player.autodarts_username}</p>
                <p className="text-xs text-muted-foreground">@{player.autodarts_username}</p>
              </div>
              <span className="text-sm font-bold text-blue-400">{player.total_points}</span>
            </div>
          ))}
        </div>
      )}

      {/* Statistics highlights */}
      {leaderboard && (leaderboard.avgBoard.length > 0 || leaderboard.s180Board.length > 0 || leaderboard.checkoutBoard.length > 0) && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Saison-Highlights</h2>
          </div>

          {leaderboard.avgBoard[0] && (
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="text-xs text-muted-foreground">Bester Average</p>
                <p className="text-sm font-semibold">{leaderboard.avgBoard[0].player_name}</p>
              </div>
              <span className="text-xl font-black text-primary">{leaderboard.avgBoard[0].value.toFixed(1)}</span>
            </div>
          )}

          {leaderboard.s180Board[0] && (
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="text-xs text-muted-foreground">Meiste 180er</p>
                <p className="text-sm font-semibold">{leaderboard.s180Board[0].player_name}</p>
              </div>
              <span className="text-xl font-black text-yellow-400">{leaderboard.s180Board[0].count ?? leaderboard.s180Board[0].value}×</span>
            </div>
          )}

          {leaderboard.checkoutBoard[0] && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Höchster Checkout</p>
                <p className="text-sm font-semibold">{leaderboard.checkoutBoard[0].player_name}</p>
              </div>
              <span className="text-xl font-black text-green-400">{leaderboard.checkoutBoard[0].value}</span>
            </div>
          )}
        </div>
      )}

      {/* Tournament history */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Turnier-Chronik 2026</h2>
        </div>
        <div className="space-y-2">
          {completedTournaments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Noch keine abgeschlossenen Turniere.</p>
          )}
          {completedTournaments.slice(0, 10).map((t) => (
            <Link key={t.id} href={`/turniere/${t.id}`}>
              <div className="flex items-center gap-3 py-2 border-b border-border last:border-0 hover:bg-muted/30 rounded px-1 transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${t.tour_type === "pro" ? "bg-primary" : "bg-blue-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.datum}</p>
                </div>
                <span className="text-xs text-muted-foreground">{t.player_count}/{t.max_players}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/oom">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center hover:bg-primary/15 transition-colors">
            <Trophy className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs font-medium">Pro OOM</p>
          </div>
        </Link>
        <Link href="/spielplan">
          <div className="bg-card border border-border rounded-xl p-4 text-center hover:bg-muted/30 transition-colors">
            <Calendar className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs font-medium">Spielplan</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
