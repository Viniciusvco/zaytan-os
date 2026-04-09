import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { CreditCard, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const VisaoContratos = () => {
  const { role } = useRole();
  const qc = useQueryClient();
  const [clientFilter, setClientFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payment-tracking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_tracking")
        .select("*, leads(name, seller_tag, clients(name)), clients(name)")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const togglePaid = useMutation({
    mutationFn: async ({ id, paid }: { id: string; paid: boolean }) => {
      const update: any = { paid };
      if (paid) update.paid_date = new Date().toISOString().split("T")[0];
      else update.paid_date = null;
      const { error } = await supabase.from("payment_tracking").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payment-tracking"] }); toast.success("Status atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_tracking").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payment-tracking"] }); setDeleteTarget(null); toast.success("Registro excluído"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Deduplicate by lead_id — keep only the latest entry per lead
  const deduplicated = useMemo(() => {
    const byClient = payments.filter((p: any) => clientFilter === "all" || p.client_id === clientFilter);
    const seen = new Map<string, any>();
    for (const p of byClient) {
      const key = `${p.lead_id}_${p.client_id}`;
      if (!seen.has(key) || (p.created_at > seen.get(key).created_at)) {
        seen.set(key, p);
      }
    }
    return Array.from(seen.values());
  }, [payments, clientFilter]);

  const today = new Date().toISOString().split("T")[0];
  const totalRecebiveis = deduplicated.reduce((s: number, p: any) => s + Number(p.valor_parcela || 0), 0);
  const inadimplentes = deduplicated.filter((p: any) => !p.paid && p.due_date && p.due_date < today).length;
  const liquidados = deduplicated.filter((p: any) => p.paid).length;

  if (isLoading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Visão de Contratos & Pagamentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Controle de inadimplência e cobranças</p>
        </div>
        {role === "admin" && (
          <select className="h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="all">Todos os clientes</option>
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="metric-card"><p className="text-2xl font-bold">{deduplicated.length}</p><p className="text-xs text-muted-foreground">Total de Parcelas</p></div>
        <div className="metric-card"><p className="text-2xl font-bold">R$ {totalRecebiveis.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Recebíveis</p></div>
        <div className="metric-card"><p className="text-2xl font-bold text-destructive">{inadimplentes}</p><p className="text-xs text-muted-foreground">Inadimplentes</p></div>
        <div className="metric-card"><p className="text-2xl font-bold text-success">{liquidados}</p><p className="text-xs text-muted-foreground">Liquidados</p></div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cliente</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Lead</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Vendedor</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Valor Parcela</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Vencimento</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Pago</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {deduplicated.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">Nenhum pagamento registrado</td></tr>
            )}
            {deduplicated.map((p: any) => {
              const isOverdue = !p.paid && p.due_date && p.due_date < today;
              return (
                <tr key={p.id} className={`border-b border-border last:border-0 transition-colors ${isOverdue ? "bg-destructive/5" : p.paid ? "bg-success/5" : "hover:bg-muted/30"}`}>
                  <td className="px-4 py-3 text-sm font-medium">{p.leads?.clients?.name || p.clients?.name || "—"}</td>
                  <td className="px-4 py-3 text-sm">{p.leads?.name || "—"}</td>
                  <td className="px-4 py-3 text-sm">{p.seller_name || p.leads?.seller_tag || "—"}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">R$ {Number(p.valor_parcela || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                      {p.due_date ? new Date(p.due_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.paid ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Liquidado
                      </span>
                    ) : isOverdue ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Inadimplente
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning">Pendente</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch
                      checked={p.paid}
                      onCheckedChange={(checked) => togglePaid.mutate({ id: p.id, paid: checked })}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors" title="Excluir">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir Registro</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir o registro de <strong>{deleteTarget?.leads?.name || "—"}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deletePayment.mutate(deleteTarget.id)} disabled={deletePayment.isPending}>
              {deletePayment.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisaoContratos;
