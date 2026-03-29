import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Trophy, Home, Settings, BarChart2, Users, Calendar,
  BookOpen, ListOrdered, RotateCcw,
} from "lucide-react";
import { useCareerActions } from "@/hooks/use-career";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/stats", label: "Statistiken", icon: BarChart2 },
  { href: "/kalender", label: "Kalender", icon: Calendar },
  { href: "/order-of-merit", label: "Order of Merit", icon: ListOrdered },
  { href: "/h2h", label: "H2H", icon: Users },
  { href: "/history", label: "Verlauf", icon: BookOpen },
  { href: "/hall-of-fame", label: "Hall of Fame", icon: Trophy },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
];

export function Layout({ children }: { children: ReactNode }) {
  const { resetCareer, isResetting } = useCareerActions();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-1.5 group shrink-0">
            <Trophy className="w-5 h-5 text-primary group-hover:text-primary/80 transition-colors" />
            <h1 className="text-base font-display font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent whitespace-nowrap">
              OnlineProTourCompanion
            </h1>
          </Link>

          <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  location === href
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            ))}
            <button
              onClick={() => {
                if (confirm("Bist du sicher? Dein gesamter Fortschritt geht verloren!")) {
                  resetCareer();
                }
              }}
              disabled={isResetting}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden lg:inline">Reset</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
