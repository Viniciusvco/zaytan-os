import { useState } from "react";
import { BarChart3, TrendingUp, MousePointer, Users, DollarSign, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DateRangeFilter, useDefaultDateRange } from "@/components/DateRangeFilter";
import { ContextFilters } from "@/components/ContextFilters";

interface CampaignData {
  id: string;
  client: string;
  nicho: string;
  leads: number;
  vendas: number;
  cliques: number;
  investimento: number;
  cpc: number;
  cpl: number;
  roas: number;
}

const campaignData: CampaignData[] = [
  { id: "1", client: "Escritório Silva", nicho: "Advocacia", leads: 85, vendas: 12, cliques: 2400, investimento: 4200, cpc: 1.75, cpl: 49.41, roas: 3.8 },
  { id: "2", client: "Clínica Bella", nicho: "Saúde", leads: 120, vendas: 18, cliques: 3800, investimento: 5600, cpc: 1.47, cpl: 46.67, roas: 4.2 },
  { id: "3", client: "Imobiliária Nova Era", nicho: "Imobiliário", leads: 45, vendas: 3, cliques: 1800, investimento: 6200, cpc: 3.44, cpl: 137.78, roas: 2.1 },
  { id: "4", client: "TechShop", nicho: "E-commerce", leads: 320, vendas: 48, cliques: 8500, investimento: 12000, cpc: 1.41, cpl: 37.50, roas: 5.6 },
  { id: "5", client: "Construtora Horizonte", nicho: "Imobiliário", leads: 28, vendas: 2, cliques: 950, investimento: 3800, cpc: 4.00, cpl: 135.71, roas: 1.8 },
  { id: "6", client: "Clínica Odonto Premium", nicho: "Saúde", leads: 95, vendas: 15, cliques: 2900, investimento: 4800, cpc: 1.66, cpl: 50.53, roas: 3.5 },
  { id: "7", client: "Loja Decora+", nicho: "E-commerce", leads: 180, vendas: 22, cliques: 5200, investimento: 7500, cpc: 1.44, cpl: 41.67, roas: 4.0 },
];

const nichos = [...new Set(campaignData.map(c => c.nicho))];

