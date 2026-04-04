import { useState } from "react";
import { Plus, Shield, Users, User, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type UserType = "admin" | "gestor" | "designer" | "editor" | "atendimento" | "cliente";

interface AppUser {
  id: string;
  name: string;
  email: string;
  type: UserType;
  active: boolean;
  createdAt: string;
}

const typeConfig: Record<UserType, { label: string; className: string; icon: typeof Shield }> = {
  admin: { label: "Admin", className: "bg-primary/10 text-primary", icon: Shield },
  gestor: { label: "Gestor de Tráfego", className: "bg-info/10 text-info", icon: Users },
  designer: { label: "Designer", className: "bg-warning/10 text-warning", icon: Users },
  editor: { label: "Editor", className: "bg-success/10 text-success", icon: Users },
  atendimento: { label: "Atendimento", className: "bg-chart-3/10 text-chart-3", icon: Users },
  cliente: { label: "Cliente", className: "bg-muted text-muted-foreground", icon: User },
};

const initialUsers: AppUser[] = [
  { id: "1", name: "Admin Zaytan", email: "admin@zaytan.com", type: "admin", active: true, createdAt: "2026-01-01" },
  { id: "2", name: "João Silva", email: "joao@zaytan.com", type: "gestor", active: true, createdAt: "2026-01-15" },
  { id: "3", name: "Maria Santos", email: "maria@zaytan.com", type: "atendimento", active: true, createdAt: "2026-02-01" },
  { id: "4", name: "Pedro Costa", email: "pedro@zaytan.com", type: "designer", active: true, createdAt: "2026-02-10" },
  { id: "5", name: "Ana Oliveira", email: "ana@zaytan.com", type: "editor", active: true, createdAt: "2026-03-01" },
  { id: "6", name: "Escritório Silva", email: "contato@silva.adv.br", type: "cliente", active: true, createdAt: "2026-01-15" },
  { id: "7", name: "Clínica Bella", email: "contato@bella.com", type: "cliente", active: true, createdAt: "2026-02-01" },
  { id: "8", name: "Ex-Cliente XPTO", email: "xpto@email.com", type: "cliente", active: false, createdAt: "2025-10-01" },
];

const Usuarios = () => {
  const [users, setUsers] = useState(initialUsers);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [newUser, setNewUser] = useState({ name: "", email: "", type: "cliente" as UserType });

  const filtered = users.filter(u => filterType === "all" || u.type === filterType);
  const activeCount = users.filter(u => u.active).length;

  const toggleActive = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Usuários</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeCount} ativos de {users.length} total</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Usuário</Button>
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-0.5 w-fit flex-wrap">
        {[{ value: "all", label: "Todos" }, ...Object.entries(typeConfig).map(([k, v]) => ({ value: k, label: v.label }))].map(tab => (
          <button key={tab.value} onClick={() => setFilterType(tab.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterType === tab.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{tab.label}</button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Usuário</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Email</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Perfil</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Criado em</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const tc = typeConfig[u.type];
              return (
                <tr key={u.id} className={`border-b border-border last:border-0 hover:bg-muted/30 ${!u.active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{u.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</div><span className="text-sm font-medium">{u.name}</span></div></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${tc.className}`}>{tc.label}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${u.active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{u.active ? "Ativo" : "Inativo"}</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => toggleActive(u.id)} className="p-1.5 rounded-md hover:bg-muted">{u.active ? <PowerOff className="h-3.5 w-3.5 text-warning" /> : <Power className="h-3.5 w-3.5 text-success" />}</button>
                      <button onClick={() => setEditUser({ ...u })} className="p-1.5 rounded-md hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-md hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>Novo Usuário</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nome" value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} />
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newUser.type} onChange={e => setNewUser(p => ({ ...p, type: e.target.value as UserType }))}>
              {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <DialogFooter><Button onClick={() => { if (newUser.name && newUser.email) { setUsers(prev => [...prev, { ...newUser, id: Date.now().toString(), active: true, createdAt: new Date().toISOString().split("T")[0] }]); setNewUser({ name: "", email: "", type: "cliente" }); setShowAdd(false); } }}>Criar Usuário</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
          {editUser && <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} />
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={editUser.type} onChange={e => setEditUser({ ...editUser, type: e.target.value as UserType })}>
              {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>}
          <DialogFooter><Button onClick={() => { if (editUser) { setUsers(p => p.map(u => u.id === editUser.id ? editUser : u)); setEditUser(null); } }}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir usuário?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { setUsers(p => p.filter(u => u.id !== deleteId)); setDeleteId(null); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Usuarios;
