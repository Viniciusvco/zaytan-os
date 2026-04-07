import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Building2, CheckCircle2, Clock, AlertCircle, XCircle, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const statusTabs = [
  { value: "all", label: "Todos" },
  { value: "ativo", label: "Ativos" },
  { value: "onboarding", label: "Onboarding" },
  { value: "inativo", label: "Inativos" },
];

const Clientes = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMut = useMutation({
    mutationFn: async (p: typeof form) => {
      const { error } = await supabase.from("clients").insert(p);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setShowAdd(false); setForm({ name: "", email: "", phone: "", company: "" }); toast.success("Cliente criado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async (p: any) => {
      const { id, created_at, updated_at, ...rest } = p;
      const { error } = await supabase.from("clients").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setEditClient(null); toast.success("Cliente atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setDeleteId(null); toast.success("Cliente excluído"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = clients.filter((c: any) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.company || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" ||
      (filterStatus === "ativo" && c.active && c.onboarding_complete) ||
      (filterStatus === "onboarding" && c.active && !c.onboarding_complete) ||
      (filterStatus === "inativo" && !c.active);
    return matchSearch && matchStatus;
  });

  const getStatus = (c: any) => {
    if (!c.active) return { label: "Inativo", icon: XCircle, className: "bg-destructive/10 text-destructive" };
    if (!c.onboarding_complete) return { label: "Onboarding", icon: Clock, className: "bg-info/10 text-info" };
    return { label: "Ativo", icon: CheckCircle2, className: "bg-success/10 text-success" };
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Clientes</h1><p className="text-sm text-muted-foreground mt-1">{clients.length} clientes cadastrados</p></div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Cliente</Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Buscar clientes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {statusTabs.map(tab => (
            <button key={tab.value} onClick={() => setFilterStatus(tab.value)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterStatus === tab.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{tab.label}</button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cliente</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Empresa</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Email</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Telefone</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
            <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Ações</th>
          </tr></thead>
          <tbody>
            {filtered.map((client: any) => {
              const status = getStatus(client);
              const StatusIcon = status.icon;
              return (
                <tr key={client.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="h-4 w-4 text-primary" /></div><span className="text-sm font-medium">{client.name}</span></div></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{client.company || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{client.email || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{client.phone || "—"}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${status.className}`}><StatusIcon className="h-3 w-3" /> {status.label}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditClient({ ...client })} className="p-1.5 rounded-md hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      <button onClick={() => setDeleteId(client.id)} className="p-1.5 rounded-md hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogContent><DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Empresa" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
          <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Telefone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
        </div>
        <DialogFooter><Button onClick={() => { if (form.name) createMut.mutate(form); }} disabled={createMut.isPending}>{createMut.isPending ? "Criando..." : "Adicionar"}</Button></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={!!editClient} onOpenChange={() => setEditClient(null)}><DialogContent><DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
        {editClient && <div className="space-y-3">
          <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editClient.name} onChange={e => setEditClient({ ...editClient, name: e.target.value })} />
          <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Empresa" value={editClient.company || ""} onChange={e => setEditClient({ ...editClient, company: e.target.value })} />
          <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Email" value={editClient.email || ""} onChange={e => setEditClient({ ...editClient, email: e.target.value })} />
          <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Telefone" value={editClient.phone || ""} onChange={e => setEditClient({ ...editClient, phone: e.target.value })} />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editClient.active} onChange={e => setEditClient({ ...editClient, active: e.target.checked })} /> Ativo</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editClient.onboarding_complete} onChange={e => setEditClient({ ...editClient, onboarding_complete: e.target.checked })} /> Onboarding Completo</label>
          </div>
        </div>}
        <DialogFooter><Button onClick={() => { if (editClient) updateMut.mutate(editClient); }} disabled={updateMut.isPending}>{updateMut.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
      </DialogContent></Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir cliente?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { if (deleteId) deleteMut.mutate(deleteId); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent></AlertDialog>
    </div>
  );
};

export default Clientes;