const Performance = () => {
  const [dateRange, setDateRange] = useState(useDefaultDateRange());
  const [search, setSearch] = useState("");
  const [nichoFilter, setNichoFilter] = useState("all");

  const filtered = campaignData.filter(c => {
    const matchSearch = c.client.toLowerCase().includes(search.toLowerCase());
    const matchNicho = nichoFilter === "all" || c.nicho === nichoFilter;
    return matchSearch && matchNicho;
  });

  const totalLeads = filtered.reduce((s, c) => s + c.leads, 0);
  const totalVendas = filtered.reduce((s, c) => s + c.vendas, 0);
  const totalCliques = filtered.reduce((s, c) => s + c.cliques, 0);
  const totalInvestimento = filtered.reduce((s, c) => s + c.investimento, 0);
  const avgCPC = totalCliques > 0 ? (totalInvestimento / totalCliques) : 0;
  const avgCPL = totalLeads > 0 ? (totalInvestimento / totalLeads) : 0;
  const avgROAS = filtered.length > 0 ? (filtered.reduce((s, c) => s + c.roas, 0) / filtered.length) : 0;

  const chartData = filtered.map(c => ({ name: c.client.split(" ").slice(0, 2).join(" "), Leads: c.leads, Vendas: c.vendas }));
  const nichoChartData = nichos.map(n => {
    const items = filtered.filter(c => c.nicho === n);
    return { nicho: n, Leads: items.reduce((s, c) => s + c.leads, 0), Investimento: items.reduce((s, c) => s + c.investimento, 0) };
  }).filter(n => n.Leads > 0);

  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const selectedData = campaignData.find(c => c.id === selectedClient);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance de Campanhas</h1>
          <p className="text-sm text-muted-foreground mt-1">Análise de tráfego e dados de Meta Ads</p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Leads", value: totalLeads, icon: Users, color: "primary" },
          { label: "Vendas", value: totalVendas, icon: TrendingUp, color: "success" },
          { label: "Cliques", value: totalCliques.toLocaleString(), icon: MousePointer, color: "info" },
          { label: "Investimento", value: `R$ ${totalInvestimento.toLocaleString()}`, icon: DollarSign, color: "warning" },
          { label: "CPC Médio", value: `R$ ${avgCPC.toFixed(2)}`, icon: MousePointer, color: "muted-foreground" },
          { label: "CPL Médio", value: `R$ ${avgCPL.toFixed(2)}`, icon: Users, color: "chart-3" },
          { label: "ROAS Médio", value: `${avgROAS.toFixed(1)}x`, icon: BarChart3, color: "success" },
        ].map(m => (
          <div key={m.label} className="metric-card">
            <div className={`h-7 w-7 rounded-lg bg-${m.color}/10 flex items-center justify-center mb-1.5`}>
              <m.icon className={`h-3.5 w-3.5 text-${m.color}`} />
            </div>
            <p className="text-lg font-bold">{m.value}</p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leads & Sales Chart */}
        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-4">Leads vs Vendas por Cliente</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="Leads" fill="hsl(17, 100%, 58%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Vendas" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Niche */}
        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-4">Performance por Nicho</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nichoChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="nicho" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="Leads" fill="hsl(200, 70%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Investimento" fill="hsl(340, 65%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Dados de Performance</h3>
        </div>
        <ContextFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar cliente..."
          filterGroups={[{
            key: "nicho", label: "Nicho",
            options: [{ label: "Todos", value: "all" }, ...nichos.map(n => ({ label: n, value: n }))],
          }]}
          activeFilters={{ nicho: nichoFilter }}
          onFilterChange={(_, v) => setNichoFilter(v)}
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground pb-2">Cliente</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-2">Nicho</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-2">Leads</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-2">Vendas</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-2">Cliques</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-2">CPC</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-2">CPL</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-2">ROAS</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-2">Relatório</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-2.5 text-sm font-medium">{c.client}</td>
                  <td className="py-2.5"><span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{c.nicho}</span></td>
                  <td className="py-2.5 text-right text-sm font-semibold">{c.leads}</td>
                  <td className="py-2.5 text-right text-sm">{c.vendas}</td>
                  <td className="py-2.5 text-right text-sm text-muted-foreground">{c.cliques.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-sm">R$ {c.cpc.toFixed(2)}</td>
                  <td className="py-2.5 text-right text-sm">R$ {c.cpl.toFixed(2)}</td>
                  <td className="py-2.5 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.roas >= 4 ? "bg-success/10 text-success" : c.roas >= 2.5 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
                      {c.roas.toFixed(1)}x
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => setSelectedClient(c.id)} className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary">
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Report Dialog */}
      {selectedData && (
        <div className="metric-card border-primary/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">📊 Relatório Rápido — {selectedData.client}</h3>
            <button onClick={() => setSelectedClient(null)} className="text-xs text-muted-foreground hover:text-foreground">Fechar</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-muted rounded-lg p-3"><p className="text-lg font-bold">{selectedData.leads}</p><p className="text-[10px] text-muted-foreground">Leads Gerados</p></div>
            <div className="bg-muted rounded-lg p-3"><p className="text-lg font-bold">{selectedData.vendas}</p><p className="text-[10px] text-muted-foreground">Vendas</p></div>
            <div className="bg-muted rounded-lg p-3"><p className="text-lg font-bold">R$ {selectedData.cpl.toFixed(2)}</p><p className="text-[10px] text-muted-foreground">CPL</p></div>
            <div className="bg-muted rounded-lg p-3"><p className="text-lg font-bold">{selectedData.roas.toFixed(1)}x</p><p className="text-[10px] text-muted-foreground">ROAS</p></div>
          </div>
          <div className="text-sm space-y-2">
            <p><strong>Investimento total:</strong> R$ {selectedData.investimento.toLocaleString()}</p>
            <p><strong>Taxa de conversão:</strong> {selectedData.leads > 0 ? ((selectedData.vendas / selectedData.leads) * 100).toFixed(1) : 0}%</p>
            <p><strong>Nicho:</strong> {selectedData.nicho}</p>
            <p className="text-muted-foreground text-xs mt-3">
              {selectedData.roas >= 4 ? "✅ Performance excelente. ROAS acima de 4x indica alta eficiência." :
               selectedData.roas >= 2.5 ? "⚠️ Performance boa, mas há espaço para otimização de criativos e audiências." :
               "🔴 ROAS abaixo de 2.5x. Recomendado revisar segmentação, criativos e landing page."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance;
