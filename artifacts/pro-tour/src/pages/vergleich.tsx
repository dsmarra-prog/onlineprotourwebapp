import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Swords, Loader2, TrendingUp, Target, Trophy, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch, TourPlayer, TourPlayerProfile, TourH2H, RUNDE_LABELS } from "@/lib/api";

function StatRow({ label, v1, v2, higherBetter = true }: { label: string; v1: number | null; v2: number | null; higherBetter?: boolean }) {
  const fmt = (v: number | null) => (v == null ? "—" : v % 1 === 0 ? v.toString() : v.toFixed(1));
  const p1Wins = v1 != null && v2 != null && (higherBetter ? v1 > v2 : v1 < v2);
  const p2Wins = v1 != null && v2 != null && (higherBetter ? v2 > v1 : v2 < v1);

  return (
    <div className="grid grid-cols-3 items-center py-2 border-b border-border last:border-0">
      <div className={`text-sm font-bold text-right pr-2 ${p1Wins ? "text-primary" : "text-muted-foreground"}`}>
        {fmt(v1)}
        {p1Wins && <span className="ml-1 text-[10px]">●</span>}
      </div>
      <div className="text-xs text-muted-foreground text-center px-1">{label}</div>
      <div className={`text-sm font-bold text-left pl-2 ${p2Wins ? "text-primary" : "text-muted-foreground"}`}>
        {p2Wins && <span className="mr-1 text-[10px]">●</span>}
        {fmt(v2)}
      </div>
    </div>
  );
}

