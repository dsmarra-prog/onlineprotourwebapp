import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BarChart3, Target, Zap, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

type LeaderboardEntry = {
  player_id: number;
  name: string;
  autodarts_username: string;
  avg?: number;
  total_180s?: number;
  high_checkout?: number;
};

type Leaderboard = {
  avgBoard: LeaderboardEntry[];
  s180Board: LeaderboardEntry[];
  checkoutBoard: LeaderboardEntry[];
};

const MEDAL = ["🥇", "🥈", "🥉"];

function Board({
  title,
  icon: Icon,
  entries,
  valueKey,
  valueSuffix = "",
  color = "text-primary",
}: {
  title: string;
  icon: any;
  entries: LeaderboardEntry[];
  valueKey: keyof LeaderboardEntry;
  valueSuffix?: string;
  color?: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Icon className={`w-4 h-4 ${color}`} />
          <h2 className="font-semibold text-sm">{title}</h2>
        </div>
        <p className="text-muted-foreground text-sm text-center py-6">
          Noch keine Daten — Matches mit Autodarts-Statistiken werden hier angezeigt
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-4 h-4 ${color}`} />
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="space-y-2">
        {entries.map((e, i) => (
          <Link
            key={e.player_id}
            href={`/spieler/${e.player_id}`}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors"
          >
            <span className="w-7 text-center text-sm font-bold">
              {i < 3 ? MEDAL[i] : <span className="text-muted-foreground">{i + 1}</span>}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{e.name}</p>
              <p className="text-[10px] text-muted-foreground">@{e.autodarts_username}</p>
            </div>
            <span className={`text-sm font-bold tabular-nums ${i === 0 ? color : "text-foreground"}`}>
              {e[valueKey] as number}{valueSuffix}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function StatistikenPage() {
  const { data, isLoading } = useQuery<Leaderboard>({
    queryKey: ["leaderboard"],
    queryFn: () => apiFetch("/tour/stats/leaderboard"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> Bestenlisten
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Top-Spieler nach Average, 180er und Höchst-Checkout
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          <Board
            title="Bester Average (Ø)"
            icon={BarChart3}
            entries={data?.avgBoard ?? []}
            valueKey="avg"
            color="text-primary"
          />
          <Board
            title="Meiste 180er"
            icon={Target}
            entries={data?.s180Board ?? []}
            valueKey="total_180s"
            color="text-red-400"
          />
          <Board
            title="Höchster Checkout"
            icon={Zap}
            entries={data?.checkoutBoard ?? []}
            valueKey="high_checkout"
            color="text-yellow-400"
          />
        </div>
      )}
    </div>
  );
}
