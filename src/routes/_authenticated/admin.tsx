import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck, Users, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.user.id)
      .eq("role", "admin");
    if (!data || data.length === 0) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();
  const [adjust, setAdjust] = useState<Record<string, string>>({});

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allOps } = useQuery({
    queryKey: ["admin-operations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lock_operations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const recharge = async (userId: string) => {
    const amount = parseInt(adjust[userId] ?? "0", 10);
    if (!Number.isFinite(amount) || amount === 0) return toast.error("Montant invalide");
    const target = users?.find((u) => u.id === userId);
    if (!target) return;
    const newBalance = Math.max(0, (target.credits ?? 0) + amount);
    const { error } = await supabase.from("profiles").update({ credits: newBalance }).eq("id", userId);
    if (error) return toast.error(error.message);
    toast.success(`Crédits mis à jour : ${newBalance}`);
    setAdjust((p) => ({ ...p, [userId]: "" }));
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    qc.invalidateQueries({ queryKey: ["my-profile"] });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="text-muted-foreground text-sm">Gestion des comptes et des crédits</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Users className="h-3.5 w-3.5" /> Utilisateurs</div>
          <div className="text-2xl font-bold mt-1">{users?.length ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Activity className="h-3.5 w-3.5" /> Opérations (50 dernières)</div>
          <div className="text-2xl font-bold mt-1">{allOps?.length ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">Total crédits en circulation</div>
          <div className="text-2xl font-bold mt-1">{users?.reduce((s, u) => s + (u.credits ?? 0), 0) ?? 0}</div>
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="font-semibold mb-4">Utilisateurs</h2>
        <div className="space-y-2">
          {users?.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-4 rounded-md border border-border/40 p-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">{u.username ?? "—"}</div>
                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Solde</div>
                <div className="font-bold text-primary">{u.credits} crédits</div>
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="± qté"
                  className="w-24"
                  value={adjust[u.id] ?? ""}
                  onChange={(e) => setAdjust((p) => ({ ...p, [u.id]: e.target.value }))}
                />
                <Button size="sm" onClick={() => recharge(u.id)}>Appliquer</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Opérations récentes (toutes)</h2>
        <div className="space-y-2">
          {allOps?.map((op) => {
            const owner = users?.find((u) => u.id === op.user_id);
            return (
              <div key={op.id} className="flex items-center justify-between rounded-md border border-border/40 p-3 text-sm">
                <div>
                  <div className="font-medium">{op.device_model} <span className="text-muted-foreground text-xs">({op.device_imei})</span></div>
                  <div className="text-xs text-muted-foreground">par {owner?.username ?? op.user_id.slice(0, 8)}</div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {new Date(op.created_at).toLocaleString()} · -{op.credits_spent}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
