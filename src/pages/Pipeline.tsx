import { useState } from "react";
import { MoreHorizontal, Plus, DollarSign, Calendar, User } from "lucide-react";

interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  probability: number;
  stage: string;
  daysInStage: number;
}

const initialDeals: Deal[] = [
  { id: "1", name: "Automação WhatsApp", company: "Escritório Silva Advocacia", value: 4500, probability: 20, stage: "prospeccao", daysInStage: 3 },
  { id: "2", name: "Landing Pages + Tráfego", company: "Clínica Estética Bella", value: 3200, probability: 20, stage: "prospeccao", daysInStage: 1 },
  { id: "3", name: "Chatbot IA + CRM", company: "Imobiliária Nova Era", value: 6800, probability: 40, stage: "qualificacao", daysInStage: 5 },
  { id: "4", name: "Funil de Vendas Completo", company: "Consultoria RH Plus", value: 8500, probability: 60, stage: "diagnostico", daysInStage: 8 },
  { id: "5", name: "Automação N8N + IA", company: "E-commerce TechShop", value: 12000, probability: 60, stage: "diagnostico", daysInStage: 4 },
  { id: "6", name: "Pack Tráfego Premium", company: "Restaurante Sabor & Arte", value: 2800, probability: 80, stage: "proposta", daysInStage: 2 },
  { id: "7", name: "Sistema Completo IA", company: "Construtora Horizonte", value: 15000, probability: 95, stage: "fechamento", daysInStage: 1 },
];

const stages = [
  { id: "prospeccao", label: "Prospecção", color: "bg-muted-foreground" },
  { id: "qualificacao", label: "Qualificação", color: "bg-info" },
  { id: "diagnostico", label: "Diagnóstico", color: "bg-warning" },
  { id: "proposta", label: "Proposta", color: "bg-primary" },
  { id: "fechamento", label: "Fechamento", color: "bg-success" },
];

const Pipeline = () => {
  const [deals] = useState<Deal[]>(initialDeals);

  const getStageDeals = (stageId: string) => deals.filter((d) => d.stage === stageId);
  const getStageValue = (stageId: string) =>
    getStageDeals(stageId).reduce((sum, d) => sum + d.value, 0);
  const getWeightedValue = (stageId: string) =>
    getStageDeals(stageId).reduce((sum, d) => sum + d.value * (d.probability / 100), 0);

  const totalPipeline = deals.reduce((sum, d) => sum + d.value, 0);
  const weightedTotal = deals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline de Vendas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seu funil comercial</p>
        </div>
        <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Novo Deal
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Total Pipeline</p>
          <p className="text-xl font-bold mt-1">R$ {totalPipeline.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Valor Ponderado</p>
          <p className="text-xl font-bold mt-1">R$ {weightedTotal.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Deals Ativos</p>
          <p className="text-xl font-bold mt-1">{deals.length}</p>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="kanban-column min-w-[260px] flex-1">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                <span className="text-xs font-semibold uppercase tracking-wider">{stage.label}</span>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {getStageDeals(stage.id).length}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground px-1 mb-3">
              R$ {getStageValue(stage.id).toLocaleString()}
            </p>
            <div className="space-y-2">
              {getStageDeals(stage.id).map((deal) => (
                <div key={deal.id} className="kanban-card">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium leading-tight">{deal.name}</h4>
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                    <User className="h-3 w-3" /> {deal.company}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      R$ {deal.value.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {deal.daysInStage}d
                    </span>
                  </div>
                  <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${deal.probability}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{deal.probability}% chance</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pipeline;
