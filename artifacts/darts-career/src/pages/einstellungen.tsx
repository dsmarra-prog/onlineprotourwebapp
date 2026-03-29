import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Wifi, WifiOff, CheckCircle, AlertCircle, ExternalLink, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { Layout } from "@/components/layout";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface ConnectionStatus {
  connected: boolean;
  username: string | null;
  using_env: boolean;
}

export default function EinstellungenPage() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [refreshToken, setRefreshToken] = useState("");
  const [username, setUsername] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  async function loadStatus() {
    try {
      const r = await fetch(`${BASE}/api/career/autodarts/status`);
      const data = await r.json();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  }

  useEffect(() => { loadStatus(); }, []);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!refreshToken.trim()) return;
    setSaving(true);
    setResult(null);
    try {
      const r = await fetch(`${BASE}/api/career/autodarts/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken, username }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Fehler");
      setResult({ ok: true, message: `Verbunden als ${data.username ?? username}!` });
      setRefreshToken("");
      await loadStatus();
    } catch (err: any) {
      setResult({ ok: false, message: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            Einstellungen
          </h1>
          <p className="text-muted-foreground mt-1">Verbinde deinen Autodarts-Account</p>
        </motion.div>

        {/* Current Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border/50 bg-card/50 p-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wifi className="w-5 h-5 text-primary" />
            Verbindungsstatus
          </h2>

          {loadingStatus ? (
            <div className="text-muted-foreground animate-pulse">Lade Status…</div>
          ) : status?.connected ? (
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="font-semibold text-green-400">Verbunden</p>
                {status.username && (
                  <p className="text-sm text-muted-foreground">
                    Account: <span className="text-primary font-mono">{status.username}</span>
                  </p>
                )}
                {status.using_env && (
                  <p className="text-xs text-muted-foreground mt-1">
                    (Standard-Token aus Servereinstellung — du kannst ihn unten überschreiben)
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <WifiOff className="w-6 h-6 text-red-400" />
              <div>
                <p className="font-semibold text-red-400">Nicht verbunden</p>
                <p className="text-sm text-muted-foreground">
                  Trage deinen Refresh-Token ein, um Autodarts-Matches zu verbinden.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Connection Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border/50 bg-card/50 p-6"
        >
          <h2 className="text-lg font-semibold mb-1">Autodarts-Account verbinden</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Gibt deinen Autodarts Refresh-Token ein. Dein Konto wird dadurch mit der App verknüpft.
          </p>

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Autodarts Benutzername
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="z.B. smarradinho"
                className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Refresh-Token <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={refreshToken}
                  onChange={e => setRefreshToken(e.target.value)}
                  placeholder="eyJhbGciOi…"
                  required
                  className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-2.5 pr-12 text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {result && (
              <div
                className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
                  result.ok
                    ? "bg-green-500/10 border border-green-500/30 text-green-400"
                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                }`}
              >
                {result.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {result.message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !refreshToken.trim()}
              className="w-full py-3 rounded-lg bg-primary text-black font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {saving ? "Verbinde…" : "Account verbinden"}
            </button>
          </form>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border/50 bg-card/50 p-6"
        >
          <button
            onClick={() => setShowHelp(v => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary/70" />
              Wie bekomme ich meinen Refresh-Token?
            </h2>
            {showHelp ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>

          {showHelp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 space-y-3 text-sm text-muted-foreground"
            >
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  Öffne{" "}
                  <a
                    href="https://play.autodarts.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    play.autodarts.io
                    <ExternalLink className="w-3 h-3" />
                  </a>{" "}
                  und melde dich an.
                </li>
                <li>Drücke <kbd className="bg-background border border-border px-1.5 py-0.5 rounded text-xs">F12</kbd> um die Browser-Entwicklerwerkzeuge zu öffnen.</li>
                <li>
                  Gehe auf den Tab <strong className="text-foreground">Anwendung</strong> (Application) → <strong className="text-foreground">Lokaler Speicher</strong> (Local Storage) →{" "}
                  <code className="text-primary">https://play.autodarts.io</code>
                </li>
                <li>
                  Suche nach dem Eintrag <code className="text-primary font-mono">oidc.user:…</code> und klicke darauf.
                </li>
                <li>
                  Kopiere den Wert bei <code className="text-primary font-mono">refresh_token</code> aus dem JSON-Text.
                </li>
                <li>Füge ihn oben ein und klicke auf <strong className="text-foreground">Account verbinden</strong>.</li>
              </ol>
              <p className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-300/80 text-xs">
                ⚠️ Der Refresh-Token ist wie ein Passwort — teile ihn mit niemandem. Er wird sicher in der Datenbank gespeichert.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
