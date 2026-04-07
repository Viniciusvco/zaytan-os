import { ComingSoon } from "@/components/ComingSoon";
import { MessageSquare, Star, TrendingUp, Clock } from "lucide-react";

const mockFeedbacks = [
  { id: 1, week: "Semana 1 — Abril", qualidade: 4, quantidade: 3, status: "respondido", date: "01/04" },
  { id: 2, week: "Semana 4 — Março", qualidade: 5, quantidade: 4, status: "respondido", date: "24/03" },
  { id: 3, week: "Semana 3 — Março", qualidade: 3, quantidade: 2, status: "respondido", date: "17/03" },
];

const Feedbacks = () => {
  return (
    <ComingSoon>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" /> Feedbacks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Avalie a qualidade e quantidade dos seus leads</p>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="metric-card text-center">
            <p className="text-2xl font-bold text-primary">4.0</p>
            <p className="text-[10px] text-muted-foreground">Média Qualidade</p>
          </div>
          <div className="metric-card text-center">
            <p className="text-2xl font-bold text-info">3.0</p>
            <p className="text-[10px] text-muted-foreground">Média Quantidade</p>
          </div>
          <div className="metric-card text-center">
            <p className="text-2xl font-bold text-success">3</p>
            <p className="text-[10px] text-muted-foreground">Respostas</p>
          </div>
        </div>

        {/* Histórico */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Histórico de Feedbacks</h3>
          {mockFeedbacks.map(f => (
            <div key={f.id} className="metric-card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{f.week}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3 text-warning" /> Qualidade: {f.qualidade}/5
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-info" /> Quantidade: {f.quantidade}/5
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success">
                {f.status}
              </span>
            </div>
          ))}
        </div>

        {/* Pending */}
        <div className="metric-card border-warning/30 bg-warning/5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm font-semibold">Pesquisa Pendente</span>
          </div>
          <p className="text-xs text-muted-foreground">Semana 2 — Abril • Prazo: 3 dias restantes</p>
          <div className="mt-3 h-9 px-4 rounded-lg bg-muted inline-flex items-center text-sm text-muted-foreground">
            Responder Pesquisa
          </div>
        </div>
      </div>
    </ComingSoon>
  );
};

export default Feedbacks;