export default function VergleichPage() {
  const [player1Id, setPlayer1Id] = useState<string>("");
  const [player2Id, setPlayer2Id] = useState<string>("");

  const { data: allPlayers = [] } = useQuery<TourPlayer[]>({
    queryKey: ["players"],
    queryFn: () => apiFetch("/tour/players"),
  });

  const { data: profile1, isLoading: loading1 } = useQuery<TourPlayerProfile>({
    queryKey: ["player-profile", player1Id],
    queryFn: () => apiFetch(`/tour/players/${player1Id}`),
    enabled: !!player1Id,
  });

  const { data: profile2, isLoading: loading2 } = useQuery<TourPlayerProfile>({
    queryKey: ["player-profile", player2Id],
    queryFn: () => apiFetch(`/tour/players/${player2Id}`),
    enabled: !!player2Id,
  });

  const { data: h2h, isLoading: h2hLoading } = useQuery<TourH2H>({
    queryKey: ["h2h", player1Id, player2Id],
    queryFn: () => apiFetch(`/tour/players/${player1Id}/h2h/${player2Id}`),
    enabled: !!player1Id && !!player2Id && player1Id !== player2Id,
  });

  const p1Name = profile1?.name ?? allPlayers.find((p) => p.id.toString() === player1Id)?.name ?? "Spieler 1";
  const p2Name = profile2?.name ?? allPlayers.find((p) => p.id.toString() === player2Id)?.name ?? "Spieler 2";

  const bothSelected = !!player1Id && !!player2Id && player1Id !== player2Id;
  const isLoading = loading1 || loading2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" /> Spieler-Vergleich
          </h1>
          <p className="text-xs text-muted-foreground">Zwei Spieler direkt gegenüberstellen</p>
        </div>
      </div>

      {/* Player selectors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Spieler 1</p>
          <Select value={player1Id} onValueChange={setPlayer1Id}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Wählen…" />
            </SelectTrigger>
            <SelectContent>
              {allPlayers.filter((p) => p.id.toString() !== player2Id).map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Spieler 2</p>
          <Select value={player2Id} onValueChange={setPlayer2Id}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Wählen…" />
            </SelectTrigger>
            <SelectContent>
              {allPlayers.filter((p) => p.id.toString() !== player1Id).map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!bothSelected && (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          <Swords className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Wähle zwei Spieler um ihren direkten Vergleich zu sehen</p>
        </div>
      )}

      {bothSelected && isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {bothSelected && !isLoading && profile1 && profile2 && (
        <>
          {/* Player headers */}
          <div className="grid grid-cols-2 gap-3">
            {[{ p: profile1, id: player1Id }, { p: profile2, id: player2Id }].map(({ p, id }) => (
              <Link key={id} href={`/spieler/${id}`}>
                <div className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-black text-primary mx-auto mb-2">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-bold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">@{p.autodarts_username}</p>
                  <p className="text-xs text-primary mt-1">{p.oom_points} OOM-Pkt.</p>
                </div>
              </Link>
            ))}
          </div>

          {/* H2H summary */}
          {h2h && (h2h.wins > 0 || h2h.losses > 0) && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Swords className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Head-to-Head</h2>
              </div>
              <div className="grid grid-cols-3 items-center text-center mb-4">
                <div>
                  <p className="text-3xl font-black text-primary">{h2h.wins}</p>
                  <p className="text-xs text-muted-foreground">{p1Name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Siege</p>
                  <div className="flex justify-center mt-1">
                    <div className="h-1.5 bg-primary rounded-l-full" style={{ width: `${(h2h.wins / (h2h.wins + h2h.losses)) * 60}px` }} />
                    <div className="h-1.5 bg-blue-400 rounded-r-full" style={{ width: `${(h2h.losses / (h2h.wins + h2h.losses)) * 60}px` }} />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-black text-blue-400">{h2h.losses}</p>
                  <p className="text-xs text-muted-foreground">{p2Name}</p>
                </div>
              </div>

              {/* Match history */}
              {h2h.history.length > 0 && (
                <div className="space-y-1.5 mt-3">
                  {h2h.history.slice(0, 5).map((m) => (
                    <div key={m.match_id} className="flex items-center gap-2 text-xs py-1 border-b border-border last:border-0">
                      <span className={`font-bold ${m.won ? "text-primary" : "text-blue-400"}`}>{m.won ? `✓ ${p1Name}` : `✓ ${p2Name}`}</span>
                      <span className="text-muted-foreground">{m.my_score}:{m.opp_score}</span>
                      <span className="text-muted-foreground flex-1 truncate">{m.tournament_name}</span>
                      <span className="text-muted-foreground shrink-0">{RUNDE_LABELS[m.runde] ?? m.runde}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats comparison */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Statistik-Vergleich</h2>
            </div>
            {/* Column headers */}
            <div className="grid grid-cols-3 text-xs text-muted-foreground mb-2 px-1">
              <div className="text-right pr-2 truncate">{p1Name}</div>
              <div className="text-center"></div>
              <div className="text-left pl-2 truncate">{p2Name}</div>
            </div>

            <StatRow label="OOM Punkte" v1={profile1.oom_points} v2={profile2.oom_points} />
            <StatRow label="Turniere" v1={profile1.stats.tournaments_played} v2={profile2.stats.tournaments_played} />
            <StatRow label="Titel" v1={profile1.stats.titles} v2={profile2.stats.titles} />
            <StatRow label="Siege" v1={profile1.stats.matches_won} v2={profile2.stats.matches_won} />
            <StatRow label="Niederlagen" v1={profile1.stats.matches_lost} v2={profile2.stats.matches_lost} />
            <StatRow label="Siegquote %" v1={profile1.stats.win_rate} v2={profile2.stats.win_rate} />
            <StatRow label="Avg" v1={profile1.stats.avg_score} v2={profile2.stats.avg_score} />
            <StatRow label="First 9 Avg" v1={profile1.stats.first9_avg} v2={profile2.stats.first9_avg} />
            <StatRow label="Double Rate %" v1={profile1.stats.double_rate} v2={profile2.stats.double_rate} />
            <StatRow label="Doppel getroffen" v1={profile1.stats.doubles_hit} v2={profile2.stats.doubles_hit} />
          </div>

          {/* Links to profiles */}
          <div className="grid grid-cols-2 gap-3">
            <Link href={`/spieler/${player1Id}`}>
              <div className="bg-card border border-border rounded-xl p-3 text-center text-sm text-primary hover:bg-primary/5 transition-colors">
                Profil {p1Name}
              </div>
            </Link>
            <Link href={`/spieler/${player2Id}`}>
              <div className="bg-card border border-border rounded-xl p-3 text-center text-sm text-primary hover:bg-primary/5 transition-colors">
                Profil {p2Name}
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
