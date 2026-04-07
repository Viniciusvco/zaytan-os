import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { ComingSoon } from "@/components/ComingSoon";
import { Plus, AlertTriangle, CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { useKanbanDnD } from "@/hooks/use-kanban-dnd";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type DemandStatus = "backlog" | "em_progresso" | "revisao" | "concluido";

const statusColumns: { key: DemandStatus; label: string; color: string }[] = [
  { key: "backlog", label: "Backlog", color: "muted-foreground" },
  { key: "em_progresso", label: "Em Andamento", color: "info" },
  { key: "revisao", label: "Em Revisão", color: "warning" },
  { key: "concluido", label: "Concluído", color: "success" },
];

const priorityConfig = {
  baixa: { label: "Baixa", className: "bg-success/10 text-success", icon: CheckCircle2 },
  media: { label: "Média", className: "bg-warning/10 text-warning", icon: Clock },
  alta: { label: "Alta", className: "bg-primary/10 text-primary", icon: AlertTriangle },
  critica: { label: "Crítica", className: "bg-destructive/10 text-destructive", icon: AlertTriangle },
};

const specialtyConfig: Record<string, { label: string; className: string }> = {
  trafego: { label: "Tráfego", className: "bg-info/10 text-info" },
  design: { label: "Design", className: "bg-chart-3/10 text-chart-3" },
  cs: { label: "CS", className: "bg-success/10 text-success" },
};

const Demandas = () => {
  const { role, colaboradorType } = useRole();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newDemand, setNewDemand] = useState({ title: "", description: "", specialty: "cs" as string, priority: "media" as string, client_id: "" });

  const isClient = role === "cliente";

  const { data: demands = [] } = useQuery({
    queryKey: ["demands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("demands").select("*, clients(name)").order("created_at", { ascending: false });
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
    mutationFn: async (p: typeof newDemand) => {
      const { error } = await supabase.from("demands").insert({
        title: p.title,
        description: p.description || null,
        specialty: (isClient ? "cs" : p.specialty) as any,
        priority: p.priority as any,
        client_id: p.client_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["demands"] });
      setShowAdd(false);
      setNewDemand({ title: "", description: "", specialty: "cs", priority: "media", client_id: "" });
      toast.success("Demanda criada");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("demands").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demands"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const moveDemand = useCallback((id: string, newStatus: DemandStatus) => {
    updateStatusMut.mutate({ id, status: newStatus });
  }, []);

  const { draggedId, dragOverCol, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } = useKanbanDnD<DemandStatus>(moveDemand);

  const content = (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isClient ? "Minhas Solicitações" : "Gestão de Demandas"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{demands.length} demandas</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> {isClient ? "Nova Solicitação" : "Nova Demanda"}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusColumns.map(col => (
          <div key={col.key}
            className={`kanban-column transition-colors ${dragOverCol === col.key ? "ring-2 ring-primary/30 bg-primary/5" : ""}`}
            onDragOver={e => handleDragOver(e, col.key)} onDragLeave={handleDragLeave} onDrop={e => handleDrop(e, col.key)}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full bg-${col.color}/10 text-${col.color}`}>
                {demands.filter((d: any) => d.status === col.key).length}
              </span>
            </div>
            <div className="space-y-2">
              {demands.filter((d: any) => d.status === col.key).map((demand: any) => {
                const pri = priorityConfig[demand.priority as keyof typeof priorityConfig] || priorityConfig.media;
                const sp = specialtyConfig[demand.specialty as string];
                const PriIcon = pri.icon;
                return (
                  <div key={demand.id} draggable onDragStart={e => handleDragStart(e, demand.id)} onDragEnd={handleDragEnd}
                    className={`kanban-card ${demand.specialty ? `border-l-4 border-l-${sp?.className?.includes("info") ? "info" : sp?.className?.includes("chart-3") ? "chart-3" : "success"}` : ""} cursor-grab active:cursor-grabbing ${draggedId === demand.id ? "opacity-40" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${pri.className} inline-flex items-center gap-1`}>
                        <PriIcon className="h-3 w-3" /> {pri.label}
                      </span>
                      {sp && <span className={`text-[10px] px-2 py-0.5 rounded-full ${sp.className}`}>{sp.label}</span>}
                    </div>
                    <h4 className="text-sm font-medium mb-1">{demand.title}</h4>
                    {!isClient && <p className="text-xs text-muted-foreground mb-1">{demand.clients?.name || "—"}</p>}
                    {demand.description && <p className="text-xs text-muted-foreground/70 line-clamp-2 mb-2">{demand.description}</p>}
                    <div className="flex gap-1 mt-2">
                      {col.key !== "backlog" && (
                        <button onClick={() => moveDemand(demand.id, statusColumns[statusColumns.findIndex(c => c.key === col.key) - 1].key)} className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted-foreground/10">← Voltar</button>
                      )}
                      {col.key !== "concluido" && (
                        <button onClick={() => moveDemand(demand.id, statusColumns[statusColumns.findIndex(c => c.key === col.key) + 1].key)} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20">Avançar →</button>
                      )}
                    </div>
                  </div>
                );
              })}
              {demands.filter((d: any) => d.status === col.key).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhuma demanda</p>
              )}
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
            {!isClient && (
              <>
                <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newDemand.specialty} onChange={e => setNewDemand(p => ({ ...p, specialty: e.target.value }))}>
                  <option value="cs">CS</option><option value="trafego">Tráfego Pago</option><option value="design">Design</option>
                </select>
                <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newDemand.priority} onChange={e => setNewDemand(p => ({ ...p, priority: e.target.value }))}>
                  <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="critica">Crítica</option>
                </select>
              </>
            )}
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newDemand.client_id} onChange={e => setNewDemand(p => ({ ...p, client_id: e.target.value }))}>
              <option value="">Selecione o cliente</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <DialogFooter><Button onClick={() => { if (newDemand.title && newDemand.client_id) createMut.mutate(newDemand); }} disabled={createMut.isPending}>{createMut.isPending ? "Criando..." : "Criar"}</Button></DialogFooter>
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
