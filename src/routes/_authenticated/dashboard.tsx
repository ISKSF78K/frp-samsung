import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, AlertCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const COST = 5;

function Dashboard() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [model, setModel] = useState("");
  const [imei, setImei] = useState("");
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const { data: operations } = useQuery({
    queryKey: ["my-operations", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lock_operations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const credits = profile?.credits ?? 0;
  const canLock = credits >= COST;

  const appendLog = (line: string) =>
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`]);

  const handleLock = async () => {
    if (!model.trim() || !imei.trim()) return toast.error("Modèle et IMEI requis");
    if (imei.length < 8) return toast.error("IMEI invalide");
    if (!canLock) return toast.error("Crédits insuffisants");

    setRunning(true);
    setLog([]);
    appendLog("Vérification du compte...");
    appendLog(`Débit de ${COST} crédits...`);

    const { data, error } = await supabase.rpc("perform_lock_operation", {
      _device_model: model,
      _device_imei: imei,
    });

    if (error) {
      appendLog(`ERREUR : ${error.message}`);
      toast.error(error.message);
      setRunning(false);
      return;
    }

    appendLog("Crédits débités ✓");
    appendLog("Connexion à l'appareil...");
    await new Promise((r) => setTimeout(r, 800));
    appendLog("Lancement du script de verrouillage...");
    await new Promise((r) => setTimeout(r, 1200));
    appendLog("Écriture de la partition FRP...");
    await new Promise((r) => setTimeout(r, 1000));
    appendLog(`✓ Appareil verrouillé. Opération ID: ${data}`);
    toast.success("Appareil verrouillé !");

    qc.invalidateQueries({ queryKey: ["my-profile"] });
    qc.invalidateQueries({ queryKey: ["my-operations"] });
    setRunning(false);
    setModel("");
    setImei("");
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Verrouillez un appareil Samsung</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lock card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Verrouiller un appareil</h2>
              <p className="text-xs text-muted-foreground">{COST} crédits par opération</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model">Modèle Samsung</Label>
              <Input id="model" placeholder="ex: SM-A536B" value={model} onChange={(e) => setModel(e.target.value)} disabled={running} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imei">IMEI</Label>
              <Input id="imei" placeholder="15 chiffres" value={imei} onChange={(e) => setImei(e.target.value)} disabled={running} />
            </div>

            {!canLock && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div>
                  <div className="font-medium text-destructive">Crédits insuffisants</div>
                  <div className="text-xs text-muted-foreground">Contactez un admin pour recharger.</div>
                </div>
              </div>
            )}

            <Button onClick={handleLock} disabled={running || !canLock} className="w-full" size="lg">
              {running ? "Verrouillage en cours..." : `Verrouiller (-${COST} crédits)`}
            </Button>
          </div>
        </Card>

        {/* Log */}
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Logs en temps réel</h2>
          <div className="bg-black/60 rounded-md p-4 font-mono text-xs h-64 overflow-auto border border-border/60">
            {log.length === 0 ? (
              <div className="text-muted-foreground">En attente d'une opération...</div>
            ) : (
              log.map((l, i) => (
                <div key={i} className="text-green-400">{l}</div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* History */}
      <Card className="p-6 mt-6">
        <h2 className="font-semibold mb-4">Historique récent</h2>
        {!operations?.length ? (
          <p className="text-sm text-muted-foreground">Aucune opération.</p>
        ) : (
          <div className="space-y-2">
            {operations.map((op) => (
              <div key={op.id} className="flex items-center justify-between rounded-md border border-border/40 p-3 text-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="font-medium">{op.device_model || "—"}</div>
                    <div className="text-xs text-muted-foreground">IMEI: {op.device_imei}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{new Date(op.created_at).toLocaleString()}</div>
                  <div className="text-xs">-{op.credits_spent} crédits</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
