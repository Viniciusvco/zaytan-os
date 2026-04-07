import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Shield, Users, User, Power, PowerOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type AppRole = "admin" | "colaborador" | "cliente";
type ColabType = "gestor" | "designer" | "cs";

const typeConfig: Record<string, { label: string; className: string }> = {
  admin: { label: "Admin", className: "bg-primary/10 text-primary" },
  colaborador: { label: "Colaborador", className: "bg-info/10 text-info" },
  cliente: { label: "Cliente", className: "bg-muted text-muted-foreground" },
};

const colabLabels: Record<ColabType, string> = { gestor: "Gestor de Tráfego", designer: "Designer", cs: "CS" };

const Usuarios = () => {
  const qc = useQueryClient();
  const { createUser } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "cliente" as AppRole, colaborador_type: "gestor" as ColabType });

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const { error } = await createUser(
        form.email, form.password, form.name, form.role,
        form.role === "colaborador" ? form.colaborador_type : undefined
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
      setShowAdd(false);
      setForm({ name: "", email: "", password: "", role: "cliente", colaborador_type: "gestor" });
      toast.success("Usuário criado com sucesso");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao criar usuário"),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("profiles").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profiles"] }); toast.success("Status atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = profiles.filter((u: any) => filterType === "all" || u.role === filterType);
  const activeCount = profiles.filter((u: any) => u.active).length;

  if (isLoading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Gestão de Usuários</h1><p className="text-sm text-muted-foreground mt-1">{activeCount} ativos de {profiles.length} total</p></div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Usuário</Button>
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-0.5 w-fit flex-wrap">
        {[{ value: "all", label: "Todos" }, { value: "admin", label: "Admin" }, { value: "colaborador", label: "Colaborador" }, { value: "cliente", label: "Cliente" }].map(tab => (
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
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Criado em</th>
            <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Ações</th>
          </tr></thead>
          <tbody>
            {filtered.map((u: any) => {
              const tc = typeConfig[u.role] || typeConfig.cliente;
              const subLabel = u.role === "colaborador" && u.colaborador_type ? ` (${colabLabels[u.colaborador_type as ColabType] || u.colaborador_type})` : "";
              return (
                <tr key={u.id} className={`border-b border-border last:border-0 hover:bg-muted/30 ${!u.active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{u.full_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}</div><span className="text-sm font-medium">{u.full_name}</span></div></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${tc.className}`}>{tc.label}{subLabel}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${u.active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{u.active ? "Ativo" : "Inativo"}</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleActive.mutate({ id: u.id, active: !u.active })} className="p-1.5 rounded-md hover:bg-muted">
                      {u.active ? <PowerOff className="h-3.5 w-3.5 text-warning" /> : <Power className="h-3.5 w-3.5 text-success" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogContent><DialogHeader><DialogTitle>Novo Usuário</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nome completo" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <input type="password" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Senha" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as AppRole }))}>
            <option value="admin">Admin</option><option value="colaborador">Colaborador</option><option value="cliente">Cliente</option>
          </select>
          {form.role === "colaborador" && (
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={form.colaborador_type} onChange={e => setForm(p => ({ ...p, colaborador_type: e.target.value as ColabType }))}>
              <option value="gestor">Gestor de Tráfego</option><option value="designer">Designer</option><option value="cs">CS</option>
            </select>
          )}
        </div>
        <DialogFooter><Button onClick={() => { if (form.name && form.email && form.password) createMut.mutate(); }} disabled={createMut.isPending}>{createMut.isPending ? "Criando..." : "Criar Usuário"}</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
};

export default Usuarios;
