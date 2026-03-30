import { useState } from "react";
import { DollarSign, TrendingUp, ArrowDownRight, Receipt, Repeat, Zap, Plus, Pencil, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface RevenueEntry { id: string; client: string; type: "mrr" | "setup" | "oneoff"; value: number; description: string }
interface CostEntry { id: string; name: string; type: "fixo" | "variavel"; value: number; project?: string }

const initialRevenues: RevenueEntry[] = [
  { id: "1", client: "Escritório Silva", type: "mrr", value: 4500, description: "Gestão mensal" },
  { id: "2", client: "Clínica Bella", type: "mrr", value: 3200, description: "Tráfego mensal" },
  { id: "3", client: "Clínica Bella", type: "oneoff", value: 1500, description: "Landing Page" },
  { id: "4", client: "Imobiliária Nova Era", type: "mrr", value: 6800, description: "Automação mensal" },
  { id: "5", client: "Imobiliária Nova Era", type: "setup", value: 3000, description: "Setup CRM" },
  { id: "6", client: "TechShop", type: "mrr", value: 5500, description: "Google Ads mensal" },
  { id: "7", client: "Construtora Horizonte", type: "mrr", value: 8000, description: "Pacote completo" },
  { id: "8", client: "Construtora Horizonte", type: "setup", value: 5000, description: "Setup automação" },
];

const initialCosts: CostEntry[] = [
  { id: "1", name: "Ferramentas IA (GPT, Claude)", type: "fixo", value: 2800 },
  { id: "2", name: "Meta Ads (Conta Agência)", type: "fixo", value: 1200 },
  { id: "3", name: "N8N Cloud", type: "fixo", value: 800 },
  { id: "4", name: "Freelancers", type: "variavel", value: 4500, project: "Vários" },
  { id: "5", name: "Hospedagem / Domínios", type: "fixo", value: 600 },
  { id: "6", name: "APIs Externas", type: "variavel", value: 1200 },
];

const monthlyData = [
  { month: "Out", receita: 28000, custos: 12000 },
  { month: "Nov", receita: 32000, custos: 13500 },
  { month: "Dez", receita: 35000, custos: 14000 },
  { month: "Jan", receita: 38000, custos: 14200 },
  { month: "Fev", receita: 40000, custos: 15000 },
  { month: "Mar", receita: 42800, custos: 14800 },
];

const nicheData = [
  { name: "Advocacia", value: 35, profit: 72 },
  { name: "Saúde/Estética", value: 25, profit: 65 },
  { name: "Imobiliário", value: 20, profit: 58 },
  { name: "E-commerce", value: 12, profit: 70 },
  { name: "Serviços", value: 8, profit: 55 },
];
const COLORS = ["hsl(17, 100%, 58%)", "hsl(200, 70%, 55%)", "hsl(262, 60%, 60%)", "hsl(152, 60%, 42%)", "hsl(340, 65%, 55%)"];

const Financeiro = () => {
  const [revenues, setRevenues] = useState(initialRevenues);
  const [costs, setCosts] = useState(initialCosts);
  const [showAddRev, setShowAddRev] = useState(false);
  const [showAddCost, setShowAddCost] = useState(false);
  const [editRev, setEditRev] = useState<RevenueEntry | null>(null);
  const [editCost, setEditCost] = useState<CostEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "rev" | "cost"; id: string } | null>(null);
  const [newRev, setNewRev] = useState<Omit<RevenueEntry, "id">>({ client: "", type: "mrr", value: 0, description: "" });
  const [newCost, setNewCost] = useState<Omit<CostEntry, "id">>({ name: "", type: "fixo", value: 0 });

  const mrrTotal = revenues.filter(r => r.type === "mrr").reduce((s, r) => s + r.value, 0);
  const setupTotal = revenues.filter(r => r.type === "setup").reduce((s, r) => s + r.value, 0);
  const oneOffTotal = revenues.filter(r => r.type === "oneoff").reduce((s, r) => s + r.value, 0);
  const tcv = mrrTotal * 12 + setupTotal + oneOffTotal;
  const totalCustos = costs.reduce((s, c) => s + c.value, 0);
  const totalReceita = mrrTotal + setupTotal + oneOffTotal;
  const lucro = totalReceita - totalCustos;
  const margem = totalReceita > 0 ? Math.round((lucro / totalReceita) * 100) : 0;

  // Margin per client
  const clientNames = [...new Set(revenues.map(r => r.client))];
  const clientMargins = clientNames.map(name => {
    const rev = revenues.filter(r => r.client === name).reduce((s, r) => s + r.value, 0);
    const costShare = Math.round(totalCustos * (rev / totalReceita));
    const profit = rev - costShare;
    const margin = rev > 0 ? Math.round((profit / rev) * 100) : 0;
    return { client: name, revenue: rev, costs: costShare, profit, margin };
  });

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "rev") setRevenues(prev => prev.filter(r => r.id !== deleteTarget.id));
    else setCosts(prev => prev.filter(c => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div><h1 className="text-2xl font-bold tracking-tight">Financial Intelligence</h1><p className="text-sm text-muted-foreground mt-1">Receitas, custos operacionais e margem real</p></div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "MRR", value: mrrTotal, icon: Repeat, color: "primary" },
          { label: "Setup Fees", value: setupTotal, icon: Zap, color: "info" },
          { label: "One-offs", value: oneOffTotal, icon: DollarSign, color: "warning" },
          { label: "TCV (Anual)", value: tcv, icon: Receipt, color: "muted-foreground" },
          { label: "Custos", value: totalCustos, icon: ArrowDownRight, color: "destructive" },
          { label: "Margem", value: margem, icon: TrendingUp, color: "success", isSuffix: "%" },
        ].map((m) => (
          <div key={m.label} className="metric-card">
            <div className={`h-7 w-7 rounded-lg bg-${m.color}/10 flex items-center justify-center mb-1.5`}><m.icon className={`h-3.5 w-3.5 text-${m.color}`} /></div>
            <p className="text-xl font-bold">{(m as any).isSuffix ? `${m.value}%` : `R$ ${m.value.toLocaleString()}`}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="metric-card lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Receita vs Custos (6 meses)</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [`R$ ${value.toLocaleString()}`, ""]} />
                <Bar dataKey="receita" fill="hsl(17, 100%, 58%)" radius={[4, 4, 0, 0]} name="Receita" />
                <Bar dataKey="custos" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="Custos" opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-4">Por Nicho</h3>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={nicheData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={2}>{nicheData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} /></PieChart></ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">{nicheData.map((n, i) => <div key={n.name} className="flex items-center justify-between text-xs"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} /><span className="text-muted-foreground">{n.name}</span></div><span className="font-medium">{n.profit}%</span></div>)}</div>
        </div>
      </div>

      {/* Margem por Cliente */}
      <div className="metric-card">
        <h3 className="text-sm font-semibold mb-4">Margem Real por Cliente</h3>
        <table className="w-full"><thead><tr className="border-b border-border"><th className="text-left text-xs font-medium text-muted-foreground pb-2">Cliente</th><th className="text-right text-xs font-medium text-muted-foreground pb-2">Receita</th><th className="text-right text-xs font-medium text-muted-foreground pb-2">Custos</th><th className="text-right text-xs font-medium text-muted-foreground pb-2">Lucro</th><th className="text-right text-xs font-medium text-muted-foreground pb-2">Margem</th></tr></thead>
          <tbody>{clientMargins.map(c => <tr key={c.client} className="border-b border-border last:border-0"><td className="py-2 text-sm font-medium">{c.client}</td><td className="py-2 text-right text-sm">R$ {c.revenue.toLocaleString()}</td><td className="py-2 text-right text-sm text-destructive">R$ {c.costs.toLocaleString()}</td><td className="py-2 text-right text-sm font-semibold text-success">R$ {c.profit.toLocaleString()}</td><td className="py-2 text-right"><span className={`text-xs px-2 py-0.5 rounded-full ${c.margin >= 65 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{c.margin}%</span></td></tr>)}</tbody>
        </table>
      </div>

      {/* Revenue Entries */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold">Lançamentos de Receita</h3><Button size="sm" variant="outline" onClick={() => setShowAddRev(true)}><Plus className="h-3.5 w-3.5 mr-1" />Adicionar</Button></div>
        <table className="w-full"><thead><tr className="border-b border-border"><th className="text-left text-xs font-medium text-muted-foreground pb-2">Cliente</th><th className="text-left text-xs font-medium text-muted-foreground pb-2">Tipo</th><th className="text-left text-xs font-medium text-muted-foreground pb-2">Descrição</th><th className="text-right text-xs font-medium text-muted-foreground pb-2">Valor</th><th className="text-right text-xs font-medium text-muted-foreground pb-2">Ações</th></tr></thead>
          <tbody>{revenues.map(r => <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30"><td className="py-2 text-sm">{r.client}</td><td className="py-2"><span className={`text-[10px] px-2 py-0.5 rounded-full ${r.type === "mrr" ? "bg-primary/10 text-primary" : r.type === "setup" ? "bg-info/10 text-info" : "bg-warning/10 text-warning"}`}>{r.type.toUpperCase()}</span></td><td className="py-2 text-sm text-muted-foreground">{r.description}</td><td className="py-2 text-right text-sm font-medium">R$ {r.value.toLocaleString()}</td><td className="py-2 text-right"><div className="flex justify-end gap-1"><button onClick={() => setEditRev({ ...r })} className="p-1 rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button><button onClick={() => setDeleteTarget({ type: "rev", id: r.id })} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button></div></td></tr>)}</tbody>
        </table>
      </div>

      {/* Cost Entries */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold">Custos Operacionais</h3><Button size="sm" variant="outline" onClick={() => setShowAddCost(true)}><Plus className="h-3.5 w-3.5 mr-1" />Adicionar</Button></div>
        <table className="w-full"><thead><tr className="border-b border-border"><th className="text-left text-xs font-medium text-muted-foreground pb-2">Item</th><th className="text-left text-xs font-medium text-muted-foreground pb-2">Tipo</th><th className="text-right text-xs font-medium text-muted-foreground pb-2">Valor</th><th className="text-right text-xs font-medium text-muted-foreground pb-2">Ações</th></tr></thead>
          <tbody>{costs.map(c => <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30"><td className="py-2 text-sm">{c.name}</td><td className="py-2"><span className={`text-[10px] px-2 py-0.5 rounded-full ${c.type === "fixo" ? "bg-info/10 text-info" : "bg-warning/10 text-warning"}`}>{c.type === "fixo" ? "Fixo" : "Variável"}</span></td><td className="py-2 text-right text-sm font-medium">R$ {c.value.toLocaleString()}</td><td className="py-2 text-right"><div className="flex justify-end gap-1"><button onClick={() => setEditCost({ ...c })} className="p-1 rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button><button onClick={() => setDeleteTarget({ type: "cost", id: c.id })} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button></div></td></tr>)}</tbody>
        </table>
      </div>

      {/* Add Revenue Dialog */}
      <Dialog open={showAddRev} onOpenChange={setShowAddRev}>
        <DialogContent><DialogHeader><DialogTitle>Nova Receita</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Cliente" value={newRev.client} onChange={e => setNewRev(p => ({ ...p, client: e.target.value }))} />
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newRev.type} onChange={e => setNewRev(p => ({ ...p, type: e.target.value as any }))}><option value="mrr">MRR</option><option value="setup">Setup</option><option value="oneoff">One-off</option></select>
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Descrição" value={newRev.description} onChange={e => setNewRev(p => ({ ...p, description: e.target.value }))} />
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Valor (R$)" value={newRev.value || ""} onChange={e => setNewRev(p => ({ ...p, value: Number(e.target.value) }))} />
          </div>
          <DialogFooter><Button onClick={() => { if (newRev.client) { setRevenues(p => [...p, { ...newRev, id: Date.now().toString() }]); setNewRev({ client: "", type: "mrr", value: 0, description: "" }); setShowAddRev(false); } }}>Adicionar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Revenue */}
      <Dialog open={!!editRev} onOpenChange={() => setEditRev(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Receita</DialogTitle></DialogHeader>
          {editRev && <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editRev.client} onChange={e => setEditRev({ ...editRev, client: e.target.value })} />
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={editRev.type} onChange={e => setEditRev({ ...editRev, type: e.target.value as any })}><option value="mrr">MRR</option><option value="setup">Setup</option><option value="oneoff">One-off</option></select>
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editRev.description} onChange={e => setEditRev({ ...editRev, description: e.target.value })} />
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editRev.value} onChange={e => setEditRev({ ...editRev, value: Number(e.target.value) })} />
          </div>}
          <DialogFooter><Button onClick={() => { if (editRev) { setRevenues(p => p.map(r => r.id === editRev.id ? editRev : r)); setEditRev(null); } }}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Cost */}
      <Dialog open={showAddCost} onOpenChange={setShowAddCost}>
        <DialogContent><DialogHeader><DialogTitle>Novo Custo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Nome do custo" value={newCost.name} onChange={e => setNewCost(p => ({ ...p, name: e.target.value }))} />
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newCost.type} onChange={e => setNewCost(p => ({ ...p, type: e.target.value as any }))}><option value="fixo">Fixo</option><option value="variavel">Variável</option></select>
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Valor (R$)" value={newCost.value || ""} onChange={e => setNewCost(p => ({ ...p, value: Number(e.target.value) }))} />
          </div>
          <DialogFooter><Button onClick={() => { if (newCost.name) { setCosts(p => [...p, { ...newCost, id: Date.now().toString() }]); setNewCost({ name: "", type: "fixo", value: 0 }); setShowAddCost(false); } }}>Adicionar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Cost */}
      <Dialog open={!!editCost} onOpenChange={() => setEditCost(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Custo</DialogTitle></DialogHeader>
          {editCost && <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editCost.name} onChange={e => setEditCost({ ...editCost, name: e.target.value })} />
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={editCost.type} onChange={e => setEditCost({ ...editCost, type: e.target.value as any })}><option value="fixo">Fixo</option><option value="variavel">Variável</option></select>
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editCost.value} onChange={e => setEditCost({ ...editCost, value: Number(e.target.value) })} />
          </div>}
          <DialogFooter><Button onClick={() => { if (editCost) { setCosts(p => p.map(c => c.id === editCost.id ? editCost : c)); setEditCost(null); } }}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir lançamento?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Financeiro;
