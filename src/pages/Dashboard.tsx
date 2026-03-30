import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Target,
  Receipt,
  Repeat,
  Zap,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { DateRangeFilter, useDefaultDateRange } from "@/components/DateRangeFilter";

const revenueBreakdown = [
  { month: "Out", mrr: 22000, setup: 4000, spot: 2000 },
  { month: "Nov", mrr: 25000, setup: 5000, spot: 2500 },
  { month: "Dez", mrr: 27000, setup: 3500, spot: 4500 },
  { month: "Jan", mrr: 30000, setup: 4000, spot: 4000 },
  { month: "Fev", mrr: 33000, setup: 3000, spot: 4000 },
  { month: "Mar", mrr: 35500, setup: 5000, spot: 2300 },
];

const projectionData = [
  { month: "Abr", atual: 42800, projetado: 42800 },
  { month: "Mai", atual: 0, projetado: 47200 },
  { month: "Jun", atual: 0, projetado: 51000 },
  { month: "Jul", atual: 0, projetado: 55000 },
  { month: "Ago", atual: 0, projetado: 58500 },
  { month: "Set", atual: 0, projetado: 62000 },
];

const revenueDetails = [
  { client: "Escritório Silva", type: "MRR", value: 4500, description: "Gestão mensal" },
  { client: "Clínica Bella", type: "MRR", value: 3200, description: "Tráfego mensal" },
  { client: "Clínica Bella", type: "Spot", value: 1500, description: "Landing Page" },
  { client: "Imobiliária Nova Era", type: "MRR", value: 6800, description: "Automação mensal" },
  { client: "Imobiliária Nova Era", type: "Setup", value: 3000, description: "Setup CRM" },
  { client: "TechShop", type: "MRR", value: 5500, description: "Google Ads mensal" },
  { client: "Construtora Horizonte", type: "MRR", value: 8000, description: "Pacote completo" },
  { client: "Construtora Horizonte", type: "Setup", value: 5000, description: "Setup automação" },
  { client: "Restaurante Sabor & Arte", type: "MRR", value: 2800, description: "Meta Ads" },
  { client: "Loja Decora+", type: "Spot", value: 2200, description: "Landing Page" },
  { client: "Clínica Odonto Premium", type: "MRR", value: 4700, description: "Tráfego mensal" },
];

const Dashboard = () => {
  const [dateRange, setDateRange] = useState(useDefaultDateRange());

  const mrrTotal = revenueDetails.filter(r => r.type === "MRR").reduce((s, r) => s + r.value, 0);
  const setupTotal = revenueDetails.filter(r => r.type === "Setup").reduce((s, r) => s + r.value, 0);
  const spotTotal = revenueDetails.filter(r => r.type === "Spot").reduce((s, r) => s + r.value, 0);
  const faturamentoAtual = mrrTotal + setupTotal + spotTotal;
  const metaMes = 55000;
  const projecao = mrrTotal + setupTotal + spotTotal + 3200; // previstos adicionais
  const tcv = mrrTotal * 12 + setupTotal + spotTotal;
  const pctMeta = Math.round((faturamentoAtual / metaMes) * 100);

  const metrics = [
    { label: "Faturamento Atual", value: `R$ ${faturamentoAtual.toLocaleString()}`, sub: `${pctMeta}% da meta`, icon: DollarSign, color: "primary" },
    { label: "Meta do Mês", value: `R$ ${metaMes.toLocaleString()}`, sub: "Configurada manualmente", icon: Target, color: "warning" },
    { label: "Projeção", value: `R$ ${projecao.toLocaleString()}`, sub: "MRR + Setup + Spot previstos", icon: TrendingUp, color: "success" },
    { label: "MRR", value: `R$ ${mrrTotal.toLocaleString()}`, sub: "Recorrência mensal", icon: Repeat, color: "info" },
    { label: "Vendas Pontuais", value: `R$ ${spotTotal.toLocaleString()}`, sub: "LPs e serviços", icon: Zap, color: "chart-5" },
    { label: "Setup Fees", value: `R$ ${setupTotal.toLocaleString()}`, sub: "Implementações", icon: Receipt, color: "chart-3" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Executivo</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão estratégica da operação Zaytan</p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Big Numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card animate-fade-in">
            <div className={`h-8 w-8 rounded-lg bg-${m.color}/10 flex items-center justify-center mb-2`}>
              <m.icon className={`h-4 w-4 text-${m.color}`} />
            </div>
            <p className="text-xl font-bold">{m.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
            <p className="text-[10px] text-muted-foreground/70">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* TCV Card */}
      <div className="metric-card flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">TCV — Total Contract Value (período)</p>
          <p className="text-3xl font-bold mt-1">R$ {tcv.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">MRR anualizado + Setup + Spot</p>
          <p className="text-sm font-medium text-primary mt-1">Contratos fechados no período</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Breakdown */}
        <div className="metric-card animate-fade-in">
          <h3 className="text-sm font-semibold mb-4">Detalhamento de Receita (6 meses)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueBreakdown}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString()}`, ""]}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="mrr" name="MRR" stackId="a" fill="hsl(17, 100%, 58%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="setup" name="Setup" stackId="a" fill="hsl(200, 70%, 50%)" />
                <Bar dataKey="spot" name="Spot" stackId="a" fill="hsl(340, 65%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projection */}
        <div className="metric-card animate-fade-in">
          <h3 className="text-sm font-semibold mb-4">Projeção de Faturamento (6 meses)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(17, 100%, 58%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(17, 100%, 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString()}`, ""]}
                />
                <Area type="monotone" dataKey="projetado" stroke="hsl(17, 100%, 58%)" strokeWidth={2} fillOpacity={1} fill="url(#colorProj)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Revenue List */}
      <div className="metric-card">
        <h3 className="text-sm font-semibold mb-4">Lançamentos do Período</h3>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cliente</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Tipo</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Descrição</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Valor</th>
              </tr>
            </thead>
            <tbody>
              {revenueDetails.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-sm font-medium">{r.client}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.type === "MRR" ? "bg-primary/10 text-primary" : r.type === "Setup" ? "bg-info/10 text-info" : "bg-destructive/10 text-destructive"}`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">{r.description}</td>
                  <td className="px-4 py-2.5 text-right text-sm font-semibold">R$ {r.value.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
