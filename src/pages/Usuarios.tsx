import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Power, PowerOff, Pencil, Trash2, Eye, EyeOff, Building2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type AppRole = "admin" | "cliente";

const typeConfig: Record<string, { label: string; className: string }> = {
  admin: { label: "Admin", className: "bg-primary/10 text-primary" },
  cliente: { label: "Cliente", className: "bg-muted text-muted-foreground" },
};

function calcLifetime(startDate: string | null): string {
  if (!startDate) return "—";
  const start = new Date(startDate);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (months < 1) return "< 1 mês";
  if (months === 1) return "1 mês";
  return `${months} meses`;
}

const Usuarios = () => {
  const qc = useQueryClient();
  const { createUser } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "cliente" as AppRole });
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteUserId, setDeleteUserId] = useState<any>(null);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const { error } = await createUser(form.email, form.password, form.name, form.role);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
      setShowAdd(false);
      setForm({ name: "", email: "", password: "", role: "cliente" });
      toast.success("Usuário criado com sucesso");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao criar usuário"),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active, user_id }: { id: string; active: boolean; user_id: string }) => {
      const { error } = await supabase.from("profiles").update({ active }).eq("id", id);
      if (error) throw error;
      if (!active) {
        const { data: clientData } = await supabase.from("clients").select("id").eq("user_id", user_id);
        if (clientData && clientData.length > 0) {
          await supabase.from("clients").update({ active: false }).eq("id", clientData[0].id);
        }
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profiles"] }); toast.success("Status atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteUserMut = useMutation({
    mutationFn: async (user: any) => {
      const { data: clientData } = await supabase.from("clients").select("id").eq("user_id", user.user_id);
      if (clientData && clientData.length > 0) {
        await supabase.from("clients").update({ active: false }).eq("id", clientData[0].id);
      }
      const { error } = await supabase.from("profiles").delete().eq("id", user.id);
      if (error) throw error;
      await supabase.from("user_roles").delete().eq("user_id", user.user_id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profiles"] }); setDeleteUserId(null); toast.success("Usuário excluído"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateUser = useMutation({
    mutationFn: async (u: { id: string; full_name: string; email: string; contract_start_date: string | null }) => {
      const updateData: any = { full_name: u.full_name, email: u.email };
      if (u.contract_start_date) updateData.contract_start_date = u.contract_start_date;
      const { error } = await supabase.from("profiles").update(updateData).eq("id", u.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profiles"] }); setEditUser(null); toast.success("Usuário atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = profiles.filter((u: any) => filterType === "all" || u.role === filterType);
  const activeCount = profiles.filter((u: any) => u.active).length;

  if (isLoading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Usuários</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeCount} ativos de {profiles.length} total</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Usuário</Button>
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-0.5 w-fit flex-wrap">
        {[{ value: "all", label: "Todos" }, { value: "admin", label: "Admin" }, { value: "cliente", label: "Cliente" }].map(tab => (
          <button key={tab.value} onClick={() => setFilterType(tab.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterType === tab.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{tab.label}</button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Usuário</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Email</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Perfil</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
            <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">CSV Import</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Início Contrato</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Lifetime</th>
            <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Ações</th>
          </tr></thead>
          <tbody>
            {filtered.map((u: any) => {
              const tc = typeConfig[u.role] || typeConfig.cliente;
              const contractDate = u.contract_start_date || u.created_at;
              return (
                <tr key={u.id} className={`border-b border-border last:border-0 hover:bg-muted/30 ${!u.active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{u.full_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}</div><span className="text-sm font-medium">{u.full_name}</span></div></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${tc.className}`}>{tc.label}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${u.active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{u.active ? "Ativo" : "Inativo"}</span></td>
                  <td className="px-4 py-3 text-center">
                    {u.role === "cliente" && (
                      <Switch checked={u.csv_import_enabled || false} onCheckedChange={(checked) => {
                        supabase.from("profiles").update({ csv_import_enabled: checked }).eq("id", u.id).then(({ error }) => {
                          if (error) toast.error(error.message);
                          else { qc.invalidateQueries({ queryKey: ["profiles"] }); toast.success(checked ? "CSV habilitado" : "CSV desabilitado"); }
                        });
                      }} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(contractDate).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-sm font-medium">{calcLifetime(contractDate)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditUser({ ...u, contract_start_date_input: u.contract_start_date || (u.created_at ? u.created_at.split("T")[0] : "") })} className="p-1.5 rounded-md hover:bg-muted">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => toggleActive.mutate({ id: u.id, active: !u.active, user_id: u.user_id })} className="p-1.5 rounded-md hover:bg-muted">
                        {u.active ? <PowerOff className="h-3.5 w-3.5 text-warning" /> : <Power className="h-3.5 w-3.5 text-success" />}
                      </button>
                      <button onClick={() => setDeleteUserId(u)} className="p-1.5 rounded-md hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ClientCrmVisibility />


      <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogContent><DialogHeader><DialogTitle>Novo Usuário</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nome completo" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <input type="password" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Senha" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as AppRole }))}>
            <option value="admin">Admin</option><option value="cliente">Cliente</option>
          </select>
        </div>
        <DialogFooter><Button onClick={() => { if (form.name && form.email && form.password) createMut.mutate(); }} disabled={createMut.isPending}>{createMut.isPending ? "Criando..." : "Criar Usuário"}</Button></DialogFooter>
      </DialogContent></Dialog>

      {/* Edit user dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
          {editUser && (
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Nome completo</label>
                <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editUser.full_name} onChange={e => setEditUser((p: any) => ({ ...p, full_name: e.target.value }))} /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editUser.email} onChange={e => setEditUser((p: any) => ({ ...p, email: e.target.value }))} /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Data de Início do Contrato</label>
                <input type="date" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editUser.contract_start_date_input} onChange={e => setEditUser((p: any) => ({ ...p, contract_start_date_input: e.target.value }))} />
                <p className="text-[10px] text-muted-foreground mt-1">Permite datas passadas para gestão retroativa</p></div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { if (editUser && editUser.full_name && editUser.email) updateUser.mutate({ id: editUser.id, full_name: editUser.full_name, email: editUser.email, contract_start_date: editUser.contract_start_date_input || null }); }} disabled={updateUser.isPending}>
              {updateUser.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete user confirm */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário <strong>{deleteUserId?.full_name}</strong> será excluído. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteUserId) deleteUserMut.mutate(deleteUserId); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Usuarios;
