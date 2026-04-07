import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, Clock, FileQuestion, XCircle, RefreshCw, PieChart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DateRangeFilter, useDefaultDateRange } from "@/components/DateRangeFilter";
import { ContextFilters } from "@/components/ContextFilters";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { Progress } from "@/components/ui/progress";

type ContractStatus = "rascunho" | "ativo" | "cancelado" | "aguardando";

const statusConfig: Record<ContractStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  ativo: { label: "Ativo", icon: CheckCircle2, className: "bg-success/10 text-success" },
  rascunho: { label: "Rascunho", icon: FileQuestion, className: "bg-muted text-muted-foreground" },
  cancelado: { label: "Cancelado", icon: XCircle, className: "bg-destructive/10 text-destructive" },
  aguardando: { label: "Aguardando Assinatura", icon: Clock, className: "bg-warning/10 text-warning" },
};

function daysUntilDate(dateStr: string | null): number {
  if (!dateStr) return 999;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const emptyForm = { client_id: "", title: "", start_date: new Date().toISOString().split("T")[0], end_date: "", setup_value: 0, mrr_value: 0, weekly_investment: 0, status: "rascunho" as ContractStatus, notes: "" };

const Contratos = () => {
  const qc = useQueryClient();
  const [dateRange, setDateRange] = useState(useDefaultDateRange());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editContract, setEditContract] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts").select("*, clients(name)").order("created_at", { ascending: false });
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

  const createMut = useMutation({
    mutationFn: async (p: typeof emptyForm) => {
      const payload: any = { ...p };
      if (!payload.end_date) delete payload.end_date;
      if (!payload.notes) delete payload.notes;
      const { error } = await supabase.from("contracts").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contracts"] }); setShowAdd(false); setForm(emptyForm); toast.success("Contrato criado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async (p: any) => {
      const { id, created_at, updated_at, clients: _c, ...rest } = p;
      if (!rest.end_date) rest.end_date = null;
      if (!rest.notes) rest.notes = null;
      const { error } = await supabase.from("contracts").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contracts"] }); setEditContract(null); toast.success("Contrato atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contracts"] }); setDeleteId(null); toast.success("Contrato excluído"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = contracts.filter((c: any) => {
    const clientName = c.clients?.name || "";
    const matchSearch = clientName.toLowerCase().includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeContracts = contracts.filter((c: any) => c.status === "ativo");
  const totalMRR = activeContracts.reduce((s: number, c: any) => s + Number(c.mrr_value || 0), 0);
  const expiringCount = activeContracts.filter((c: any) => { const d = daysUntilDate(c.end_date); return d <= 30 && d > 0; }).length;

  // Lead distribution calculation (preview)
  const investmentByClient: Record<string, { name: string; investment: number }> = {};
  activeContracts.forEach((c: any) => {
    const cid = c.client_id;
    const name = c.clients?.name || "—";
    if (!investmentByClient[cid]) investmentByClient[cid] = { name, investment: 0 };
    investmentByClient[cid].investment += Number(c.weekly_investment || 0);
  });
  const totalWeeklyInvestment = Object.values(investmentByClient).reduce((s, c) => s + c.investment, 0);
  const distributionPreview = Object.entries(investmentByClient)
    .filter(([_, v]) => v.investment > 0)
    .map(([cid, v]) => ({
      client_id: cid,
      name: v.name,
      investment: v.investment,
      percentage: totalWeeklyInvestment > 0 ? (v.investment / totalWeeklyInvestment) * 100 : 0,
    }));

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("distribute-leads");
      if (error) throw error;
      setSyncResult(data);
      if (data?.total_inserted > 0) {
        toast.success(`${data.total_inserted} leads distribuídos com sucesso!`);
      } else {
        toast.info(data?.message || "Nenhum lead novo para distribuir");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao sincronizar leads");
    } finally {
      setSyncing(false);
    }
  };

  const ContractForm = ({ data, onChange }: { data: any; onChange: (d: any) => void }) => (
    <div className="space-y-3">
      <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={data.client_id} onChange={e => onChange({ ...data, client_id: e.target.value })}>
        <option value="">Selecione o cliente</option>
        {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Título do contrato" value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-[10px] text-muted-foreground font-medium mb-1 block">Data de Início</label>
          <input type="date" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.start_date} onChange={e => onChange({ ...data, start_date: e.target.value })} /></div>
        <div><label className="text-[10px] text-muted-foreground font-medium mb-1 block">Data de Término</label>
          <input type="date" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.end_date || ""} onChange={e => onChange({ ...data, end_date: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Setup (R$)" value={data.setup_value || ""} onChange={e => onChange({ ...data, setup_value: Number(e.target.value) })} />
        <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="MRR (R$)" value={data.mrr_value || ""} onChange={e => onChange({ ...data, mrr_value: Number(e.target.value) })} />
        <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Invest. Semanal (R$)" value={data.weekly_investment || ""} onChange={e => onChange({ ...data, weekly_investment: Number(e.target.value) })} />
      </div>
      <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={data.status} onChange={e => onChange({ ...data, status: e.target.value })}>
        <option value="rascunho">Rascunho</option><option value="aguardando">Aguardando Assinatura</option><option value="ativo">Ativo</option><option value="cancelado">Cancelado</option>
      </select>
      <textarea className="w-full h-16 px-3 py-2 rounded-lg bg-muted border-0 text-sm focus:outline-none resize-none" placeholder="Observações..." value={data.notes || ""} onChange={e => onChange({ ...data, notes: e.target.value })} />
    </div>
  );

  if (isLoading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Gestão de Contratos</h1><p className="text-sm text-muted-foreground mt-1">Lifecycle completo</p></div>
        <div className="flex items-center gap-2">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Contrato</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card"><div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2"><FileText className="h-4 w-4 text-primary" /></div><p className="text-2xl font-bold">{contracts.length}</p><p className="text-xs text-muted-foreground mt-1">Total de Contratos</p></div>
        <div className="metric-card"><div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center mb-2"><CheckCircle2 className="h-4 w-4 text-success" /></div><p className="text-2xl font-bold">R$ {totalMRR.toLocaleString()}</p><p className="text-xs text-muted-foreground mt-1">MRR Ativo</p></div>
        <div className="metric-card"><div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center mb-2"><FileText className="h-4 w-4 text-info" /></div><p className="text-2xl font-bold">{activeContracts.length}</p><p className="text-xs text-muted-foreground mt-1">Contratos Ativos</p></div>
        <div className={`metric-card ${expiringCount > 0 ? "border-primary/50" : ""}`}><div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center mb-2"><AlertTriangle className="h-4 w-4 text-warning" /></div><p className="text-2xl font-bold">{expiringCount}</p><p className="text-xs text-muted-foreground mt-1">Vencendo em 30 dias</p></div>
      </div>

      <ContextFilters search={search} onSearchChange={setSearch} searchPlaceholder="Buscar contratos..."
        filterGroups={[{ key: "status", label: "Status", options: [
          { label: "Todos", value: "all" }, { label: "Ativo", value: "ativo" },
          { label: "Rascunho", value: "rascunho" }, { label: "Aguardando", value: "aguardando" },
          { label: "Cancelado", value: "cancelado" },
        ]}]}
        activeFilters={{ status: statusFilter }}
        onFilterChange={(_, v) => setStatusFilter(v)}
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cliente</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Título</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Início</th>
            <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Setup</th>
            <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">MRR</th>
            <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Invest. Semanal</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Vencimento</th>
            <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Ações</th>
          </tr></thead>
          <tbody>
            {filtered.map((c: any) => {
              const st = statusConfig[c.status as ContractStatus] || statusConfig.rascunho;
              const StIcon = st.icon;
              const days = daysUntilDate(c.end_date);
              const isExpiring = c.status === "ativo" && days <= 30 && days > 0;
              const isExpired = c.status === "ativo" && days <= 0 && c.end_date;
              return (
                <tr key={c.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${isExpiring ? "bg-warning/5" : ""}`}>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="h-4 w-4 text-primary" /></div><span className="text-sm font-medium">{c.clients?.name || "—"}</span></div></td>
                  <td className="px-4 py-3 text-sm">{c.title}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(c.start_date).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-sm text-right">R$ {Number(c.setup_value || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">R$ {Number(c.mrr_value || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right">R$ {Number(c.weekly_investment || 0).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${st.className}`}><StIcon className="h-3 w-3" /> {st.label}</span></td>
                  <td className="px-4 py-3">
                    {c.end_date && c.status === "ativo" && (
                      <div className="flex items-center gap-1.5">
                        {isExpiring && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                        {isExpired && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                        <span className={`text-xs ${isExpiring ? "text-warning font-semibold" : isExpired ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                          {isExpired ? "Vencido" : `${days}d — ${new Date(c.end_date).toLocaleDateString("pt-BR")}`}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditContract({ ...c })} className="p-1.5 rounded-md hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-md hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogContent><DialogHeader><DialogTitle>Novo Contrato</DialogTitle></DialogHeader>
        <ContractForm data={form} onChange={setForm} />
        <DialogFooter><Button onClick={() => { if (form.client_id && form.title) createMut.mutate(form); }} disabled={createMut.isPending}>{createMut.isPending ? "Criando..." : "Criar Contrato"}</Button></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={!!editContract} onOpenChange={() => setEditContract(null)}><DialogContent><DialogHeader><DialogTitle>Editar Contrato</DialogTitle></DialogHeader>
        {editContract && <ContractForm data={editContract} onChange={setEditContract} />}
        <DialogFooter><Button onClick={() => { if (editContract) updateMut.mutate(editContract); }} disabled={updateMut.isPending}>{updateMut.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
      </DialogContent></Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir contrato?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { if (deleteId) deleteMut.mutate(deleteId); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent></AlertDialog>
    </div>
  );
};

export default Contratos;
