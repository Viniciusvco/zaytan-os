import { useState } from "react";
import { Search, Plus, Building2, Zap, Globe, MoreHorizontal, CheckCircle2, Clock, AlertCircle, Pencil, Trash2, X, ExternalLink, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface HistoryEntry { date: string; note: string }
interface LinkEntry { label: string; url: string }
interface Task { text: string; done: boolean }

interface Client {
  id: string; name: string; pillar: "trafego" | "automacao"; status: "ativo" | "onboarding" | "pausado";
  mrr: number; tasks: Task[]; nextDelivery: string; links: LinkEntry[]; history: HistoryEntry[];
}

const initialClients: Client[] = [
  { id: "1", name: "Escritório Silva Advocacia", pillar: "automacao", status: "ativo", mrr: 4500, tasks: [{ text: "Configurar N8N", done: true }, { text: "Treinar modelo GPT", done: true }, { text: "Testar fluxo", done: false }], nextDelivery: "02 Abr", links: [{ label: "Drive", url: "#" }], history: [{ date: "28 Mar", note: "Reunião de alinhamento sobre chatbot" }] },
  { id: "2", name: "Clínica Estética Bella", pillar: "trafego", status: "ativo", mrr: 3200, tasks: [{ text: "Design LP", done: true }, { text: "Copy", done: true }, { text: "Configurar Meta Ads", done: false }], nextDelivery: "05 Abr", links: [], history: [] },
  { id: "3", name: "Imobiliária Nova Era", pillar: "automacao", status: "onboarding", mrr: 6800, tasks: [{ text: "Coletar acessos", done: false }, { text: "Mapear processos", done: false }], nextDelivery: "10 Abr", links: [], history: [] },
  { id: "4", name: "E-commerce TechShop", pillar: "trafego", status: "ativo", mrr: 5500, tasks: [{ text: "Google Ads otimização", done: true }], nextDelivery: "—", links: [{ label: "Dashboard BI", url: "#" }], history: [] },
  { id: "5", name: "Restaurante Sabor & Arte", pillar: "trafego", status: "pausado", mrr: 2800, tasks: [], nextDelivery: "—", links: [], history: [] },
  { id: "6", name: "Construtora Horizonte", pillar: "automacao", status: "onboarding", mrr: 8000, tasks: [{ text: "Setup CRM", done: false }, { text: "Integrar API", done: false }], nextDelivery: "15 Abr", links: [], history: [] },
];

const statusConfig = {
  ativo: { label: "Ativo", icon: CheckCircle2, className: "bg-success/10 text-success" },
  onboarding: { label: "Onboarding", icon: Clock, className: "bg-info/10 text-info" },
  pausado: { label: "Pausado", icon: AlertCircle, className: "bg-warning/10 text-warning" },
};
const pillarConfig = {
  trafego: { label: "Tráfego/LPs", icon: Globe },
  automacao: { label: "Automação/IA", icon: Zap },
};

const Clientes = () => {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");
  const [filterPillar, setFilterPillar] = useState<string>("all");
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", pillar: "trafego" as "trafego" | "automacao", mrr: 0 });
  const [newNote, setNewNote] = useState("");
  const [newLink, setNewLink] = useState({ label: "", url: "" });
  const [newTask, setNewTask] = useState("");

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchPillar = filterPillar === "all" || c.pillar === filterPillar;
    return matchSearch && matchPillar;
  });

  const handleAdd = () => {
    if (!newClient.name.trim()) return;
    setClients(prev => [...prev, { ...newClient, id: Date.now().toString(), status: "onboarding", tasks: [], nextDelivery: "—", links: [], history: [] }]);
    setNewClient({ name: "", pillar: "trafego", mrr: 0 });
    setShowAdd(false);
  };

  const handleEdit = () => {
    if (!editClient) return;
    setClients(prev => prev.map(c => c.id === editClient.id ? editClient : c));
    setEditClient(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setClients(prev => prev.filter(c => c.id !== deleteId));
    setDeleteId(null);
  };

  const updateDetail = (updated: Client) => {
    setDetailClient(updated);
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const addHistoryNote = () => {
    if (!detailClient || !newNote.trim()) return;
    const updated = { ...detailClient, history: [...detailClient.history, { date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }), note: newNote }] };
    updateDetail(updated);
    setNewNote("");
  };

  const addLink = () => {
    if (!detailClient || !newLink.label.trim() || !newLink.url.trim()) return;
    updateDetail({ ...detailClient, links: [...detailClient.links, { ...newLink }] });
    setNewLink({ label: "", url: "" });
  };

  const addTask = () => {
    if (!detailClient || !newTask.trim()) return;
    updateDetail({ ...detailClient, tasks: [...detailClient.tasks, { text: newTask, done: false }] });
    setNewTask("");
  };

  const toggleTask = (idx: number) => {
    if (!detailClient) return;
    const tasks = [...detailClient.tasks];
    tasks[idx] = { ...tasks[idx], done: !tasks[idx].done };
    updateDetail({ ...detailClient, tasks });
  };

  const removeTask = (idx: number) => {
    if (!detailClient) return;
    updateDetail({ ...detailClient, tasks: detailClient.tasks.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{clients.length} clientes</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Cliente</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Buscar clientes..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {[{ value: "all", label: "Todos" }, { value: "trafego", label: "Tráfego" }, { value: "automacao", label: "Automação" }].map((opt) => (
            <button key={opt.value} onClick={() => setFilterPillar(opt.value)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterPillar === opt.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{opt.label}</button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cliente</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Pilar</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">MRR</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Tarefas</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => {
              const status = statusConfig[client.status];
              const pillar = pillarConfig[client.pillar];
              const StatusIcon = status.icon;
              const PillarIcon = pillar.icon;
              const done = client.tasks.filter(t => t.done).length;
              const total = client.tasks.length;
              const progress = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <tr key={client.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setDetailClient(client)}>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="h-4 w-4 text-primary" /></div><span className="text-sm font-medium">{client.name}</span></div></td>
                  <td className="px-4 py-3"><span className="text-xs flex items-center gap-1.5 text-muted-foreground"><PillarIcon className="h-3 w-3" /> {pillar.label}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${status.className}`}><StatusIcon className="h-3 w-3" /> {status.label}</span></td>
                  <td className="px-4 py-3"><span className="text-sm font-semibold">R$ {client.mrr.toLocaleString()}</span></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} /></div><span className="text-xs text-muted-foreground">{done}/{total}</span></div></td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditClient({ ...client })} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteId(client.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nome do cliente" value={newClient.name} onChange={(e) => setNewClient(p => ({ ...p, name: e.target.value }))} />
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={newClient.pillar} onChange={(e) => setNewClient(p => ({ ...p, pillar: e.target.value as any }))}>
              <option value="trafego">Tráfego/LPs</option><option value="automacao">Automação/IA</option>
            </select>
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="MRR (R$)" value={newClient.mrr || ""} onChange={(e) => setNewClient(p => ({ ...p, mrr: Number(e.target.value) }))} />
          </div>
          <DialogFooter><Button onClick={handleAdd}>Adicionar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editClient} onOpenChange={() => setEditClient(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
          {editClient && (
            <div className="space-y-3">
              <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editClient.name} onChange={(e) => setEditClient({ ...editClient, name: e.target.value })} />
              <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={editClient.pillar} onChange={(e) => setEditClient({ ...editClient, pillar: e.target.value as any })}>
                <option value="trafego">Tráfego/LPs</option><option value="automacao">Automação/IA</option>
              </select>
              <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={editClient.status} onChange={(e) => setEditClient({ ...editClient, status: e.target.value as any })}>
                <option value="ativo">Ativo</option><option value="onboarding">Onboarding</option><option value="pausado">Pausado</option>
              </select>
              <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editClient.mrr} onChange={(e) => setEditClient({ ...editClient, mrr: Number(e.target.value) })} />
            </div>
          )}
          <DialogFooter><Button onClick={handleEdit}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir cliente?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Modal */}
      <Dialog open={!!detailClient} onOpenChange={() => setDetailClient(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailClient && (
            <>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />{detailClient.name}</DialogTitle></DialogHeader>
              <div className="space-y-5">
                {/* Tasks */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Checklist de Tarefas</h4>
                  <div className="space-y-1.5">
                    {detailClient.tasks.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 group">
                        <button onClick={() => toggleTask(i)} className="shrink-0">{t.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <div className="h-4 w-4 rounded-full border-2 border-border" />}</button>
                        <span className={`text-sm flex-1 ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.text}</span>
                        <button onClick={() => removeTask(i)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input className="flex-1 h-8 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nova tarefa..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} />
                    <Button size="sm" variant="outline" onClick={addTask}>Adicionar</Button>
                  </div>
                </div>

                {/* Links */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Links Úteis</h4>
                  <div className="space-y-1">
                    {detailClient.links.map((l, i) => (
                      <a key={i} href={l.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline"><ExternalLink className="h-3.5 w-3.5" />{l.label}</a>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input className="flex-1 h-8 px-3 rounded-lg bg-muted border-0 text-xs focus:outline-none" placeholder="Label" value={newLink.label} onChange={(e) => setNewLink(p => ({ ...p, label: e.target.value }))} />
                    <input className="flex-1 h-8 px-3 rounded-lg bg-muted border-0 text-xs focus:outline-none" placeholder="URL" value={newLink.url} onChange={(e) => setNewLink(p => ({ ...p, url: e.target.value }))} />
                    <Button size="sm" variant="outline" onClick={addLink}>+</Button>
                  </div>
                </div>

                {/* History */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> Histórico & Notas</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {detailClient.history.length === 0 && <p className="text-xs text-muted-foreground">Nenhum registro.</p>}
                    {detailClient.history.map((h, i) => (
                      <div key={i} className="bg-muted rounded-lg p-2.5"><p className="text-[10px] text-muted-foreground mb-0.5">{h.date}</p><p className="text-xs">{h.note}</p></div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input className="flex-1 h-8 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Adicionar nota..." value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHistoryNote()} />
                    <Button size="sm" variant="outline" onClick={addHistoryNote}>Salvar</Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clientes;
