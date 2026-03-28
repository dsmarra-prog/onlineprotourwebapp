import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { useGetCareer, useCareerActions } from "@/hooks/use-career";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Zap, Swords, MonitorPlay, Activity, RefreshCw, ChevronLeft,
  CheckCircle2, TrendingUp, Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDartsSounds } from "@/hooks/use-sounds";

// Known real PDC pro players — everyone else is a fictional regional tour player
const PDC_PROS = new Set([
  "Luke Humphries","Michael van Gerwen","Michael Smith","Gerwyn Price","Nathan Aspinall",
  "Luke Littler","Rob Cross","Damon Heta","Dimitri Van den Bergh","Peter Wright",
  "Danny Noppert","Chris Dobey","Jose de Sousa","Jonny Clayton","Gary Anderson",
  "Brendan Dolan","Andrew Gilding","Callan Rydz","Mike De Decker","Dirk van Duijvenbode",
  "Martin Schindler","Josh Rock","Jermaine Wattimena","Ryan Joyce","Joe Cullen",
  "Ryan Searle","Raymond van Barneveld","John Henderson","Krzysztof Ratajski","Dave Chisnall",
  "Mensur Suljovic","James Wade","Kim Huybrechts","Daryl Gurney","Scott Williams",
  "Jim Williams","Jeffrey de Graaf","Mickey Mansell","Karel Sedlacek","Stephen Bunting",
  "Ricky Evans","Kevin Doets","Florian Hempel","Gian van Veen","Ritchie Edhouse",
  "Connor Scutt","Danny van Trijp","Paolo Nebrida","William O'Connor","Wessel Nijman",
  "Ricardo Pietreczko","Matt Campbell","Madars Razma","Bradley Brooks","Luke Woodhouse",
  "Gordon Mathers","Niels Zonneveld","Boris Krcmar","Rowby-John Rodriguez","Keane Barry",
  "Ted Evetts","Ross Smith","Gary Robson","Martin Atkins","Mark Webster",
  "Andy Boulton","Paul Hogan","Andy Hamilton","Adrian Lewis","Terry Jenkins",
  "Dean Winstanley","Colin Osborne","Scott Waites","Kevin Painter","Paul Nicholson",
  "Andy Smith","Noa-Lynn van Leuwen","Fallon Sherrock","Beau Greaves","Glen Durrant",
  "Steve Beaton","Mervyn King","Tony O'Shea","Max Hopp","Corey Cadby",
  "Darius Labanauskas","Ian White","Steve West","Jamie Caven","Robbie Green",
  "Wayne Mardle","Kirk Shepherd","Chris Mason","Paul Lim","Wayne Jones","Colin Lloyd",
]);

