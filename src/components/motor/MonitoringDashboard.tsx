import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Clock, Package, AlertTriangle, XCircle, Users, Zap, ShieldAlert, CalendarIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

type DatePreset = "hoje" | "ontem" | "custom";

type Props = { campaignId: string | null };

export function MonitoringDashboard({ campaignId }: Props) {
  const [datePreset, setDatePreset] = useState<DatePreset>("hoje");
  const [customDate, setCustomDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

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
  const cards = [
    { label: "Leads Hoje", value: m.total_leads_today || 0, icon: Zap, color: "bg-primary/10 text-primary" },
    { label: "Distribuídos Hoje", value: m.distributed_today || 0, icon: Users, color: "bg-success/10 text-success" },
    { label: "Em Estoque", value: m.stock_count || 0, icon: Package, color: "bg-warning/10 text-warning" },
    { label: "Expirados", value: m.expired_count || 0, icon: XCircle, color: "bg-destructive/10 text-destructive" },
    { label: "Duplicados Pendentes", value: m.duplicate_pending || 0, icon: AlertTriangle, color: "bg-info/10 text-info" },
    { label: "Em Processamento (>5min)", value: m.processing_stuck || 0, icon: ShieldAlert, color: m.processing_stuck > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">Período:</span>
        <Button
          variant={datePreset === "hoje" ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setDatePreset("hoje")}
        >
          Hoje
        </Button>
        <Button
          variant={datePreset === "ontem" ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setDatePreset("ontem")}
        >
          Ontem
        </Button>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={datePreset === "custom" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs gap-1.5"
            >
              <CalendarIcon className="h-3 w-3" />
              {datePreset === "custom" ? format(customDate, "dd/MM/yyyy") : "Selecionar data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={customDate}
              onSelect={(d) => {
                if (d) {
                  setCustomDate(d);
                  setDatePreset("custom");
                  setCalendarOpen(false);
                }
              }}
              disabled={(d) => d > new Date()}
              locale={ptBR}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        <span className="text-xs text-muted-foreground ml-2">({dateLabel})</span>
      </div>

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
                      <span className={c.weight_override ? "text-primary font-semibold" : ""}>
                        {Number(c.weight_percent).toFixed(1)}%
                      </span>
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
    </div>
  );
}
