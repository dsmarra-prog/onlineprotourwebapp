import { useState } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Trophy, Users, BarChart3, Settings, Home, Target, CalendarDays, LogOut, Swords, Menu, X, Star, TrendingUp, GitCompare, HelpCircle, ChevronRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import TourniereListe from "@/pages/turniere";
import TurnierDetail from "@/pages/turnier-detail";
import OomPage from "@/pages/oom";
import DevOomPage from "@/pages/dev-oom";
import HallOfFamePage from "@/pages/hall-of-fame";
import SpielerPage from "@/pages/spieler";
import SpielerProfil from "@/pages/spieler-profil";
import EinstellungenPage from "@/pages/einstellungen";
import HomeDashboard from "@/pages/home";
import SpielplanPage from "@/pages/spielplan";
import StatistikenPage from "@/pages/statistiken";
import Portal from "@/pages/portal";
import AutodartsCallback from "@/pages/autodarts-callback";
import SaisonPage from "@/pages/saison";
import VergleichPage from "@/pages/vergleich";
import HilfePage from "@/pages/hilfe";
import { PlayerProvider, usePlayer } from "@/context/PlayerContext";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000 } },
});

const NAV_ITEMS = [
  { href: "/", label: "Start", icon: Home },
  { href: "/spielplan", label: "Spielplan", icon: CalendarDays },
  { href: "/turniere", label: "Turniere", icon: Trophy },
  { href: "/spieler", label: "Spieler", icon: Users },
  { href: "/oom", label: "Pro OOM", icon: BarChart3 },
  { href: "/dev-oom", label: "Dev OOM", icon: Swords },
  { href: "/statistiken", label: "Statistiken", icon: TrendingUp },
  { href: "/hall-of-fame", label: "Hall of Fame", icon: Star },
  { href: "/saison", label: "Saison", icon: Trophy },
  { href: "/vergleich", label: "Vergleich", icon: GitCompare },
  { href: "/hilfe", label: "Hilfe", icon: HelpCircle },
  { href: "/einstellungen", label: "Mein Account", icon: Settings },
];

const BOTTOM_NAV = [
  { href: "/", label: "Start", icon: Home },
  { href: "/turniere", label: "Turniere", icon: Trophy },
  { href: "/oom", label: "Pro OOM", icon: BarChart3 },
  { href: "/hilfe", label: "Hilfe", icon: HelpCircle },
  { href: "/einstellungen", label: "Account", icon: Settings },
];

// ─── Tutorial Overlay ────────────────────────────────────────────────────────

const TUTORIAL_STEPS = [
  {
    icon: Target,
    title: "Willkommen bei der Online Pro Tour!",
    body: "Schoen, dass du dabei bist! Die OPT ist eine professionelle Online-Dartstour auf Basis von Autodarts. Hier trittst du in Turnieren gegen andere Spieler an, sammelst Punkte in der Order of Merit und kaempfst um Titel.",
  },
  {
    icon: Trophy,
    title: "Turniere",
    body: "Unter \"Turniere\" findest du alle anstehenden und laufenden Events. Melde dich rechtzeitig an und checke vor dem Start ein (meistens 30 Minuten vorher). Wer den Check-In verpasst, fliegt raus!",
  },
  {
    icon: Target,
    title: "Autodarts & Discord",
    body: "Du brauchst ein laufendes Autodarts-System sowie einen Discord-Account. Wichtig: Dein Discord-Name muss deinen Autodarts-Namen enthalten. Alle Matches laufen ueber Autodarts-Lobbies, die automatisch erstellt werden.",
  },
  {
    icon: CheckCircle,
    title: "Matches spielen",
    body: "Sobald das Bracket steht, oeffnet der oben stehende Spieler die Autodarts-Lobby und teilt den Link. Gespielt wird 501 Double Out. Ergebnisse werden direkt in der App eingetragen — einfach auf dein Match klicken.",
  },
  {
    icon: BarChart3,
    title: "Order of Merit",
    body: "Fuer jedes Turnierergebnis gibt es Punkte. Die Rangliste findest du unter \"Pro OOM\". Je besser dein Ergebnis, desto mehr Punkte! Am Saisonende qualifizieren sich die besten Spieler fuer grosse Events.",
  },
  {
    icon: HelpCircle,
    title: "Hilfe & Support",
    body: "Fragen oder Probleme? Unter \"Hilfe\" kannst du jederzeit ein Support-Ticket einreichen. Ein Admin antwortet dir so schnell wie moeglich. Jetzt viel Spass und gute Darts!",
  },
];

