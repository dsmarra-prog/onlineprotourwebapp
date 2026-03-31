import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePlayer } from "@/context/PlayerContext";
import { apiFetch } from "@/lib/api";
import { Bell, BellOff, Check, CheckCheck, ArrowRight, Trophy, Target, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

type Notification = {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

function typeIcon(type: string) {
  if (type === "match_ready") return <Trophy className="w-4 h-4 text-primary" />;
  if (type === "match_result") return <Target className="w-4 h-4 text-green-400" />;
  if (type === "tournament_confirmed") return <CheckCheck className="w-4 h-4 text-blue-400" />;
  if (type === "checkin_removed") return <AlertCircle className="w-4 h-4 text-red-400" />;
  return <MessageSquare className="w-4 h-4 text-muted-foreground" />;
}

export default function NachrichtenPage() {
  const { currentPlayer } = usePlayer();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications", currentPlayer?.id],
    queryFn: () => apiFetch(`/tour/players/${currentPlayer!.id}/notifications`),
    enabled: !!currentPlayer,
    refetchInterval: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: number) => apiFetch(`/tour/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", currentPlayer?.id] }),
  });

  const markAll = useMutation({
    mutationFn: () => apiFetch(`/tour/players/${currentPlayer!.id}/notifications/read-all`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", currentPlayer?.id] });
      toast({ title: "Alle als gelesen markiert" });
    },
  });

  if (!currentPlayer) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm">
        Bitte einloggen um Nachrichten zu sehen.
      </div>
    );
  }

  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">Nachrichten</h1>
          {unread > 0 && (
            <span className="text-xs font-bold bg-primary text-black px-2 py-0.5 rounded-full">{unread} neu</span>
          )}
        </div>
        {unread > 0 && (
          <Button size="sm" variant="outline" className="gap-2 text-xs h-8" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            <CheckCheck className="w-3.5 h-3.5" />
            Alle gelesen
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-12 text-muted-foreground text-sm">Laden…</div>
      )}

      {!isLoading && (!notifications || notifications.length === 0) && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <BellOff className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Keine Nachrichten vorhanden</p>
        </div>
      )}

      {notifications && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-card border rounded-xl p-4 transition-all ${
                n.read ? "border-border opacity-70" : "border-primary/30 bg-primary/5"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{typeIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold leading-tight ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!n.read && (
                        <button
                          onClick={() => markRead.mutate(n.id)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          title="Als gelesen markieren"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                      {n.link && (
                        <Link
                          href={n.link.replace("/pro-tour", "")}
                          onClick={() => !n.read && markRead.mutate(n.id)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          title="Öffnen"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: de })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
