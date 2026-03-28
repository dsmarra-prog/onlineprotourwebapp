import { Layout } from "@/components/layout";
import { useGetEquipment, useCareerActions } from "@/hooks/use-career";
import { AlertCircle, ShoppingBag, Check, Zap, BarChart2, Target } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Darts: <span className="text-2xl">🎯</span>,
  Flights: <span className="text-2xl">🪁</span>,
  Shafts: <span className="text-2xl">📏</span>,
  Board: <span className="text-2xl">🎰</span>,
  Kleidung: <span className="text-2xl">👕</span>,
  Training: <span className="text-2xl">🏆</span>,
};

const BONUS_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  avg: { label: "Average-Bonus", icon: <BarChart2 className="w-4 h-4" />, color: "text-primary" },
  checkout: { label: "Doppelquote-Bonus", icon: <Target className="w-4 h-4" />, color: "text-green-400" },
  coaching: { label: "Coaching-Bonus", icon: <Zap className="w-4 h-4" />, color: "text-yellow-400" },
  startgeld: { label: "Startgeld-Bonus", icon: <span className="text-sm">£</span>, color: "text-orange-400" },
};

export default function EquipmentPage() {
  const { data, isLoading, error } = useGetEquipment();
  const { buyEquipment, isBuying } = useCareerActions();
  const [buying, setBuying] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("Alle");

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="text-center py-20 text-destructive">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Fehler beim Laden.</p>
        </div>
      </Layout>
    );
  }

  const items = data.items ?? [];
  const categories = ["Alle", ...Array.from(new Set(items.map((i: any) => i.kategorie)))];
  const filtered = filter === "Alle" ? items : items.filter((i: any) => i.kategorie === filter);
  const ownedCount = items.filter((i: any) => i.owned).length;

  const handleBuy = (id: string) => {
    setBuying(id);
    buyEquipment(id);
    setTimeout(() => setBuying(null), 2000);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-white">Equipment Shop</h1>
            <p className="text-muted-foreground mt-1">Verbessere deine Ausrüstung für mehr Leistung</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Guthaben</p>
            <p className="text-2xl font-mono font-bold text-green-400">£{(data.bank_konto ?? 0).toLocaleString("en-GB")}</p>
            <p className="text-xs text-muted-foreground mt-1">{ownedCount}/{items.length} besessen</p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                filter === cat
                  ? "bg-primary text-black border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item: any, i: number) => {
            const bonusInfo = BONUS_TYPE_LABELS[item.bonus_typ] ?? { label: item.bonus_typ, icon: null, color: "text-white" };
            const canAfford = (data.bank_konto ?? 0) >= item.preis;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-card border rounded-2xl p-5 flex flex-col gap-4 transition-all ${
                  item.owned
                    ? "border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(0,210,255,0.05)]"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {CATEGORY_ICONS[item.kategorie] ?? <ShoppingBag className="w-6 h-6" />}
                    <div>
                      <p className="font-bold text-white text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.kategorie}</p>
                    </div>
                  </div>
                  {item.owned && (
                    <div className="flex items-center gap-1 text-primary text-xs font-bold">
                      <Check className="w-4 h-4" /> Besessen
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{item.beschreibung}</p>

                <div className={`flex items-center gap-2 text-sm font-medium ${bonusInfo.color}`}>
                  {bonusInfo.icon}
                  <span>{bonusInfo.label}:</span>
                  <span className="font-mono font-bold">
                    {item.bonus_typ === "avg" || item.bonus_typ === "coaching"
                      ? `+${item.bonus_wert}`
                      : item.bonus_typ === "checkout"
                      ? `+${item.bonus_wert}%`
                      : `+£${item.bonus_wert}`}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                  <span className={`text-xl font-mono font-bold ${canAfford || item.owned ? "text-white" : "text-muted-foreground"}`}>
                    £{item.preis.toLocaleString("en-GB")}
                  </span>
                  {!item.owned && (
                    <Button
                      size="sm"
                      onClick={() => handleBuy(item.id)}
                      disabled={isBuying || !canAfford || buying === item.id}
                      className={`${canAfford ? "bg-primary hover:bg-primary/80 text-black font-bold" : "opacity-50 cursor-not-allowed"}`}
                    >
                      {buying === item.id ? "Kaufe..." : canAfford ? "Kaufen" : "Zu teuer"}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
