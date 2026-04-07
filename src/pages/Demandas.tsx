import { useState, useCallback } from "react";
import { useRole } from "@/contexts/RoleContext";
import { ComingSoon } from "@/components/ComingSoon";
import { Plus, AlertTriangle, CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { useKanbanDnD } from "@/hooks/use-kanban-dnd";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Priority = "critico" | "atencao" | "saudavel";
type DemandType = "suporte" | "trafego" | "design";
type DemandStatus = "backlog" | "andamento" | "revisao" | "concluido";

interface Demand {
  id: string; title: string; description: string; client: string;
  type: DemandType; priority: Priority; status: DemandStatus;
  assignee: string; createdAt: string; dueDate: string;
  attachment?: string; internalNotes: string;
}

const initialDemands: Demand[] = [
  { id: "1", title: "Criar campanha de Páscoa", description: "Nova campanha sazonal para Meta Ads", client: "Clínica Bella", type: "trafego", priority: "atencao", status: "andamento", assignee: "João Silva", createdAt: "2026-03-28", dueDate: "2026-04-05", internalNotes: "Verificar criativos com designer" },
  { id: "2", title: "Leads não chegam no CRM", description: "Webhook N8N parou de enviar leads", client: "Escritório Silva", type: "suporte", priority: "critico", status: "backlog", assignee: "Maria Santos", createdAt: "2026-03-30", dueDate: "2026-04-02", internalNotes: "Autenticação do webhook expirou" },
  { id: "3", title: "Nova landing page", description: "LP para campanha de imóveis de luxo", client: "Imobiliária Nova Era", type: "design", priority: "saudavel", status: "revisao", assignee: "Pedro Costa", createdAt: "2026-03-25", dueDate: "2026-04-08", internalNotes: "" },
  { id: "4", title: "Otimizar Google Ads", description: "CPC acima da média, precisa otimizar", client: "TechShop", type: "trafego", priority: "atencao", status: "andamento", assignee: "João Silva", createdAt: "2026-03-27", dueDate: "2026-04-04", internalNotes: "Testar novos termos negativos" },
  { id: "5", title: "Relatório mensal", description: "Enviar relatório de performance de março", client: "Construtora Horizonte", type: "suporte", priority: "saudavel", status: "concluido", assignee: "Maria Santos", createdAt: "2026-03-20", dueDate: "2026-03-31", internalNotes: "Enviado por email" },
  { id: "6", title: "Feedback negativo - Reclamação", description: "Cliente deu nota 2 no feedback semanal", client: "Escritório Silva", type: "suporte", priority: "critico", status: "backlog", assignee: "Maria Santos", createdAt: "2026-04-01", dueDate: "2026-04-03", internalNotes: "Feedback automático — CS deve intervir" },
];

const statusColumns: { key: DemandStatus; label: string; color: string }[] = [
  { key: "backlog", label: "Backlog", color: "muted-foreground" },
  { key: "andamento", label: "Em Andamento", color: "info" },
  { key: "revisao", label: "Em Revisão", color: "warning" },
  { key: "concluido", label: "Concluído", color: "success" },
];

const priorityConfig = {
  critico: { label: "Crítico", className: "bg-destructive/10 text-destructive", icon: AlertTriangle },
  atencao: { label: "Atenção", className: "bg-warning/10 text-warning", icon: Clock },
  saudavel: { label: "Saudável", className: "bg-success/10 text-success", icon: CheckCircle2 },
};

// Specialty border colors
const typeBorderColors: Record<DemandType, string> = {
  trafego: "border-l-4 border-l-info",
  design: "border-l-4 border-l-chart-3",
  suporte: "border-l-4 border-l-success",
};

const typeConfig: Record<DemandType, { label: string; className: string }> = {
  suporte: { label: "Suporte", className: "bg-success/10 text-success" },
  trafego: { label: "Tráfego", className: "bg-info/10 text-info" },
  design: { label: "Design", className: "bg-chart-3/10 text-chart-3" },
};

function getSLAStatus(dueDate: string): { color: string; label: string } {
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { color: "destructive", label: "Atrasado" };
  if (days <= 1) return { color: "warning", label: `${days}d restante` };
  return { color: "success", label: `${days}d restante` };
}

function getDaysInStatus(createdAt: string): number {
  return Math.max(0, Math.ceil((Date.now() - new Date(createdAt).getTime()) / 86400000));
}

const Demandas = () => {
  const { role, colaboradorType } = useRole();
  const [demands, setDemands] = useState(initialDemands);
  const [showAdd, setShowAdd] = useState(false);
  const [newDemand, setNewDemand] = useState({ title: "", description: "", type: "suporte" as DemandType, priority: "saudavel" as Priority, attachment: "" });

  const isClient = role === "cliente";

  // Auto-filter by specialty for colaboradores
  let filtered = demands;
  if (isClient) {
    filtered = demands.filter(d => d.client === "Escritório Silva");
  } else if (role === "colaborador") {
    if (colaboradorType === "gestor") filtered = demands.filter(d => d.type === "trafego");
    else if (colaboradorType === "designer") filtered = demands.filter(d => d.type === "design");
    // CS sees all
  }

  const moveDemand = useCallback((id: string, newStatus: DemandStatus) => {
    setDemands(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
  }, []);

  const { draggedId, dragOverCol, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } = useKanbanDnD<DemandStatus>(moveDemand);

  const handleAdd = () => {
    if (!newDemand.title.trim()) return;
    setDemands(prev => [...prev, {
      ...newDemand, id: Date.now().toString(), client: isClient ? "Escritório Silva" : "Novo Cliente",
      status: "backlog", assignee: "Não atribuído",
      createdAt: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      internalNotes: "",
    }]);
    setNewDemand({ title: "", description: "", type: "suporte", priority: "saudavel", attachment: "" });
    setShowAdd(false);
  };

  const content = (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isClient ? "Minhas Solicitações" : "Gestão de Demandas"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} demandas
            {role === "colaborador" && colaboradorType !== "cs" && ` (filtro: ${colaboradorType === "gestor" ? "Tráfego" : "Design"})`}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> {isClient ? "Nova Solicitação" : "Nova Demanda"}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusColumns.map(col => (
          <div
            key={col.key}
            className={`kanban-column transition-colors ${dragOverCol === col.key ? "ring-2 ring-primary/30 bg-primary/5" : ""}`}
            onDragOver={e => handleDragOver(e, col.key)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, col.key)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full bg-${col.color}/10 text-${col.color}`}>
                {filtered.filter(d => d.status === col.key).length}
              </span>
            </div>
            <div className="space-y-2">
              {filtered.filter(d => d.status === col.key).map(demand => {
                const pri = priorityConfig[demand.priority];
                const tp = typeConfig[demand.type];
                const PriIcon = pri.icon;
                const sla = getSLAStatus(demand.dueDate);
                const daysOpen = getDaysInStatus(demand.createdAt);
                const isStale = daysOpen > 3 && demand.status !== "concluido";

                return (
                  <div
                    key={demand.id}
                    draggable
                    onDragStart={e => handleDragStart(e, demand.id)}
                    onDragEnd={handleDragEnd}
                    className={`kanban-card ${typeBorderColors[demand.type]} ${isStale ? "shadow-primary/10 shadow-md" : ""} cursor-grab active:cursor-grabbing ${draggedId === demand.id ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${pri.className} inline-flex items-center gap-1`}>
                        <PriIcon className="h-3 w-3" /> {pri.label}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${tp.className}`}>{tp.label}</span>
                    </div>
                    <h4 className="text-sm font-medium mb-1">{demand.title}</h4>
                    {!isClient && <p className="text-xs text-muted-foreground mb-1">{demand.client}</p>}

                    {isClient ? (
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${sla.color}/10 text-${sla.color}`}>{sla.label}</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground/70 line-clamp-2 mb-2">{demand.description}</p>
                        {demand.internalNotes && (
                          <div className="text-[10px] text-muted-foreground bg-muted rounded p-1.5 mb-2 flex items-start gap-1">
                            <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" /> {demand.internalNotes}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">{demand.assignee}</span>
                          <span className={`px-2 py-0.5 rounded-full bg-${sla.color}/10 text-${sla.color}`}>{sla.label}</span>
                        </div>
                        {isStale && <p className="text-[10px] text-primary mt-1 font-medium">⚠ {daysOpen}d nesta etapa</p>}
                        <div className="flex gap-1 mt-2">
                          {col.key !== "backlog" && (
                            <button onClick={() => moveDemand(demand.id, statusColumns[statusColumns.findIndex(c => c.key === col.key) - 1].key)} className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted-foreground/10">← Voltar</button>
                          )}
                          {col.key !== "concluido" && (
                            <button onClick={() => moveDemand(demand.id, statusColumns[statusColumns.findIndex(c => c.key === col.key) + 1].key)} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20">Avançar →</button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isClient ? "Nova Solicitação" : "Nova Demanda"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Título" value={newDemand.title} onChange={e => setNewDemand(p => ({ ...p, title: e.target.value }))} />
            <textarea className="w-full h-20 px-3 py-2 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="Descrição..." value={newDemand.description} onChange={e => setNewDemand(p => ({ ...p, description: e.target.value }))} />
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newDemand.type} onChange={e => setNewDemand(p => ({ ...p, type: e.target.value as DemandType }))}>
              <option value="suporte">Suporte</option><option value="trafego">Tráfego Pago</option><option value="design">Design</option>
            </select>
            {!isClient && (
              <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newDemand.priority} onChange={e => setNewDemand(p => ({ ...p, priority: e.target.value as Priority }))}>
                <option value="saudavel">Saudável</option><option value="atencao">Atenção</option><option value="critico">Crítico</option>
              </select>
            )}
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Link de anexo (opcional)" value={newDemand.attachment} onChange={e => setNewDemand(p => ({ ...p, attachment: e.target.value }))} />
          </div>
          <DialogFooter><Button onClick={handleAdd}>Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (role === "colaborador") {
    return <ComingSoon>{content}</ComingSoon>;
  }
  return content;
};

export default Demandas;