function TutorialOverlay() {
  const { showTutorial, dismissTutorial, currentPlayer } = usePlayer();
  const [step, setStep] = useState(0);

  if (!showTutorial || !currentPlayer) return null;

  const current = TUTORIAL_STEPS[step];
  const Icon = current.icon;
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / TUTORIAL_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Schritt {step + 1} von {TUTORIAL_STEPS.length}
              </p>
              <h2 className="font-bold text-lg leading-tight">{current.title}</h2>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{current.body}</p>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={dismissTutorial}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Ueberspringen
            </button>
            <div className="flex-1" />
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                Zurueck
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                if (isLast) dismissTutorial();
                else setStep((s) => s + 1);
              }}
            >
              {isLast ? (
                <><CheckCircle className="w-3.5 h-3.5 mr-1.5" />Los geht&apos;s!</>
              ) : (
                <>Weiter<ChevronRight className="w-3.5 h-3.5 ml-1" /></>
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 pb-4">
          {TUTORIAL_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-primary w-4" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── NavBar ──────────────────────────────────────────────────────────────────

function NavBar() {
  const [location] = useLocation();
  const { currentPlayer, logout } = usePlayer();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = () => setMobileOpen(false);

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center h-14 gap-1">
        <Link href="/" className="flex items-center gap-2 mr-4 flex-shrink-0 hover:opacity-80 transition-opacity">
          <img src="/pro-tour/opt-logo.png" alt="OPT" className="w-8 h-8 object-contain" />
          <span className="font-bold text-sm text-primary tracking-wide uppercase hidden sm:block">Online Pro Tour</span>
          <span className="font-bold text-xs text-primary tracking-wide uppercase sm:hidden">OPT</span>
        </Link>

        <div className="hidden md:flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </div>

        {currentPlayer && (
          <div className="hidden md:flex items-center gap-2 ml-2 pl-3 border-l border-border shrink-0">
            <div className="text-right">
              <div className="text-xs font-semibold text-foreground leading-none">{currentPlayer.name}</div>
              <div className="text-[10px] text-muted-foreground leading-none mt-0.5">@{currentPlayer.autodarts_username}</div>
            </div>
            <button
              onClick={logout}
              title="Ausloggen"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex md:hidden items-center gap-2 flex-1 justify-end">
          {currentPlayer && (
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">{currentPlayer.name}</span>
          )}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 space-y-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = href === "/" ? location === "/" : location.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
            {currentPlayer && (
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Ausloggen
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-stretch h-16">
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Router() {
  const [location] = useLocation();
  const { currentPlayer, isLoading } = usePlayer();

  if (location === "/autodarts-callback") {
    return <AutodartsCallback />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Target className="w-8 h-8 text-primary animate-pulse" />
          <span className="text-sm">Laden...</span>
        </div>
      </div>
    );
  }

  if (!currentPlayer) {
    return (
      <Switch>
        <Route path="/spielplan">
          <div className="min-h-screen bg-background text-foreground">
            <NavBar />
            <main className="max-w-6xl mx-auto px-4 py-6">
              <SpielplanPage />
            </main>
          </div>
        </Route>
        <Route component={Portal} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <Switch>
          <Route path="/" component={HomeDashboard} />
          <Route path="/spielplan" component={SpielplanPage} />
          <Route path="/turniere" component={TourniereListe} />
          <Route path="/turniere/:id" component={TurnierDetail} />
          <Route path="/oom" component={OomPage} />
          <Route path="/dev-oom" component={DevOomPage} />
          <Route path="/statistiken" component={StatistikenPage} />
          <Route path="/hall-of-fame" component={HallOfFamePage} />
          <Route path="/spieler" component={SpielerPage} />
          <Route path="/spieler/:id" component={SpielerProfil} />
          <Route path="/einstellungen" component={EinstellungenPage} />
          <Route path="/saison" component={SaisonPage} />
          <Route path="/vergleich" component={VergleichPage} />
          <Route path="/hilfe" component={HilfePage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNav />
      <TutorialOverlay />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PlayerProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </PlayerProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
