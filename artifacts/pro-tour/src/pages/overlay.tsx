import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { apiFetch } from "@/lib/api";

type OverlayData = {
  id: number;
  tournament_name: string;
  runde: string;
  legs_format: string;
  player1_name: string;
  player2_name: string;
  player1_avatar: string | null;
  player2_avatar: string | null;
  score_p1: number;
  score_p2: number;
  avg_p1: number | null;
  avg_p2: number | null;
  count_180s_p1: number | null;
  count_180s_p2: number | null;
  high_checkout_p1: number | null;
  high_checkout_p2: number | null;
  status: string;
  winner_id: number | null;
};

function PlayerPanel({
  name,
  avatar,
  score,
  avg,
  count180s,
  highCheckout,
  isWinner,
  isLeading,
  side,
}: {
  name: string;
  avatar: string | null;
  score: number;
  avg: number | null;
  count180s: number | null;
  highCheckout: number | null;
  isWinner: boolean;
  isLeading: boolean;
  side: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 flex-1 transition-all duration-700 ${
        isWinner ? "opacity-100" : isLeading ? "opacity-95" : "opacity-70"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-20 h-20 rounded-full overflow-hidden border-4 transition-all duration-500 shadow-lg ${
          isWinner
            ? "border-yellow-400 shadow-yellow-400/40"
            : isLeading
            ? "border-cyan-400 shadow-cyan-400/30"
            : "border-white/20"
        }`}
      >
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-white/10 flex items-center justify-center text-3xl font-bold text-white/60">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name */}
      <div
        className={`text-center font-bold tracking-wide drop-shadow-lg ${
          isWinner ? "text-yellow-300 text-2xl" : "text-white text-xl"
        }`}
        style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
      >
        {name}
      </div>

      {/* Score */}
      <div
        className={`font-black tabular-nums transition-all duration-300 drop-shadow-2xl ${
          isWinner
            ? "text-yellow-300 text-[7rem] leading-none"
            : isLeading
            ? "text-cyan-300 text-[7rem] leading-none"
            : "text-white/80 text-[7rem] leading-none"
        }`}
        style={{ textShadow: "0 4px 20px rgba(0,0,0,0.9)" }}
      >
        {score}
      </div>

      {/* Stats row */}
      {(avg !== null || count180s !== null || highCheckout !== null) && (
        <div className="flex items-center gap-3 mt-1">
          {avg !== null && (
            <div className="flex flex-col items-center bg-black/50 rounded-lg px-3 py-1.5 border border-white/10">
              <span className="text-[10px] text-white/50 uppercase tracking-widest">Avg</span>
              <span className="text-sm font-bold text-cyan-300">{avg.toFixed(1)}</span>
            </div>
          )}
          {count180s !== null && count180s > 0 && (
            <div className="flex flex-col items-center bg-black/50 rounded-lg px-3 py-1.5 border border-white/10">
              <span className="text-[10px] text-white/50 uppercase tracking-widest">180s</span>
              <span className="text-sm font-bold text-pink-400">{count180s}</span>
            </div>
          )}
          {highCheckout !== null && highCheckout > 0 && (
            <div className="flex flex-col items-center bg-black/50 rounded-lg px-3 py-1.5 border border-white/10">
              <span className="text-[10px] text-white/50 uppercase tracking-widest">HiCo</span>
              <span className="text-sm font-bold text-green-400">{highCheckout}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OverlayPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;

  const [data, setData] = useState<OverlayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prevScores, setPrevScores] = useState<[number, number]>([0, 0]);
  const [flash, setFlash] = useState<"p1" | "p2" | null>(null);

  // Make body transparent for OBS browser-source
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";
    return () => {
      document.body.style.background = prev;
      document.documentElement.style.background = "";
    };
  }, []);

  const fetchData = async () => {
    try {
      const d = await apiFetch<OverlayData>(`/tour/matches/${matchId}/overlay`);
      setData((prev) => {
        if (prev) {
          if (d.score_p1 > prev.score_p1) { setFlash("p1"); setTimeout(() => setFlash(null), 1200); }
          if (d.score_p2 > prev.score_p2) { setFlash("p2"); setTimeout(() => setFlash(null), 1200); }
          setPrevScores([prev.score_p1, prev.score_p2]);
        }
        return d;
      });
      setError(null);
    } catch {
      setError("Match nicht gefunden");
    }
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 5000);
    return () => clearInterval(iv);
  }, [matchId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <p className="text-white/50 text-sm font-mono">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isFinished = data.status === "abgeschlossen";
  const p1Leading = data.score_p1 > data.score_p2;
  const p2Leading = data.score_p2 > data.score_p1;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "transparent" }}
    >
      {/* Tournament + round header */}
      <div className="flex justify-center pt-6 pb-2">
        <div
          className="flex items-center gap-3 px-5 py-2 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{
            background: "rgba(0,0,0,0.65)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(8px)",
            color: "rgba(255,255,255,0.7)",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
          }}
        >
          <span>{data.tournament_name}</span>
          <span className="text-white/30">·</span>
          <span>{data.runde}</span>
          <span className="text-white/30">·</span>
          <span>{data.legs_format}</span>
        </div>
      </div>

      {/* Score area */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="flex items-center gap-6 w-full max-w-3xl">
          {/* Player 1 */}
          <div className={`transition-all duration-300 ${flash === "p1" ? "scale-105" : ""} flex-1`}>
            <PlayerPanel
              name={data.player1_name}
              avatar={data.player1_avatar}
              score={data.score_p1}
              avg={data.avg_p1}
              count180s={data.count_180s_p1}
              highCheckout={data.high_checkout_p1}
              isWinner={isFinished && data.winner_id !== null && data.player1_name !== "TBD" && data.score_p1 > data.score_p2}
              isLeading={!isFinished && p1Leading}
              side="left"
            />
          </div>

          {/* VS divider */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div
              className="text-2xl font-black tracking-widest"
              style={{
                color: "rgba(255,255,255,0.4)",
                textShadow: "0 2px 8px rgba(0,0,0,0.8)",
              }}
            >
              VS
            </div>
            {isFinished && (
              <div
                className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(250,204,21,0.15)",
                  border: "1px solid rgba(250,204,21,0.3)",
                  color: "rgba(250,204,21,0.9)",
                }}
              >
                Abgeschlossen
              </div>
            )}
          </div>

          {/* Player 2 */}
          <div className={`transition-all duration-300 ${flash === "p2" ? "scale-105" : ""} flex-1`}>
            <PlayerPanel
              name={data.player2_name}
              avatar={data.player2_avatar}
              score={data.score_p2}
              avg={data.avg_p2}
              count180s={data.count_180s_p2}
              highCheckout={data.high_checkout_p2}
              isWinner={isFinished && data.winner_id !== null && data.score_p2 > data.score_p1}
              isLeading={!isFinished && p2Leading}
              side="right"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
