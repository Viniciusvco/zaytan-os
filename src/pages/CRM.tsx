import { useState } from "react";
import { useRole, LossReason, lossReasonLabels } from "@/contexts/RoleContext";
import { ComingSoon } from "@/components/ComingSoon";
import { Plus, MessageSquare, Phone, Mail, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type LeadStage = "entrou" | "contato" | "proposta" | "fechado" | "perdido";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  stage: LeadStage;
  value: number;
  saleValue?: number;
  lossReason?: LossReason;
  notes: string[];
  campaign?: string;
  createdAt: string;
}

const initialLeads: Lead[] = [
  { id: "1", name: "Carlos Mendes", email: "carlos@email.com", phone: "(11) 99999-1234", source: "Meta Ads", stage: "entrou", value: 3500, notes: [], campaign: "Campanha Advocacia", createdAt: "2026-04-01" },
  { id: "2", name: "Fernanda Lima", email: "fer@email.com", phone: "(11) 98888-5678", source: "Google Ads", stage: "contato", value: 5000, notes: ["Interessada em pacote completo"], campaign: "Campanha Saúde", createdAt: "2026-03-28" },
  { id: "3", name: "Roberto Alves", email: "rob@email.com", phone: "(21) 97777-0000", source: "Indicação", stage: "proposta", value: 8000, notes: ["Enviou proposta via email"], createdAt: "2026-03-25" },
  { id: "4", name: "Ana Costa", email: "ana@email.com", phone: "(11) 96666-1111", source: "Meta Ads", stage: "fechado", value: 4500, saleValue: 4200, notes: ["Contrato assinado"], campaign: "Campanha E-commerce", createdAt: "2026-03-20" },
  { id: "5", name: "Bruno Reis", email: "bruno@email.com", phone: "(31) 95555-2222", source: "Site", stage: "perdido", value: 6000, lossReason: "sem_perfil", notes: ["Orçamento muito alto"], createdAt: "2026-03-22" },
  { id: "6", name: "Juliana Pires", email: "ju@email.com", phone: "(11) 94444-3333", source: "Meta Ads", stage: "entrou", value: 3200, notes: [], campaign: "Campanha Imobiliário", createdAt: "2026-04-02" },
  { id: "7", name: "Marcos Souza", email: "marcos@email.com", phone: "(21) 93333-4444", source: "Meta Ads", stage: "perdido", value: 5000, lossReason: "concorrente", notes: [], createdAt: "2026-03-18" },
  { id: "8", name: "Lucia Ferreira", email: "lucia@email.com", phone: "(11) 92222-5555", source: "Google Ads", stage: "perdido", value: 3800, lossReason: "nao_atende", notes: [], createdAt: "2026-03-15" },
];

const stageColumns: { key: LeadStage; label: string; color: string }[] = [
  { key: "entrou", label: "Lead Entrou", color: "info" },
  { key: "contato", label: "Contato Iniciado", color: "warning" },
  { key: "proposta", label: "Proposta Enviada", color: "primary" },
  { key: "fechado", label: "Fechado ✓", color: "success" },
  { key: "perdido", label: "Perdido", color: "destructive" },
];

const COLORS = ["hsl(0, 72%, 51%)", "hsl(220, 70%, 50%)", "hsl(262, 60%, 55%)", "hsl(35, 90%, 55%)", "hsl(152, 60%, 42%)"];

