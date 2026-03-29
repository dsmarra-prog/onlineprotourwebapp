import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Target, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function AutodartsCallback() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    const errorDesc = params.get("error_description");

    if (error) {
      setStatus("error");
      setMessage(errorDesc ?? error);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("Kein Autorisierungscode erhalten.");
      return;
    }

    const stored = sessionStorage.getItem("autodarts_oauth");
    if (!stored) {
      setStatus("error");
      setMessage("OAuth-Session abgelaufen. Bitte erneut versuchen.");
      return;
    }

    const { code_verifier, player_id, pin, redirect_uri } = JSON.parse(stored);
    sessionStorage.removeItem("autodarts_oauth");

    apiFetch<{ ok: boolean; message?: string; error?: string }>(
      `/tour/players/${player_id}/autodarts-oauth-callback`,
      {
        method: "POST",
        body: JSON.stringify({ code, code_verifier, redirect_uri, pin }),
      }
    )
      .then((data) => {
        if (data.ok) {
          setStatus("success");
          setMessage(data.message ?? "Erfolgreich verbunden!");
          setTimeout(() => navigate("/einstellungen"), 2500);
        } else {
          setStatus("error");
          setMessage(data.error ?? "Unbekannter Fehler");
        }
      })
      .catch((e: Error) => {
        setStatus("error");
        setMessage(e.message);
      });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4">
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
            <p className="text-xs text-muted-foreground">Du wirst weitergeleitet…</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-10 h-10 text-destructive mx-auto" />
            <p className="text-sm text-destructive font-semibold">Verbindung fehlgeschlagen</p>
            <p className="text-xs text-muted-foreground break-all">{message}</p>
            <button
              onClick={() => navigate("/einstellungen")}
              className="text-xs text-primary underline"
            >
              Zurück zu den Einstellungen
            </button>
          </>
        )}
      </div>
    </div>
  );
}
