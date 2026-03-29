import { useEffect, useState } from "react";
import { Target, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function AutodartsCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("t");

    // Clear token from URL immediately so it doesn't linger in browser history
    if (token) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (!token) {
      setStatus("error");
      setMessage("Kein Token erhalten. Bitte erneut versuchen.");
      return;
    }

    const stored = localStorage.getItem("autodarts_connect");
    if (!stored) {
      setStatus("error");
      setMessage("Verbindungs-Session abgelaufen. Bitte den Vorgang von vorne starten.");
      return;
    }

    const { player_id, pin } = JSON.parse(stored);
    localStorage.removeItem("autodarts_connect");

    apiFetch<{ ok: boolean; message?: string; error?: string }>(
      `/tour/players/${player_id}/autodarts-connect`,
      {
        method: "POST",
        body: JSON.stringify({ token, pin }),
      }
    )
      .then((data) => {
        if (data.ok) {
          setStatus("success");
          setMessage(data.message ?? "Erfolgreich verbunden!");
        } else {
          setStatus("error");
          setMessage(data.error ?? "Unbekannter Fehler");
        }
      })
      .catch((e: Error) => {
        setStatus("error");
        setMessage(e.message);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-card border border-border rounded-2xl p-8 text-center space-y-5">
        <div className="flex justify-center">
          <Target className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-xl font-bold">Autodarts verbinden</h1>

        {status === "loading" && (
          <>
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Verbindung wird hergestellt…</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto" />
            <p className="text-sm text-green-400 font-semibold">{message}</p>
            <p className="text-xs text-muted-foreground">
              Dein Autodarts-Account ist jetzt verknüpft. Du kannst diesen Tab schließen.
            </p>
            <Button className="w-full" onClick={() => window.close()}>
              Tab schließen
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-10 h-10 text-destructive mx-auto" />
            <p className="text-sm text-destructive font-semibold">Verbindung fehlgeschlagen</p>
            <p className="text-xs text-muted-foreground break-all">{message}</p>
            <Button variant="outline" className="w-full" onClick={() => window.close()}>
              Tab schließen
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
