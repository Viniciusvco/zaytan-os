import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, Clock, FileQuestion, XCircle, RefreshCw, PieChart, RotateCcw, Eye, CalendarIcon, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRangeFilter, useDefaultDateRange } from "@/components/DateRangeFilter";
import { ContextFilters } from "@/components/ContextFilters";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, ListOrdered, Package, ScrollText, Megaphone } from "lucide-react";
import { MonitoringDashboard } from "@/components/motor/MonitoringDashboard";
import { CampaignManager } from "@/components/motor/CampaignManager";
import { LeadQueue } from "@/components/motor/LeadQueue";
import { StockManager } from "@/components/motor/StockManager";
import { AuditLog } from "@/components/motor/AuditLog";

const SYSTEM_DISTRIBUTION_CAMPAIGN_NAME = "__crm_distribution__";

type ContractStatus = "rascunho" | "ativo" | "cancelado" | "aguardando";

type ContractFormData = {
  client_id: string;
  title: string;
  start_date: string;
  end_date: string;
  setup_value: number | "";
  mrr_value: number | "";
  weekly_investment: number | "";
  status: ContractStatus;
  notes: string;
};

const statusConfig: Record<ContractStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  ativo: { label: "Ativo", icon: CheckCircle2, className: "bg-success/10 text-success" },
  rascunho: { label: "Rascunho", icon: FileQuestion, className: "bg-muted text-muted-foreground" },
  cancelado: { label: "Cancelado", icon: XCircle, className: "bg-destructive/10 text-destructive" },
  aguardando: { label: "Aguardando Assinatura", icon: Clock, className: "bg-warning/10 text-warning" },
};

function daysUntilDate(dateStr: string | null): number {
  if (!dateStr) return 999;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const emptyForm: ContractFormData = {
  client_id: "",
  title: "",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  setup_value: 0,
  mrr_value: 0,
  weekly_investment: 0,
  status: "rascunho",
  notes: "",
};

const ContractForm = ({
  data,
  onChange,
  clients,
}: {
  data: ContractFormData;
  onChange: (d: ContractFormData) => void;
  clients: Array<{ id: string; name: string }>;
}) => (
  <div className="space-y-3">
    <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={data.client_id} onChange={(e) => onChange({ ...data, client_id: e.target.value })}>
      <option value="">Selecione o cliente</option>
      {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
    <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Título do contrato" value={data.title} onChange={(e) => onChange({ ...data, title: e.target.value })} />
    <div className="grid grid-cols-2 gap-3">
      <div><label className="text-[10px] text-muted-foreground font-medium mb-1 block">Data de Início</label>
        <input type="date" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.start_date} onChange={(e) => onChange({ ...data, start_date: e.target.value })} /></div>
      <div><label className="text-[10px] text-muted-foreground font-medium mb-1 block">Data de Término</label>
        <input type="date" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.end_date || ""} onChange={(e) => onChange({ ...data, end_date: e.target.value })} /></div>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <div><label className="text-[10px] text-muted-foreground font-medium mb-1 block">Setup (R$)</label>
        <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.setup_value} onChange={(e) => onChange({ ...data, setup_value: e.target.value === "" ? "" : Number(e.target.value) })} /></div>
      <div><label className="text-[10px] text-muted-foreground font-medium mb-1 block">MRR (R$)</label>
        <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.mrr_value} onChange={(e) => onChange({ ...data, mrr_value: e.target.value === "" ? "" : Number(e.target.value) })} /></div>
      <div><label className="text-[10px] text-muted-foreground font-medium mb-1 block">Invest. Semanal (R$)</label>
        <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.weekly_investment} onChange={(e) => onChange({ ...data, weekly_investment: e.target.value === "" ? "" : Number(e.target.value) })} /></div>
    </div>
    <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={data.status} onChange={(e) => onChange({ ...data, status: e.target.value as ContractStatus })}>
      <option value="rascunho">Rascunho</option><option value="aguardando">Aguardando Assinatura</option><option value="ativo">Ativo</option><option value="cancelado">Cancelado</option>
    </select>
    <textarea className="w-full h-16 px-3 py-2 rounded-lg bg-muted border-0 text-sm focus:outline-none resize-none" placeholder="Observações..." value={data.notes || ""} onChange={(e) => onChange({ ...data, notes: e.target.value })} />
  </div>
);

