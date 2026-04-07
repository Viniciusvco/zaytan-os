import { ComingSoon } from "@/components/ComingSoon";
import { BarChart3, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";

const mockClients = [
  { name: "Star5", score: 92, status: "saudavel", alerts: 0, mrr: 4500, churnRisk: "Baixo" },
  { name: "Select", score: 78, status: "atencao", alerts: 2, mrr: 3200, churnRisk: "Médio" },
  { name: "SelectPrev", score: 65, status: "critico", alerts: 4, mrr: 2800, churnRisk: "Alto" },
  { name: "Seven", score: 85, status: "saudavel", alerts: 1, mrr: 5000, churnRisk: "Baixo" },
  { name: "Andrade&Fukushima", score: 71, status: "atencao", alerts: 3, mrr: 3800, churnRisk: "Médio" },
  { name: "LaPortec", score: 58, status: "critico", alerts: 5, mrr: 2100, churnRisk: "Alto" },
];

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  saudavel: { label: "Saudável", className: "bg-success/10 text-success", icon: CheckCircle2 },
  atencao: { label: "Atenção", className: "bg-warning/10 text-warning", icon: AlertTriangle },
  critico: { label: "Crítico", className: "bg-destructive/10 text-destructive", icon: TrendingDown },
};

const Performance = () => {
  const sorted = [...mockClients].sort((a, b) => a.score - b.score);

  return (
    <ComingSoon>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Ranking de Performance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Clientes ordenados por criticidade — Motor de Regras</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="metric-card"><CheckCircle2 className="h-4 w-4 text-success mb-1" /><p className="text-2xl font-bold">{mockClients.filter(c => c.status === "saudavel").length}</p><p className="text-xs text-muted-foreground">Saudáveis</p></div>
          <div className="metric-card"><AlertTriangle className="h-4 w-4 text-warning mb-1" /><p className="text-2xl font-bold">{mockClients.filter(c => c.status === "atencao").length}</p><p className="text-xs text-muted-foreground">Atenção</p></div>
          <div className="metric-card"><TrendingDown className="h-4 w-4 text-destructive mb-1" /><p className="text-2xl font-bold">{mockClients.filter(c => c.status === "critico").length}</p><p className="text-xs text-muted-foreground">Críticos</p></div>
          <div className="metric-card"><TrendingUp className="h-4 w-4 text-primary mb-1" /><p className="text-2xl font-bold">{Math.round(mockClients.reduce((s, c) => s + c.score, 0) / mockClients.length)}</p><p className="text-xs text-muted-foreground">Score Médio</p></div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">#</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cliente</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Score</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Alertas</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">MRR</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Risco Churn</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const sc = statusConfig[c.status];
                const Icon = sc.icon;
                return (
                  <tr key={c.name} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm font-bold text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{c.name.slice(0, 2).toUpperCase()}</div>
                        <span className="text-sm font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${c.score >= 80 ? "bg-success" : c.score >= 65 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${c.score}%` }} />
                        </div>
                        <span className="text-xs font-medium">{c.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${sc.className}`}><Icon className="h-3 w-3" />{sc.label}</span></td>
                    <td className="px-4 py-3 text-right text-sm">{c.alerts}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium">R$ {c.mrr.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${c.churnRisk === "Baixo" ? "bg-success/10 text-success" : c.churnRisk === "Médio" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>{c.churnRisk}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ComingSoon>
  );
};

export default Performance;
