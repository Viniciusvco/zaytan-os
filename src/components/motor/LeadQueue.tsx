import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Play, Package, AlertTriangle, Upload, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

type Props = { campaignId: string | null };

const statusLabels: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-warning/10 text-warning" },
  em_processamento: { label: "Em Processamento", className: "bg-info/10 text-info" },
  distribuido: { label: "Distribuído", className: "bg-success/10 text-success" },
  duplicado: { label: "Duplicado", className: "bg-destructive/10 text-destructive" },
  expirado: { label: "Expirado", className: "bg-muted text-muted-foreground" },
  estoque: { label: "Estoque", className: "bg-primary/10 text-primary" },
};

export function LeadQueue({ campaignId }: Props) {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newLeads, setNewLeads] = useState("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["lead-queue", campaignId, statusFilter],
    queryFn: async () => {
      if (!campaignId) return [];
      let query = supabase.from("lead_queue")
        .select("*, clients:assigned_client_id(name)")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });

  const distributeMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("distribute-leads", {
        body: { action: "distribute", campaign_id: campaignId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["lead-queue"] });
      qc.invalidateQueries({ queryKey: ["motor-metrics"] });
      toast.success(`${data.distributed} leads distribuídos${data.stocked > 0 ? `, ${data.stocked} para estoque` : ""}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const ingestMut = useMutation({
    mutationFn: async (leadsData: any[]) => {
      const { data, error } = await supabase.functions.invoke("distribute-leads", {
        body: { action: "ingest", campaign_id: campaignId, leads: leadsData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["lead-queue"] });
      toast.success(`${data.inserted} leads inseridos, ${data.duplicated} duplicados`);
      setShowAdd(false);
      setNewLeads("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const expireMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("distribute-leads", {
        body: { action: "expire_stock" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["lead-queue"] });
      toast.success(`${data.expired_count} leads expirados`);
    },
  });

  const handleBulkIngest = () => {
    try {
      const lines = newLeads.trim().split("\n").filter(Boolean);
      const parsed = lines.map(line => {
        const parts = line.split(",").map(s => s.trim());
        return { name: parts[0] || "Lead", phone: parts[1] || null, email: parts[2] || null, source: parts[3] || null };
      });
      if (parsed.length === 0) { toast.error("Nenhum lead para inserir"); return; }
      ingestMut.mutate(parsed);
    } catch {
      toast.error("Formato inválido. Use: nome, telefone, email, fonte (um por linha)");
    }
  };

  if (!campaignId) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Selecione uma campanha</div>;
  }

  const pendingCount = leads.filter((l: any) => l.status === "pendente").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select className="h-8 px-2 rounded-lg bg-muted border-0 text-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Todos</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            <Upload className="h-4 w-4 mr-1" /> Ingerir Leads
          </Button>
          <Button size="sm" variant="outline" onClick={() => expireMut.mutate()}>
            <AlertTriangle className="h-4 w-4 mr-1" /> Expirar Estoque
          </Button>
          <Button size="sm" onClick={() => distributeMut.mutate()} disabled={distributeMut.isPending || pendingCount === 0}>
            <Play className="h-4 w-4 mr-1" /> Distribuir ({pendingCount})
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhum lead na fila</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-left px-4 py-2">Telefone</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Fonte</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Distribuído para</th>
              <th className="text-left px-4 py-2">Data</th>
            </tr></thead>
            <tbody>
              {leads.map((l: any) => {
                const st = statusLabels[l.status] || statusLabels.pendente;
                return (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-sm font-medium">{l.name}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{l.phone || "—"}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{l.email || "—"}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{l.source || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.className}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-2.5 text-sm">{(l.clients as any)?.name || "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Ingest Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ingerir Leads</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Um lead por linha: nome, telefone, email, fonte</p>
          <textarea
            className="w-full h-40 px-3 py-2 rounded-lg bg-muted border-0 text-sm focus:outline-none resize-none font-mono"
            placeholder="João Silva, (11) 99999-1234, joao@email.com, meta_ads&#10;Maria Oliveira, (21) 88888-5678, maria@email.com, google"
            value={newLeads}
            onChange={e => setNewLeads(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={handleBulkIngest} disabled={ingestMut.isPending || !newLeads.trim()}>
              {ingestMut.isPending ? "Inserindo..." : "Inserir Leads"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
