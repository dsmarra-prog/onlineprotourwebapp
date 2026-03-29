import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Trophy, Users, BarChart3, Settings, Home, Target, CalendarDays } from "lucide-react";
import NotFound from "@/pages/not-found";
import TourniereListe from "@/pages/turniere";
import TurnierDetail from "@/pages/turnier-detail";
import OomPage from "@/pages/oom";
import SpielerPage from "@/pages/spieler";
import SpielerProfil from "@/pages/spieler-profil";
import EinstellungenPage from "@/pages/einstellungen";
import HomeDashboard from "@/pages/home";
import SpielplanPage from "@/pages/spielplan";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000 } },
});

const NAV_ITEMS = [
  { href: "/", label: "Start", icon: Home },
  { href: "/spielplan", label: "Spielplan", icon: CalendarDays },
  { href: "/turniere", label: "Turniere", icon: Trophy },
  { href: "/spieler", label: "Spieler", icon: Users },
  { href: "/oom", label: "OOM", icon: BarChart3 },
  { href: "/einstellungen", label: "Mein Account", icon: Settings },
];

function NavBar() {
  const [location] = useLocation();
  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center h-14 gap-1">
        <div className="flex items-center gap-2 mr-6">
          <Target className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm text-primary tracking-wide uppercase">Online Pro Tour</span>
        </div>
        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
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
      </div>
    </nav>
  );
}

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Switch>
          <Route path="/" component={HomeDashboard} />
          <Route path="/spielplan" component={SpielplanPage} />
          <Route path="/turniere" component={TourniereListe} />
          <Route path="/turniere/:id" component={TurnierDetail} />
          <Route path="/oom" component={OomPage} />
          <Route path="/spieler" component={SpielerPage} />
          <Route path="/spieler/:id" component={SpielerProfil} />
          <Route path="/einstellungen" component={EinstellungenPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
