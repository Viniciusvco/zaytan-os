import { useState } from "react";
import { Search, Filter, Plus, Building2, Zap, Globe, MoreHorizontal, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface Client {
  id: string;
  name: string;
  pillar: "trafego" | "automacao";
  status: "ativo" | "onboarding" | "pausado";
  mrr: number;
  tasks: { total: number; done: number };
  nextDelivery: string;
}

const clients: Client[] = [
  { id: "1", name: "Escritório Silva Advocacia", pillar: "automacao", status: "ativo", mrr: 4500, tasks: { total: 12, done: 9 }, nextDelivery: "02 Abr" },
  { id: "2", name: "Clínica Estética Bella", pillar: "trafego", status: "ativo", mrr: 3200, tasks: { total: 8, done: 6 }, nextDelivery: "05 Abr" },
  { id: "3", name: "Imobiliária Nova Era", pillar: "automacao", status: "onboarding", mrr: 6800, tasks: { total: 15, done: 3 }, nextDelivery: "10 Abr" },
  { id: "4", name: "E-commerce TechShop", pillar: "trafego", status: "ativo", mrr: 5500, tasks: { total: 10, done: 10 }, nextDelivery: "—" },
  { id: "5", name: "Restaurante Sabor & Arte", pillar: "trafego", status: "pausado", mrr: 2800, tasks: { total: 6, done: 4 }, nextDelivery: "—" },
  { id: "6", name: "Construtora Horizonte", pillar: "automacao", status: "onboarding", mrr: 8000, tasks: { total: 20, done: 2 }, nextDelivery: "15 Abr" },
];

const statusConfig = {
  ativo: { label: "Ativo", icon: CheckCircle2, className: "bg-success/10 text-success" },
  onboarding: { label: "Onboarding", icon: Clock, className: "bg-info/10 text-info" },
  pausado: { label: "Pausado", icon: AlertCircle, className: "bg-warning/10 text-warning" },
};

const pillarConfig = {
  trafego: { label: "Tráfego/LPs", icon: Globe },
  automacao: { label: "Automação/IA", icon: Zap },
};

const Clientes = () => {
  const [search, setSearch] = useState("");
  const [filterPillar, setFilterPillar] = useState<string>("all");

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchPillar = filterPillar === "all" || c.pillar === filterPillar;
    return matchSearch && matchPillar;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{clients.length} clientes ativos</p>
        </div>
        <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Novo Cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {[
            { value: "all", label: "Todos" },
            { value: "trafego", label: "Tráfego" },
            { value: "automacao", label: "Automação" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterPillar(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterPillar === opt.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cliente</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Pilar</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">MRR</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Tarefas</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Próx. Entrega</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => {
              const status = statusConfig[client.status];
              const pillar = pillarConfig[client.pillar];
              const StatusIcon = status.icon;
              const PillarIcon = pillar.icon;
              const progress = Math.round((client.tasks.done / client.tasks.total) * 100);

              return (
                <tr key={client.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs flex items-center gap-1.5 text-muted-foreground">
                      <PillarIcon className="h-3 w-3" /> {pillar.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${status.className}`}>
                      <StatusIcon className="h-3 w-3" /> {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold">R$ {client.mrr.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{client.tasks.done}/{client.tasks.total}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{client.nextDelivery}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
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

export default Clientes;
