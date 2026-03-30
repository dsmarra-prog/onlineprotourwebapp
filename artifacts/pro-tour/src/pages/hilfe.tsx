import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, Send, MessageSquare, CheckCircle, Clock, Lock, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePlayer } from "@/context/PlayerContext";
import { apiFetch } from "@/lib/api";

type TicketStatus = "offen" | "beantwortet" | "geschlossen";

type SupportTicket = {
  id: number;
  player_id: number;
  player_name?: string;
  subject: string;
  message: string;
  status: TicketStatus;
  admin_reply: string | null;
  replied_by: number | null;
  created_at: string;
  replied_at: string | null;
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: typeof Clock }> = {
  offen: { label: "Offen", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", icon: Clock },
  beantwortet: { label: "Beantwortet", color: "text-green-400 bg-green-400/10 border-green-400/30", icon: CheckCircle },
  geschlossen: { label: "Geschlossen", color: "text-muted-foreground bg-muted/30 border-border", icon: Lock },
};

function StatusBadge({ status }: { status: TicketStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.offen;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

function TicketCard({ ticket, isAdmin, onReply, onClose }: {
  ticket: SupportTicket;
  isAdmin: boolean;
  onReply?: (id: number, reply: string, close: boolean) => void;
  onClose?: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [closeAfter, setCloseAfter] = useState(false);

  const canReply = isAdmin && ticket.status !== "geschlossen";
  const canClose = !isAdmin && ticket.status !== "geschlossen";

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <button
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-accent/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{ticket.subject}</span>
            <StatusBadge status={ticket.status as TicketStatus} />
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {isAdmin && ticket.player_name && <span className="font-medium text-foreground">{ticket.player_name}</span>}
            <span>{new Date(ticket.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <div className="bg-muted/30 rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap">{ticket.message}</div>

          {ticket.admin_reply && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <ShieldCheck className="w-3.5 h-3.5" />Admin-Antwort
                {ticket.replied_at && (
                  <span className="font-normal text-muted-foreground ml-1">
                    {new Date(ticket.replied_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.admin_reply}</p>
            </div>
          )}

          {canReply && onReply && (
            <div className="space-y-2 pt-1">
              <textarea
                className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Antwort schreiben..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={closeAfter}
                    onChange={(e) => setCloseAfter(e.target.checked)}
                  />
                  Ticket danach schliessen
                </label>
                <Button
                  size="sm"
                  className="ml-auto"
                  disabled={!replyText.trim()}
                  onClick={() => { onReply(ticket.id, replyText, closeAfter); setReplyText(""); }}
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />Antworten
                </Button>
              </div>
            </div>
          )}

          {canClose && onClose && ticket.status === "beantwortet" && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => onClose(ticket.id)}
            >
              <Lock className="w-3 h-3 mr-1.5" />Als geloest markieren
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function HilfePage() {
  const { currentPlayer, sessionPin } = usePlayer();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAdmin = currentPlayer?.is_admin ?? false;

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState<"alle" | TicketStatus>("alle");

  const ticketQuery = useQuery<SupportTicket[]>({
    queryKey: isAdmin ? ["support-tickets-all"] : ["support-tickets-mine", currentPlayer?.id],
    queryFn: () => {
      if (!currentPlayer || !sessionPin) return [];
      const params = new URLSearchParams({ player_id: String(currentPlayer.id), pin: sessionPin });
      const path = isAdmin ? `/tour/support/tickets?${params}` : `/tour/support/tickets/mine?${params}`;
      return apiFetch<SupportTicket[]>(path);
    },
    enabled: !!currentPlayer && !!sessionPin,
  });

  const submitMut = useMutation({
    mutationFn: () => apiFetch<SupportTicket>("/tour/support/tickets", {
      method: "POST",
      body: JSON.stringify({ player_id: currentPlayer!.id, pin: sessionPin, subject, message }),
    }),
    onSuccess: () => {
      setSubject("");
      setMessage("");
      toast({ title: "Ticket eingereicht!", description: "Wir melden uns so bald wie moeglich." });
      qc.invalidateQueries({ queryKey: ["support-tickets-mine", currentPlayer?.id] });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Fehler", description: e.message }),
  });

  const replyMut = useMutation({
    mutationFn: ({ id, reply, close }: { id: number; reply: string; close: boolean }) =>
      apiFetch(`/tour/support/tickets/${id}/reply`, {
        method: "POST",
        body: JSON.stringify({ player_id: currentPlayer!.id, pin: sessionPin, reply, status: close ? "geschlossen" : "beantwortet" }),
      }),
    onSuccess: () => {
      toast({ title: "Antwort gesendet" });
      qc.invalidateQueries({ queryKey: ["support-tickets-all"] });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Fehler", description: e.message }),
  });

  const closeMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/tour/support/tickets/${id}/close`, {
      method: "POST",
      body: JSON.stringify({ player_id: currentPlayer!.id, pin: sessionPin }),
    }),
    onSuccess: () => {
      toast({ title: "Ticket geschlossen" });
      qc.invalidateQueries({ queryKey: ["support-tickets-mine", currentPlayer?.id] });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Fehler", description: e.message }),
  });

  const tickets = ticketQuery.data ?? [];
  const filtered = filterStatus === "alle" ? tickets : tickets.filter((t) => t.status === filterStatus);
  const openCount = tickets.filter((t) => t.status === "offen").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <HelpCircle className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Hilfe & Support</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? `Support-Eingang — ${openCount} offene Tickets` : "Stelle eine Frage oder melde ein Problem"}
          </p>
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />Neue Anfrage stellen
          </h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Betreff</Label>
              <Input
                id="subject"
                placeholder="z.B. Problem beim Check-In"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Nachricht</Label>
              <textarea
                id="message"
                className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Beschreibe dein Anliegen so detailliert wie moeglich..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
              />
            </div>
            <Button
              className="w-full"
              disabled={!subject.trim() || !message.trim() || submitMut.isPending}
              onClick={() => submitMut.mutate()}
            >
              {submitMut.isPending ? "Wird gesendet..." : "Anfrage absenden"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-semibold">{isAdmin ? "Alle Tickets" : "Meine Anfragen"}</h2>
          <div className="flex items-center gap-1 flex-wrap">
            {(["alle", "offen", "beantwortet", "geschlossen"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${
                  filterStatus === s
                    ? "bg-primary/15 text-primary border-primary/30 font-semibold"
                    : "text-muted-foreground border-border hover:bg-accent"
                }`}
              >
                {s === "alle" ? "Alle" : STATUS_CONFIG[s].label}
                {s !== "alle" && (
                  <span className="ml-1 opacity-70">({tickets.filter((t) => t.status === s).length})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {ticketQuery.isLoading && (
          <div className="text-center py-10 text-muted-foreground text-sm">Laden...</div>
        )}

        {!ticketQuery.isLoading && filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            {tickets.length === 0 ? "Noch keine Anfragen vorhanden." : "Keine Tickets in diesem Status."}
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              isAdmin={isAdmin}
              onReply={isAdmin ? (id, reply, close) => replyMut.mutate({ id, reply, close }) : undefined}
              onClose={!isAdmin ? (id) => closeMut.mutate(id) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
