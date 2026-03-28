import { ReactNode } from "react";
import { Link } from "wouter";
import { Trophy, Home, Settings } from "lucide-react";
import { useCareerActions } from "@/hooks/use-career";

export function Layout({ children }: { children: ReactNode }) {
  const { resetCareer, isResetting } = useCareerActions();

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Trophy className="w-6 h-6 text-primary group-hover:text-primary/80 transition-colors" />
            <h1 className="text-xl font-display font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              PDC KARRIERE
            </h1>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <button 
              onClick={() => {
                if(confirm("Bist du sicher? Dein gesamter Fortschritt geht verloren!")) {
                  resetCareer();
                }
              }}
              disabled={isResetting}
              className="text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
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
