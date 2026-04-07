import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole, LossReason, lossReasonLabels } from "@/contexts/RoleContext";
import { ComingSoon } from "@/components/ComingSoon";
import { Plus, Phone, Mail, ExternalLink, Download, Tag, Filter, Car, CreditCard, Calendar, RefreshCw, Trash2, BarChart3 } from "lucide-react";
import { useKanbanDnD } from "@/hooks/use-kanban-dnd";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from "recharts";
import { toast } from "sonner";

type LeadStatus = "novo" | "contatado" | "qualificado" | "fechado" | "perdido";

const stageColumns: { key: LeadStatus; label: string; color: string }[] = [
  { key: "novo", label: "Novo Lead", color: "info" },
  { key: "contatado", label: "Contatado", color: "warning" },
  { key: "qualificado", label: "Qualificado", color: "chart-3" },
  { key: "fechado", label: "Fechado ✓", color: "success" },
  { key: "perdido", label: "Perdido", color: "destructive" },
];

const COLORS = ["hsl(0, 72%, 51%)", "hsl(220, 70%, 50%)", "hsl(262, 60%, 55%)", "hsl(35, 90%, 55%)", "hsl(152, 60%, 42%)", "hsl(180, 50%, 45%)"];

const CRM = () => {
  const { role } = useRole();
  const qc = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", source: "Meta Ads", value: 0, client_id: "" });
  const [moveTarget, setMoveTarget] = useState<{ lead: any; status: LeadStatus } | null>(null);
  const [saleValue, setSaleValue] = useState(0);
  const [lossReason, setLossReason] = useState<LossReason>("nao_atende");
  const [lossNote, setLossNote] = useState("");

  // Filters - default to current month
  const [clientFilter, setClientFilter] = useState("all");
  const [sellerFilter, setSellerFilter] = useState("all");
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
  const [dateTo, setDateTo] = useState(now.toISOString().split("T")[0]);

  // Edit sale value on closed leads
  const [editValueTarget, setEditValueTarget] = useState<any>(null);
  const [editValue, setEditValue] = useState(0);

  // Seller tag management
  const [showTagDialog, setShowTagDialog] = useState<any>(null);
  const [tagInput, setTagInput] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

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

  // Get unique seller tags
  const sellerTags = useMemo(() => {
    const tags = new Set<string>();
    leads.forEach((l: any) => { if (l.seller_tag) tags.add(l.seller_tag); });
    return Array.from(tags).sort();
  }, [leads]);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l: any) => {
      if (clientFilter !== "all" && l.client_id !== clientFilter) return false;
      if (sellerFilter !== "all" && l.seller_tag !== sellerFilter) return false;
      if (dateFrom) {
        const entryDate = l.lead_entry_date || l.created_at;
        if (entryDate < dateFrom) return false;
      }
      if (dateTo) {
        const entryDate = l.lead_entry_date || l.created_at;
        if (entryDate > dateTo + "T23:59:59") return false;
      }
      return true;
    });
  }, [leads, clientFilter, sellerFilter, dateFrom, dateTo]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, value, loss_reason, notes }: { id: string; status: LeadStatus; value?: number; loss_reason?: string; notes?: string }) => {
      const update: any = { status };
      if (value !== undefined) update.value = value;
      if (loss_reason) update.loss_reason = loss_reason;
      if (notes !== undefined) update.notes = notes;
      const { error } = await supabase.from("leads").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); setMoveTarget(null); setLossNote(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateSellerTag = useMutation({
    mutationFn: async ({ id, seller_tag }: { id: string; seller_tag: string }) => {
      const { error } = await supabase.from("leads").update({ seller_tag } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); setShowTagDialog(null); setTagInput(""); toast.success("Vendedor atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateSaleValue = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: number }) => {
      const { error } = await supabase.from("leads").update({ value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); setEditValueTarget(null); toast.success("Valor atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); setDeleteTarget(null); setSelectedLead(null); toast.success("Lead excluído"); },
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
      setLossReason("nao_atende");
      setLossNote("");
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
      notes: moveTarget.status === "perdido" && lossNote.trim() ? lossNote.trim() : undefined,
    });
  };

  const handleDnDMove = useCallback((id: string, newStatus: LeadStatus) => {
    const lead = leads.find((l: any) => l.id === id);
    if (!lead || lead.status === newStatus) return;
    moveLead(lead, newStatus);
  }, [leads]);

  const { draggedId, dragOverCol, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } = useKanbanDnD<LeadStatus>(handleDnDMove);

  const closedCount = filteredLeads.filter((l: any) => l.status === "fechado").length;
  const lostCount = filteredLeads.filter((l: any) => l.status === "perdido").length;
  const conversionRate = filteredLeads.length > 0 ? Math.round((closedCount / filteredLeads.length) * 100) : 0;

  const lostLeads = filteredLeads.filter((l: any) => l.status === "perdido" && l.loss_reason);
  const lossBreakdown = Object.entries(lossReasonLabels).map(([key, label]) => ({
    name: label,
    value: lostLeads.filter((l: any) => l.loss_reason === key).length,
  })).filter(d => d.value > 0);

  // Leads by seller chart data
  const leadsBySellerData = useMemo(() => {
    const sellerMap: Record<string, number> = {};
    filteredLeads.forEach((l: any) => {
      const tag = l.seller_tag || "Sem vendedor";
      sellerMap[tag] = (sellerMap[tag] || 0) + 1;
    });
    return Object.entries(sellerMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredLeads]);

  const isClient = role === "cliente";
  const isAdmin = role === "admin";
  const canAddLeads = isAdmin;
  const showChart = isAdmin || isClient;

  const [syncing, setSyncing] = useState(false);
  const syncLeads = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("distribute-leads");
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["leads"] });
      const result = data as any;
      if (result?.total_inserted > 0) {
        toast.success(`${result.total_inserted} novos leads sincronizados!`);
      } else {
        toast.info(result?.message || "Nenhum lead novo encontrado.");
      }
    } catch (e: any) {
      toast.error("Erro ao sincronizar: " + (e.message || "Tente novamente"));
    } finally {
      setSyncing(false);
    }
  };

  // CSV Export
  const exportCSV = () => {
    const headers = ["Nome", "Email", "Telefone", "Status", "Vendedor", "Tipo Financiamento", "Valor Parcelas", "Valor", "Data Entrada", "Origem"];
    const rows = filteredLeads.map((l: any) => [
      l.name, l.email || "", l.phone || "", l.status, l.seller_tag || "",
      l.financing_type || "", l.installment_value || "", l.value || "",
      l.lead_entry_date ? new Date(l.lead_entry_date).toLocaleDateString("pt-BR") : new Date(l.created_at).toLocaleDateString("pt-BR"),
      l.source || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm-leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  const formatSource = (source: string | null) => {
    if (!source) return "—";
    if (source === "leads_laportec_star5") return "Meta Ads";
    return source;
  };

  const content = (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isClient ? "Meus Leads" : "CRM — Pipeline Geral"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{filteredLeads.length} leads no pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={syncLeads} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Carregar Leads"}
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Exportar CSV</Button>
          {canAddLeads && <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Lead</Button>}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {isAdmin && (
          <select className="h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="all">Todos os clientes</option>
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <select className="h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={sellerFilter} onChange={e => setSellerFilter(e.target.value)}>
          <option value="all">Todos vendedores</option>
          {sellerTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">De:</span>
          <input type="date" className="h-9 px-2 rounded-lg bg-muted border-0 text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Até:</span>
          <input type="date" className="h-9 px-2 rounded-lg bg-muted border-0 text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        {(clientFilter !== "all" || sellerFilter !== "all" || dateFrom || dateTo) && (
          <button className="text-xs text-primary hover:underline" onClick={() => { setClientFilter("all"); setSellerFilter("all"); setDateFrom(""); setDateTo(""); }}>Limpar filtros</button>
        )}
      </div>

      {/* Big numbers */}
      <div className="grid gap-4 grid-cols-4">
        <div className="metric-card">
          <p className="text-2xl font-bold">{filteredLeads.length}</p>
          <p className="text-xs text-muted-foreground">Total de Leads</p>
        </div>
        <div className="metric-card"><p className="text-2xl font-bold text-success">{closedCount}</p><p className="text-xs text-muted-foreground">Leads Fechados</p></div>
        <div className="metric-card"><p className="text-2xl font-bold text-destructive">{lostCount}</p><p className="text-xs text-muted-foreground">Leads Perdidos</p></div>
        <div className="metric-card"><p className="text-2xl font-bold">{conversionRate}%</p><p className="text-xs text-muted-foreground">Conversão</p></div>
      </div>

      {/* Charts side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Leads by seller - vertical bars */}
        {leadsBySellerData.length > 0 && (
          <div className="metric-card">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4" />Leads por Vendedor</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsBySellerData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }} className="my-[41px] pr-[25px]">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Leads">
                    <LabelList dataKey="value" position="top" style={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--foreground))" }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Loss reasons pie */}
        {showChart && lossBreakdown.length > 0 && (
          <div className="metric-card">
            <h3 className="text-sm font-semibold mb-3">Motivos de Perda</h3>
            <div className="grid grid-cols-1 gap-4 items-center">
              <div className="h-[160px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={lossBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>{lossBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} /></PieChart></ResponsiveContainer></div>
              <div className="space-y-2">{lossBreakdown.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs"><div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-muted-foreground">{d.name}</span></div><span className="font-bold">{d.value}</span></div>
              ))}</div>
            </div>
          </div>
        )}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto">
        {stageColumns.map(col => (
          <div key={col.key}
            className={`kanban-column min-w-[200px] transition-colors ${dragOverCol === col.key ? "ring-2 ring-primary/30 bg-primary/5" : ""}`}
            onDragOver={e => handleDragOver(e, col.key)} onDragLeave={handleDragLeave} onDrop={e => handleDrop(e, col.key)}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold">{col.label}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${col.color}/10 text-${col.color}`}>{filteredLeads.filter((l: any) => l.status === col.key).length}</span>
            </div>
            <div className="space-y-2">
              {filteredLeads.filter((l: any) => l.status === col.key).map((lead: any) => (
                <div key={lead.id} draggable onDragStart={e => handleDragStart(e, lead.id)} onDragEnd={handleDragEnd}
                  className={`kanban-card cursor-grab active:cursor-grabbing ${draggedId === lead.id ? "opacity-40" : ""}`}
                  onClick={() => setSelectedLead(lead)}>
                  <h4 className="text-sm font-medium mb-1">{lead.name}</h4>
                  <p className="text-xs text-muted-foreground mb-1">{formatSource(lead.source)}</p>
                  {isAdmin && <p className="text-[10px] text-primary mb-1">{lead.clients?.name || ""}</p>}
                  {lead.email && <p className="text-[10px] text-muted-foreground truncate"><Mail className="h-3 w-3 inline mr-1" />{lead.email}</p>}
                  {lead.phone && lead.phone !== lead.email && <p className="text-[10px] text-muted-foreground truncate"><Phone className="h-3 w-3 inline mr-1" />{lead.phone}</p>}
                  {lead.financing_type && <p className="text-[10px] text-muted-foreground"><Car className="h-3 w-3 inline mr-1" />{lead.financing_type.replace(/_/g, " ")}</p>}
                  {lead.installment_value && <p className="text-[10px] text-muted-foreground"><CreditCard className="h-3 w-3 inline mr-1" />{lead.installment_value.replace(/_/g, " ").replace(/r\$/i, "R$")}</p>}
                  {lead.value > 0 && <p className="text-sm font-semibold">R$ {Number(lead.value).toLocaleString()}</p>}
                  {lead.seller_tag ? (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary mt-1 inline-flex items-center gap-1 cursor-pointer hover:bg-primary/20"
                      onClick={e => { e.stopPropagation(); setShowTagDialog(lead); setTagInput(""); }}
                    >
                      <Tag className="h-2.5 w-2.5" />{lead.seller_tag}
                    </span>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); setShowTagDialog(lead); setTagInput(""); }}
                      className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground mt-1 inline-flex items-center gap-1 hover:bg-primary/10 hover:text-primary">
                      <Tag className="h-2.5 w-2.5" />+ Vendedor
                    </button>
                  )}
                  {lead.loss_reason && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive mt-1 inline-block">{lossReasonLabels[lead.loss_reason as LossReason] || lead.loss_reason}</span>}
                  <div className="flex gap-1 mt-2">
                    {col.key !== "novo" && col.key !== "perdido" && (
                      <button onClick={e => { e.stopPropagation(); const prev = stageColumns[stageColumns.findIndex(c => c.key === col.key) - 1]; if (prev) moveLead(lead, prev.key); }} className="text-[10px] px-2 py-0.5 rounded bg-muted">←</button>
                    )}
                    {col.key !== "fechado" && col.key !== "perdido" && (
                      <button onClick={e => { e.stopPropagation(); const next = stageColumns[stageColumns.findIndex(c => c.key === col.key) + 1]; if (next) moveLead(lead, next.key); }} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">→</button>
                    )}
                    <button onClick={e => { e.stopPropagation(); setDeleteTarget(lead); }} className="text-[10px] px-2 py-0.5 rounded bg-destructive/10 text-destructive ml-auto"><Trash2 className="h-3 w-3" /></button>
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
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Motivo</label>
                <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={lossReason} onChange={e => setLossReason(e.target.value as LossReason)}>
                  {Object.entries(lossReasonLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Observação (opcional)</label>
                <textarea className="w-full min-h-[60px] px-3 py-2 rounded-lg bg-muted border-0 text-sm focus:outline-none resize-none" placeholder="Alguma observação sobre a perda..." value={lossNote} onChange={e => setLossNote(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setMoveTarget(null)}>Cancelar</Button><Button onClick={confirmMove}>Confirmar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir Lead</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir o lead <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteLead.mutate(deleteTarget.id)} disabled={deleteLead.isPending}>
              {deleteLead.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Seller Tag Dialog */}
      <Dialog open={!!showTagDialog} onOpenChange={() => setShowTagDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Atribuir Vendedor</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground">Selecione ou crie uma tag de vendedor</label>
            {sellerTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sellerTags.map(tag => (
                  <button key={tag} onClick={() => { if (showTagDialog) updateSellerTag.mutate({ id: showTagDialog.id, seller_tag: tag }); }}
                    className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    {tag}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input className="flex-1 h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Nova tag de vendedor..." value={tagInput} onChange={e => setTagInput(e.target.value)} />
              <Button size="sm" disabled={!tagInput.trim()} onClick={() => { if (showTagDialog && tagInput.trim()) updateSellerTag.mutate({ id: showTagDialog.id, seller_tag: tagInput.trim() }); }}>
                Criar
              </Button>
            </div>
          </div>
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
              <div className="flex items-center gap-2 text-sm"><ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />{formatSource(selectedLead.source)} {selectedLead.clients?.name && `— ${selectedLead.clients.name}`}</div>
              {selectedLead.financing_type && <div className="flex items-center gap-2 text-sm"><Car className="h-3.5 w-3.5 text-muted-foreground" />Financiamento: {selectedLead.financing_type.replace(/_/g, " ")}</div>}
              {selectedLead.installment_value && <div className="flex items-center gap-2 text-sm"><CreditCard className="h-3.5 w-3.5 text-muted-foreground" />Parcelas: {selectedLead.installment_value.replace(/_/g, " ").replace(/r\$/i, "R$")}</div>}
              {selectedLead.lead_entry_date && <div className="flex items-center gap-2 text-sm"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />Entrada: {new Date(selectedLead.lead_entry_date).toLocaleDateString("pt-BR")}</div>}
              {selectedLead.value > 0 && <p className="text-lg font-bold">R$ {Number(selectedLead.value).toLocaleString()}</p>}
              {selectedLead.notes && <div className="text-xs text-muted-foreground bg-muted rounded-lg p-2"><strong>Obs:</strong> {selectedLead.notes}</div>}
              {selectedLead.seller_tag ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary inline-flex items-center gap-1"><Tag className="h-3 w-3" />{selectedLead.seller_tag}</span>
                  <button className="text-[10px] text-muted-foreground hover:text-primary" onClick={() => { setShowTagDialog(selectedLead); setTagInput(""); setSelectedLead(null); }}>Alterar</button>
                </div>
              ) : (
                <button className="text-xs text-primary hover:underline" onClick={() => { setShowTagDialog(selectedLead); setTagInput(""); setSelectedLead(null); }}>+ Atribuir vendedor</button>
              )}
              <div className="pt-2 border-t">
                <Button variant="destructive" size="sm" onClick={() => { setDeleteTarget(selectedLead); setSelectedLead(null); }}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir Lead
                </Button>
              </div>
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
