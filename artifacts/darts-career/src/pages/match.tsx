import { useEffect } from "react";
import { Layout } from "@/components/layout";
import { useGetCareer, useCareerActions } from "@/hooks/use-career";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Zap, Swords, MonitorPlay, Activity, RefreshCw, ChevronLeft, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const matchSchema = z.object({
  legs_won: z.coerce.number().min(0),
  legs_lost: z.coerce.number().min(0),
  my_avg: z.coerce.number().optional(),
  my_180s: z.coerce.number().optional(),
  my_hf: z.coerce.number().optional(),
  my_co_pct: z.coerce.number().optional(),
});

type MatchFormValues = z.infer<typeof matchSchema>;

export default function MatchView() {
  const { data: career, isLoading } = useGetCareer();
  const { submitResult, isSubmitting, pullAutodarts, isPulling } = useCareerActions();
  const [, setLocation] = useLocation();

  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      legs_won: 0,
      legs_lost: 0,
      my_avg: 0,
      my_180s: 0,
      my_hf: 0,
      my_co_pct: 0,
    }
  });

  // Redirect if no match is active
  useEffect(() => {
    if (!isLoading && career && !career.turnier_laeuft) {
      setLocation("/");
    }
  }, [career, isLoading, setLocation]);

  if (isLoading || !career || !career.turnier_laeuft) {
    return (
      <Layout>
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div>
      </Layout>
    );
  }

  const onSubmit = (data: MatchFormValues) => {
    submitResult(data);
    // The backend redirect logic will be handled by the useEffect above once turnier_laeuft changes
  };

  const isSets = career.runden_info.format === 'sets';

  return (
    <Layout>
      <div className="mb-6">
        <Button variant="ghost" className="text-muted-foreground hover:text-white" onClick={() => setLocation("/")}>
          <ChevronLeft className="w-4 h-4 mr-2" /> Zurück zum Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Main Match Area */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Match Header (Epic) */}
          <div className="bg-card border border-primary/50 shadow-[0_0_30px_rgba(0,210,255,0.1)] rounded-3xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            
            <motion.h2 
              className="text-4xl md:text-5xl font-display font-bold text-white uppercase tracking-widest mb-6 drop-shadow-[0_0_15px_rgba(0,210,255,0.5)] flex items-center justify-center gap-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Zap className="w-10 h-10 text-accent" />
              Live Match
              <Zap className="w-10 h-10 text-accent" />
            </motion.h2>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
              <div className="flex-1 text-right">
                <h3 className="text-3xl md:text-4xl font-bold text-primary truncate">{career.spieler_name}</h3>
              </div>
              <div className="bg-secondary/80 rounded-full p-4 shrink-0">
                <Swords className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-3xl md:text-4xl font-bold text-white truncate">{career.gegner_name}</h3>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border inline-block px-8">
              <p className="text-accent font-bold uppercase tracking-widest text-lg">
                H2H Bilanz: {career.h2h_siege} Siege - {career.h2h_niederlagen} Niederlagen
              </p>
              <p className="text-muted-foreground mt-2">
                Erwarteter Bot-Average: <span className="text-white font-mono font-bold">{career.gegner_avg}</span>
              </p>
            </div>
          </div>

          {/* YouTube Video if available */}
          {career.walk_on_video && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden border-2 border-primary/30 shadow-[0_0_20px_rgba(0,210,255,0.15)] bg-black"
            >
              <div className="bg-secondary/50 px-4 py-2 border-b border-primary/30 flex items-center gap-2">
                <MonitorPlay className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Walk-on Video</span>
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

          {/* Result Submission Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Autodarts Option */}
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-center items-center text-center">
              <Activity className="w-12 h-12 text-primary mb-4 opacity-80" />
              <h3 className="text-xl font-bold mb-2">Autodarts Integration</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Hast du das Match auf dem Board beendet? Ziehe dir das Ergebnis direkt über die Autodarts API.
              </p>
              <Button 
                onClick={() => pullAutodarts()}
                disabled={isPulling}
                size="lg"
                className="w-full bg-accent hover:bg-accent/90 text-black font-bold shadow-lg shadow-accent/20"
              >
                {isPulling ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <RefreshCw className="w-5 h-5 mr-2" />}
                Von Autodarts abrufen
              </Button>
            </div>

            {/* Right: Manual Form Option */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
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
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">Dein Average</Label>
                    <Input type="number" step="0.01" className="bg-secondary h-8 font-mono text-sm" {...form.register("my_avg")} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">Doppel-Quote (%)</Label>
                    <Input type="number" step="0.01" className="bg-secondary h-8 font-mono text-sm" {...form.register("my_co_pct")} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">180s</Label>
                    <Input type="number" className="bg-secondary h-8 font-mono text-sm" {...form.register("my_180s")} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">Highest Finish</Label>
                    <Input type="number" className="bg-secondary h-8 font-mono text-sm" {...form.register("my_hf")} />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                >
                  Ergebnis eintragen
                </Button>
              </form>
            </div>
            
          </div>
        </div>

        {/* Right Sidebar: Bracket */}
        <div className="xl:col-span-1">
          <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
            <h3 className="text-xl font-display font-bold text-center mb-2">
              🏆 {career.runden_info.name}
            </h3>
            <p className="text-center text-muted-foreground text-sm mb-6 border-b border-border pb-4">
              First to {career.runden_info.first_to} {isSets ? 'Sätze' : 'Legs'}
            </p>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {career.matchups.map((matchup, idx) => {
                const isActive = matchup.player1 === career.spieler_name || matchup.player2 === career.spieler_name;
                
                return (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl border ${
                      isActive 
                        ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(0,210,255,0.15)] relative' 
                        : 'bg-secondary/30 border-border/50 opacity-80'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-r-full" />
                    )}
                    <div className="flex flex-col gap-1">
                      <span className={`font-medium text-sm truncate ${matchup.player1 === career.spieler_name ? 'text-primary font-bold' : 'text-foreground'}`}>
                        {matchup.player1}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase pl-2">vs</span>
                      <span className={`font-medium text-sm truncate ${matchup.player2 === career.spieler_name ? 'text-primary font-bold' : 'text-foreground'}`}>
                        {matchup.player2}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
      </div>
    </Layout>
  );
}
