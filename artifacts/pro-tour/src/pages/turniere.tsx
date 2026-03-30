import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Trophy, Calendar, Users, Lock, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, TourTournament, TYP_LABELS } from "@/lib/api";

export default function TourniereListe() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: tournaments, isLoading } = useQuery<TourTournament[]>({
    queryKey: ["tournaments"],
    queryFn: () => apiFetch("/tour/tournaments"),
  });

  const [form, setForm] = useState({
    name: "",
    typ: "pc",
    tour_type: "pro",
    datum: new Date().toISOString().slice(0, 10),
    uhrzeit: "19:00",
    legs_format: "5",
    max_players: "32",
    admin_pin: "",
    is_test: false,
  });

  const TEMPLATES = [
    { label: "Players Championship", typ: "pc", tour_type: "pro", legs_format: "5", max_players: "32" },
    { label: "Major", typ: "m1", tour_type: "pro", legs_format: "7", max_players: "32" },
    { label: "Grand Final", typ: "m2", tour_type: "pro", legs_format: "9", max_players: "32" },
    { label: "Dev Cup", typ: "dev_cup", tour_type: "development", legs_format: "3", max_players: "32" },
    { label: "Dev Major", typ: "dev_major", tour_type: "development", legs_format: "7", max_players: "16" },
  ];

  const createMut = useMutation({
    mutationFn: () =>
      apiFetch("/tour/tournaments", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          legs_format: parseInt(form.legs_format),
          max_players: parseInt(form.max_players),
          is_test: form.is_test,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      setOpen(false);
      setForm({ name: "", typ: "pc", tour_type: "pro", datum: new Date().toISOString().slice(0, 10), uhrzeit: "19:00", legs_format: "5", max_players: "32", admin_pin: "", is_test: false });
      toast({ title: "Turnier erstellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const statusColor = (s: string) =>
    s === "laufend" ? "text-primary bg-primary/10 border-primary/30" :
    s === "abgeschlossen" ? "text-muted-foreground bg-muted border-border" :
    "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";

  const statusLabel = (s: string) =>
    s === "laufend" ? "Laufend" : s === "abgeschlossen" ? "Abgeschlossen" : "Offen";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Turniere</h1>
          <p className="text-muted-foreground text-sm mt-1">Online Pro Tour Turnierkalender</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Neues Turnier
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Neues Turnier erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Templates */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Zap className="w-3 h-3" /> Vorlage</Label>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.typ}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, typ: t.typ, tour_type: t.tour_type, legs_format: t.legs_format, max_players: t.max_players }))}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.typ === t.typ ? "bg-primary/20 border-primary/50 text-primary" : "bg-accent/30 border-border text-muted-foreground hover:border-primary/30"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="z.B. Players Championship Berlin" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Typ</Label>
                  <Select value={form.typ} onValueChange={(v) => setForm((f) => ({ ...f, typ: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pc">Players Championship</SelectItem>
                      <SelectItem value="m1">Major (Spring Open / Grand Prix)</SelectItem>
                      <SelectItem value="m2">Grand Final / Home Matchplay</SelectItem>
                      <SelectItem value="dev_cup">Development Cup</SelectItem>
                      <SelectItem value="dev_major">Dev Major</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Datum</Label>
                  <Input type="date" value={form.datum} onChange={(e) => setForm((f) => ({ ...f, datum: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1">🕐 Uhrzeit (für Discord-Erinnerung)</Label>
                <Input type="time" value={form.uhrzeit} onChange={(e) => setForm((f) => ({ ...f, uhrzeit: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Best of (Legs)</Label>
                  <Select value={form.legs_format} onValueChange={(v) => setForm((f) => ({ ...f, legs_format: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">Best of 3</SelectItem>
                      <SelectItem value="5">Best of 5</SelectItem>
                      <SelectItem value="7">Best of 7</SelectItem>
                      <SelectItem value="9">Best of 9</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Max. Spieler</Label>
                  <Select value={form.max_players} onValueChange={(v) => setForm((f) => ({ ...f, max_players: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="16">16</SelectItem>
                      <SelectItem value="32">32</SelectItem>
                      <SelectItem value="64">64</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1"><Lock className="w-3 h-3" /> Admin-PIN (für Verwaltung)</Label>
                <Input type="password" value={form.admin_pin} onChange={(e) => setForm((f) => ({ ...f, admin_pin: e.target.value }))} placeholder="PIN festlegen" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_test}
                  onChange={(e) => setForm((f) => ({ ...f, is_test: e.target.checked }))}
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <span className="text-sm text-muted-foreground">Testturnier (keine OOM-Punkte)</span>
              </label>
              <Button className="w-full" onClick={() => createMut.mutate()} disabled={createMut.isPending || !form.name || !form.admin_pin}>
                {createMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Erstellen...</> : "Turnier erstellen"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : tournaments?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Noch keine Turniere. Erstelle das erste!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tournaments?.map((t) => (
            <Link key={t.id} href={`/turniere/${t.id}`} className="block p-4 bg-card border border-border rounded-xl hover:border-primary/40 hover:bg-card/80 transition-all">

                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold truncate">{t.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${statusColor(t.status)}`}>
                        {statusLabel(t.status)}
                      </span>
                      {(t as any).is_test && (
                        <span className="text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 text-orange-400 bg-orange-400/10 border-orange-400/30">
                          Test
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{TYP_LABELS[t.typ]}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{t.datum}{t.uhrzeit ? ` · ${t.uhrzeit} Uhr` : ""}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.player_count}/{t.max_players}</span>
                    </div>
                  </div>
                  {t.status === "abgeschlossen" && (
                    <div className="text-right ml-4">
                      <p className="text-xs text-muted-foreground">Abgeschlossen</p>
                    </div>
                  )}
                </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
