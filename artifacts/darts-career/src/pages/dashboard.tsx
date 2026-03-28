import { useState } from "react";
import { Layout } from "@/components/layout";
import { useGetCareer, useCareerActions } from "@/hooks/use-career";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Banknote, Target, TrendingUp, Medal, PlayCircle,
  AlertCircle, ChevronRight, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const DIFFICULTY_INFO = [
  { level: 1, label: "Level 1 – Anfänger", desc: "Sehr leichte Gegner, ideal zum Lernen", color: "text-green-400" },
  { level: 2, label: "Level 2 – Einsteiger", desc: "Leichte Gegner mit schwachen Averages", color: "text-green-400" },
  { level: 3, label: "Level 3 – Freizeit", desc: "Entspannte Matches, wenig Druck", color: "text-lime-400" },
  { level: 4, label: "Level 4 – Fortgeschritten", desc: "Ausgewogen, leicht unter Standard", color: "text-yellow-400" },
  { level: 5, label: "Level 5 – Standard", desc: "Reale PDC-Verhältnisse", color: "text-orange-400" },
  { level: 6, label: "Level 6 – Anspruchsvoll", desc: "Gegner spielen über ihrem Niveau", color: "text-orange-500" },
  { level: 7, label: "Level 7 – Profi", desc: "Hohe Averages, kein Erbarmen", color: "text-red-400" },
  { level: 8, label: "Level 8 – Elite", desc: "Nur für Experten geeignet", color: "text-red-500" },
  { level: 9, label: "Level 9 – Legende", desc: "Autodarts-Bestlevel, brutal hart", color: "text-red-600" },
];

