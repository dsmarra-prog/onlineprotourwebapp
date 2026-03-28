import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import MatchView from "@/pages/match";
import StatsPage from "@/pages/stats";
import H2HPage from "@/pages/h2h";
import CalendarPage from "@/pages/calendar";
import HistoryPage from "@/pages/history";
import HallOfFamePage from "@/pages/hall-of-fame";
import OrderOfMeritPage from "@/pages/order-of-merit";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  }
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/match" component={MatchView} />
      <Route path="/stats" component={StatsPage} />
      <Route path="/h2h" component={H2HPage} />
      <Route path="/kalender" component={CalendarPage} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/hall-of-fame" component={HallOfFamePage} />
      <Route path="/order-of-merit" component={OrderOfMeritPage} />
      <Route component={NotFound} />
    </Switch>
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
