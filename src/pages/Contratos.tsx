import { useState } from "react";
import { FileText, Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, Clock, FileQuestion, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DateRangeFilter, useDefaultDateRange } from "@/components/DateRangeFilter";
import { ContextFilters } from "@/components/ContextFilters";

type ContractStatus = "rascunho" | "ativo" | "cancelado" | "aguardando";

interface Contract {
  id: string;
  client: string;
  startDate: string;
  durationMonths: number;
  setupValue: number;
  mrrValue: number;
  status: ContractStatus;
  notes?: string;
}

const initialContracts: Contract[] = [
  { id: "1", client: "Escritório Silva Advocacia", startDate: "2025-01-15", durationMonths: 12, setupValue: 3000, mrrValue: 4500, status: "ativo" },
  { id: "2", client: "Clínica Estética Bella", startDate: "2025-02-01", durationMonths: 6, setupValue: 1500, mrrValue: 3200, status: "ativo" },
  { id: "3", client: "Imobiliária Nova Era", startDate: "2025-03-10", durationMonths: 12, setupValue: 5000, mrrValue: 6800, status: "aguardando" },
  { id: "4", client: "E-commerce TechShop", startDate: "2024-10-01", durationMonths: 6, setupValue: 2000, mrrValue: 5500, status: "ativo" },
  { id: "5", client: "Restaurante Sabor & Arte", startDate: "2024-11-01", durationMonths: 3, setupValue: 800, mrrValue: 2800, status: "cancelado" },
  { id: "6", client: "Construtora Horizonte", startDate: "2025-03-20", durationMonths: 12, setupValue: 5000, mrrValue: 8000, status: "rascunho" },
];

const statusConfig: Record<ContractStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  ativo: { label: "Ativo", icon: CheckCircle2, className: "bg-success/10 text-success" },
  rascunho: { label: "Rascunho", icon: FileQuestion, className: "bg-muted text-muted-foreground" },
  cancelado: { label: "Cancelado", icon: XCircle, className: "bg-destructive/10 text-destructive" },
  aguardando: { label: "Aguardando Assinatura", icon: Clock, className: "bg-warning/10 text-warning" },
};

function getEndDate(start: string, months: number): Date {
  const d = new Date(start);
  d.setMonth(d.getMonth() + months);
  return d;
}