export default function Dashboard() {
  const { data: career, isLoading, error } = useGetCareer();
  const { startMatch, isStarting, setPlayerName, isSettingName } = useCareerActions();
  const [, setLocation] = useLocation();
  const [newName, setNewName] = useState("");
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [selectedDifficulty, setSelectedDifficulty] = useState(5);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !career) {
    return (
      <Layout>
        <div className="text-center py-20 text-destructive">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Fehler beim Laden der Karriere</h2>
          <p className="text-muted-foreground">Backend erreichbar?</p>
        </div>
      </Layout>
    );
  }

  // Name Setup Screen (2 Schritte)
  if (!career.name_set) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <AnimatePresence mode="wait">
            {setupStep === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="bg-card border border-primary/40 rounded-3xl p-10 max-w-md w-full text-center shadow-[0_0_60px_rgba(0,210,255,0.1)]"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-10 h-10 text-primary" />
                </div>
                <p className="text-xs text-primary uppercase tracking-widest font-bold mb-2">Schritt 1 von 2</p>
                <h1 className="text-3xl font-display font-bold text-white mb-2">Karriere starten</h1>
                <p className="text-muted-foreground mb-8">Wie soll dein Darts-Profi heißen?</p>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newName.trim()) setSetupStep(2);
                  }}
                  placeholder="z.B. Dennis"
                  maxLength={30}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-lg text-center text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary mb-6"
                />
                <Button
                  onClick={() => newName.trim() && setSetupStep(2)}
                  disabled={!newName.trim()}
                  className="w-full text-lg py-6 bg-gradient-to-r from-primary to-cyan-400 hover:from-primary/90 hover:to-cyan-500 text-black font-bold"
                >
                  Weiter zum Schwierigkeitsgrad →
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="bg-card border border-primary/40 rounded-3xl p-8 max-w-lg w-full shadow-[0_0_60px_rgba(0,210,255,0.1)]"
              >
                <p className="text-xs text-primary uppercase tracking-widest font-bold mb-2 text-center">Schritt 2 von 2</p>
                <h1 className="text-2xl font-display font-bold text-white mb-1 text-center">Schwierigkeitsgrad</h1>
                <p className="text-muted-foreground text-sm mb-6 text-center">
                  Basiert auf den Autodarts Bot-Leveln 1–9
                </p>

                <div className="space-y-2 mb-6">
                  {DIFFICULTY_INFO.map((d) => (
                    <button
                      key={d.level}
                      onClick={() => setSelectedDifficulty(d.level)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        selectedDifficulty === d.level
                          ? "bg-primary/10 border-primary"
                          : "bg-secondary/20 border-border/50 hover:border-border"
                      }`}
                    >
                      <span className={`text-xl font-mono font-bold w-6 text-center ${d.color}`}>{d.level}</span>
                      <div>
                        <p className={`font-bold text-sm ${selectedDifficulty === d.level ? "text-white" : "text-muted-foreground"}`}>{d.label}</p>
                        <p className="text-xs text-muted-foreground">{d.desc}</p>
                      </div>
                      {selectedDifficulty === d.level && (
                        <span className="ml-auto text-primary text-lg">✓</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSetupStep(1)}
                    className="flex-1"
                  >
                    ← Zurück
                  </Button>
                  <Button
                    onClick={() => setPlayerName({ name: newName, schwierigkeitsgrad: selectedDifficulty })}
                    disabled={isSettingName}
                    className="flex-1 bg-gradient-to-r from-primary to-cyan-400 hover:from-primary/90 hover:to-cyan-500 text-black font-bold"
                  >
                    {isSettingName ? "Starte..." : `🎯 Karriere starten`}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Layout>
    );
  }

  const handleStartMatch = () => {
    startMatch();
    setLocation("/match");
  };

  const unlockedCount = Object.values(career.achievements).filter((a: any) => a.unlocked).length;
  const totalAchievements = Object.values(career.achievements).length;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
              Willkommen, <span className="text-primary">{career.spieler_name}</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Saison {career.saison_jahr} • {career.hat_tourcard ? "Tour Card Holder" : "Q-School Teilnehmer"}
            </p>
          </div>
          <div className="shrink-0">
            {career.turnier_laeuft ? (
              <Button
                onClick={() => setLocation("/match")}
                className="w-full md:w-auto text-lg px-8 py-6 bg-gradient-to-r from-accent to-orange-400 hover:from-accent/90 hover:to-orange-500 text-black font-bold shadow-[0_0_20px_rgba(255,170,0,0.3)]"
              >
                <PlayCircle className="w-6 h-6 mr-2" />
                Weiter zum Match
              </Button>
            ) : (
              <Button
                onClick={handleStartMatch}
                disabled={isStarting}
                className="w-full md:w-auto text-lg px-8 py-6 bg-gradient-to-r from-primary to-cyan-400 hover:from-primary/90 hover:to-cyan-500 text-black font-bold shadow-[0_0_20px_rgba(0,210,255,0.3)]"
              >
                <Trophy className="w-6 h-6 mr-2" />
                {isStarting ? "Lade..." : "Nächstes Turnier starten"}
              </Button>
            )}
          </div>
        </div>

        {/* News Banner */}
        <AnimatePresence>
          {career.letzte_schlagzeile && (
            <motion.div
              key="news"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-secondary/40 border-l-4 border-destructive p-6 rounded-r-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 blur-[50px] -z-10" />
              <h4 className="text-destructive font-bold text-sm tracking-widest uppercase mb-2">PDC News Express</h4>
              <h2 className="text-2xl font-display font-bold text-white mb-2">{career.letzte_schlagzeile.titel}</h2>
              <p className="text-muted-foreground italic text-lg border-l-2 border-muted-foreground/30 pl-4">
                "{career.letzte_schlagzeile.text}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-display font-bold">Leistung</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Karriere-Average</span>
                    <span className="text-xl font-bold font-mono">{career.gesamt_avg.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(career.gesamt_avg, 120) / 1.2}%` }} />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-muted-foreground">Doppel-Quote</span>
                    <span className="text-xl font-bold font-mono">{career.gesamt_co.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-accent h-2 rounded-full" style={{ width: `${career.gesamt_co}%` }} />
                  </div>
                  {(career.avg_bonus > 0 || career.checkout_bonus > 0) && (
                    <div className="pt-2 border-t border-border/50 flex gap-4">
                      {career.avg_bonus > 0 && (
                        <span className="text-xs text-green-400">+{career.avg_bonus} Avg (Equipment)</span>
                      )}
                      {career.checkout_bonus > 0 && (
                        <span className="text-xs text-green-400">+{career.checkout_bonus}% CO (Equipment)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-display font-bold">Status</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <span className="text-muted-foreground">Nächstes Event</span>
                    <span className="font-bold text-right pl-4 text-sm">{career.turnier_name}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <span className="text-muted-foreground">Weltrangliste</span>
                    <span className="font-bold text-primary text-xl">Platz {career.platz}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <span className="text-muted-foreground">Siege</span>
                    <span className="font-bold">{career.stats_siege} / {career.stats_spiele} ({career.quote}%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Höchstes Finish</span>
                    <span className={`font-bold ${career.stats_highest_finish >= 170 ? 'text-yellow-400' : career.stats_highest_finish >= 100 ? 'text-primary' : ''}`}>
                      {career.stats_highest_finish || "–"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { href: "/stats", label: "Statistiken", icon: "📊" },
                { href: "/kalender", label: "Kalender", icon: "📅" },
                { href: "/h2h", label: "Head-to-Head", icon: "⚔️" },
                { href: "/history", label: "Turnierverlauf", icon: "📖" },
              ].map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className="text-sm font-medium text-muted-foreground group-hover:text-white transition-colors">{label}</div>
                  <ChevronRight className="w-4 h-4 mx-auto mt-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>

            {/* Achievements */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent/10 rounded-xl">
                    <Medal className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-display font-bold">Meilensteine</h3>
                </div>
                <span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                  {unlockedCount}/{totalAchievements} freigeschaltet
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(career.achievements).map((ach: any, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                      ach.unlocked
                        ? "bg-primary/5 border-primary/30 shadow-[0_0_10px_rgba(0,210,255,0.05)]"
                        : "bg-secondary/20 border-border/50 opacity-50 grayscale"
                    }`}
                  >
                    <Trophy className={`w-7 h-7 shrink-0 mt-0.5 ${ach.unlocked ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <h4 className={`font-bold text-sm ${ach.unlocked ? "text-white" : "text-muted-foreground"}`}>{ach.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">{ach.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Finances */}
            <div className="bg-gradient-to-br from-card to-secondary border border-border rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-white/5 rotate-12 pointer-events-none">
                <Banknote className="w-32 h-32" />
              </div>
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-green-400" /> Finanzen
              </h3>
              <div className="space-y-4 relative z-10">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bankkonto</p>
                  <p className="text-3xl font-mono font-bold text-white">£{career.bank_konto.toLocaleString("en-GB")}</p>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">Order of Merit (Preisgeld)</p>
                  <p className="text-xl font-mono font-bold text-primary">£{career.order_of_merit_geld.toLocaleString("en-GB")}</p>
                </div>
              </div>
            </div>

            {/* Sponsor */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" /> Aktiver Sponsor
              </h3>
              {career.aktiver_sponsor ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-primary">{career.aktiver_sponsor.name}</span>
                    <span className="text-xs bg-secondary px-2 py-1 rounded-md text-muted-foreground">
                      Noch {career.aktiver_sponsor.turniere_zeit} Turniere
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{career.aktiver_sponsor.text}</p>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Fortschritt</span>
                      <span className="font-mono">{career.aktiver_sponsor.aktuell} / {career.aktiver_sponsor.ziel_wert}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((career.aktiver_sponsor.aktuell / career.aktiver_sponsor.ziel_wert) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3 text-center">
                    <span className="text-sm text-muted-foreground">Belohnung:</span>
                    <span className="ml-2 font-bold text-yellow-400">£{career.aktiver_sponsor.belohnung.toLocaleString("en-GB")}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Kein aktiver Sponsor.</p>
                  <p className="text-sm mt-1">Zeige gute Leistungen, um Verträge zu erhalten!</p>
                </div>
              )}
            </div>

            {/* OOM Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border bg-secondary/30">
                <h3 className="text-xl font-display font-bold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-accent" /> PDC Top 10
                </h3>
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-muted-foreground font-medium w-10">#</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Spieler</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">OoM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {career.oom.map((s: any, i: number) => (
                      <tr
                        key={i}
                        className={`transition-colors hover:bg-secondary/30 ${s.name === career.spieler_name ? "bg-primary/10" : ""}`}
                      >
                        <td className="p-3 text-muted-foreground font-mono">{i + 1}</td>
                        <td className={`p-3 font-medium ${s.name === career.spieler_name ? "text-primary font-bold" : ""}`}>
                          {s.name}
                        </td>
                        <td className="p-3 text-right font-mono text-xs">£{s.geld.toLocaleString("en-GB")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