function PlayerAvatar({ name, size = 48 }: { name: string; size?: number }) {
  // All players now have human names — use portrait style for everyone
  // PDC pros get a slightly different seed prefix so their avatar is distinct
  const seed = PDC_PROS.has(name) ? `pro_${name}` : name;
  const url = `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0f1923&radius=50`;
  return (
    <img
      src={url}
      alt={name}
      width={size}
      height={size}
      className="rounded-full border-2 border-border object-cover"
      style={{ width: size, height: size }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}

// Inline info card shown when clicking a player name in the bracket
function PlayerInfoCard({
  name,
  info,
  isSelf,
  children,
}: {
  name: string;
  info?: { avg: number; form: string; geld: number; level: number };
  isSelf?: boolean;
  children: React.ReactNode;
}) {
  if (isSelf || !info) return <>{children}</>;

  const levelColor =
    info.level <= 2 ? "text-slate-300 border-slate-500/40 bg-slate-500/10" :
    info.level <= 4 ? "text-yellow-300 border-yellow-500/40 bg-yellow-500/10" :
    info.level <= 6 ? "text-orange-300 border-orange-500/40 bg-orange-500/10" :
    info.level <= 8 ? "text-red-300 border-red-500/40 bg-red-500/10" :
    "text-pink-300 border-pink-500/40 bg-pink-500/10";

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="left"
        align="center"
        sideOffset={8}
        className="w-56 p-0 bg-[#0d1117] border border-border/60 shadow-xl rounded-xl overflow-hidden"
      >
        <div className="border-b border-border/40 px-3 py-2 flex items-center gap-2">
          <PlayerAvatar name={name} size={32} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{name}</p>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${levelColor}`}>
              🎯 Level {info.level}
            </span>
          </div>
        </div>
        <div className="px-3 py-2 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Erwart. Average</span>
            <span className="font-mono font-bold text-white">{info.avg.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tagesform</span>
            <span className="font-medium">{info.form}</span>
          </div>
          {info.geld > 0 && (
            <div className="flex justify-between border-t border-border/40 pt-1.5 mt-1">
              <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" />Saison-Preisgeld</span>
              <span className="font-mono font-bold text-primary">£{info.geld.toLocaleString("en-GB")}</span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Bracket / Turnierbracket Modal ────────────────────────────────────────────

function PastRoundView({ ergebnisse, spieler_name }: { ergebnisse: any[]; spieler_name: string }) {
  const playerMatch = ergebnisse.find((e: any) => e.p1 === spieler_name || e.p2 === spieler_name);
  const otherMatches = ergebnisse.filter((e: any) => e.p1 !== spieler_name && e.p2 !== spieler_name);
  const isP1 = playerMatch?.p1 === spieler_name;

  return (
    <div className="space-y-6 p-4">
      {playerMatch && (
        <div className="bg-primary/10 border border-primary/40 rounded-2xl p-5">
          <p className="text-xs text-primary uppercase tracking-widest font-bold mb-4">Dein Match</p>
          <div className="flex items-center gap-6 justify-center flex-wrap">
            <div className="text-center flex-1 min-w-[80px]">
              <PlayerAvatar name={playerMatch.p1} size={44} />
              <p className={`font-bold text-sm mt-2 truncate ${isP1 ? "text-primary" : "text-white"}`}>{playerMatch.p1}</p>
              {playerMatch.p1_avg !== undefined && (
                <p className="text-xs text-muted-foreground">Avg {playerMatch.p1_avg}</p>
              )}
            </div>
            <div className="text-center shrink-0 px-2">
              <p className="text-3xl font-bold font-mono text-white leading-none">
                {isP1 ? playerMatch.p1_legs : playerMatch.p2_legs}
                <span className="text-muted-foreground mx-1">:</span>
                {isP1 ? playerMatch.p2_legs : playerMatch.p1_legs}
              </p>
              <span className={`text-sm font-bold mt-1 block ${playerMatch.winner === spieler_name ? "text-green-400" : "text-red-400"}`}>
                {playerMatch.winner === spieler_name ? "✓ Sieg" : "✗ Niederlage"}
              </span>
            </div>
            <div className="text-center flex-1 min-w-[80px]">
              <PlayerAvatar name={playerMatch.p2} size={44} />
              <p className={`font-bold text-sm mt-2 truncate ${!isP1 ? "text-primary" : "text-white"}`}>{playerMatch.p2}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-3">
          Alle anderen Spiele ({otherMatches.length})
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
          {otherMatches.map((m: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/20 text-xs border border-border/20">
              <span className={`flex-1 truncate ${m.winner === m.p1 ? "font-semibold text-white" : "text-muted-foreground line-through"}`}>
                {m.p1}
              </span>
              <span className="text-muted-foreground shrink-0 text-[10px] font-mono">vs</span>
              <span className={`flex-1 truncate text-right ${m.winner === m.p2 ? "font-semibold text-white" : "text-muted-foreground line-through"}`}>
                {m.p2}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CurrentRoundView({
  matchups, spieler_name, turnier_bot_info, runden_info,
}: { matchups: any[]; spieler_name: string; turnier_bot_info: any; runden_info: any }) {
  const isSets = runden_info?.format === "sets";
  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-muted-foreground border border-primary/20 bg-primary/5 rounded-xl px-4 py-2">
        Aktuelle Runde — noch nicht gespielt · First to {runden_info?.first_to} {isSets ? "Sätze" : "Legs"}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {matchups.map((matchup: any, idx: number) => {
          const isActive = matchup.player1 === spieler_name || matchup.player2 === spieler_name;
          const info1 = turnier_bot_info?.[matchup.player1];
          const info2 = turnier_bot_info?.[matchup.player2];
          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border ${isActive ? "bg-primary/10 border-primary/60 shadow-[0_0_10px_rgba(0,210,255,0.08)]" : "bg-secondary/20 border-border/40"}`}
            >
              {isActive && <span className="text-[9px] text-primary font-bold uppercase tracking-wider block mb-1">▶ Dein Match</span>}
              <div className="space-y-0.5">
                <p className={`text-xs font-medium truncate ${matchup.player1 === spieler_name ? "text-primary font-bold" : "text-foreground"}`}>
                  {matchup.player1}
                  {info1 && <span className="text-muted-foreground ml-1 font-normal text-[10px]">({Math.round(info1.avg)})</span>}
                </p>
                <span className="text-[9px] text-muted-foreground pl-1 block">vs</span>
                <p className={`text-xs font-medium truncate ${matchup.player2 === spieler_name ? "text-primary font-bold" : "text-foreground"}`}>
                  {matchup.player2}
                  {info2 && <span className="text-muted-foreground ml-1 font-normal text-[10px]">({Math.round(info2.avg)})</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BracketModal({
  spieler_name,
  turnier_runden_log,
  matchups,
  runden_info,
  turnier_bot_info,
}: {
  spieler_name: string;
  turnier_runden_log: any[];
  matchups: any[];
  runden_info: any;
  turnier_bot_info: any;
}) {
  const [open, setOpen] = useState(false);

  const allRunden = [
    ...turnier_runden_log.map((r: any) => ({ ...r, isCurrent: false })),
    ...(matchups.length > 0 ? [{ rundenName: runden_info?.name ?? "Aktuelle Runde", ergebnisse: null, currentMatchups: matchups, isCurrent: true }] : []),
  ];

  if (allRunden.length === 0) return null;

  const defaultTab = String(allRunden.length - 1);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
      >
        <Trophy className="w-4 h-4 mr-2" />
        Vollständiger Bracket
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[88vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-border/60 shrink-0">
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Vollständiger Turnierbracket
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="h-auto rounded-none border-b border-border/60 bg-transparent px-4 py-2 gap-1 flex-wrap justify-start shrink-0 overflow-x-auto">
              {allRunden.map((r, i) => (
                <TabsTrigger
                  key={i}
                  value={String(i)}
                  className="text-xs shrink-0 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  {r.isCurrent ? `▶ ${r.rundenName}` : `R${i + 1}: ${r.rundenName}`}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              {allRunden.map((r, i) => (
                <TabsContent key={i} value={String(i)} className="mt-0 h-full">
                  {!r.isCurrent ? (
                    <PastRoundView ergebnisse={r.ergebnisse} spieler_name={spieler_name} />
                  ) : (
                    <CurrentRoundView
                      matchups={r.currentMatchups}
                      spieler_name={spieler_name}
                      turnier_bot_info={turnier_bot_info}
                      runden_info={runden_info}
                    />
                  )}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────────────

const matchSchema = z.object({
  legs_won: z.coerce.number().min(0),
  legs_lost: z.coerce.number().min(0),
  my_avg: z.coerce.number().optional(),
  my_180s: z.coerce.number().optional(),
  my_hf: z.coerce.number().optional(),
  my_co_pct: z.coerce.number().optional(),
});

type MatchFormValues = z.infer<typeof matchSchema>;

// Draw animation: names being "drawn" from a hat
function DrawAnimation({ players, onDone, onSoundTrigger }: { players: string[]; onDone: () => void; onSoundTrigger?: () => void }) {
  const [revealed, setRevealed] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    onSoundTrigger?.();
    let i = 0;
    const total = Math.min(players.length, 16);
    const timer = setInterval(() => {
      setRevealed((prev) => [...prev, i]);
      i++;
      if (i >= total) {
        clearInterval(timer);
        setTimeout(() => {
          setDone(true);
          setTimeout(onDone, 400);
        }, 800);
      }
    }, 120);
    return () => clearInterval(timer);
  }, []);

  if (done) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-8"
      >
        <div className="text-5xl mb-4">🎲</div>
        <h2 className="text-3xl font-display font-bold text-white uppercase tracking-widest">
          Auslosung läuft...
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 gap-2 max-w-md w-full">
        {players.slice(0, 16).map((name, idx) => (
          <AnimatePresence key={idx}>
            {revealed.includes(idx) && (
              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`px-3 py-2 rounded-lg text-sm font-medium border truncate ${
                  name === players[0]
                    ? "bg-primary/20 border-primary text-primary font-bold"
                    : "bg-secondary/50 border-border/50 text-muted-foreground"
                }`}
              >
                {name}
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>
      {players.length > 16 && (
        <p className="text-muted-foreground text-sm mt-4">+ {players.length - 16} weitere Teilnehmer</p>
      )}
    </motion.div>
  );
}

// Opponent profile card
function GegnerProfil({ career }: { career: any }) {
  const {
    gegner_name, gegner_avg, gegner_form, h2h_siege, h2h_niederlagen,
    gegner_platz, gegner_oom_geld, gegner_bot_level, ist_angstgegner,
  } = career;

  const formEmoji = gegner_form?.form?.split(" ")[0] ?? "➡️";
  const formColor =
    formEmoji === "🔥" ? "text-orange-400" :
    formEmoji === "📈" ? "text-green-400" :
    formEmoji === "❄️" ? "text-blue-400" :
    formEmoji === "📉" ? "text-red-400" : "text-muted-foreground";

  const totalH2H = (h2h_siege ?? 0) + (h2h_niederlagen ?? 0);
  const h2hPct = totalH2H > 0 ? Math.round((h2h_siege / totalH2H) * 100) : null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="shrink-0">
          <PlayerAvatar name={gegner_name} size={52} />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-lg leading-tight">{gegner_name}</h3>
            {ist_angstgegner && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs font-bold px-2 py-0.5 rounded-full border border-red-500/60 bg-red-500/15 text-red-300"
              >
                ⚠️ Angstgegner
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {gegner_platz && (
              <p className="text-sm text-muted-foreground">Platz {gegner_platz}</p>
            )}
            {gegner_bot_level != null && (
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                gegner_bot_level <= 2 ? "border-slate-500/40 bg-slate-500/10 text-slate-300" :
                gegner_bot_level <= 4 ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-300" :
                gegner_bot_level <= 6 ? "border-orange-500/40 bg-orange-500/10 text-orange-300" :
                gegner_bot_level <= 8 ? "border-red-500/40 bg-red-500/10 text-red-300" :
                "border-pink-500/40 bg-pink-500/10 text-pink-300"
              }`}>
                🎯 Autodarts Level {gegner_bot_level}
              </span>
            )}
            {!gegner_platz && !gegner_bot_level && (
              <p className="text-sm text-muted-foreground">Unranked</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-secondary/30 rounded-xl p-3 text-center">
          <p className="text-2xl font-mono font-bold text-white">{gegner_avg}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Erwart. Average</p>
        </div>
        <div className="bg-secondary/30 rounded-xl p-3 text-center">
          <p className={`text-2xl font-bold ${formColor}`}>{formEmoji}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {gegner_form?.form?.split(" ").slice(1).join(" ") || "Normalform"}
          </p>
        </div>
      </div>

      {gegner_oom_geld != null && (
        <div className="flex justify-between text-sm bg-secondary/20 rounded-xl p-3">
          <span className="text-muted-foreground">OoM Preisgeld</span>
          <span className="font-mono font-bold text-primary">£{gegner_oom_geld.toLocaleString("en-GB")}</span>
        </div>
      )}

      <div className="border-t border-border pt-3">
        <p className="text-xs text-muted-foreground mb-2">Head-to-Head Bilanz</p>
        {totalH2H === 0 ? (
          <p className="text-sm text-muted-foreground italic">Noch kein Duell gespielt</p>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-green-400 font-bold">{h2h_siege} Siege</span>
              <span className="text-xs font-mono text-muted-foreground">{h2hPct}% Siegquote</span>
              <span className="text-red-400 font-bold">{h2h_niederlagen} Niederlagen</span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${h2hPct ?? 50}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MatchView() {
  const { data: career, isLoading } = useGetCareer();
  const { submitResult, isSubmitting, pullAutodarts, isPulling } = useCareerActions();
  const [, setLocation] = useLocation();
  const [showDraw, setShowDraw] = useState(false);
  const [drawShown, setDrawShown] = useState(false);
  const { playMatchStart, playDrawAnimation } = useDartsSounds();

  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: { legs_won: 0, legs_lost: 0, my_avg: 0, my_180s: 0, my_hf: 0, my_co_pct: 0 },
  });

  // Show draw animation only on first round of a new tournament
  useEffect(() => {
    if (!isLoading && career && career.turnier_laeuft && !drawShown && career.aktuelle_runde === 0) {
      setShowDraw(true);
      setDrawShown(true);
      playMatchStart();
    } else if (!isLoading && career && career.turnier_laeuft && !drawShown && career.aktuelle_runde > 0) {
      setDrawShown(true);
    }
  }, [career, isLoading]);

  useEffect(() => {
    if (!isLoading && career && !career.turnier_laeuft) {
      setLocation("/");
    }
  }, [career, isLoading, setLocation]);

  if (isLoading || !career || !career.turnier_laeuft) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const onSubmit = (data: MatchFormValues) => {
    submitResult(data);
  };

  const isSets = career.runden_info.format === "sets";
  const allPlayers = career.matchups.flatMap((m: any) => [m.player1, m.player2]);
  const uniquePlayers = [career.spieler_name, ...allPlayers.filter((p: string) => p !== career.spieler_name)];

  const formEmoji = career.gegner_form?.form?.split(" ")[0] ?? "";

  return (
    <Layout>
      {/* Draw animation */}
      <AnimatePresence>
        {showDraw && (
          <DrawAnimation
            players={uniquePlayers}
            onDone={() => setShowDraw(false)}
            onSoundTrigger={playDrawAnimation}
          />
        )}
      </AnimatePresence>

      <div className="mb-6">
        <Button variant="ghost" className="text-muted-foreground hover:text-white" onClick={() => setLocation("/")}>
          <ChevronLeft className="w-4 h-4 mr-2" /> Zurück zum Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Main Match Area */}
        <div className="xl:col-span-2 space-y-6">

          {/* Match Header */}
          <div className="bg-card border border-primary/50 shadow-[0_0_30px_rgba(0,210,255,0.1)] rounded-3xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            <motion.p
              className="text-xs text-primary uppercase tracking-widest font-bold mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {career.turnier_name} · {career.runden_info.name}
            </motion.p>

            <motion.h2
              className="text-4xl md:text-5xl font-display font-bold text-white uppercase tracking-widest mb-6 drop-shadow-[0_0_15px_rgba(0,210,255,0.5)] flex items-center justify-center gap-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Zap className="w-8 h-8 text-accent" />
              Live Match
              <Zap className="w-8 h-8 text-accent" />
            </motion.h2>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
              <div className="flex-1 flex flex-col items-center md:items-end gap-2">
                <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{career.spieler_name?.charAt(0)}</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-primary truncate text-center md:text-right">{career.spieler_name}</h3>
                <p className="text-muted-foreground text-sm">Platz {career.platz}</p>
                {(career as any).aktuelle_serie !== 0 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      (career as any).aktuelle_serie >= 5
                        ? "text-emerald-200 border-emerald-400/60 bg-emerald-500/20"
                        : (career as any).aktuelle_serie >= 3
                        ? "text-green-300 border-green-500/50 bg-green-500/15"
                        : (career as any).aktuelle_serie > 0
                        ? "text-green-400/70 border-green-500/30 bg-green-500/10"
                        : (career as any).aktuelle_serie <= -5
                        ? "text-red-200 border-red-400/60 bg-red-500/20"
                        : (career as any).aktuelle_serie <= -3
                        ? "text-red-300 border-red-500/50 bg-red-500/15"
                        : "text-red-400/70 border-red-500/30 bg-red-500/10"
                    }`}
                  >
                    {(career as any).aktuelle_serie > 0
                      ? `🔥 ${(career as any).aktuelle_serie} Siege`
                      : `❄️ ${Math.abs((career as any).aktuelle_serie)} Niederlage${Math.abs((career as any).aktuelle_serie) > 1 ? "n" : ""}`}
                  </motion.span>
                )}
              </div>
              <div className="bg-secondary/80 rounded-full p-4 shrink-0">
                <Swords className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="flex-1 flex flex-col items-center md:items-start gap-2">
                <PlayerAvatar name={career.gegner_name} size={64} />
                <h3 className="text-2xl md:text-3xl font-bold text-white truncate text-center md:text-left">{career.gegner_name}</h3>
                <p className={`text-sm font-medium`}>{formEmoji} {career.gegner_form?.form?.split(" ").slice(1).join(" ")}</p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-border/50">
              <p className="text-primary font-bold text-sm">
                First to {career.runden_info.first_to} {isSets ? "Sätze" : "Legs"}
              </p>
            </div>
          </div>

          {/* Opponent Profile */}
          <GegnerProfil career={career} />

          {/* Match-Herausforderung (Side Quest) */}
          {(career as any).match_herausforderung && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-amber-500/10 border border-amber-400/40 rounded-2xl p-4 flex items-start gap-4 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
            >
              <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl">
                🎯
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-amber-300 font-bold text-sm uppercase tracking-wide">Match-Herausforderung</p>
                  <span className="text-amber-200 font-mono font-bold text-sm shrink-0">
                    +£{((career as any).match_herausforderung.belohnung as number).toLocaleString("en-GB")}
                  </span>
                </div>
                <p className="text-white text-sm">{(career as any).match_herausforderung.text}</p>
              </div>
            </motion.div>
          )}

          {/* YouTube Walk-on */}
          {career.walk_on_video && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden border-2 border-primary/30 shadow-[0_0_20px_rgba(0,210,255,0.15)] bg-black"
            >
              <div className="bg-secondary/50 px-4 py-2 border-b border-primary/30 flex items-center gap-2">
                <MonitorPlay className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Walk-on: {career.gegner_name}</span>
              </div>
              <div className="aspect-video w-full">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${career.walk_on_video}?autoplay=1`}
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
            </motion.div>
          )}

          {/* Result Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-center items-center text-center">
              <Activity className="w-12 h-12 text-primary mb-4 opacity-80" />
              <h3 className="text-xl font-bold mb-2">Autodarts Integration</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Match auf dem Board beendet? Ergebnis direkt über Autodarts importieren.
              </p>
              <Button
                onClick={() => pullAutodarts()}
                disabled={isPulling}
                size="lg"
                className="w-full bg-accent hover:bg-accent/90 text-black font-bold shadow-lg shadow-accent/20"
              >
                {isPulling
                  ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  : <RefreshCw className="w-5 h-5 mr-2" />}
                Von Autodarts abrufen
              </Button>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Manuelle Eingabe
              </h3>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Deine {isSets ? "Sätze" : "Legs"}</Label>
                    <Input type="number" min="0" className="bg-secondary text-lg font-mono" {...form.register("legs_won")} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Gegner {isSets ? "Sätze" : "Legs"}</Label>
                    <Input type="number" min="0" className="bg-secondary text-lg font-mono" {...form.register("legs_lost")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Dein Average</Label>
                    <Input type="number" step="0.01" className="bg-secondary h-8 font-mono text-sm" {...form.register("my_avg")} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Doppel-Quote (%)</Label>
                    <Input type="number" step="0.01" className="bg-secondary h-8 font-mono text-sm" {...form.register("my_co_pct")} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">180s</Label>
                    <Input type="number" className="bg-secondary h-8 font-mono text-sm" {...form.register("my_180s")} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Highest Finish</Label>
                    <Input type="number" className="bg-secondary h-8 font-mono text-sm" {...form.register("my_hf")} />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                >
                  Ergebnis eintragen
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Bracket */}
        <div className="xl:col-span-1">
          <div className="bg-card border border-border rounded-2xl p-5 sticky top-24">
            <h3 className="text-lg font-display font-bold text-center mb-1">
              🏆 Turnierbracket
            </h3>
            <p className="text-center text-muted-foreground text-xs mb-3">
              {career.runden_info.name} · First to {career.runden_info.first_to} {isSets ? "Sätze" : "Legs"}
            </p>

            <div className="mb-4 pb-3 border-b border-border">
              <BracketModal
                spieler_name={career.spieler_name}
                turnier_runden_log={(career as any).turnier_runden_log ?? []}
                matchups={career.matchups}
                runden_info={career.runden_info}
                turnier_bot_info={(career as any).turnier_bot_info}
              />
            </div>

            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {career.matchups.map((matchup: any, idx: number) => {
                const isActive = matchup.player1 === career.spieler_name || matchup.player2 === career.spieler_name;
                const info1 = career.turnier_bot_info?.[matchup.player1];
                const info2 = career.turnier_bot_info?.[matchup.player2];
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`p-2.5 rounded-xl border relative ${
                      isActive
                        ? "bg-primary/10 border-primary/60 shadow-[0_0_10px_rgba(0,210,255,0.1)]"
                        : "bg-secondary/20 border-border/40"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                    )}
                    <div className="flex flex-col gap-0.5">
                      <PlayerInfoCard name={matchup.player1} info={info1} isSelf={matchup.player1 === career.spieler_name}>
                        <button className={`text-xs truncate font-medium text-left w-full rounded px-0.5 hover:underline cursor-pointer transition-colors ${matchup.player1 === career.spieler_name ? "text-primary font-bold cursor-default hover:no-underline" : "text-foreground hover:text-primary"}`}>
                          {matchup.player1}
                        </button>
                      </PlayerInfoCard>
                      <span className="text-[9px] text-muted-foreground pl-1.5">vs</span>
                      <PlayerInfoCard name={matchup.player2} info={info2} isSelf={matchup.player2 === career.spieler_name}>
                        <button className={`text-xs truncate font-medium text-left w-full rounded px-0.5 hover:underline cursor-pointer transition-colors ${matchup.player2 === career.spieler_name ? "text-primary font-bold cursor-default hover:no-underline" : "text-foreground hover:text-primary"}`}>
                          {matchup.player2}
                        </button>
                      </PlayerInfoCard>
                    </div>
                    {isActive && (
                      <span className="absolute top-1 right-2 text-[9px] text-primary font-bold uppercase tracking-wider">LIVE</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