function daysUntilExpiry(start: string, months: number): number {
  const end = getEndDate(start, months);
  const diff = end.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const Contratos = () => {
  const [contracts, setContracts] = useState(initialContracts);
  const [dateRange, setDateRange] = useDefaultDateRangeState();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editContract, setEditContract] = useState<Contract | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newContract, setNewContract] = useState<Omit<Contract, "id">>({
    client: "", startDate: new Date().toISOString().split("T")[0], durationMonths: 12, setupValue: 0, mrrValue: 0, status: "rascunho",
  });

  const filtered = contracts.filter((c) => {
    const matchSearch = c.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeContracts = contracts.filter(c => c.status === "ativo");
  const totalMRR = activeContracts.reduce((s, c) => s + c.mrrValue, 0);
  const expiringCount = activeContracts.filter(c => daysUntilExpiry(c.startDate, c.durationMonths) <= 30 && daysUntilExpiry(c.startDate, c.durationMonths) > 0).length;
  const totalTCV = activeContracts.reduce((s, c) => s + c.setupValue + c.mrrValue * c.durationMonths, 0);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Contratos</h1>
          <p className="text-sm text-muted-foreground mt-1">Lifecycle completo de contratos</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Contrato</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2"><FileText className="h-4 w-4 text-primary" /></div>
          <p className="text-2xl font-bold">{contracts.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total de Contratos</p>
        </div>
        <div className="metric-card">
          <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center mb-2"><CheckCircle2 className="h-4 w-4 text-success" /></div>
          <p className="text-2xl font-bold">R$ {totalMRR.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">MRR Ativo</p>
        </div>
        <div className="metric-card">
          <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center mb-2"><FileText className="h-4 w-4 text-info" /></div>
          <p className="text-2xl font-bold">R$ {totalTCV.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">TCV Total</p>
        </div>
        <div className={`metric-card ${expiringCount > 0 ? "border-primary/50" : ""}`}>
          <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center mb-2"><AlertTriangle className="h-4 w-4 text-warning" /></div>
          <p className="text-2xl font-bold">{expiringCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Vencendo em 30 dias</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ContextFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar contratos..."
          filterGroups={[{
            key: "status", label: "Status",
            options: [
              { label: "Todos", value: "all" },
              { label: "Ativo", value: "ativo" },
              { label: "Rascunho", value: "rascunho" },
              { label: "Aguardando", value: "aguardando" },
              { label: "Cancelado", value: "cancelado" },
            ],
          }]}
          activeFilters={{ status: statusFilter }}
          onFilterChange={(_, v) => setStatusFilter(v)}
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cliente</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Início</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Vigência</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Setup</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">MRR</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Vencimento</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const st = statusConfig[c.status];
              const StIcon = st.icon;
              const days = daysUntilExpiry(c.startDate, c.durationMonths);
              const isExpiring = c.status === "ativo" && days <= 30 && days > 0;
              const isExpired = c.status === "ativo" && days <= 0;
              const endDateStr = getEndDate(c.startDate, c.durationMonths).toLocaleDateString("pt-BR");
              return (
                <tr key={c.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${isExpiring ? "bg-warning/5" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="h-4 w-4 text-primary" /></div>
                      <span className="text-sm font-medium">{c.client}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(c.startDate).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-sm">{c.durationMonths} meses</td>
                  <td className="px-4 py-3 text-sm text-right">R$ {c.setupValue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">R$ {c.mrrValue.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${st.className}`}>
                      <StIcon className="h-3 w-3" /> {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.status === "ativo" && (
                      <div className="flex items-center gap-1.5">
                        {isExpiring && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                        {isExpired && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                        <span className={`text-xs ${isExpiring ? "text-warning font-semibold" : isExpired ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                          {isExpired ? "Vencido" : `${days}d — ${endDateStr}`}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditContract({ ...c })} className="p-1.5 rounded-md hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-md hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Contrato</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Cliente" value={newContract.client} onChange={(e) => setNewContract(p => ({ ...p, client: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Data de Início</label>
                <input type="date" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={newContract.startDate} onChange={(e) => setNewContract(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Vigência (meses)</label>
                <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={newContract.durationMonths} onChange={(e) => setNewContract(p => ({ ...p, durationMonths: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Valor Setup (R$)" value={newContract.setupValue || ""} onChange={(e) => setNewContract(p => ({ ...p, setupValue: Number(e.target.value) }))} />
              <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Valor MRR (R$)" value={newContract.mrrValue || ""} onChange={(e) => setNewContract(p => ({ ...p, mrrValue: Number(e.target.value) }))} />
            </div>
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newContract.status} onChange={(e) => setNewContract(p => ({ ...p, status: e.target.value as ContractStatus }))}>
              <option value="rascunho">Rascunho</option>
              <option value="aguardando">Aguardando Assinatura</option>
              <option value="ativo">Ativo</option>
            </select>
          </div>
          <DialogFooter>
            <Button onClick={() => { if (newContract.client.trim()) { setContracts(p => [...p, { ...newContract, id: Date.now().toString() }]); setNewContract({ client: "", startDate: new Date().toISOString().split("T")[0], durationMonths: 12, setupValue: 0, mrrValue: 0, status: "rascunho" }); setShowAdd(false); } }}>
              Criar Contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editContract} onOpenChange={() => setEditContract(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Contrato</DialogTitle></DialogHeader>
          {editContract && (
            <div className="space-y-3">
              <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editContract.client} onChange={(e) => setEditContract({ ...editContract, client: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editContract.startDate} onChange={(e) => setEditContract({ ...editContract, startDate: e.target.value })} />
                <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editContract.durationMonths} onChange={(e) => setEditContract({ ...editContract, durationMonths: Number(e.target.value) })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editContract.setupValue} onChange={(e) => setEditContract({ ...editContract, setupValue: Number(e.target.value) })} />
                <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editContract.mrrValue} onChange={(e) => setEditContract({ ...editContract, mrrValue: Number(e.target.value) })} />
              </div>
              <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={editContract.status} onChange={(e) => setEditContract({ ...editContract, status: e.target.value as ContractStatus })}>
                <option value="rascunho">Rascunho</option>
                <option value="aguardando">Aguardando Assinatura</option>
                <option value="ativo">Ativo</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { if (editContract) { setContracts(p => p.map(c => c.id === editContract.id ? editContract : c)); setEditContract(null); } }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir contrato?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setContracts(p => p.filter(c => c.id !== deleteId)); setDeleteId(null); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function useDefaultDateRangeState() {
  return useState(useDefaultDateRange());
}

export default Contratos;