const CRM = () => {
  const { role } = useRole();
  const [leads, setLeads] = useState(initialLeads);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState("");
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", source: "Meta Ads", value: 0 });

  // Move lead dialog states
  const [moveTarget, setMoveTarget] = useState<{ lead: Lead; stage: LeadStage } | null>(null);
  const [saleValue, setSaleValue] = useState<number>(0);
  const [lossReason, setLossReason] = useState<LossReason>("nao_atende");

  const confirmMove = () => {
    if (!moveTarget) return;
    const { lead, stage } = moveTarget;
    setLeads(prev => prev.map(l => {
      if (l.id !== lead.id) return l;
      const updated = { ...l, stage };
      if (stage === "fechado") updated.saleValue = saleValue;
      if (stage === "perdido") updated.lossReason = lossReason;
      return updated;
    }));
    setMoveTarget(null);
    setSaleValue(0);
  };

  const moveLead = (lead: Lead, stage: LeadStage) => {
    if (stage === "fechado" || stage === "perdido") {
      setMoveTarget({ lead, stage });
      setSaleValue(lead.value);
    } else {
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, stage } : l));
    }
  };

  const addNote = () => {
    if (!selectedLead || !newNote.trim()) return;
    const updated = { ...selectedLead, notes: [...selectedLead.notes, newNote] };
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    setSelectedLead(updated);
    setNewNote("");
  };

  const totalValue = leads.filter(l => l.stage === "fechado").reduce((s, l) => s + (l.saleValue || l.value), 0);
  const pipelineValue = leads.filter(l => !["fechado", "perdido"].includes(l.stage)).reduce((s, l) => s + l.value, 0);
  const conversionRate = leads.length > 0 ? Math.round((leads.filter(l => l.stage === "fechado").length / leads.length) * 100) : 0;

  // Loss reason breakdown for chart
  const lostLeads = leads.filter(l => l.stage === "perdido" && l.lossReason);
  const lossBreakdown = Object.entries(lossReasonLabels).map(([key, label]) => ({
    name: label,
    value: lostLeads.filter(l => l.lossReason === key).length,
  })).filter(d => d.value > 0);

  const isClient = role === "cliente";
  const isAdmin = role === "admin";

  // Ticket médio
  const fechados = leads.filter(l => l.stage === "fechado");
  const ticketMedio = fechados.length > 0 ? Math.round(fechados.reduce((s, l) => s + (l.saleValue || l.value), 0) / fechados.length) : 0;

  const content = (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isClient ? "Meus Leads" : "CRM — Prospecção de Novos Clientes"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isClient ? `${leads.length} leads no pipeline` : "Pipeline de prospecção da agência"}</p>
        </div>
        {!isClient && <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Lead</Button>}
      </div>

      {/* Metrics */}
      <div className={`grid gap-4 ${isAdmin ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
        <div className="metric-card"><p className="text-2xl font-bold text-success">R$ {totalValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Fechados</p></div>
        <div className="metric-card"><p className="text-2xl font-bold text-primary">R$ {pipelineValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">No Pipeline</p></div>
        <div className="metric-card"><p className="text-2xl font-bold">{conversionRate}%</p><p className="text-xs text-muted-foreground">Conversão</p></div>
        {(isAdmin || isClient) && (
          <div className="metric-card"><p className="text-2xl font-bold text-info">R$ {ticketMedio.toLocaleString()}</p><p className="text-xs text-muted-foreground">Ticket Médio</p></div>
        )}
      </div>

      {/* Lead Quality Chart (Admin only) */}
      {isAdmin && lossBreakdown.length > 0 && (
        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-3">Qualidade de Leads — Motivos de Perda</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={lossBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {lossBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {lossBreakdown.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-bold">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto">
        {stageColumns.map(col => (
          <div key={col.key} className="kanban-column min-w-[220px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold">{col.label}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${col.color}/10 text-${col.color}`}>
                {leads.filter(l => l.stage === col.key).length}
              </span>
            </div>
            <div className="space-y-2">
              {leads.filter(l => l.stage === col.key).map(lead => (
                <div key={lead.id} className="kanban-card cursor-pointer" onClick={() => setSelectedLead(lead)}>
                  <h4 className="text-sm font-medium mb-1">{lead.name}</h4>
                  <p className="text-xs text-muted-foreground mb-1">{lead.source}</p>
                  {lead.campaign && <p className="text-[10px] text-primary mb-1">{lead.campaign}</p>}
                  <p className="text-sm font-semibold">R$ {(lead.saleValue || lead.value).toLocaleString()}</p>
                  {lead.lossReason && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive mt-1 inline-block">
                      {lossReasonLabels[lead.lossReason]}
                    </span>
                  )}
                  {/* Move buttons - clients and admin/colaborador can move */}
                  <div className="flex gap-1 mt-2">
                    {col.key !== "entrou" && col.key !== "perdido" && (
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

      {/* Move to Fechado/Perdido Dialog */}
      <Dialog open={!!moveTarget} onOpenChange={() => setMoveTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {moveTarget?.stage === "fechado" ? "Registrar Venda" : "Motivo da Perda"}
            </DialogTitle>
          </DialogHeader>
          {moveTarget?.stage === "fechado" ? (
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground">Valor da Venda (R$)</label>
              <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={saleValue || ""} onChange={e => setSaleValue(Number(e.target.value))} />
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground">Motivo (Obrigatório)</label>
              <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={lossReason} onChange={e => setLossReason(e.target.value as LossReason)}>
                {Object.entries(lossReasonLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveTarget(null)}>Cancelar</Button>
            <Button onClick={confirmMove}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-md">
          {selectedLead && (
            <>
              <DialogHeader><DialogTitle>{selectedLead.name}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{selectedLead.email}</div>
                <div className="flex items-center gap-2 text-sm"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{selectedLead.phone}</div>
                <div className="flex items-center gap-2 text-sm"><ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />{selectedLead.source}{selectedLead.campaign && ` — ${selectedLead.campaign}`}</div>
                <p className="text-lg font-bold">R$ {(selectedLead.saleValue || selectedLead.value).toLocaleString()}</p>
                {selectedLead.lossReason && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-destructive/10 text-destructive">
                    {lossReasonLabels[selectedLead.lossReason]}
                  </span>
                )}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><MessageSquare className="h-4 w-4" /> Histórico</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedLead.notes.length === 0 && <p className="text-xs text-muted-foreground">Sem registros.</p>}
                    {selectedLead.notes.map((n, i) => <div key={i} className="bg-muted rounded p-2 text-xs">{n}</div>)}
                  </div>
                  {!isClient && (
                    <div className="flex gap-2 mt-2">
                      <input className="flex-1 h-8 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Adicionar nota..." value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote()} />
                      <Button size="sm" variant="outline" onClick={addNote}>+</Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Lead */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nome" value={newLead.name} onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))} />
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Email" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} />
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Telefone" value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} />
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))}>
              <option>Meta Ads</option><option>Google Ads</option><option>Indicação</option><option>Site</option>
            </select>
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Valor estimado (R$)" value={newLead.value || ""} onChange={e => setNewLead(p => ({ ...p, value: Number(e.target.value) }))} />
          </div>
          <DialogFooter><Button onClick={() => { if (newLead.name) { setLeads(prev => [...prev, { ...newLead, id: Date.now().toString(), stage: "entrou" as LeadStage, notes: [], createdAt: new Date().toISOString().split("T")[0] }]); setNewLead({ name: "", email: "", phone: "", source: "Meta Ads", value: 0 }); setShowAdd(false); } }}>Adicionar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRM;
