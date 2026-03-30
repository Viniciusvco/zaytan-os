import { useState } from "react";
import { CheckCircle2, Clock, AlertCircle, FolderOpen, Plus, Pencil, Trash2, X, ExternalLink, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface Task { text: string; done: boolean }
interface ProjectLink { label: string; url: string }

interface Project {
  id: string; name: string; client: string; phase: string;
  campaignName: string; lpLink: string; testStatus: string;
  tasks: Task[]; links: ProjectLink[]; notes: string;
}

const phases = [
  { id: "documentacao", label: "Documentação", color: "bg-muted-foreground" },
  { id: "onboarding", label: "Onboarding", color: "bg-info" },
  { id: "producao", label: "Produção", color: "bg-warning" },
  { id: "implementacao", label: "Implementação", color: "bg-primary" },
  { id: "monitoramento", label: "Monitoramento", color: "bg-success" },
];

const initialProjects: Project[] = [
  { id: "1", name: "Funil WhatsApp + IA", client: "Escritório Silva", phase: "producao", campaignName: "[ZAYTAN] Camp_Silva_WA_v1", lpLink: "", testStatus: "", tasks: [{ text: "Configurar N8N", done: true }, { text: "Treinar modelo GPT", done: false }], links: [{ label: "Briefing", url: "#" }], notes: "" },
  { id: "2", name: "Pack LP + Tráfego", client: "Clínica Bella", phase: "implementacao", campaignName: "[ZAYTAN] LP_Bella_Meta_v1", lpLink: "https://bella.lp.com", testStatus: "Aprovado", tasks: [{ text: "Design LP", done: true }, { text: "Copy", done: true }, { text: "Configurar Meta Ads", done: false }], links: [], notes: "Aguardando aprovação do criativo" },
  { id: "3", name: "Onboarding Completo", client: "Imobiliária Nova Era", phase: "onboarding", campaignName: "", lpLink: "", testStatus: "", tasks: [{ text: "Coletar acessos", done: false }, { text: "Mapear processos", done: false }], links: [], notes: "" },
  { id: "4", name: "Chatbot Vendas", client: "Construtora Horizonte", phase: "documentacao", campaignName: "", lpLink: "", testStatus: "", tasks: [{ text: "Script conversacional", done: false }], links: [], notes: "" },
  { id: "5", name: "Campanha Google Ads", client: "TechShop", phase: "monitoramento", campaignName: "[ZAYTAN] Google_TechShop_Mar", lpLink: "https://techshop.lp.com", testStatus: "Aprovado", tasks: [], links: [{ label: "Dashboard", url: "#" }], notes: "Performance estável" },
];

const Projetos = () => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [showAdd, setShowAdd] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({ name: "", client: "", phase: "documentacao" });
  const [newTask, setNewTask] = useState("");
  const [newLink, setNewLink] = useState({ label: "", url: "" });

  const handleAdd = () => {
    if (!newProject.name.trim()) return;
    setProjects(prev => [...prev, { ...newProject, id: Date.now().toString(), campaignName: "", lpLink: "", testStatus: "", tasks: [], links: [], notes: "" }]);
    setNewProject({ name: "", client: "", phase: "documentacao" });
    setShowAdd(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setProjects(prev => prev.filter(p => p.id !== deleteId));
    setDeleteId(null);
  };

  const updateDetail = (p: Project) => {
    setDetailProject(p);
    setProjects(prev => prev.map(x => x.id === p.id ? p : x));
  };

  const addTask = () => {
    if (!detailProject || !newTask.trim()) return;
    updateDetail({ ...detailProject, tasks: [...detailProject.tasks, { text: newTask, done: false }] });
    setNewTask("");
  };

  const toggleTask = (i: number) => {
    if (!detailProject) return;
    const tasks = [...detailProject.tasks];
    tasks[i] = { ...tasks[i], done: !tasks[i].done };
    updateDetail({ ...detailProject, tasks });
  };

  const addLink = () => {
    if (!detailProject || !newLink.label.trim()) return;
    updateDetail({ ...detailProject, links: [...detailProject.links, { ...newLink }] });
    setNewLink({ label: "", url: "" });
  };

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Esteira Operacional</h1>
          <p className="text-sm text-muted-foreground mt-1">Pipeline de produção: Documentação → Monitoramento</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Projeto</Button>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {phases.map((phase) => {
          const cards = projects.filter(p => p.phase === phase.id);
          return (
            <div key={phase.id} className="kanban-column min-w-[260px] flex-1">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={`h-2 w-2 rounded-full ${phase.color}`} />
                <span className="text-xs font-semibold uppercase tracking-wider">{phase.label}</span>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{cards.length}</span>
              </div>
              <div className="space-y-2">
                {cards.map((p) => {
                  const done = p.tasks.filter(t => t.done).length;
                  const total = p.tasks.length;
                  return (
                    <div key={p.id} className="kanban-card group" onClick={() => setDetailProject(p)}>
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-sm font-medium">{p.name}</h4>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setEditProject({ ...p })} className="p-1 rounded hover:bg-muted"><Pencil className="h-3 w-3 text-muted-foreground" /></button>
                          <button onClick={() => setDeleteId(p.id)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="h-3 w-3 text-destructive" /></button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{p.client}</p>
                      {total > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} /></div>
                          <span className="text-[10px] text-muted-foreground">{done}/{total}</span>
                        </div>
                      )}
                      {p.campaignName && <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono mt-1.5 block truncate">{p.campaignName}</code>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>Novo Projeto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nome do projeto" value={newProject.name} onChange={(e) => setNewProject(p => ({ ...p, name: e.target.value }))} />
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Cliente" value={newProject.client} onChange={(e) => setNewProject(p => ({ ...p, client: e.target.value }))} />
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newProject.phase} onChange={(e) => setNewProject(p => ({ ...p, phase: e.target.value }))}>
              {phases.map(ph => <option key={ph.id} value={ph.id}>{ph.label}</option>)}
            </select>
          </div>
          <DialogFooter><Button onClick={handleAdd}>Criar Projeto</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editProject} onOpenChange={() => setEditProject(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Projeto</DialogTitle></DialogHeader>
          {editProject && (
            <div className="space-y-3">
              <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editProject.name} onChange={(e) => setEditProject({ ...editProject, name: e.target.value })} />
              <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editProject.client} onChange={(e) => setEditProject({ ...editProject, client: e.target.value })} />
              <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={editProject.phase} onChange={(e) => setEditProject({ ...editProject, phase: e.target.value })}>
                {phases.map(ph => <option key={ph.id} value={ph.id}>{ph.label}</option>)}
              </select>
            </div>
          )}
          <DialogFooter><Button onClick={() => { if (editProject) { setProjects(prev => prev.map(p => p.id === editProject.id ? editProject : p)); setEditProject(null); } }}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir projeto?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Modal */}
      <Dialog open={!!detailProject} onOpenChange={() => setDetailProject(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailProject && (
            <>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><FolderOpen className="h-5 w-5 text-primary" />{detailProject.name}</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground -mt-2">Cliente: {detailProject.client} · Fase: {phases.find(p => p.id === detailProject.phase)?.label}</p>

              <div className="space-y-5 mt-2">
                {/* Implementation Fields */}
                {detailProject.phase === "implementacao" && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                    <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">Campos Obrigatórios — Implementação</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div><label className="text-[10px] text-muted-foreground">Nomenclatura Campanha</label><input className="w-full h-8 px-2 rounded bg-muted border-0 text-xs focus:outline-none" value={detailProject.campaignName} onChange={(e) => updateDetail({ ...detailProject, campaignName: e.target.value })} /></div>
                      <div><label className="text-[10px] text-muted-foreground">Link da LP</label><input className="w-full h-8 px-2 rounded bg-muted border-0 text-xs focus:outline-none" value={detailProject.lpLink} onChange={(e) => updateDetail({ ...detailProject, lpLink: e.target.value })} /></div>
                      <div><label className="text-[10px] text-muted-foreground">Status dos Testes</label><input className="w-full h-8 px-2 rounded bg-muted border-0 text-xs focus:outline-none" value={detailProject.testStatus} onChange={(e) => updateDetail({ ...detailProject, testStatus: e.target.value })} /></div>
                    </div>
                  </div>
                )}

                {/* Tasks */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Checklist</h4>
                  <div className="space-y-1.5">
                    {detailProject.tasks.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 group">
                        <button onClick={() => toggleTask(i)}>{t.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <div className="h-4 w-4 rounded-full border-2 border-border" />}</button>
                        <span className={`text-sm flex-1 ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.text}</span>
                        <button onClick={() => { const tasks = detailProject.tasks.filter((_, idx) => idx !== i); updateDetail({ ...detailProject, tasks }); }} className="opacity-0 group-hover:opacity-100"><X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2"><input className="flex-1 h-8 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Nova tarefa..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} /><Button size="sm" variant="outline" onClick={addTask}>+</Button></div>
                </div>

                {/* Links */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Link2 className="h-4 w-4" /> Links</h4>
                  {detailProject.links.map((l, i) => <a key={i} href={l.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline mb-1"><ExternalLink className="h-3.5 w-3.5" />{l.label}</a>)}
                  <div className="flex gap-2 mt-1"><input className="flex-1 h-8 px-3 rounded-lg bg-muted border-0 text-xs" placeholder="Label" value={newLink.label} onChange={(e) => setNewLink(p => ({ ...p, label: e.target.value }))} /><input className="flex-1 h-8 px-3 rounded-lg bg-muted border-0 text-xs" placeholder="URL" value={newLink.url} onChange={(e) => setNewLink(p => ({ ...p, url: e.target.value }))} /><Button size="sm" variant="outline" onClick={addLink}>+</Button></div>
                </div>

                {/* Notes */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Notas</h4>
                  <textarea className="w-full h-20 px-3 py-2 rounded-lg bg-muted border-0 text-sm focus:outline-none resize-none" placeholder="Notas estratégicas..." value={detailProject.notes} onChange={(e) => updateDetail({ ...detailProject, notes: e.target.value })} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projetos;
