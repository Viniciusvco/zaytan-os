import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { BarChart3, TrendingUp, Target, Users, DollarSign, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(17, 100%, 58%)", "hsl(210, 100%, 56%)", "hsl(45, 100%, 51%)", "hsl(142, 71%, 45%)", "hsl(262, 60%, 55%)", "hsl(180, 50%, 45%)"];

const Performance = () => {
  const { role } = useRole();
  const [clientFilter, setClientFilter] = useState("all");

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

  const filtered = useMemo(() => {
    if (clientFilter === "all") return leads;
    return leads.filter((l: any) => l.client_id === clientFilter);
  }, [leads, clientFilter]);

  // Vendas por vendedor
  const sellerStats = useMemo(() => {
    const map: Record<string, { name: string; deals: number; revenue: number; total: number }> = {};
    filtered.forEach((l: any) => {
      const seller = l.seller_tag || "Sem vendedor";
      if (!map[seller]) map[seller] = { name: seller, deals: 0, revenue: 0, total: 0 };
      map[seller].total++;
      if (l.status === "fechado") {
        map[seller].deals++;
        map[seller].revenue += Number(l.value || 0);
      }
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  const sellerChartData = sellerStats.map(s => ({
    name: s.name.length > 12 ? s.name.slice(0, 12) + "…" : s.name,
    vendas: s.deals,
    receita: s.revenue,
    conversao: s.total > 0 ? Math.round((s.deals / s.total) * 100) : 0,
  }));

  // Source breakdown
  const sourceStats = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((l: any) => {
      const src = l.source || "Outros";
      map[src] = (map[src] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  // Client ranking
  const clientStats = useMemo(() => {
    const map: Record<string, { name: string; total: number; closed: number; revenue: number }> = {};
    leads.forEach((l: any) => {
      const name = l.clients?.name || "—";
      const cid = l.client_id;
      if (!map[cid]) map[cid] = { name, total: 0, closed: 0, revenue: 0 };
      map[cid].total++;
      if (l.status === "fechado") {
        map[cid].closed++;
        map[cid].revenue += Number(l.value || 0);
      }
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [leads]);

  const totalLeads = filtered.length;
  const closedLeads = filtered.filter((l: any) => l.status === "fechado").length;
  const totalRevenue = filtered.filter((l: any) => l.status === "fechado").reduce((s: number, l: any) => s + Number(l.value || 0), 0);
  const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Dashboard de Performance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Vendas por vendedor, conversão e métricas</p>
        </div>
        {role === "admin" && (
          <select className="h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="all">Todos os clientes</option>
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="metric-card"><DollarSign className="h-4 w-4 text-primary mb-1" /><p className="text-2xl font-bold">R$ {totalRevenue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Faturamento</p></div>
        <div className="metric-card"><Target className="h-4 w-4 text-success mb-1" /><p className="text-2xl font-bold">{closedLeads}</p><p className="text-xs text-muted-foreground">Deals Fechados</p></div>
        <div className="metric-card"><TrendingUp className="h-4 w-4 text-info mb-1" /><p className="text-2xl font-bold">{conversionRate}%</p><p className="text-xs text-muted-foreground">Taxa de Conversão</p></div>
        <div className="metric-card"><Users className="h-4 w-4 text-warning mb-1" /><p className="text-2xl font-bold">{sellerStats.length}</p><p className="text-xs text-muted-foreground">Vendedores Ativos</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vendas por vendedor */}
        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-4">Vendas por Vendedor</h3>
          <div className="h-[280px]">
            {sellerChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sellerChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="vendas" name="Vendas Fechadas" fill="hsl(17, 100%, 58%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conversao" name="Conversão %" fill="hsl(210, 100%, 56%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados de vendedores</p>
            )}
          </div>
        </div>

        {/* Origem dos leads */}
        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-4">Origem dos Leads</h3>
          <div className="h-[280px]">
            {sourceStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceStats} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {sourceStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados</p>
            )}
          </div>
        </div>
      </div>

      {/* Ranking de vendedores */}
      <div className="metric-card">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Ranking de Vendedores</h3>
        <div className="space-y-3">
          {sellerStats.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Sem vendedores registrados</p>}
          {sellerStats.map((s, i) => (
            <div key={s.name} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
              <span className={`text-lg font-bold ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>#{i + 1}</span>
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {s.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-[10px] text-muted-foreground">{s.deals} deals • {s.total > 0 ? Math.round((s.deals / s.total) * 100) : 0}% conversão</p>
              </div>
              <p className="text-sm font-bold text-success">R$ {s.revenue.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Client comparison - admin only */}
      {role === "admin" && clientFilter === "all" && (
        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-4">Comparativo por Empresa</h3>
          <div className="space-y-2">
            {clientStats.map((c) => (
              <div key={c.name} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{c.name.slice(0, 2).toUpperCase()}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">{c.total} leads • {c.closed} fechados • {c.total > 0 ? Math.round((c.closed / c.total) * 100) : 0}% conversão</p>
                </div>
                <p className="text-sm font-bold">R$ {c.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance;
