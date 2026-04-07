import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole, LossReason, lossReasonLabels } from "@/contexts/RoleContext";
import { ComingSoon } from "@/components/ComingSoon";
import { Plus, MessageSquare, Phone, Mail, ExternalLink } from "lucide-react";
import { useKanbanDnD } from "@/hooks/use-kanban-dnd";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

type LeadStatus = "novo" | "contatado" | "qualificado" | "proposta" | "fechado" | "perdido";

const stageColumns: { key: LeadStatus; label: string; color: string }[] = [
  { key: "novo", label: "Novo Lead", color: "info" },
  { key: "contatado", label: "Contatado", color: "warning" },
  { key: "qualificado", label: "Qualificado", color: "chart-3" },
  { key: "proposta", label: "Proposta", color: "primary" },
  { key: "fechado", label: "Fechado ✓", color: "success" },
  { key: "perdido", label: "Perdido", color: "destructive" },
];

const COLORS = ["hsl(0, 72%, 51%)", "hsl(220, 70%, 50%)", "hsl(262, 60%, 55%)", "hsl(35, 90%, 55%)", "hsl(152, 60%, 42%)"];

const CRM = () => {
  const { role } = useRole();
  const qc = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", source: "Meta Ads", value: 0, client_id: "" });
  const [moveTarget, setMoveTarget] = useState<{ lead: any; status: LeadStatus } | null>(null);
  const [saleValue, setSaleValue] = useState(0);
  const [lossReason, setLossReason] = useState<LossReason>("nao_atende");

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*, clients(name)").order("created_at", { ascending: false });
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

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, value, loss_reason }: { id: string; status: LeadStatus; value?: number; loss_reason?: string }) => {
      const update: any = { status };
      if (value !== undefined) update.value = value;
      if (loss_reason) update.loss_reason = loss_reason;
      const { error } = await supabase.from("leads").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); setMoveTarget(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const createLeadMut = useMutation({
    mutationFn: async (p: typeof newLead) => {
      const { error } = await supabase.from("leads").insert({ name: p.name, email: p.email || null, phone: p.phone || null, source: p.source, value: p.value || null, client_id: p.client_id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); setShowAdd(false); setNewLead({ name: "", email: "", phone: "", source: "Meta Ads", value: 0, client_id: "" }); toast.success("Lead criado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const moveLead = (lead: any, status: LeadStatus) => {
    if (status === "fechado" || status === "perdido") {
      setMoveTarget({ lead, status });
      setSaleValue(lead.value || 0);
    } else {
      updateStatus.mutate({ id: lead.id, status });
    }
  };

  const confirmMove = () => {
    if (!moveTarget) return;
    updateStatus.mutate({
      id: moveTarget.lead.id,
      status: moveTarget.status,
      value: moveTarget.status === "fechado" ? saleValue : undefined,
      loss_reason: moveTarget.status === "perdido" ? lossReason : undefined,
    });
  };

  const handleDnDMove = useCallback((id: string, newStatus: LeadStatus) => {
    const lead = leads.find((l: any) => l.id === id);
    if (!lead || lead.status === newStatus) return;
    moveLead(lead, newStatus);
  }, [leads]);

  const { draggedId, dragOverCol, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } = useKanbanDnD<LeadStatus>(handleDnDMove);

  const totalValue = leads.filter((l: any) => l.status === "fechado").reduce((s: number, l: any) => s + Number(l.value || 0), 0);
  const pipelineValue = leads.filter((l: any) => !["fechado", "perdido"].includes(l.status)).reduce((s: number, l: any) => s + Number(l.value || 0), 0);
  const conversionRate = leads.length > 0 ? Math.round((leads.filter((l: any) => l.status === "fechado").length / leads.length) * 100) : 0;

  const lostLeads = leads.filter((l: any) => l.status === "perdido" && l.loss_reason);
  const lossBreakdown = Object.entries(lossReasonLabels).map(([key, label]) => ({
    name: label,
    value: lostLeads.filter((l: any) => l.loss_reason === key).length,
  })).filter(d => d.value > 0);

  const isClient = role === "cliente";
  const isAdmin = role === "admin";
  const canAddLeads = isAdmin;
  const showChart = isAdmin;

  const content = (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isClient ? "Meus Leads" : "CRM — Pipeline Geral"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{leads.length} leads no pipeline</p>
        </div>
        {canAddLeads && <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Lead</Button>}
      </div>

      <div className="grid gap-4 grid-cols-3">
        <div className="metric-card"><p className="text-2xl font-bold text-success">R$ {totalValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Fechados</p></div>
        <div className="metric-card"><p className="text-2xl font-bold text-primary">R$ {pipelineValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">No Pipeline</p></div>
        <div className="metric-card"><p className="text-2xl font-bold">{conversionRate}%</p><p className="text-xs text-muted-foreground">Conversão</p></div>
      </div>

      {showChart && lossBreakdown.length > 0 && (
        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-3">Motivos de Perda</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-[180px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={lossBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>{lossBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} /></PieChart></ResponsiveContainer></div>
            <div className="space-y-2">{lossBreakdown.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs"><div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-muted-foreground">{d.name}</span></div><span className="font-bold">{d.value}</span></div>
            ))}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
        {stageColumns.map(col => (
          <div key={col.key}
            className={`kanban-column min-w-[200px] transition-colors ${dragOverCol === col.key ? "ring-2 ring-primary/30 bg-primary/5" : ""}`}
            onDragOver={e => handleDragOver(e, col.key)} onDragLeave={handleDragLeave} onDrop={e => handleDrop(e, col.key)}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold">{col.label}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${col.color}/10 text-${col.color}`}>{leads.filter((l: any) => l.status === col.key).length}</span>
            </div>
            <div className="space-y-2">
              {leads.filter((l: any) => l.status === col.key).map((lead: any) => (
                <div key={lead.id} draggable onDragStart={e => handleDragStart(e, lead.id)} onDragEnd={handleDragEnd}
                  className={`kanban-card cursor-grab active:cursor-grabbing ${draggedId === lead.id ? "opacity-40" : ""}`}
                  onClick={() => setSelectedLead(lead)}>
                  <h4 className="text-sm font-medium mb-1">{lead.name}</h4>
                  <p className="text-xs text-muted-foreground mb-1">{lead.source || "—"}</p>
                  <p className="text-[10px] text-primary mb-1">{lead.clients?.name || ""}</p>
                  <p className="text-sm font-semibold">R$ {Number(lead.value || 0).toLocaleString()}</p>
                  {lead.loss_reason && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive mt-1 inline-block">{lossReasonLabels[lead.loss_reason as LossReason] || lead.loss_reason}</span>}
                  <div className="flex gap-1 mt-2">
                    {col.key !== "novo" && col.key !== "perdido" && (
                      <button onClick={e => { e.stopPropagation(); const prev = stageColumns[stageColumns.findIndex(c => c.key === col.key) - 1]; if (prev) moveLead(lead, prev.key); }} className="text-[10px] px-2 py-0.5 rounded bg-muted">←</button>
                    )}
                    {col.key !== "fechado" && col.key !== "perdido" && (
                      <button onClick={e => { e.stopPropagation(); const next = stageColumns[stageColumns.findIndex(c => c.key === col.key) + 1]; if (next) moveLead(lead, next.key); }} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">→</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Move Dialog */}
      <Dialog open={!!moveTarget} onOpenChange={() => setMoveTarget(null)}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>{moveTarget?.status === "fechado" ? "Registrar Venda" : "Motivo da Perda"}</DialogTitle></DialogHeader>
          {moveTarget?.status === "fechado" ? (
            <div className="space-y-3"><label className="text-xs font-medium text-muted-foreground">Valor da Venda (R$)</label>
              <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={saleValue || ""} onChange={e => setSaleValue(Number(e.target.value))} /></div>
          ) : (
            <div className="space-y-3"><label className="text-xs font-medium text-muted-foreground">Motivo</label>
              <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={lossReason} onChange={e => setLossReason(e.target.value as LossReason)}>
                {Object.entries(lossReasonLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setMoveTarget(null)}>Cancelar</Button><Button onClick={confirmMove}>Confirmar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-md">
          {selectedLead && (<>
            <DialogHeader><DialogTitle>{selectedLead.name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{selectedLead.email || "—"}</div>
              <div className="flex items-center gap-2 text-sm"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{selectedLead.phone || "—"}</div>
              <div className="flex items-center gap-2 text-sm"><ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />{selectedLead.source || "—"} {selectedLead.clients?.name && `— ${selectedLead.clients.name}`}</div>
              <p className="text-lg font-bold">R$ {Number(selectedLead.value || 0).toLocaleString()}</p>
              {selectedLead.notes && <div className="bg-muted rounded p-2 text-xs">{selectedLead.notes}</div>}
            </div>
          </>)}
        </DialogContent>
      </Dialog>

      {/* Add Lead */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nome" value={newLead.name} onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))} />
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Email" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} />
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Telefone" value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} />
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))}>
              <option>Meta Ads</option><option>Google Ads</option><option>Indicação</option><option>Site</option>
            </select>
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newLead.client_id} onChange={e => setNewLead(p => ({ ...p, client_id: e.target.value }))}>
              <option value="">Selecione o cliente</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Valor estimado (R$)" value={newLead.value || ""} onChange={e => setNewLead(p => ({ ...p, value: Number(e.target.value) }))} />
          </div>
          <DialogFooter><Button onClick={() => { if (newLead.name && newLead.client_id) createLeadMut.mutate(newLead); }} disabled={createLeadMut.isPending}>{createLeadMut.isPending ? "Criando..." : "Adicionar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (role === "colaborador") return <ComingSoon>{content}</ComingSoon>;
  return content;
};

export default CRM;
