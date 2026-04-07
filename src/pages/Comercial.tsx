import { ComingSoon } from "@/components/ComingSoon";
import { DollarSign, TrendingUp, Users, Target, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

const mockSellers = [
  { name: "Carlos Mendes", deals: 18, revenue: 45000, conversion: 32, avatar: "CM" },
  { name: "Ana Paula", deals: 14, revenue: 38000, conversion: 28, avatar: "AP" },
  { name: "Roberto Lima", deals: 11, revenue: 29000, conversion: 22, avatar: "RL" },
  { name: "Juliana Costa", deals: 9, revenue: 21000, conversion: 18, avatar: "JC" },
];

const monthlyData = [
  { month: "Jan", vendas: 42, meta: 50 },
  { month: "Fev", vendas: 38, meta: 50 },
  { month: "Mar", vendas: 55, meta: 50 },
  { month: "Abr", vendas: 48, meta: 55 },
  { month: "Mai", vendas: 62, meta: 55 },
  { month: "Jun", vendas: 52, meta: 55 },
];

const channelData = [
  { name: "Indicação", value: 35 },
  { name: "Meta Ads", value: 28 },
  { name: "Google Ads", value: 20 },
  { name: "Orgânico", value: 17 },
];

const COLORS = ["hsl(17, 100%, 58%)", "hsl(210, 100%, 56%)", "hsl(45, 100%, 51%)", "hsl(142, 71%, 45%)"];

const Comercial = () => {
  return (
    <ComingSoon>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comercial & Vendedores</h1>
          <p className="text-sm text-muted-foreground mt-1">Performance de vendas e acompanhamento de metas</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="metric-card"><DollarSign className="h-4 w-4 text-primary mb-1" /><p className="text-2xl font-bold">R$ 133k</p><p className="text-xs text-muted-foreground">Faturamento Mensal</p></div>
          <div className="metric-card"><Target className="h-4 w-4 text-success mb-1" /><p className="text-2xl font-bold">52</p><p className="text-xs text-muted-foreground">Deals Fechados</p></div>
          <div className="metric-card"><TrendingUp className="h-4 w-4 text-info mb-1" /><p className="text-2xl font-bold">25%</p><p className="text-xs text-muted-foreground">Taxa de Conversão</p></div>
          <div className="metric-card"><Users className="h-4 w-4 text-warning mb-1" /><p className="text-2xl font-bold">4</p><p className="text-xs text-muted-foreground">Vendedores Ativos</p></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="metric-card">
            <h3 className="text-sm font-semibold mb-4">Vendas vs Meta Mensal</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="vendas" name="Vendas" fill="hsl(17, 100%, 58%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="meta" name="Meta" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.3} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="metric-card">
            <h3 className="text-sm font-semibold mb-4">Origem dos Leads</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Ranking de Vendedores</h3>
          <div className="space-y-3">
            {mockSellers.map((s, i) => (
              <div key={s.name} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                <span className={`text-lg font-bold ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>#{i + 1}</span>
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{s.avatar}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.deals} deals • {s.conversion}% conversão</p>
                </div>
                <p className="text-sm font-bold text-success">R$ {s.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ComingSoon>
  );
};

export default Comercial;
