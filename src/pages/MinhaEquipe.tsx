import { ComingSoon } from "@/components/ComingSoon";
import { Users, BarChart3, Clock, CheckCircle2 } from "lucide-react";

const mockTeam = [
  { id: 1, name: "João Silva", role: "Gestor de Tráfego", avatar: "JS", completion: 92, avgDelivery: "1.8d" },
  { id: 2, name: "Maria Santos", role: "Customer Success", avatar: "MS", completion: 88, avgDelivery: "2.1d" },
  { id: 3, name: "Pedro Costa", role: "Designer", avatar: "PC", completion: 95, avgDelivery: "1.5d" },
];

const MinhaEquipe = () => {
  return (
    <ComingSoon>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Minha Equipe
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Membros da Zaytan alocados para você</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {mockTeam.map(m => (
            <div key={m.id} className="metric-card text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mx-auto mb-3">
                {m.avatar}
              </div>
              <h4 className="text-sm font-semibold">{m.name}</h4>
              <p className="text-[10px] text-muted-foreground mb-3">{m.role}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    <span className="text-xs font-bold">{m.completion}%</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">Conclusão</p>
                </div>
                <div className="bg-muted rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3 text-info" />
                    <span className="text-xs font-bold">{m.avgDelivery}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">Entrega Média</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance geral */}
        <div className="metric-card">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-primary" /> Performance da Equipe
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-success">91.7%</p>
              <p className="text-[10px] text-muted-foreground">Taxa de Conclusão</p>
            </div>
            <div>
              <p className="text-xl font-bold text-info">1.8d</p>
              <p className="text-[10px] text-muted-foreground">Tempo Médio</p>
            </div>
            <div>
              <p className="text-xl font-bold text-primary">12</p>
              <p className="text-[10px] text-muted-foreground">Tasks esta Semana</p>
            </div>
          </div>
        </div>
      </div>
    </ComingSoon>
  );
};

export default MinhaEquipe;
