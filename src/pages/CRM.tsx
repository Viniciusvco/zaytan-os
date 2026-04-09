import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole, LossReason, lossReasonLabels } from "@/contexts/RoleContext";
import { ComingSoon } from "@/components/ComingSoon";
import { Plus, Phone, Mail, ExternalLink, Download, Upload, Tag, Filter, Car, CreditCard, Calendar, RefreshCw, Trash2, Search, MoreHorizontal, FileText } from "lucide-react";
import { LaudoGenerator } from "@/components/LaudoGenerator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useKanbanDnD } from "@/hooks/use-kanban-dnd";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";

type LeadStatus = "novo" | "contatado" | "qualificado" | "fechado" | "perdido";

const stageColumns: { key: LeadStatus; label: string; color: string }[] = [
  { key: "novo", label: "Novo Lead", color: "info" },
  { key: "contatado", label: "Contatado", color: "warning" },
  { key: "qualificado", label: "Qualificado", color: "chart-3" },
  { key: "fechado", label: "Fechado ✓", color: "success" },
  { key: "perdido", label: "Perdido", color: "destructive" },
];



const CRM = () => {
  const { role } = useRole();
  const qc = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", source: "Meta Ads", value: 0, client_id: "", financing_type: "", installment_value: "", lead_entry_date: "", seller_tag: "", notes: "" });
  const [moveTarget, setMoveTarget] = useState<{ lead: any; status: LeadStatus } | null>(null);
  const [saleValue, setSaleValue] = useState(0);
  const [lossReason, setLossReason] = useState<LossReason>("nao_atende");
  const [lossNote, setLossNote] = useState("");

  // Filters - default to current month
  const [clientFilter, setClientFilter] = useState("all");
  const [sellerFilter, setSellerFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
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
  const [laudoTarget, setLaudoTarget] = useState<any>(null);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSupplier, setImportSupplier] = useState("");

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
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = (l.name || "").toLowerCase().includes(q) ||
          (l.email || "").toLowerCase().includes(q) ||
          (l.phone || "").toLowerCase().includes(q) ||
          (l.seller_tag || "").toLowerCase().includes(q);
        if (!match) return false;
      }
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
  }, [leads, clientFilter, sellerFilter, searchQuery, dateFrom, dateTo]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, value, loss_reason, notes }: { id: string; status: LeadStatus; value?: number; loss_reason?: string; notes?: string }) => {
      const update: any = { status };
      if (value !== undefined) update.value = value;
      if (loss_reason) update.loss_reason = loss_reason;
      if (notes !== undefined) update.notes = notes;
      const { error } = await supabase.from("leads").update(update).eq("id", id);
      if (error) throw error;

      // Auto-create juridico card + payment tracking when closing
      if (status === "fechado") {
        const lead = leads.find((l: any) => l.id === id);
        if (lead) {
          // Create juridico card (ignore if already exists)
          await supabase.from("juridico_cards").insert({
            lead_id: id,
            client_id: lead.client_id,
            status: "analise_documentacao" as any,
            laudo_url: lead.laudo_pdf_url || null,
          }).then(() => {});

          // Create payment tracking (ignore if already exists)
          await supabase.from("payment_tracking").insert({
            lead_id: id,
            client_id: lead.client_id,
            seller_name: lead.seller_tag || null,
            valor_parcela: value || lead.value || 0,
          }).then(() => {});
        }
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); qc.invalidateQueries({ queryKey: ["juridico-cards"] }); qc.invalidateQueries({ queryKey: ["payment-tracking"] }); setMoveTarget(null); setLossNote(""); },
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
      const { error } = await supabase.from("leads").insert({
        name: p.name, email: p.email || null, phone: p.phone || null, source: p.source,
        value: p.value || null, client_id: p.client_id,
        financing_type: p.financing_type || null, installment_value: p.installment_value || null,
        lead_entry_date: p.lead_entry_date || null, seller_tag: p.seller_tag || null, notes: p.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); setShowAdd(false); setNewLead({ name: "", email: "", phone: "", source: "Meta Ads", value: 0, client_id: "", financing_type: "", installment_value: "", lead_entry_date: "", seller_tag: "", notes: "" }); toast.success("Lead criado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const moveLead = (lead: any, status: LeadStatus) => {
    if (status === "fechado" || status === "perdido") {
      setMoveTarget({ lead, status });
      setSaleValue(lead.value || 0);
      setLossReason("nao_atende");
      setLossNote("");
    } else {
      // When moving back from "fechado" or "perdido", clear value/loss_reason
      const updates: any = { id: lead.id, status };
      if (lead.status === "fechado") updates.value = 0;
      if (lead.status === "perdido") updates.loss_reason = null;
      updateStatus.mutate(updates);
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

  const closedLeads = filteredLeads.filter((l: any) => l.status === "fechado");
  const closedCount = closedLeads.length;
  const lostCount = filteredLeads.filter((l: any) => l.status === "perdido").length;
  const conversionRate = filteredLeads.length > 0 ? Math.round((closedCount / filteredLeads.length) * 100) : 0;
  const totalFaturado = closedLeads.reduce((sum: number, l: any) => sum + (Number(l.value) || 0), 0);


  const isClient = role === "cliente";
  const isAdmin = role === "admin";
  const canAddLeads = isAdmin;

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
    if (source === "leads_laportec_star5") return "Leads Zaytan";
    if (source.startsWith("import_")) return `Leads ${source.replace("import_", "")}`;
    return source;
  };

  const getSourceTag = (source: string | null) => {
    if (!source) return null;
    if (source === "leads_laportec_star5") return { label: "Leads Zaytan", className: "bg-primary/10 text-primary" };
    if (source.startsWith("import_")) return { label: `Leads ${source.replace("import_", "")}`, className: "bg-chart-3/10 text-chart-3" };
    return null;
  };

  const downloadTemplate = () => {
    const headers = ["Nome", "Email", "Telefone", "Valor", "Tipo Financiamento", "Valor Parcelas", "Vendedor", "Observações"];
    const example = ["João Silva", "joao@email.com", "(11)99999-0000", "50000", "financiamento", "R$ 1.200", "Carlos", "Lead qualificado"];
    const csv = [headers.join(","), example.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-importacao-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCSV = async () => {
    if (!importFile || !importSupplier.trim()) { toast.error("Informe o fornecedor de leads"); return; }
    const clientId = isClient ? undefined : (clientFilter !== "all" ? clientFilter : undefined);
    if (isAdmin && !clientId) { toast.error("Selecione um cliente no filtro antes de importar"); return; }
    
    const text = await importFile.text();
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) { toast.error("CSV deve ter pelo menos 1 lead"); return; }
    
    const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
    const nameIdx = headers.findIndex(h => /nome/i.test(h));
    if (nameIdx < 0) { toast.error("Coluna 'Nome' é obrigatória"); return; }
    
    const emailIdx = headers.findIndex(h => /email/i.test(h));
    const phoneIdx = headers.findIndex(h => /telefone|phone/i.test(h));
    const valueIdx = headers.findIndex(h => /valor(?! parc)/i.test(h));
    const finTypeIdx = headers.findIndex(h => /tipo.*financ/i.test(h));
    const installIdx = headers.findIndex(h => /parcela/i.test(h));
    const sellerIdx = headers.findIndex(h => /vendedor/i.test(h));
    const notesIdx = headers.findIndex(h => /observ|notas|notes/i.test(h));

    const leadsToInsert = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map(v => v.replace(/^"|"$/g, "").trim());
      const name = vals[nameIdx];
      if (!name) continue;
      leadsToInsert.push({
        name,
        email: emailIdx >= 0 ? vals[emailIdx] || null : null,
        phone: phoneIdx >= 0 ? vals[phoneIdx] || null : null,
        value: valueIdx >= 0 ? Number(vals[valueIdx]?.replace(/[^\d.-]/g, "")) || null : null,
        financing_type: finTypeIdx >= 0 ? vals[finTypeIdx] || null : null,
        installment_value: installIdx >= 0 ? vals[installIdx] || null : null,
        seller_tag: sellerIdx >= 0 ? vals[sellerIdx] || null : null,
        notes: notesIdx >= 0 ? vals[notesIdx] || null : null,
        source: `import_${importSupplier.trim()}`,
        status: "novo" as const,
        client_id: clientId!,
        lead_entry_date: new Date().toISOString(),
      });
    }

    if (leadsToInsert.length === 0) { toast.error("Nenhum lead válido encontrado"); return; }

    const { error } = await supabase.from("leads").insert(leadsToInsert);
    if (error) { toast.error("Erro ao importar: " + error.message); return; }
    
    qc.invalidateQueries({ queryKey: ["leads"] });
    toast.success(`${leadsToInsert.length} leads importados como "Leads ${importSupplier.trim()}"`);
    setShowImport(false);
    setImportFile(null);
    setImportSupplier("");
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
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}><Upload className="h-4 w-4 mr-1" /> Importar CSV</Button>
          {canAddLeads && <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Lead</Button>}
        </div>
      </div>

      {/* Big numbers */}
      <div className="grid gap-4 grid-cols-5">
        <div className="metric-card">
          <p className="text-2xl font-bold">{filteredLeads.length}</p>
          <p className="text-xs text-muted-foreground">Total de Leads</p>
        </div>
        <div className="metric-card"><p className="text-2xl font-bold text-success">{closedCount}</p><p className="text-xs text-muted-foreground">Leads Fechados</p></div>
        <div className="metric-card"><p className="text-2xl font-bold text-destructive">{lostCount}</p><p className="text-xs text-muted-foreground">Leads Perdidos</p></div>
        <div className="metric-card"><p className="text-2xl font-bold">{conversionRate}%</p><p className="text-xs text-muted-foreground">Conversão</p></div>
        <div className="metric-card"><p className="text-2xl font-bold text-success">R$ {totalFaturado.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Valor Faturado</p></div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Buscar leads..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
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
        {(clientFilter !== "all" || sellerFilter !== "all" || dateFrom || dateTo || searchQuery) && (
          <button className="text-xs text-primary hover:underline" onClick={() => { setClientFilter("all"); setSellerFilter("all"); setDateFrom(""); setDateTo(""); setSearchQuery(""); }}>Limpar filtros</button>
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
              <div className="flex items-center gap-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${col.color}/10 text-${col.color}`}>{filteredLeads.filter((l: any) => l.status === col.key).length}</span>
                {col.key === "novo" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-0.5 rounded hover:bg-muted transition-colors"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        if (clientFilter !== "all") setNewLead(p => ({ ...p, client_id: clientFilter }));
                        setShowAdd(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" /> Inserir lead manualmente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {filteredLeads.filter((l: any) => l.status === col.key).map((lead: any) => (
                <div key={lead.id} draggable onDragStart={e => handleDragStart(e, lead.id)} onDragEnd={handleDragEnd}
                  className={`kanban-card cursor-grab active:cursor-grabbing ${draggedId === lead.id ? "opacity-40" : ""}`}
                  onClick={() => setSelectedLead(lead)}>
                  <h4 className="text-sm font-medium mb-1">{lead.name}</h4>
                  {getSourceTag(lead.source) && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${getSourceTag(lead.source)!.className}`}>
                      {getSourceTag(lead.source)!.label}
                    </span>
                  )}
                  {!getSourceTag(lead.source) && <p className="text-xs text-muted-foreground mb-1">{formatSource(lead.source)}</p>}
                  {isAdmin && <p className="text-[10px] text-primary mb-1">{lead.clients?.name || ""}</p>}
                  {lead.email && <p className="text-[10px] text-muted-foreground truncate"><Mail className="h-3 w-3 inline mr-1" />{lead.email}</p>}
                  {lead.phone && lead.phone !== lead.email && <p className="text-[10px] text-muted-foreground truncate"><Phone className="h-3 w-3 inline mr-1" />{lead.phone}</p>}
                  {lead.financing_type && <p className="text-[10px] text-muted-foreground"><Car className="h-3 w-3 inline mr-1" />{lead.financing_type.replace(/_/g, " ")}</p>}
                  {lead.installment_value && <p className="text-[10px] text-muted-foreground"><CreditCard className="h-3 w-3 inline mr-1" />{lead.installment_value.replace(/_/g, " ").replace(/r\$/i, "R$")}</p>}
                  {(lead.lead_entry_date || lead.created_at) && <p className="text-[10px] text-muted-foreground"><Calendar className="h-3 w-3 inline mr-1" />Entrada: {new Date(lead.lead_entry_date || lead.created_at).toLocaleDateString("pt-BR")}</p>}
                  {(lead.laudo_data || lead.laudo_pdf_url) && (
                    <button onClick={e => { e.stopPropagation(); setLaudoTarget(lead); }} className="text-[10px] px-2 py-1 rounded-md bg-green-100 text-green-700 font-semibold inline-flex items-center gap-1 mt-1 border border-green-300 hover:bg-green-200 transition-colors">
                      <FileText className="h-3 w-3" /> Laudo Gerado
                    </button>
                  )}
                  {lead.status === "fechado" && (
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold">R$ {Number(lead.value || 0).toLocaleString()}</p>
                      <button onClick={e => { e.stopPropagation(); setEditValueTarget(lead); setEditValue(lead.value || 0); }} className="text-[9px] text-primary hover:underline">editar</button>
                    </div>
                  )}
                  {lead.status !== "fechado" && lead.value > 0 && <p className="text-sm font-semibold">R$ {Number(lead.value).toLocaleString()}</p>}
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
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {col.key !== "novo" && (
                      <button onClick={e => { e.stopPropagation(); const prev = stageColumns[stageColumns.findIndex(c => c.key === col.key) - 1]; if (prev) moveLead(lead, prev.key); }} className="text-[10px] px-2 py-0.5 rounded bg-muted">←</button>
                    )}
                    {col.key !== "fechado" && col.key !== "perdido" && (
                      <button onClick={e => { e.stopPropagation(); const next = stageColumns[stageColumns.findIndex(c => c.key === col.key) + 1]; if (next) moveLead(lead, next.key); }} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">→</button>
                    )}
                    <button onClick={e => { e.stopPropagation(); setLaudoTarget(lead); }} className="text-[10px] px-2 py-0.5 rounded bg-chart-3/10 text-chart-3" title="Gerar Laudo"><FileText className="h-3 w-3" /></button>
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

      {/* Edit Sale Value Dialog */}
      <Dialog open={!!editValueTarget} onOpenChange={() => setEditValueTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Editar Valor da Venda</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground">Valor da Venda (R$)</label>
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editValue || ""} onChange={e => setEditValue(Number(e.target.value))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditValueTarget(null)}>Cancelar</Button>
            <Button onClick={() => { if (editValueTarget) updateSaleValue.mutate({ id: editValueTarget.id, value: editValue }); }} disabled={updateSaleValue.isPending}>
              {updateSaleValue.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
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
              {selectedLead.value > 0 && (
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold">R$ {Number(selectedLead.value).toLocaleString()}</p>
                  {selectedLead.status === "fechado" && (
                    <button className="text-xs text-primary hover:underline" onClick={() => { setEditValueTarget(selectedLead); setEditValue(selectedLead.value || 0); setSelectedLead(null); }}>Editar valor</button>
                  )}
                </div>
              )}
              {selectedLead.status === "fechado" && !selectedLead.value && (
                <button className="text-xs text-primary hover:underline" onClick={() => { setEditValueTarget(selectedLead); setEditValue(0); setSelectedLead(null); }}>+ Adicionar valor da venda</button>
              )}
              {selectedLead.notes && <div className="text-xs text-muted-foreground bg-muted rounded-lg p-2"><strong>Obs:</strong> {selectedLead.notes}</div>}
              {selectedLead.seller_tag ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary inline-flex items-center gap-1"><Tag className="h-3 w-3" />{selectedLead.seller_tag}</span>
                  <button className="text-[10px] text-muted-foreground hover:text-primary" onClick={() => { setShowTagDialog(selectedLead); setTagInput(""); setSelectedLead(null); }}>Alterar</button>
                </div>
              ) : (
                <button className="text-xs text-primary hover:underline" onClick={() => { setShowTagDialog(selectedLead); setTagInput(""); setSelectedLead(null); }}>+ Atribuir vendedor</button>
              )}
              {(selectedLead.laudo_data || selectedLead.laudo_pdf_url) && (
                <div className="flex items-center gap-2">
                  <button onClick={() => { setLaudoTarget(selectedLead); setSelectedLead(null); }} className="text-xs px-3 py-1.5 rounded-md bg-green-100 text-green-700 font-semibold inline-flex items-center gap-1 border border-green-300 hover:bg-green-200">
                    <FileText className="h-3.5 w-3.5" /> Ver Laudo Gerado
                  </button>
                  {selectedLead.laudo_pdf_url && (
                    <a href={selectedLead.laudo_pdf_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:underline">
                      <Download className="h-3 w-3 inline mr-0.5" />PDF
                    </a>
                  )}
                </div>
              )}
              <div className="pt-2 border-t flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setLaudoTarget(selectedLead); setSelectedLead(null); }}>
                  <FileText className="h-3.5 w-3.5 mr-1" /> Gerar Laudo
                </Button>
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
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nome *" value={newLead.name} onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))} />
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Email" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} />
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Telefone" value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} />
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))}>
              <option>Meta Ads</option><option>Google Ads</option><option>Indicação</option><option>Site</option>
            </select>
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newLead.client_id} onChange={e => setNewLead(p => ({ ...p, client_id: e.target.value }))}>
              <option value="">Selecione o cliente *</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Valor estimado (R$)" value={newLead.value || ""} onChange={e => setNewLead(p => ({ ...p, value: Number(e.target.value) }))} />
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newLead.financing_type} onChange={e => setNewLead(p => ({ ...p, financing_type: e.target.value }))}>
              <option value="">Tipo de financiamento</option>
              <option value="financiamento">Financiamento</option>
              <option value="consorcio">Consórcio</option>
              <option value="a_vista">À Vista</option>
              <option value="outro">Outro</option>
            </select>
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Valor das parcelas" value={newLead.installment_value} onChange={e => setNewLead(p => ({ ...p, installment_value: e.target.value }))} />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data de entrada do lead</label>
              <input type="date" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={newLead.lead_entry_date} onChange={e => setNewLead(p => ({ ...p, lead_entry_date: e.target.value }))} />
            </div>
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Tag do vendedor" value={newLead.seller_tag} onChange={e => setNewLead(p => ({ ...p, seller_tag: e.target.value }))} />
            <textarea className="w-full min-h-[60px] px-3 py-2 rounded-lg bg-muted border-0 text-sm focus:outline-none resize-none" placeholder="Observações" value={newLead.notes} onChange={e => setNewLead(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <DialogFooter><Button onClick={() => { if (newLead.name && newLead.client_id) createLeadMut.mutate(newLead); }} disabled={createLeadMut.isPending}>{createLeadMut.isPending ? "Criando..." : "Adicionar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Laudo Generator */}
      <LaudoGenerator
        open={!!laudoTarget}
        onOpenChange={v => { if (!v) setLaudoTarget(null); }}
        leadName={laudoTarget?.name || ""}
        leadPhone={laudoTarget?.phone}
        leadEmail={laudoTarget?.email}
        leadId={laudoTarget?.id}
        clientName={laudoTarget?.clients?.name || (clients.find((c: any) => c.id === laudoTarget?.client_id) as any)?.name || ""}
        onPdfSaved={() => qc.invalidateQueries({ queryKey: ["leads"] })}
        existingLaudoData={laudoTarget?.laudo_data || null}
      />
      {/* Import CSV Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent>
          <DialogHeader><DialogTitle>Importar Leads via CSV</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Baixe o template para conhecer o formato esperado, preencha e importe.</p>
              <Button variant="outline" size="sm" onClick={downloadTemplate}><Download className="h-4 w-4 mr-1" /> Baixar Template</Button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome do Fornecedor de Leads *</label>
              <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder='Ex: "Banco X", "Parceiro Y"' value={importSupplier} onChange={e => setImportSupplier(e.target.value)} />
              <p className="text-[10px] text-muted-foreground mt-1">Os leads serão tagueados como "Leads {importSupplier || '[Fornecedor]'}"</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Arquivo CSV *</label>
              <input type="file" accept=".csv" className="w-full text-sm" onChange={e => setImportFile(e.target.files?.[0] || null)} />
            </div>
            {isAdmin && clientFilter === "all" && <p className="text-xs text-destructive">⚠️ Selecione um cliente no filtro do CRM antes de importar</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImport(false)}>Cancelar</Button>
            <Button onClick={importCSV} disabled={!importFile || !importSupplier.trim() || (isAdmin && clientFilter === "all")}>Importar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (role === "colaborador") return <ComingSoon>{content}</ComingSoon>;
  return content;
};

export default CRM;