const Contratos = () => {
  const qc = useQueryClient();
  const [dateRange, setDateRange] = useState(useDefaultDateRange());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editContract, setEditContract] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts").select("*, clients(name)").order("created_at", { ascending: false });
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

  const { data: distributionConfig, refetch: refetchDistributionConfig } = useQuery({
    queryKey: ["distribution-config"],
    queryFn: async () => {
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .select("id")
        .eq("name", SYSTEM_DISTRIBUTION_CAMPAIGN_NAME)
        .maybeSingle();

      if (campaignError) throw campaignError;
      if (!campaign) return { campaignId: null, rows: [] as any[] };

      const { data: rows, error: rowsError } = await supabase
        .from("campaign_clients")
        .select("id, client_id, investment_amount, weight_percent, weight_override, daily_limit")
        .eq("campaign_id", campaign.id);

      if (rowsError) throw rowsError;
      return { campaignId: campaign.id, rows: rows || [] };
    },
  });

  const createMut = useMutation({
    mutationFn: async (p: ContractFormData) => {
      const payload: any = {
        ...p,
        setup_value: p.setup_value === "" ? 0 : p.setup_value,
        mrr_value: p.mrr_value === "" ? 0 : p.mrr_value,
        weekly_investment: p.weekly_investment === "" ? 0 : p.weekly_investment,
      };
      if (!payload.end_date) delete payload.end_date;
      if (!payload.notes) delete payload.notes;
      const { error } = await supabase.from("contracts").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contracts"] }); setShowAdd(false); setForm(emptyForm); toast.success("Contrato criado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async (p: any) => {
      const { id, created_at, updated_at, clients: _c, ...rest } = p;
      if (!rest.end_date) rest.end_date = null;
      if (!rest.notes) rest.notes = null;
      rest.setup_value = rest.setup_value === "" ? 0 : rest.setup_value;
      rest.mrr_value = rest.mrr_value === "" ? 0 : rest.mrr_value;
      rest.weekly_investment = rest.weekly_investment === "" ? 0 : rest.weekly_investment;
      const { error } = await supabase.from("contracts").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contracts"] }); setEditContract(null); toast.success("Contrato atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contracts"] }); setDeleteId(null); toast.success("Contrato excluído"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = contracts.filter((c: any) => {
    const clientName = c.clients?.name || "";
    const matchSearch = clientName.toLowerCase().includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchClient = clientFilter === "all" || c.client_id === clientFilter;
    return matchSearch && matchStatus && matchClient;
  });

  const activeContracts = contracts.filter((c: any) => c.status === "ativo");
  const totalMRR = activeContracts.reduce((s: number, c: any) => s + Number(c.mrr_value || 0), 0);
  const expiringCount = activeContracts.filter((c: any) => { const d = daysUntilDate(c.end_date); return d <= 30 && d > 0; }).length;

  // Lead distribution calculation (preview)
  const investmentByClient: Record<string, { name: string; investment: number }> = {};
  activeContracts.forEach((c: any) => {
    const cid = c.client_id;
    const name = c.clients?.name || "—";
    if (!investmentByClient[cid]) investmentByClient[cid] = { name, investment: 0 };
    investmentByClient[cid].investment += Number(c.weekly_investment || 0);
  });
  const totalWeeklyInvestment = Object.values(investmentByClient).reduce((s, c) => s + c.investment, 0);
  const storedDistributionByClient = useMemo(
    () => new Map((distributionConfig?.rows || []).map((row: any) => [row.client_id, row])),
    [distributionConfig],
  );

  const [percentOverrides, setPercentOverrides] = useState<Record<string, number>>({});
  const [dailyLimitOverrides, setDailyLimitOverrides] = useState<Record<string, number | null>>({});
  const [costPerLeadReal, setCostPerLeadReal] = useState(10);
  const [costPerLeadSale, setCostPerLeadSale] = useState(20);
  const [importMode, setImportMode] = useState<"new_only" | "all">("new_only");
  const [importClientFilter, setImportClientFilter] = useState<string>("all");
  const [monitorPeriod, setMonitorPeriod] = useState<string>("today");

  const distributionPreview = Object.entries(investmentByClient)
    .filter(([_, v]) => v.investment > 0)
    .map(([cid, v]) => {
      const autoPercent = totalWeeklyInvestment > 0 ? (v.investment / totalWeeklyInvestment) * 100 : 0;
      const storedConfig = storedDistributionByClient.get(cid);
      const pct = percentOverrides[cid] !== undefined
        ? percentOverrides[cid]
        : storedConfig?.weight_override
          ? Number(storedConfig.weight_percent)
          : autoPercent;
      // Daily limit = weekly investment / cost per sale lead / 7 days
      const calculatedDailyLimit = costPerLeadSale > 0 ? Math.max(1, Math.round(v.investment / costPerLeadSale / 7)) : 1;
      return {
        client_id: cid,
        name: v.name,
        investment: v.investment,
        percentage: pct,
        isOverridden: percentOverrides[cid] !== undefined || !!storedConfig?.weight_override,
        dailyLimit: dailyLimitOverrides[cid] !== undefined ? dailyLimitOverrides[cid] : storedConfig?.daily_limit ?? calculatedDailyLimit,
        calculatedDailyLimit,
        isDailyLimitManual: dailyLimitOverrides[cid] !== undefined || storedConfig?.daily_limit !== null,
      };
    });

  const ensureDistributionCampaign = async () => {
    if (distributionConfig?.campaignId) return distributionConfig.campaignId;

    const { data: existingCampaign, error: existingError } = await supabase
      .from("campaigns")
      .select("id")
      .eq("name", SYSTEM_DISTRIBUTION_CAMPAIGN_NAME)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingCampaign) return existingCampaign.id;

    const { data: createdCampaign, error: createError } = await supabase
      .from("campaigns")
      .insert({
        name: SYSTEM_DISTRIBUTION_CAMPAIGN_NAME,
        total_investment: totalWeeklyInvestment,
        stock_expiry_days: 7,
        active: false,
      })
      .select("id")
      .single();

    if (createError) throw createError;
    return createdCampaign.id;
  };

  const saveDistributionRule = async (clientId: string, changes: { weight_percent?: number; weight_override?: boolean; daily_limit?: number | null }) => {
    const campaignId = await ensureDistributionCampaign();
    const storedConfig = storedDistributionByClient.get(clientId);
    const investment = investmentByClient[clientId]?.investment || 0;
    const autoPercent = totalWeeklyInvestment > 0 ? (investment / totalWeeklyInvestment) * 100 : 0;
    const payload = {
      investment_amount: investment,
      weight_percent: changes.weight_percent ?? Number(storedConfig?.weight_percent ?? autoPercent),
      weight_override: changes.weight_override ?? storedConfig?.weight_override ?? false,
      daily_limit: changes.daily_limit !== undefined ? changes.daily_limit : storedConfig?.daily_limit ?? null,
    };

    if (storedConfig?.id) {
      const { error } = await supabase.from("campaign_clients").update(payload).eq("id", storedConfig.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("campaign_clients").insert({
        campaign_id: campaignId,
        client_id: clientId,
        ...payload,
      });
      if (error) throw error;
    }

    await refetchDistributionConfig();
  };

  // Monitoring: leads distributed per client
  const monitorDateRange = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    if (monitorPeriod === "today") return { from: `${todayStr}T00:00:00.000Z`, to: `${todayStr}T23:59:59.999Z` };
    if (monitorPeriod === "yesterday") {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split("T")[0];
      return { from: `${yStr}T00:00:00.000Z`, to: `${yStr}T23:59:59.999Z` };
    }
    if (monitorPeriod === "7d") {
      const d = new Date(now); d.setDate(d.getDate() - 7);
      return { from: d.toISOString(), to: now.toISOString() };
    }
    if (monitorPeriod === "30d") {
      const d = new Date(now); d.setDate(d.getDate() - 30);
      return { from: d.toISOString(), to: now.toISOString() };
    }
    if (monitorPeriod.startsWith("custom:")) {
      const customDateStr = monitorPeriod.replace("custom:", "");
      return { from: `${customDateStr}T00:00:00.000Z`, to: `${customDateStr}T23:59:59.999Z` };
    }
    return { from: `${todayStr}T00:00:00.000Z`, to: `${todayStr}T23:59:59.999Z` };
  }, [monitorPeriod]);

  const monitorClientIds = useMemo(() => distributionPreview.map(d => d.client_id), [distributionPreview]);

  const { data: monitoringData, isLoading: monitorLoading, refetch: refetchMonitoring, isFetching: monitorFetching } = useQuery({
    queryKey: ["distribution-monitoring", monitorDateRange, monitorClientIds],
    queryFn: async () => {
      if (monitorClientIds.length === 0) {
        return { clients: [], lastUpdate: null, totalCurrent: 0, totalDistributed: 0 };
      }

      let allCurrentLeads: Array<{ client_id: string; lead_entry_date: string | null; created_at: string }> = [];
      let leadsFrom = 0;
      const pageSize = 1000;

      while (true) {
        const { data: batch, error } = await supabase
          .from("leads")
          .select("client_id, lead_entry_date, created_at")
          .in("client_id", monitorClientIds)
          .or(`and(lead_entry_date.gte.${monitorDateRange.from},lead_entry_date.lte.${monitorDateRange.to}),and(lead_entry_date.is.null,created_at.gte.${monitorDateRange.from},created_at.lte.${monitorDateRange.to})`)
          .range(leadsFrom, leadsFrom + pageSize - 1);
        if (error) throw error;
        if (!batch || batch.length === 0) break;
        allCurrentLeads = allCurrentLeads.concat(batch);
        if (batch.length < pageSize) break;
        leadsFrom += pageSize;
      }

      let allDistributedLogs: Array<{ client_id: string; created_at: string }> = [];
      let logsFrom = 0;
      while (true) {
        const { data: batch, error } = await supabase
          .from("distribution_logs")
          .select("client_id, created_at")
          .in("client_id", monitorClientIds)
          .gte("created_at", monitorDateRange.from)
          .lte("created_at", monitorDateRange.to)
          .range(logsFrom, logsFrom + pageSize - 1);
        if (error) throw error;
        if (!batch || batch.length === 0) break;
        allDistributedLogs = allDistributedLogs.concat(batch);
        if (batch.length < pageSize) break;
        logsFrom += pageSize;
      }

      const currentCountByClient: Record<string, number> = {};
      const distributedCountByClient: Record<string, number> = {};
      let lastUpdate: string | null = null;

      for (const l of allCurrentLeads) {
        currentCountByClient[l.client_id] = (currentCountByClient[l.client_id] || 0) + 1;
        const ts = l.lead_entry_date || l.created_at;
        if (!lastUpdate || ts > lastUpdate) lastUpdate = ts;
      }

      for (const log of allDistributedLogs) {
        distributedCountByClient[log.client_id] = (distributedCountByClient[log.client_id] || 0) + 1;
        if (!lastUpdate || log.created_at > lastUpdate) lastUpdate = log.created_at;
      }

      return {
        clients: distributionPreview.map(d => ({
          client_id: d.client_id,
          name: d.name,
          currentCount: currentCountByClient[d.client_id] || 0,
          distributedCount: distributedCountByClient[d.client_id] || 0,
          dailyLimit: d.dailyLimit,
        })),
        lastUpdate,
        totalCurrent: allCurrentLeads.length,
        totalDistributed: allDistributedLogs.length,
        fetchedAt: new Date().toISOString(),
      };
    },
    enabled: monitorClientIds.length > 0,
    refetchInterval: 30000,
  });

  // Stock leads for distribution monitoring
  const [monitorStockSelected, setMonitorStockSelected] = useState<string[]>([]);
  const [monitorStockTarget, setMonitorStockTarget] = useState("");

  const { data: monitorStockLeads = [], refetch: refetchMonitorStock } = useQuery({
    queryKey: ["monitor-stock-leads", distributionConfig?.campaignId],
    queryFn: async () => {
      if (!distributionConfig?.campaignId) return [];
      const { data, error } = await supabase.from("lead_queue")
        .select("*, stock_client:stock_client_id(name)")
        .eq("campaign_id", distributionConfig.campaignId)
        .eq("status", "estoque")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!distributionConfig?.campaignId,
  });

  const sendMonitorStockMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("campaign-distribute", {
        body: { action: "send_stock", lead_queue_ids: monitorStockSelected, target_client_id: monitorStockTarget },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["monitor-stock-leads"] });
      qc.invalidateQueries({ queryKey: ["distribution-monitoring"] });
      qc.invalidateQueries({ queryKey: ["stock-leads"] });
      qc.invalidateQueries({ queryKey: ["motor-metrics"] });
      setMonitorStockSelected([]);
      setMonitorStockTarget("");
      toast.success(`${data.sent} lead(s) enviado(s) do estoque`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleResetDistribution = () => {
    setPercentOverrides({});
    setDailyLimitOverrides({});
    const resetAll = async () => {
      const rowIds = (distributionConfig?.rows || []).map((row: any) => row.id);
      if (rowIds.length > 0) {
        const { error } = await supabase
          .from("campaign_clients")
          .update({ weight_override: false, daily_limit: null })
          .in("id", rowIds);
        if (error) throw error;
        await refetchDistributionConfig();
      }
      toast.success("Distribuição reconfigurada com base no investimento semanal");
    };

    void resetAll().catch((e: any) => toast.error(e.message || "Erro ao reconfigurar distribuição"));
  };

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const overrides = Object.keys(percentOverrides).length > 0 ? percentOverrides : undefined;
      const targetClientIds = importClientFilter !== "all" ? [importClientFilter] : undefined;
      const { data, error } = await supabase.functions.invoke("distribute-leads", {
        body: { percent_overrides: overrides, import_mode: importMode, target_client_ids: targetClientIds },
      });
      if (error) throw error;
      setSyncResult(data);
      if (data?.total_inserted > 0) {
        toast.success(`${data.total_inserted} leads importados! ${data.total_updated > 0 ? `${data.total_updated} atualizados.` : ""}`);
      } else if (data?.total_updated > 0) {
        toast.success(`${data.total_updated} leads atualizados (dados). Nenhum novo.`);
      } else {
        toast.info(data?.message || "Nenhum lead novo para distribuir");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao sincronizar leads");
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Distribuição</h1><p className="text-sm text-muted-foreground mt-1">Contratos e regras de distribuição em uma única visão</p></div>
      </div>

      <Tabs defaultValue="distribuicao">
        <TabsList>
          <TabsTrigger value="distribuicao" className="gap-1.5"><PieChart className="h-3.5 w-3.5" /> Distribuição</TabsTrigger>
          <TabsTrigger value="campanhas" className="gap-1.5"><Megaphone className="h-3.5 w-3.5" /> Campanhas</TabsTrigger>
          <TabsTrigger value="fila" className="gap-1.5"><ListOrdered className="h-3.5 w-3.5" /> Fila de Leads</TabsTrigger>
          <TabsTrigger value="estoque" className="gap-1.5"><Package className="h-3.5 w-3.5" /> Estoque</TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-1.5"><ScrollText className="h-3.5 w-3.5" /> Auditoria</TabsTrigger>
        </TabsList>

        {/* === TAB: Distribuição (contratos + regras) === */}
        <TabsContent value="distribuicao" className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Contrato</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="metric-card"><div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2"><FileText className="h-4 w-4 text-primary" /></div><p className="text-2xl font-bold">{contracts.length}</p><p className="text-xs text-muted-foreground mt-1">Total de Contratos</p></div>
            <div className="metric-card"><div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center mb-2"><CheckCircle2 className="h-4 w-4 text-success" /></div><p className="text-2xl font-bold">R$ {totalMRR.toLocaleString()}</p><p className="text-xs text-muted-foreground mt-1">MRR Ativo</p></div>
            <div className="metric-card"><div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center mb-2"><FileText className="h-4 w-4 text-info" /></div><p className="text-2xl font-bold">{activeContracts.length}</p><p className="text-xs text-muted-foreground mt-1">Contratos Ativos</p></div>
            <div className={`metric-card ${expiringCount > 0 ? "border-primary/50" : ""}`}><div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center mb-2"><AlertTriangle className="h-4 w-4 text-warning" /></div><p className="text-2xl font-bold">{expiringCount}</p><p className="text-xs text-muted-foreground mt-1">Vencendo em 30 dias</p></div>
          </div>

          <ContextFilters search={search} onSearchChange={setSearch} searchPlaceholder="Buscar contratos..."
            filterGroups={[
              { key: "client", label: "Cliente", options: [
                { label: "Todos", value: "all" },
                ...clients.map((c: any) => ({ label: c.name, value: c.id })),
              ]},
              { key: "status", label: "Status", options: [
                { label: "Todos", value: "all" }, { label: "Ativo", value: "ativo" },
                { label: "Rascunho", value: "rascunho" }, { label: "Aguardando", value: "aguardando" },
                { label: "Cancelado", value: "cancelado" },
              ]},
            ]}
            activeFilters={{ status: statusFilter, client: clientFilter }}
            onFilterChange={(key, v) => {
              if (key === "status") setStatusFilter(v);
              if (key === "client") setClientFilter(v);
            }}
          />

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cliente</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Título</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Início</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Setup</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">MRR</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Invest. Semanal</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Vencimento</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Ações</th>
              </tr></thead>
              <tbody>
                {filtered.map((c: any) => {
                  const st = statusConfig[c.status as ContractStatus] || statusConfig.rascunho;
                  const StIcon = st.icon;
                  const days = daysUntilDate(c.end_date);
                  const isExpiring = c.status === "ativo" && days <= 30 && days > 0;
                  const isExpired = c.status === "ativo" && days <= 0 && c.end_date;
                  return (
                    <tr key={c.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${isExpiring ? "bg-warning/5" : ""}`}>
                      <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="h-4 w-4 text-primary" /></div><span className="text-sm font-medium">{c.clients?.name || "—"}</span></div></td>
                      <td className="px-4 py-3 text-sm">{c.title}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(c.start_date).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3 text-sm text-right">R$ {Number(c.setup_value || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">R$ {Number(c.mrr_value || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right">R$ {Number(c.weekly_investment || 0).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${st.className}`}><StIcon className="h-3 w-3" /> {st.label}</span></td>
                      <td className="px-4 py-3">
                        {c.end_date && c.status === "ativo" && (
                          <div className="flex items-center gap-1.5">
                            {isExpiring && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                            {isExpired && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                            <span className={`text-xs ${isExpiring ? "text-warning font-semibold" : isExpired ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                              {isExpired ? "Vencido" : `${days}d — ${new Date(c.end_date).toLocaleDateString("pt-BR")}`}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditContract({ ...c })} className="p-1.5 rounded-md hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                          <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-md hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="distribuicao" className="mt-4 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <PieChart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Distribuição de Leads</h3>
                  <p className="text-xs text-muted-foreground">Proporcional ao investimento ou ajuste manual do % / limite diário</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button onClick={handleResetDistribution} variant="ghost" size="sm" className="text-xs gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" /> Reconfigurar pelo Investimento
                </Button>
                <select className="h-8 px-2 rounded-lg bg-muted border-0 text-xs" value={importClientFilter} onChange={e => setImportClientFilter(e.target.value)}>
                  <option value="all">Todos os clientes</option>
                  {distributionPreview.map(d => (
                    <option key={d.client_id} value={d.client_id}>{d.name}</option>
                  ))}
                </select>
                <select className="h-8 px-2 rounded-lg bg-muted border-0 text-xs" value={importMode} onChange={e => setImportMode(e.target.value as "new_only" | "all")}>
                  <option value="new_only">Somente novos leads</option>
                  <option value="all">Importar todos (atualizar dados, manter status)</option>
                </select>
                <Button onClick={handleSync} disabled={syncing || distributionPreview.length === 0} variant="outline" size="sm">
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Sincronizando..." : "Importar Leads"}
                </Button>
              </div>
            </div>

            {/* Cost per lead config */}
            <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Custo/Lead Real:</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">R$</span>
                  <input
                    type="number"
                    min={0.01}
                    step={0.5}
                    className="w-20 h-7 px-2 rounded bg-background border border-border text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={costPerLeadReal}
                    onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) setCostPerLeadReal(v); }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Custo/Lead Venda:</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">R$</span>
                  <input
                    type="number"
                    min={0.01}
                    step={0.5}
                    className="w-20 h-7 px-2 rounded bg-background border border-border text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={costPerLeadSale}
                    onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) setCostPerLeadSale(v); }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground">Limite diário = Invest. Semanal ÷ Custo/Lead Venda ÷ 7</span>
            </div>
            {distributionPreview.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum contrato ativo com investimento semanal configurado.
                <br />
                <span className="text-xs">Defina o "Invest. Semanal" nos contratos ativos para ativar a distribuição.</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b border-border">
                  <span>Cliente</span>
                  <span className="text-right">Investimento Semanal</span>
                  <span className="text-right">% dos Leads</span>
                  <span className="text-right">Limite Diário</span>
                  <span>Distribuição</span>
                  <span className="text-right">Ação</span>
                </div>
                {distributionPreview.map((d) => (
                  <div key={d.client_id} className="grid grid-cols-6 gap-2 items-center">
                    <span className="text-sm font-medium truncate">{d.name}</span>
                    <span className="text-sm text-right">R$ {d.investment.toLocaleString()}</span>
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        className={`w-16 h-7 px-2 rounded bg-muted border-0 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30 ${d.isOverridden ? "ring-1 ring-primary/50" : ""}`}
                        value={d.percentage.toFixed(1)}
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            setPercentOverrides(prev => ({ ...prev, [d.client_id]: val }));
                            void saveDistributionRule(d.client_id, { weight_percent: val, weight_override: true }).catch((err: any) => toast.error(err.message || "Erro ao salvar percentual"));
                          }
                        }}
                      />
                      <span className="text-xs">%</span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        min={0}
                        className={`w-16 h-7 px-2 rounded bg-muted border-0 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30 ${d.isDailyLimitManual ? "ring-1 ring-primary/50" : ""}`}
                        value={d.dailyLimit ?? ""}
                        placeholder="∞"
                        onChange={e => {
                          const val = e.target.value === "" ? null : parseInt(e.target.value);
                          setDailyLimitOverrides(prev => ({ ...prev, [d.client_id]: val }));
                          void saveDistributionRule(d.client_id, { daily_limit: val }).catch((err: any) => toast.error(err.message || "Erro ao salvar limite diário"));
                        }}
                      />
                      <span className="text-[10px] text-muted-foreground">/dia</span>
                    </div>
                    <Progress value={d.percentage} className="h-2" />
                    <div className="text-right">
                      {(d.isOverridden || d.isDailyLimitManual) && (
                        <button className="text-[10px] text-primary hover:underline" onClick={() => {
                          setPercentOverrides(prev => { const n = { ...prev }; delete n[d.client_id]; return n; });
                          setDailyLimitOverrides(prev => { const n = { ...prev }; delete n[d.client_id]; return n; });
                          void saveDistributionRule(d.client_id, { weight_percent: d.calculatedDailyLimit ? (d.investment / totalWeeklyInvestment) * 100 : 0, weight_override: false, daily_limit: null }).catch((err: any) => toast.error(err.message || "Erro ao resetar regra"));
                        }}>
                          Resetar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs font-semibold text-muted-foreground">Total Investimento Semanal</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold">R$ {totalWeeklyInvestment.toLocaleString()}</span>
                    <span className={`text-xs font-semibold ${Math.abs(distributionPreview.reduce((s, d) => s + d.percentage, 0) - 100) > 0.5 ? "text-warning" : "text-success"}`}>
                      Σ {distributionPreview.reduce((s, d) => s + d.percentage, 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {syncResult && syncResult.distribution && (
              <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="text-xs font-semibold mb-2">
                  {syncResult.total_inserted > 0 || syncResult.total_updated > 0
                    ? `✅ ${syncResult.total_inserted} novos, ${syncResult.total_updated || 0} atualizados`
                    : "ℹ️ Nenhum lead novo"}
                </h4>
                {syncResult.distribution.map((d: any) => (
                  <div key={d.client_id} className="flex items-center justify-between text-xs py-1">
                    <span>{d.client_name}</span>
                    <span className="font-semibold">
                      {d.leads_assigned} novos · {d.leads_existing || 0} existentes
                      {d.leads_updated > 0 ? ` · ${d.leads_updated} atualizados` : ""}
                      ({d.percentage.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monitoring Section */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-info/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-info" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Monitoramento de Distribuição</h3>
                  <p className="text-xs text-muted-foreground">
                    Quantidade atual no CRM e distribuição por cliente, pela data de entrada
                    {monitoringData?.lastUpdate && (
                      <> · Última atualização: <span className="font-medium">{new Date(monitoringData.lastUpdate).toLocaleString("pt-BR")}</span></>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5 px-2.5"
                  onClick={() => refetchMonitoring()}
                  disabled={monitorFetching}
                >
                  <RefreshCw className={`h-3 w-3 ${monitorFetching ? "animate-spin" : ""}`} />
                  Atualizar visão
                </Button>
                {[
                  { value: "today", label: "Hoje" },
                  { value: "yesterday", label: "Ontem" },
                  { value: "7d", label: "7 dias" },
                  { value: "30d", label: "30 dias" },
                ].map(opt => (
                  <Button
                    key={opt.value}
                    variant={monitorPeriod === opt.value ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-2.5"
                    onClick={() => setMonitorPeriod(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={monitorPeriod.startsWith("custom:") ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs gap-1.5 px-2.5"
                    >
                      <CalendarIcon className="h-3 w-3" />
                      {monitorPeriod.startsWith("custom:") 
                        ? new Date(monitorPeriod.replace("custom:", "")).toLocaleDateString("pt-BR") 
                        : "Data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={monitorPeriod.startsWith("custom:") ? new Date(monitorPeriod.replace("custom:", "")) : undefined}
                      onSelect={(d) => {
                        if (d) setMonitorPeriod(`custom:${d.toISOString().split("T")[0]}`);
                      }}
                      disabled={(d) => d > new Date()}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {monitorLoading ? (
              <div className="text-center py-6 text-muted-foreground text-sm">Carregando...</div>
            ) : !monitoringData?.clients?.length ? (
              <div className="text-center py-6 text-muted-foreground text-sm">Nenhum dado de distribuição no período selecionado.</div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b border-border">
                  <span>Cliente</span>
                  <span className="text-right">Atual no CRM</span>
                  <span className="text-right">Distribuídos</span>
                  <span className="text-right">Limite Diário</span>
                  <span>Progresso</span>
                </div>
                {monitoringData.clients.map((c: any) => {
                  const limitPct = c.dailyLimit ? Math.min((c.currentCount / c.dailyLimit) * 100, 100) : 0;
                  return (
                    <div key={c.client_id} className="grid grid-cols-5 gap-2 items-center">
                      <span className="text-sm font-medium truncate">{c.name}</span>
                      <span className="text-sm text-right font-semibold">{c.currentCount}</span>
                      <span className="text-sm text-right text-muted-foreground">{c.distributedCount}</span>
                      <span className="text-sm text-right text-muted-foreground">{c.dailyLimit ?? "∞"}</span>
                      <div>
                        {c.dailyLimit ? (
                          <div className="flex items-center gap-2">
                            <Progress value={limitPct} className="h-2 flex-1" />
                            <span className={`text-[10px] font-medium ${limitPct >= 100 ? "text-destructive" : limitPct >= 80 ? "text-warning" : "text-success"}`}>
                              {limitPct.toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Sem limite</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs font-semibold text-muted-foreground">Totais no período</span>
                  <div className="flex items-center gap-4 text-sm font-bold">
                    <span>CRM: {monitoringData.totalCurrent}</span>
                    <span>Distribuídos: {monitoringData.totalDistributed}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* === TAB: Campanhas (novo) === */}
        <TabsContent value="campanhas" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <CampaignManager selectedCampaignId={selectedCampaignId} onSelectCampaign={setSelectedCampaignId} />
            </div>
            <div className="lg:col-span-2">
              <MonitoringDashboard campaignId={selectedCampaignId} />
            </div>
          </div>
        </TabsContent>

        {/* === TAB: Fila de Leads (novo) === */}
        <TabsContent value="fila" className="mt-4">
          <LeadQueue campaignId={selectedCampaignId} />
        </TabsContent>

        {/* === TAB: Estoque (novo) === */}
        <TabsContent value="estoque" className="mt-4">
          <StockManager campaignId={selectedCampaignId} />
        </TabsContent>

        {/* === TAB: Auditoria (novo) === */}
        <TabsContent value="auditoria" className="mt-4">
          <AuditLog campaignId={selectedCampaignId} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogContent><DialogHeader><DialogTitle>Novo Contrato</DialogTitle></DialogHeader>
        <ContractForm data={form} onChange={setForm} clients={clients} />
        <DialogFooter><Button onClick={() => { if (form.client_id && form.title) createMut.mutate(form); }} disabled={createMut.isPending}>{createMut.isPending ? "Criando..." : "Criar Contrato"}</Button></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={!!editContract} onOpenChange={() => setEditContract(null)}><DialogContent><DialogHeader><DialogTitle>Editar Contrato</DialogTitle></DialogHeader>
        {editContract && <ContractForm data={editContract} onChange={setEditContract} clients={clients} />}
        <DialogFooter><Button onClick={() => { if (editContract) updateMut.mutate(editContract); }} disabled={updateMut.isPending}>{updateMut.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
      </DialogContent></Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir contrato?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { if (deleteId) deleteMut.mutate(deleteId); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent></AlertDialog>
    </div>
  );
};

export default Contratos;
