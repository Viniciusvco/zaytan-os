import { useState, useEffect, useMemo } from "react";
import { useClientRole } from "@/contexts/ClientRoleContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Target, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

interface GoalRow {
  id: string;
  vendedor_id: string;
  client_id: string;
  month_ref: string;
  target_value: number;
}

export default function ClientPerformance() {
  const { clientId, clientRole, visibleVendedores, myProfileId } = useClientRole();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({ vendedor_id: "", month_ref: format(new Date(), "yyyy-MM"), target_value: "" });
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  const { data: goals = [], refetch: refetchGoals } = useQuery({
    queryKey: ["vendor-goals", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("vendor_goals")
        .select("*")
        .eq("client_id", clientId);
      if (error) throw error;
      return data as GoalRow[];
    },
    enabled: !!clientId,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["client-perf-leads", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("leads")
        .select("id, status, value, seller_tag, updated_at")
        .eq("client_id", clientId);
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const monthGoals = goals.filter(g => g.month_ref?.startsWith(selectedMonth));

  const chartData = useMemo(() => {
    return visibleVendedores.map(v => {
      const goal = monthGoals.find(g => g.vendedor_id === v.user_id);
      const realized = leads
        .filter((l: any) => l.status === "fechado" && l.seller_tag === v.full_name && l.updated_at?.startsWith(selectedMonth))
        .reduce((s: number, l: any) => s + Number(l.value || 0), 0);
      return {
        name: v.full_name.split(" ")[0],
        meta: goal?.target_value || 0,
        realizado: realized,
        vendedorId: v.user_id,
        fullName: v.full_name,
      };
    }).filter(d => d.meta > 0 || d.realizado > 0);
  }, [visibleVendedores, monthGoals, leads, selectedMonth]);

  const handleSaveGoal = async () => {
    if (!goalForm.vendedor_id || !goalForm.target_value || !clientId) {
      toast.error("Preencha todos os campos");
      return;
    }

    const targetValue = parseFloat(goalForm.target_value);
    const monthRef = goalForm.month_ref + "-01";

    const existing = goals.find(
      g => g.vendedor_id === goalForm.vendedor_id && g.month_ref?.startsWith(goalForm.month_ref)
    );

    if (existing) {
      await supabase.from("vendor_goals").update({ target_value: targetValue } as any).eq("id", existing.id);
    } else {
      await supabase.from("vendor_goals").insert({
        vendedor_id: goalForm.vendedor_id,
        client_id: clientId,
        month_ref: monthRef,
        target_value: targetValue,
      } as any);
    }

    toast.success("Meta salva!");
    setDialogOpen(false);
    setGoalForm({ vendedor_id: "", month_ref: format(new Date(), "yyyy-MM"), target_value: "" });
    refetchGoals();
  };

  const canManageGoals = clientRole === "gerente" || clientRole === "supervisor";

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - 3 + i, 1);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy", { locale: ptBR }) };
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Performance de Vendedores</h2>
          <p className="text-sm text-muted-foreground">Metas e resultados por período</p>
        </div>
        <div className="flex gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Mês</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{monthOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {canManageGoals && (
            <Button onClick={() => setDialogOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" />Definir Meta</Button>
          )}
        </div>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />Realizado vs Meta</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma meta ou venda registrada para este período.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                <Legend />
                <Bar dataKey="meta" name="Meta" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.4} />
                <Bar dataKey="realizado" name="Realizado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Goals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metas Cadastradas — {monthOptions.find(o => o.value === selectedMonth)?.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead>Meta (R$)</TableHead>
                <TableHead>Realizado (R$)</TableHead>
                <TableHead>%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleVendedores.map(v => {
                const goal = monthGoals.find(g => g.vendedor_id === v.user_id);
                const realized = leads
                  .filter((l: any) => l.status === "fechado" && l.seller_tag === v.full_name && l.updated_at?.startsWith(selectedMonth))
                  .reduce((s: number, l: any) => s + Number(l.value || 0), 0);
                const pct = goal?.target_value ? Math.round((realized / goal.target_value) * 100) : 0;
                return (
                  <TableRow key={v.user_id}>
                    <TableCell className="font-medium">{v.full_name}</TableCell>
                    <TableCell>{goal ? `R$ ${goal.target_value.toLocaleString("pt-BR")}` : "—"}</TableCell>
                    <TableCell>R$ {realized.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      <span className={pct >= 100 ? "text-green-600 font-bold" : pct >= 50 ? "text-primary font-medium" : "text-muted-foreground"}>
                        {goal ? `${pct}%` : "—"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Goal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Definir Meta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Select value={goalForm.vendedor_id} onValueChange={v => setGoalForm(f => ({ ...f, vendedor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {visibleVendedores.map(v => (
                    <SelectItem key={v.user_id} value={v.user_id}>{v.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mês de Referência</Label>
              <Select value={goalForm.month_ref} onValueChange={v => setGoalForm(f => ({ ...f, month_ref: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{monthOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Meta (R$)</Label>
              <Input type="number" value={goalForm.target_value} onChange={e => setGoalForm(f => ({ ...f, target_value: e.target.value }))} placeholder="Ex: 50000" />
            </div>
          </div>
          <DialogFooter><Button onClick={handleSaveGoal}>Salvar Meta</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
