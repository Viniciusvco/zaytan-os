import { useState } from "react";
import { Target, Plus, TrendingUp, Users, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Seller {
  id: string;
  name: string;
  initials: string;
  commission: number;
  metaVolume: number;
  metaRevenue: number;
  realVolume: number;
  realRevenue: number;
  deals: number;
}

const sellers: Seller[] = [
  { id: "1", name: "Rafael Oliveira", initials: "RO", commission: 10, metaVolume: 8, metaRevenue: 40000, realVolume: 6, realRevenue: 32500, deals: 3 },
  { id: "2", name: "Camila Santos", initials: "CS", commission: 12, metaVolume: 10, metaRevenue: 50000, realVolume: 9, realRevenue: 47200, deals: 5 },
  { id: "3", name: "Lucas Mendes", initials: "LM", commission: 10, metaVolume: 6, metaRevenue: 30000, realVolume: 7, realRevenue: 35800, deals: 4 },
  { id: "4", name: "Ana Beatriz", initials: "AB", commission: 15, metaVolume: 12, metaRevenue: 60000, realVolume: 10, realRevenue: 52000, deals: 6 },
];

const Comercial = () => {
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);

  const chartData = sellers.map((s) => ({
    name: s.initials,
    Meta: s.metaRevenue,
    Realizado: s.realRevenue,
  }));

  const totalMeta = sellers.reduce((s, v) => s + v.metaRevenue, 0);
  const totalReal = sellers.reduce((s, v) => s + v.realRevenue, 0);
  const totalDeals = sellers.reduce((s, v) => s + v.deals, 0);
  const avgPercent = Math.round((totalReal / totalMeta) * 100);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comercial & Vendedores</h1>
          <p className="text-sm text-muted-foreground mt-1">Performance de vendas e acompanhamento de metas</p>
        </div>
        <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Novo Vendedor
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">{avgPercent}%</p>
          <p className="text-xs text-muted-foreground mt-1">Meta Geral Atingida</p>
        </div>
        <div className="metric-card">
          <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center mb-2">
            <DollarSign className="h-4 w-4 text-success" />
          </div>
          <p className="text-2xl font-bold">R$ {totalReal.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Faturado no Mês</p>
        </div>
        <div className="metric-card">
          <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center mb-2">
            <TrendingUp className="h-4 w-4 text-info" />
          </div>
          <p className="text-2xl font-bold">{totalDeals}</p>
          <p className="text-xs text-muted-foreground mt-1">Deals Fechados</p>
        </div>
        <div className="metric-card">
          <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center mb-2">
            <Users className="h-4 w-4 text-warning" />
          </div>
          <p className="text-2xl font-bold">{sellers.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Vendedores Ativos</p>
        </div>
      </div>

      {/* Chart: Meta vs Realizado */}
      <div className="metric-card">
        <h3 className="text-sm font-semibold mb-4">Meta vs Realizado por Vendedor (R$)</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`R$ ${value.toLocaleString()}`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="Meta" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.3} />
              <Bar dataKey="Realizado" fill="hsl(17, 100%, 58%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sellers Table */}
      <div className="metric-card">
        <h3 className="text-sm font-semibold mb-4">Perfis de Vendedores</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground pb-2">Vendedor</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">Comissão</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">Meta (Vol)</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">Realizado (Vol)</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">Meta (R$)</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">Realizado (R$)</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">% Atingido</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => {
              const pct = Math.round((s.realRevenue / s.metaRevenue) * 100);
              return (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{s.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.deals} deals fechados</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right text-sm">{s.commission}%</td>
                  <td className="py-3 text-right text-sm text-muted-foreground">{s.metaVolume}</td>
                  <td className="py-3 text-right text-sm">{s.realVolume}</td>
                  <td className="py-3 text-right text-sm text-muted-foreground">R$ {s.metaRevenue.toLocaleString()}</td>
                  <td className="py-3 text-right text-sm font-semibold">R$ {s.realRevenue.toLocaleString()}</td>
                  <td className="py-3 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${pct >= 100 ? "bg-success/10 text-success" : pct >= 80 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Comercial;
