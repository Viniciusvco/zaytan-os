import { useState } from "react";
import { useClientRole, ClientRole } from "@/contexts/ClientRoleContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const roleLabels: Record<ClientRole, string> = {
  gerente: "Gerente",
  supervisor: "Supervisor",
  vendedor: "Vendedor",
};

const roleBadgeVariant: Record<ClientRole, "default" | "secondary" | "outline"> = {
  gerente: "default",
  supervisor: "secondary",
  vendedor: "outline",
};

export default function ClientUsersManagement() {
  const { clientId, clientRole, teamMembers, visibleProfileIds, refetchTeam } = useClientRole();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "vendedor" as ClientRole, supervisor_id: "" });
  const [creating, setCreating] = useState(false);
  const [editMember, setEditMember] = useState<typeof teamMembers[0] | null>(null);
  const [editForm, setEditForm] = useState({ supervisor_id: "" });
  const [deleteMember, setDeleteMember] = useState<typeof teamMembers[0] | null>(null);

  const supervisors = teamMembers.filter(m => m.client_role === "supervisor");
  const visibleMembers = teamMembers.filter(m => visibleProfileIds.includes(m.user_id));

  const handleCreate = async () => {
    if (!clientId || !form.name || !form.email || !form.password) {
      toast.error("Preencha todos os campos");
      return;
    }
    setCreating(true);
    try {
      // Create user via edge function
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: form.email,
          password: form.password,
          full_name: form.name,
          role: "cliente",
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      // Now assign client_user_role
      const newProfileId = data?.profile_id || data?.user_id;
      if (newProfileId) {
        await supabase.from("client_user_roles").insert({
          client_id: clientId,
          user_id: newProfileId,
          client_role: form.role,
          supervisor_id: form.role === "vendedor" ? form.supervisor_id || null : null,
        } as any);
      }

      toast.success(`Usuário ${form.name} criado com sucesso!`);
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "vendedor", supervisor_id: "" });
      refetchTeam();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar usuário");
    }
    setCreating(false);
  };

  const handleEditSupervisor = async () => {
    if (!editMember) return;
    const { error } = await supabase
      .from("client_user_roles")
      .update({ supervisor_id: editForm.supervisor_id || null } as any)
      .eq("id", editMember.id);
    if (error) {
      toast.error("Erro ao atualizar");
      return;
    }
    toast.success("Usuário atualizado!");
    setEditMember(null);
    refetchTeam();
  };

  const handleDelete = async () => {
    if (!deleteMember) return;
    const { error } = await supabase
      .from("client_user_roles")
      .delete()
      .eq("id", deleteMember.id);
    if (error) {
      toast.error("Erro ao remover");
      return;
    }
    toast.success("Usuário removido da equipe!");
    setDeleteMember(null);
    refetchTeam();
  };

  const canManage = (member: typeof teamMembers[0]) => {
    if (clientRole === "gerente") return member.client_role !== "gerente";
    if (clientRole === "supervisor") return member.client_role === "vendedor" && member.supervisor_id === visibleProfileIds[0];
    return false;
  };

  const availableRoles: ClientRole[] = clientRole === "gerente" ? ["supervisor", "vendedor"] : ["vendedor"];

  if (clientRole === "vendedor") {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold">Equipe</h2>
        <p className="text-sm text-muted-foreground mt-2">Você não tem permissão para gerenciar usuários.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Acessos</h2>
          <p className="text-sm text-muted-foreground">{visibleMembers.length} membros na equipe</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" />Novo Membro</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar Membro à Equipe</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" /></div>
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" /></div>
              <div className="space-y-2"><Label>Senha Inicial</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" /></div>
              <div className="space-y-2">
                <Label>Função</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as ClientRole }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{availableRoles.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {form.role === "vendedor" && supervisors.length > 0 && (
                <div className="space-y-2">
                  <Label>Supervisor</Label>
                  <Select value={form.supervisor_id} onValueChange={v => setForm(f => ({ ...f, supervisor_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{supervisors.map(s => <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <Button className="w-full" onClick={handleCreate} disabled={creating}>{creating ? "Criando..." : "Criar Membro"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Supervisor</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleMembers.map(m => {
              const sup = teamMembers.find(t => t.user_id === m.supervisor_id);
              return (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant[m.client_role]} className="capitalize">
                      {roleLabels[m.client_role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{sup?.full_name || "—"}</TableCell>
                  <TableCell>
                    {canManage(m) && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => { setEditMember(m); setEditForm({ supervisor_id: m.supervisor_id || "" }); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteMember(m)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editMember} onOpenChange={() => setEditMember(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Membro</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Editando: <strong>{editMember?.full_name}</strong></p>
            {editMember?.client_role === "vendedor" && (
              <div className="space-y-2">
                <Label>Supervisor</Label>
                <Select value={editForm.supervisor_id} onValueChange={v => setEditForm(f => ({ ...f, supervisor_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{supervisors.map(s => <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter><Button onClick={handleEditSupervisor}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteMember} onOpenChange={() => setDeleteMember(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remover Membro</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deseja remover <strong>{deleteMember?.full_name}</strong> da equipe?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteMember(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
