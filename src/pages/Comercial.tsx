import { useState } from "react";
import { Target, Plus, TrendingUp, Users, DollarSign, Pencil, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface Seller {
  id: string; name: string; initials: string; commission: number;
  metaVolume: number; metaRevenue: number; realVolume: number; realRevenue: number; deals: number;
}

const initialSellers: Seller[] = [
  { id: "1", name: "Rafael Oliveira", initials: "RO", commission: 10, metaVolume: 8, metaRevenue: 40000, realVolume: 6, realRevenue: 32500, deals: 3 },
  { id: "2", name: "Camila Santos", initials: "CS", commission: 12, metaVolume: 10, metaRevenue: 50000, realVolume: 9, realRevenue: 47200, deals: 5 },
  { id: "3", name: "Lucas Mendes", initials: "LM", commission: 10, metaVolume: 6, metaRevenue: 30000, realVolume: 7, realRevenue: 35800, deals: 4 },
  { id: "4", name: "Ana Beatriz", initials: "AB", commission: 15, metaVolume: 12, metaRevenue: 60000, realVolume: 10, realRevenue: 52000, deals: 6 },
];

const Comercial = () => {
  const [sellers, setSellers] = useState(initialSellers);
  const [showAdd, setShowAdd] = useState(false);
  const [editSeller, setEditSeller] = useState<Seller | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newSeller, setNewSeller] = useState({ name: "", commission: 10, metaVolume: 0, metaRevenue: 0 });

  const chartData = sellers.map(s => ({ name: s.initials, Meta: s.metaRevenue, Realizado: s.realRevenue }));
  const totalMeta = sellers.reduce((s, v) => s + v.metaRevenue, 0);
  const totalReal = sellers.reduce((s, v) => s + v.realRevenue, 0);
  const totalDeals = sellers.reduce((s, v) => s + v.deals, 0);
  const avgPercent = totalMeta > 0 ? Math.round((totalReal / totalMeta) * 100) : 0;

  const handleAdd = () => {
    if (!newSeller.name.trim()) return;
    const initials = newSeller.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    setSellers(prev => [...prev, { ...newSeller, id: Date.now().toString(), initials, realVolume: 0, realRevenue: 0, deals: 0 }]);
    setNewSeller({ name: "", commission: 10, metaVolume: 0, metaRevenue: 0 });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Comercial & Vendedores</h1><p className="text-sm text-muted-foreground mt-1">Performance de vendas e acompanhamento de metas</p></div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Vendedor</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Meta Geral Atingida", value: `${avgPercent}%`, icon: Target, color: "primary" },
          { label: "Faturado no Mês", value: `R$ ${totalReal.toLocaleString()}`, icon: DollarSign, color: "success" },
          { label: "Deals Fechados", value: totalDeals, icon: TrendingUp, color: "info" },
          { label: "Vendedores Ativos", value: sellers.length, icon: Users, color: "warning" },
        ].map(m => (
          <div key={m.label} className="metric-card">
            <div className={`h-8 w-8 rounded-lg bg-${m.color}/10 flex items-center justify-center mb-2`}><m.icon className={`h-4 w-4 text-${m.color}`} /></div>
            <p className="text-2xl font-bold">{m.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="metric-card">
        <h3 className="text-sm font-semibold mb-4">Meta vs Realizado por Vendedor (R$)</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [`R$ ${value.toLocaleString()}`, ""]} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="Meta" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.3} />
              <Bar dataKey="Realizado" fill="hsl(17, 100%, 58%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="metric-card">
        <h3 className="text-sm font-semibold mb-4">Perfis de Vendedores</h3>
        <table className="w-full">
          <thead><tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground pb-2">Vendedor</th>
            <th className="text-right text-xs font-medium text-muted-foreground pb-2">Comissão</th>
            <th className="text-right text-xs font-medium text-muted-foreground pb-2">Meta (R$)</th>
            <th className="text-right text-xs font-medium text-muted-foreground pb-2">Realizado (R$)</th>
            <th className="text-right text-xs font-medium text-muted-foreground pb-2">% Atingido</th>
            <th className="text-right text-xs font-medium text-muted-foreground pb-2">Comissão (R$)</th>
            <th className="text-right text-xs font-medium text-muted-foreground pb-2">Ações</th>
          </tr></thead>
          <tbody>
            {sellers.map(s => {
              const pct = s.metaRevenue > 0 ? Math.round((s.realRevenue / s.metaRevenue) * 100) : 0;
              const commissionValue = Math.round(s.realRevenue * s.commission / 100);
              return (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-3"><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{s.initials}</AvatarFallback></Avatar><div><p className="text-sm font-medium">{s.name}</p><p className="text-[10px] text-muted-foreground">{s.deals} deals</p></div></div></td>
                  <td className="py-3 text-right text-sm">{s.commission}%</td>
                  <td className="py-3 text-right text-sm text-muted-foreground">R$ {s.metaRevenue.toLocaleString()}</td>
                  <td className="py-3 text-right text-sm font-semibold">R$ {s.realRevenue.toLocaleString()}</td>
                  <td className="py-3 text-right"><span className={`text-xs px-2 py-0.5 rounded-full ${pct >= 100 ? "bg-success/10 text-success" : pct >= 80 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>{pct}%</span></td>
                  <td className="py-3 text-right text-sm font-medium text-primary">R$ {commissionValue.toLocaleString()}</td>
                  <td className="py-3 text-right"><div className="flex justify-end gap-1"><button onClick={() => setEditSeller({ ...s })} className="p-1 rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button><button onClick={() => setDeleteId(s.id)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>Novo Vendedor</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nome completo" value={newSeller.name} onChange={e => setNewSeller(p => ({ ...p, name: e.target.value }))} />
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Comissão (%)" value={newSeller.commission || ""} onChange={e => setNewSeller(p => ({ ...p, commission: Number(e.target.value) }))} />
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Meta de volume" value={newSeller.metaVolume || ""} onChange={e => setNewSeller(p => ({ ...p, metaVolume: Number(e.target.value) }))} />
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Meta de receita (R$)" value={newSeller.metaRevenue || ""} onChange={e => setNewSeller(p => ({ ...p, metaRevenue: Number(e.target.value) }))} />
          </div>
          <DialogFooter><Button onClick={handleAdd}>Adicionar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editSeller} onOpenChange={() => setEditSeller(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Vendedor</DialogTitle></DialogHeader>
          {editSeller && <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editSeller.name} onChange={e => setEditSeller({ ...editSeller, name: e.target.value })} />
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editSeller.commission} onChange={e => setEditSeller({ ...editSeller, commission: Number(e.target.value) })} />
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Meta Volume" value={editSeller.metaVolume} onChange={e => setEditSeller({ ...editSeller, metaVolume: Number(e.target.value) })} />
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Meta Receita" value={editSeller.metaRevenue} onChange={e => setEditSeller({ ...editSeller, metaRevenue: Number(e.target.value) })} />
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Realizado Volume" value={editSeller.realVolume} onChange={e => setEditSeller({ ...editSeller, realVolume: Number(e.target.value) })} />
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Realizado Receita" value={editSeller.realRevenue} onChange={e => setEditSeller({ ...editSeller, realRevenue: Number(e.target.value) })} />
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Deals fechados" value={editSeller.deals} onChange={e => setEditSeller({ ...editSeller, deals: Number(e.target.value) })} />
          </div>}
          <DialogFooter><Button onClick={() => { if (editSeller) { setSellers(p => p.map(s => s.id === editSeller.id ? editSeller : s)); setEditSeller(null); } }}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir vendedor?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { setSellers(p => p.filter(s => s.id !== deleteId)); setDeleteId(null); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Comercial;
