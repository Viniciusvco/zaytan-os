import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, ArrowDownRight, Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DateRangeFilter, useDefaultDateRange } from "@/components/DateRangeFilter";
import { ContextFilters } from "@/components/ContextFilters";
import { toast } from "sonner";

type FinancialType = "receita" | "despesa";
type PaymentStatus = "pendente" | "pago" | "atrasado";

const emptyForm = { amount: 0, type: "receita" as FinancialType, status: "pendente" as PaymentStatus, description: "", category: "", client_id: "", due_date: "", is_mrr: false };

const emptyMrrForm = { client_id: "", mrr_value: 0, description: "MRR" };

const Financeiro = () => {
  const qc = useQueryClient();
  const [dateRange, setDateRange] = useState(useDefaultDateRange());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showMrr, setShowMrr] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [mrrForm, setMrrForm] = useState(emptyMrrForm);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["financial_records"],
    queryFn: async () => {
      const { data, error } = await supabase.from("financial_records").select("*, clients(name)").order("created_at", { ascending: false });
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
      const payload: any = { amount: p.amount, type: p.type, status: p.status, description: p.description || null, category: p.category || null, client_id: p.client_id || null, due_date: p.due_date || null };
      const { error } = await supabase.from("financial_records").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["financial_records"] }); setShowAdd(false); setForm(emptyForm); toast.success("Lançamento criado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const createMrrMut = useMutation({
    mutationFn: async (p: typeof emptyMrrForm) => {
      const payload: any = { amount: p.mrr_value, type: "receita" as FinancialType, status: "pendente" as PaymentStatus, description: p.description || "MRR", category: "MRR", client_id: p.client_id || null };
      const { error } = await supabase.from("financial_records").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["financial_records"] }); setShowMrr(false); setMrrForm(emptyMrrForm); toast.success("MRR cadastrado"); },
  });

  const updateMut = useMutation({
    mutationFn: async (p: any) => {
      const { id, created_at, updated_at, clients: _c, ...rest } = p;
      if (!rest.client_id) rest.client_id = null;
      if (!rest.due_date) rest.due_date = null;
      if (!rest.paid_date) rest.paid_date = null;
      const { error } = await supabase.from("financial_records").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["financial_records"] }); setEditRecord(null); toast.success("Lançamento atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["financial_records"] }); setDeleteId(null); toast.success("Lançamento excluído"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = records.filter((r: any) => {
    const matchSearch = (r.description || "").toLowerCase().includes(search.toLowerCase()) || (r.clients?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || r.type === typeFilter;
    const matchClient = clientFilter === "all" || r.client_id === clientFilter;
    return matchSearch && matchType && matchClient;
  });

  const receitas = records.filter((r: any) => r.type === "receita");
  const despesas = records.filter((r: any) => r.type === "despesa");
  const totalReceita = receitas.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const totalDespesa = despesas.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const lucro = totalReceita - totalDespesa;
  const margem = totalReceita > 0 ? Math.round((lucro / totalReceita) * 100) : 0;

  const RecordForm = ({ data, onChange }: { data: any; onChange: (d: any) => void }) => (
    <div className="space-y-3">
      <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={data.type} onChange={e => onChange({ ...data, type: e.target.value })}>
        <option value="receita">Receita</option><option value="despesa">Despesa</option>
      </select>
      <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Valor (R$)" value={data.amount || ""} onChange={e => onChange({ ...data, amount: Number(e.target.value) })} />
      <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Descrição" value={data.description || ""} onChange={e => onChange({ ...data, description: e.target.value })} />
      <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Categoria (ex: MRR, Setup, Ferramenta)" value={data.category || ""} onChange={e => onChange({ ...data, category: e.target.value })} />
      <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={data.client_id || ""} onChange={e => onChange({ ...data, client_id: e.target.value })}>
        <option value="">Sem cliente</option>
        {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={data.status} onChange={e => onChange({ ...data, status: e.target.value })}>
        <option value="pendente">Pendente</option><option value="pago">Pago</option><option value="atrasado">Atrasado</option>
      </select>
      <input type="date" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.due_date || ""} onChange={e => onChange({ ...data, due_date: e.target.value })} />
    </div>
  );

  if (isLoading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Financial Intelligence</h1><p className="text-sm text-muted-foreground mt-1">Receitas, custos e margem real</p></div>
        <div className="flex items-center gap-2">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button variant="outline" onClick={() => setShowMrr(true)}><DollarSign className="h-4 w-4 mr-1" /> Cadastrar MRR</Button>
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Lançamento</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Receita Total", value: totalReceita, icon: DollarSign, color: "primary" },
          { label: "Despesa Total", value: totalDespesa, icon: ArrowDownRight, color: "destructive" },
          { label: "Lucro", value: lucro, icon: TrendingUp, color: "success" },
          { label: "Margem", value: margem, icon: TrendingUp, color: "success", suffix: "%" },
        ].map(m => (
          <div key={m.label} className="metric-card">
            <m.icon className={`h-4 w-4 text-${m.color} mb-1`} />
            <p className="text-xl font-bold">{m.suffix ? `${m.value}%` : `R$ ${m.value.toLocaleString()}`}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="metric-card">
        <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold">Lançamentos</h3></div>
        <ContextFilters search={search} onSearchChange={setSearch} searchPlaceholder="Buscar..."
          filterGroups={[
            { key: "client", label: "Cliente", options: [
              { label: "Todos", value: "all" },
              ...clients.map((c: any) => ({ label: c.name, value: c.id })),
            ]},
            { key: "type", label: "Tipo", options: [
              { label: "Todos", value: "all" }, { label: "Receita", value: "receita" }, { label: "Despesa", value: "despesa" },
            ]},
          ]}
          activeFilters={{ type: typeFilter, client: clientFilter }}
          onFilterChange={(key, v) => {
            if (key === "type") setTypeFilter(v);
            if (key === "client") setClientFilter(v);
          }}
        />
        <table className="w-full mt-4">
          <thead><tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground pb-2">Descrição</th>
            <th className="text-left text-xs font-medium text-muted-foreground pb-2">Cliente</th>
            <th className="text-left text-xs font-medium text-muted-foreground pb-2">Tipo</th>
            <th className="text-left text-xs font-medium text-muted-foreground pb-2">Categoria</th>
            <th className="text-left text-xs font-medium text-muted-foreground pb-2">Status</th>
            <th className="text-right text-xs font-medium text-muted-foreground pb-2">Valor</th>
            <th className="text-right text-xs font-medium text-muted-foreground pb-2">Ações</th>
          </tr></thead>
          <tbody>
            {filtered.map((r: any) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="py-2 text-sm">{r.description || "—"}</td>
                <td className="py-2 text-sm text-muted-foreground">{r.clients?.name || "—"}</td>
                <td className="py-2"><span className={`text-[10px] px-2 py-0.5 rounded-full ${r.type === "receita" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{r.type === "receita" ? "Receita" : "Despesa"}</span></td>
                <td className="py-2 text-xs text-muted-foreground">{r.category || "—"}</td>
                <td className="py-2"><span className={`text-[10px] px-2 py-0.5 rounded-full ${r.status === "pago" ? "bg-success/10 text-success" : r.status === "atrasado" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>{r.status === "pago" ? "Pago" : r.status === "atrasado" ? "Atrasado" : "Pendente"}</span></td>
                <td className={`py-2 text-right text-sm font-medium ${r.type === "receita" ? "text-success" : "text-destructive"}`}>{r.type === "despesa" ? "-" : ""}R$ {Number(r.amount).toLocaleString()}</td>
                <td className="py-2 text-right"><div className="flex justify-end gap-1">
                  <button onClick={() => setEditRecord({ ...r })} className="p-1 rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button onClick={() => setDeleteId(r.id)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                </div></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">Nenhum lançamento encontrado</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogContent><DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
        <RecordForm data={form} onChange={setForm} />
        <DialogFooter><Button onClick={() => { if (form.amount > 0) createMut.mutate(form); }} disabled={createMut.isPending}>{createMut.isPending ? "Criando..." : "Adicionar"}</Button></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={!!editRecord} onOpenChange={() => setEditRecord(null)}><DialogContent><DialogHeader><DialogTitle>Editar Lançamento</DialogTitle></DialogHeader>
        {editRecord && <RecordForm data={editRecord} onChange={setEditRecord} />}
        <DialogFooter><Button onClick={() => { if (editRecord) updateMut.mutate(editRecord); }} disabled={updateMut.isPending}>{updateMut.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
      </DialogContent></Dialog>

      {/* MRR Dialog */}
      <Dialog open={showMrr} onOpenChange={setShowMrr}><DialogContent><DialogHeader><DialogTitle>Cadastrar MRR (Receita Recorrente)</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Cliente</label>
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={mrrForm.client_id} onChange={e => setMrrForm(p => ({ ...p, client_id: e.target.value }))}>
              <option value="">Selecione o cliente</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Valor MRR (R$)</label>
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ex: 2500" value={mrrForm.mrr_value || ""} onChange={e => setMrrForm(p => ({ ...p, mrr_value: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="MRR - Gestão de Tráfego" value={mrrForm.description} onChange={e => setMrrForm(p => ({ ...p, description: e.target.value }))} />
          </div>
        </div>
        <DialogFooter><Button onClick={() => { if (mrrForm.client_id && mrrForm.mrr_value > 0) createMrrMut.mutate(mrrForm); }} disabled={createMrrMut.isPending}>{createMrrMut.isPending ? "Cadastrando..." : "Cadastrar MRR"}</Button></DialogFooter>
      </DialogContent></Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir lançamento?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { if (deleteId) deleteMut.mutate(deleteId); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent></AlertDialog>
    </div>
  );
};

export default Financeiro;
