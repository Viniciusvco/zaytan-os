import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientRole } from "@/contexts/ClientRoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Target, TrendingUp, Users } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface RankingItem {
  vendedor: string;
  totalVendas: number;
  qtdVendas: number;
  meta: number;
}

export default function ClientDashboardRanking() {
  const { clientId, clientRole, visibleProfileIds, visibleVendedores, teamMembers } = useClientRole();
  const [supervisorFilter, setSupervisorFilter] = useState("all");

  const { data: leads = [] } = useQuery({
    queryKey: ["client-ranking-leads", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, status, value, seller_tag, created_at")
        .eq("client_id", clientId);
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const supervisors = teamMembers.filter(m => m.client_role === "supervisor");

  const filteredVendedores = useMemo(() => {
    let list = visibleVendedores;
    if (supervisorFilter !== "all") {
      list = list.filter(v => v.supervisor_id === supervisorFilter);
    }
    return list;
  }, [visibleVendedores, supervisorFilter]);

  const rankingData: RankingItem[] = useMemo(() => {
    return filteredVendedores.map(v => {
      const vendedorLeads = leads.filter(
        (l: any) => l.seller_tag === v.full_name && l.status === "fechado"
      );
      return {
        vendedor: v.full_name.split(" ")[0],
        totalVendas: vendedorLeads.reduce((s: number, l: any) => s + Number(l.value || 0), 0),
        qtdVendas: vendedorLeads.length,
        meta: 500000, // placeholder
      };
    }).sort((a, b) => b.totalVendas - a.totalVendas);
  }, [filteredVendedores, leads]);

  const totalLeads = leads.length;
  const fechados = leads.filter((l: any) => l.status === "fechado");
  const totalVendas = fechados.reduce((s: number, l: any) => s + Number(l.value || 0), 0);
  const conversionRate = totalLeads > 0 ? Math.round((fechados.length / totalLeads) * 100) : 0;

  const stats = [
    { label: "Faturamento", value: `R$ ${totalVendas.toLocaleString("pt-BR")}`, icon: DollarSign, accent: true },
    { label: "Taxa Conversão", value: `${conversionRate}%`, icon: Target },
    { label: "Leads Ativos", value: leads.filter((l: any) => !["fechado", "perdido"].includes(l.status)).length.toString(), icon: Users },
    { label: "Vendas Fechadas", value: fechados.length.toString(), icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            {clientRole === "vendedor"
              ? "Suas métricas pessoais"
              : clientRole === "supervisor"
              ? "Métricas da sua equipe"
              : "Visão geral do CRM"}
          </p>
        </div>
      </div>

      {/* Filters - only for gerente */}
      {clientRole === "gerente" && supervisors.length > 0 && (
        <div className="flex flex-wrap gap-3 items-end p-4 bg-secondary/30 rounded-xl border border-border">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Supervisor</label>
            <Select value={supervisorFilter} onValueChange={setSupervisorFilter}>
              <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {supervisors.map(s => (
                  <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className={s.accent ? "border-primary/30 bg-primary/5" : ""}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground font-medium">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.accent ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vendas por Vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            {rankingData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum vendedor com vendas registradas.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rankingData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="vendedor" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                  <Bar dataKey="totalVendas" name="Vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Ranking Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Ranking de Vendedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rankingData.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Sem dados de ranking</p>
              )}
              {rankingData.map((s, i) => {
                const pct = s.meta > 0 ? Math.round((s.totalVendas / s.meta) * 100) : 0;
                return (
                  <div key={s.vendedor} className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-6 text-center ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                      {i + 1}º
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{s.vendedor}</span>
                        <span className="text-sm font-semibold">R$ {s.totalVendas.toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{pct}% da meta • {s.qtdVendas} vendas</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
