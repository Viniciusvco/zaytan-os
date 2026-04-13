import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Clock, Package, AlertTriangle, XCircle, Users, Zap, ShieldAlert, CalendarIcon, Send, Eye, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type DatePreset = "hoje" | "ontem" | "custom";
type Props = { campaignId: string | null };

export function MonitoringDashboard({ campaignId }: Props) {
  const qc = useQueryClient();
  const [datePreset, setDatePreset] = useState<DatePreset>("hoje");
  const [customDate, setCustomDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedStockLeads, setSelectedStockLeads] = useState<string[]>([]);
  const [targetClient, setTargetClient] = useState("");
  const [showCrmLeads, setShowCrmLeads] = useState(false);

  const selectedDate = datePreset === "ontem" ? subDays(new Date(), 1) : datePreset === "custom" ? customDate : new Date();
  const dateLabel = datePreset === "hoje" ? "Hoje" : datePreset === "ontem" ? "Ontem" : format(customDate, "dd/MM/yyyy");

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["motor-metrics", campaignId, format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!campaignId) return null;
      const { data, error } = await supabase.functions.invoke("campaign-distribute", {
        body: { action: "metrics", campaign_id: campaignId, date: format(selectedDate, "yyyy-MM-dd") },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
    refetchInterval: 30000,
  });

  const { data: stockLeads = [] } = useQuery({
    queryKey: ["stock-leads-monitor", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase.from("lead_queue")
        .select("*, stock_client:stock_client_id(name)")
        .eq("campaign_id", campaignId)
        .eq("status", "estoque")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });

  const { data: campaignClients = [] } = useQuery({
    queryKey: ["campaign-clients-for-stock-monitor", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase.from("campaign_clients")
        .select("client_id, clients(name)")
        .eq("campaign_id", campaignId)
        .eq("paused", false);
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });

  const { data: crmLeadCounts = [], isLoading: crmLoading, refetch: refetchCrm } = useQuery({
    queryKey: ["crm-lead-counts", campaignId, format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!campaignId) return [];
      // Get client IDs in this campaign
      const { data: ccData } = await supabase.from("campaign_clients")
        .select("client_id, clients(name)")
        .eq("campaign_id", campaignId);
      if (!ccData || ccData.length === 0) return [];

      const clientIds = ccData.map((cc: any) => cc.client_id);
      
      // Query leads table for each client, filtered by date
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);

      const results = await Promise.all(clientIds.map(async (clientId: string) => {
        const { count } = await supabase.from("leads")
          .select("*", { count: "exact", head: true })
          .eq("client_id", clientId)
          .gte("created_at", dayStart.toISOString())
          .lte("created_at", dayEnd.toISOString());
        
        const clientInfo = ccData.find((cc: any) => cc.client_id === clientId);
        return {
          client_id: clientId,
          client_name: (clientInfo?.clients as any)?.name || "—",
          total_leads: count || 0,
        };
      }));

      return results;
    },
    enabled: !!campaignId && showCrmLeads,
  });


    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("campaign-distribute", {
        body: { action: "send_stock", lead_queue_ids: selectedStockLeads, target_client_id: targetClient },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["stock-leads-monitor"] });
      qc.invalidateQueries({ queryKey: ["motor-metrics"] });
      qc.invalidateQueries({ queryKey: ["stock-leads"] });
      setSelectedStockLeads([]);
      setTargetClient("");
      toast.success(`${data.sent} lead(s) enviado(s) do estoque`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleStockLead = (id: string) => {
    setSelectedStockLeads(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAllStock = () => {
    setSelectedStockLeads(prev => prev.length === stockLeads.length ? [] : stockLeads.map((l: any) => l.id));
  };

  if (!campaignId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Selecione uma campanha para ver as métricas</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Carregando métricas...</div>;
  }

  const m = metrics || {};
  const allLimitsHit = m.clients?.length > 0 && m.clients.every((c: any) => c.daily_limit && c.leads_received_today >= c.daily_limit);
  const now = new Date();

  const cards = [
    { label: "Leads Hoje", value: m.total_leads_today || 0, icon: Zap, color: "bg-primary/10 text-primary" },
    { label: "Distribuídos Hoje", value: m.distributed_today || 0, icon: Users, color: "bg-success/10 text-success" },
    { label: "Em Estoque", value: stockLeads.length, icon: Package, color: stockLeads.length > 0 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground" },
    { label: "Expirados", value: m.expired_count || 0, icon: XCircle, color: "bg-destructive/10 text-destructive" },
    { label: "Duplicados Pendentes", value: m.duplicate_pending || 0, icon: AlertTriangle, color: "bg-info/10 text-info" },
    { label: "Em Processamento (>5min)", value: m.processing_stuck || 0, icon: ShieldAlert, color: m.processing_stuck > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">Período:</span>
        <Button variant={datePreset === "hoje" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setDatePreset("hoje")}>Hoje</Button>
        <Button variant={datePreset === "ontem" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setDatePreset("ontem")}>Ontem</Button>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant={datePreset === "custom" ? "default" : "outline"} size="sm" className="h-7 text-xs gap-1.5">
              <CalendarIcon className="h-3 w-3" />
              {datePreset === "custom" ? format(customDate, "dd/MM/yyyy") : "Selecionar data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={customDate} onSelect={(d) => { if (d) { setCustomDate(d); setDatePreset("custom"); setCalendarOpen(false); } }} disabled={(d) => d > new Date()} locale={ptBR} className="pointer-events-auto" />
          </PopoverContent>
        </Popover>
        <span className="text-xs text-muted-foreground ml-2">({dateLabel})</span>
      </div>

      {/* All limits hit alert */}
      {allLimitsHit && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <span className="text-xs text-warning font-medium">Todos os clientes atingiram o limite diário. Novos leads irão para o estoque.</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="metric-card">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${c.color}`}>
              <c.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Last Distribution */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>Última distribuição: {m.last_distribution ? new Date(m.last_distribution).toLocaleString("pt-BR") : "Nenhuma"}</span>
      </div>

      {/* Client Distribution Table */}
      {m.clients?.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Distribuição por Cliente ({dateLabel})
            </h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-4 py-2">Cliente</th>
                <th className="text-right px-4 py-2">Investimento</th>
                <th className="text-right px-4 py-2">Peso %</th>
                <th className="text-right px-4 py-2">Leads Hoje</th>
                <th className="text-right px-4 py-2">Limite Diário</th>
                <th className="text-right px-4 py-2">Saldo Acum.</th>
                <th className="text-center px-4 py-2">Status</th>
                <th className="px-4 py-2">Progresso</th>
              </tr>
            </thead>
            <tbody>
              {m.clients.map((c: any) => {
                const limitPercent = c.daily_limit ? (c.leads_received_today / c.daily_limit) * 100 : 0;
                return (
                  <tr key={c.client_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-sm font-medium">{c.client_name}</td>
                    <td className="px-4 py-2.5 text-sm text-right">R$ {Number(c.investment).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-sm text-right">
                      <span className={c.weight_override ? "text-primary font-semibold" : ""}>{Number(c.weight_percent).toFixed(1)}%</span>
                      {c.weight_override && <span className="text-[10px] text-primary ml-1">✏️</span>}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right font-semibold">{c.leads_received_today}</td>
                    <td className="px-4 py-2.5 text-sm text-right">{c.daily_limit ?? "∞"}</td>
                    <td className="px-4 py-2.5 text-sm text-right">{Number(c.accumulated_balance).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-center">
                      {c.paused ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning">Pausado</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success">Ativo</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {c.daily_limit ? (
                        <Progress value={Math.min(limitPercent, 100)} className="h-1.5" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Sem limite</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock Section */}
      {stockLeads.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-warning" /> Estoque ({stockLeads.length} lead{stockLeads.length !== 1 ? "s" : ""})
            </h3>
            {selectedStockLeads.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary">{selectedStockLeads.length} selecionado(s)</span>
                <select className="h-7 px-2 rounded bg-muted border-0 text-xs" value={targetClient} onChange={e => setTargetClient(e.target.value)}>
                  <option value="">Enviar para...</option>
                  {campaignClients.map((cc: any) => (
                    <option key={cc.client_id} value={cc.client_id}>{(cc.clients as any)?.name}</option>
                  ))}
                </select>
                <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => sendStockMut.mutate()} disabled={!targetClient || sendStockMut.isPending}>
                  <Send className="h-3.5 w-3.5 mr-1" /> Enviar
                </Button>
              </div>
            )}
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-2 w-8">
                  <input type="checkbox" checked={selectedStockLeads.length === stockLeads.length && stockLeads.length > 0} onChange={selectAllStock} className="rounded" />
                </th>
                <th className="text-left px-4 py-2">Nome</th>
                <th className="text-left px-4 py-2">Telefone</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Cliente Origem</th>
                <th className="text-left px-4 py-2">Entrada</th>
                <th className="text-left px-4 py-2">Expira em</th>
              </tr>
            </thead>
            <tbody>
              {stockLeads.map((l: any) => {
                const expiresIn = l.expires_at ? Math.max(0, Math.ceil((new Date(l.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;
                const isNearExpiry = expiresIn !== null && expiresIn <= 1;
                return (
                  <tr key={l.id} className={`border-b border-border last:border-0 hover:bg-muted/30 ${isNearExpiry ? "bg-warning/5" : ""}`}>
                    <td className="px-4 py-2.5">
                      <input type="checkbox" checked={selectedStockLeads.includes(l.id)} onChange={() => toggleStockLead(l.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium">{l.name}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{l.phone || "—"}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{l.email || "—"}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{(l.stock_client as any)?.name || "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-2.5">
                      {expiresIn !== null ? (
                        <span className={`text-xs flex items-center gap-1 ${isNearExpiry ? "text-warning font-semibold" : "text-muted-foreground"}`}>
                          {isNearExpiry && <Clock className="h-3 w-3" />}
                          {expiresIn}d
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}