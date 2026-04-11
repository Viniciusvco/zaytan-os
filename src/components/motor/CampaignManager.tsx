import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Users, PauseCircle, PlayCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string | null) => void;
};

export function CampaignManager({ selectedCampaignId, onSelectCampaign }: Props) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editCampaign, setEditCampaign] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showClients, setShowClients] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({ client_id: "", investment_amount: 0, daily_limit: "" as string | number, weight_percent: 0 });

  const [form, setForm] = useState({ name: "", total_investment: 0, stock_expiry_days: 7, min_lead_goal: "" as string | number });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: campaignClients = [], refetch: refetchCC } = useQuery({
    queryKey: ["campaign-clients", showClients],
    queryFn: async () => {
      if (!showClients) return [];
      const { data, error } = await supabase.from("campaign_clients").select("*, clients(name)").eq("campaign_id", showClients).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!showClients,
  });

  const createMut = useMutation({
    mutationFn: async (f: any) => {
      const payload = {
        name: f.name,
        total_investment: f.total_investment,
        stock_expiry_days: f.stock_expiry_days,
        min_lead_goal: f.min_lead_goal || null,
      };
      const { error } = await supabase.from("campaigns").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); setShowCreate(false); toast.success("Campanha criada"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async (f: any) => {
      const { id, created_at, updated_at, ...rest } = f;
      rest.min_lead_goal = rest.min_lead_goal || null;
      const { error } = await supabase.from("campaigns").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); setEditCampaign(null); toast.success("Campanha atualizada"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      if (selectedCampaignId === deleteId) onSelectCampaign(null);
      setDeleteId(null);
      toast.success("Campanha excluída");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addClientMut = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from("campaign_clients").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchCC();
      recalcWeights();
      setNewClient({ client_id: "", investment_amount: 0, daily_limit: "", weight_percent: 0 });
      toast.success("Cliente adicionado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const togglePauseMut = useMutation({
    mutationFn: async ({ id, paused }: { id: string; paused: boolean }) => {
      const { error } = await supabase.from("campaign_clients").update({ paused }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { refetchCC(); toast.success("Status atualizado"); },
  });

  const removeClientMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaign_clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { refetchCC(); recalcWeights(); toast.success("Cliente removido"); },
  });

  const recalcWeights = async () => {
    if (!showClients) return;
    const { data: ccs } = await supabase.from("campaign_clients").select("*").eq("campaign_id", showClients);
    if (!ccs?.length) return;
    const total = ccs.reduce((s, cc) => s + Number(cc.investment_amount), 0);
    if (total <= 0) return;
    for (const cc of ccs) {
      if (!cc.weight_override) {
        const pct = (Number(cc.investment_amount) / total) * 100;
        await supabase.from("campaign_clients").update({ weight_percent: pct }).eq("id", cc.id);
      }
    }
    refetchCC();
  };

  const handleOverrideWeight = async (ccId: string, newWeight: number) => {
    await supabase.from("campaign_clients").update({ weight_percent: newWeight, weight_override: true }).eq("id", ccId);
    refetchCC();
    toast.info("Peso sobrescrito manualmente");
  };

  const handleResetWeight = async (ccId: string) => {
    await supabase.from("campaign_clients").update({ weight_override: false }).eq("id", ccId);
    recalcWeights();
    toast.info("Peso resetado para automático");
  };

  const CampaignForm = ({ data, onChange }: { data: any; onChange: (d: any) => void }) => (
    <div className="space-y-3">
      <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nome da campanha" value={data.name} onChange={e => onChange({ ...data, name: e.target.value })} />
      <div className="grid grid-cols-3 gap-3">
        <div><label className="text-[10px] text-muted-foreground font-medium mb-1 block">Investimento Total (R$)</label>
          <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.total_investment} onChange={e => onChange({ ...data, total_investment: Number(e.target.value) })} /></div>
        <div><label className="text-[10px] text-muted-foreground font-medium mb-1 block">Expiração Estoque (dias)</label>
          <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.stock_expiry_days} onChange={e => onChange({ ...data, stock_expiry_days: Number(e.target.value) })} /></div>
        <div><label className="text-[10px] text-muted-foreground font-medium mb-1 block">Meta mínima de leads</label>
          <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.min_lead_goal} onChange={e => onChange({ ...data, min_lead_goal: e.target.value === "" ? "" : Number(e.target.value) })} /></div>
      </div>
    </div>
  );

  const totalWeight = campaignClients.reduce((s, cc: any) => s + Number(cc.weight_percent), 0);
  const weightValid = Math.abs(totalWeight - 100) < 0.5;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Campanhas</h3>
        <Button size="sm" onClick={() => { setForm({ name: "", total_investment: 0, stock_expiry_days: 7, min_lead_goal: "" }); setShowCreate(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nova Campanha
        </Button>
      </div>

      <div className="space-y-2">
        {campaigns.map((c: any) => (
          <div key={c.id}
            onClick={() => onSelectCampaign(c.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedCampaignId === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">{c.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Investimento: R$ {Number(c.total_investment).toLocaleString()} · Estoque expira em {c.stock_expiry_days}d
                  {c.min_lead_goal && ` · Meta: ${c.min_lead_goal} leads`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); setShowClients(c.id); }} className="p-1.5 rounded-md hover:bg-muted"><Users className="h-3.5 w-3.5 text-muted-foreground" /></button>
                <button onClick={(e) => { e.stopPropagation(); setEditCampaign({ ...c }); }} className="p-1.5 rounded-md hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }} className="p-1.5 rounded-md hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
              </div>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <p className="text-center py-8 text-sm text-muted-foreground">Nenhuma campanha criada ainda.</p>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent><DialogHeader><DialogTitle>Nova Campanha</DialogTitle></DialogHeader>
          <CampaignForm data={form} onChange={setForm} />
          <DialogFooter><Button onClick={() => { if (form.name) createMut.mutate(form); }} disabled={createMut.isPending}>{createMut.isPending ? "Criando..." : "Criar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editCampaign} onOpenChange={() => setEditCampaign(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Campanha</DialogTitle></DialogHeader>
          {editCampaign && <CampaignForm data={editCampaign} onChange={setEditCampaign} />}
          <DialogFooter><Button onClick={() => updateMut.mutate(editCampaign)} disabled={updateMut.isPending}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir campanha?</AlertDialogTitle><AlertDialogDescription>Todos os leads e logs da campanha serão removidos.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { if (deleteId) deleteMut.mutate(deleteId); }} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Campaign Clients Dialog */}
      <Dialog open={!!showClients} onOpenChange={() => setShowClients(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Clientes da Campanha</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Add client form */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Cliente</label>
                <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newClient.client_id} onChange={e => setNewClient({ ...newClient, client_id: e.target.value })}>
                  <option value="">Selecione</option>
                  {clients.filter(cl => !campaignClients.some((cc: any) => cc.client_id === cl.id)).map(cl => (
                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Investimento (R$)</label>
                <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={newClient.investment_amount} onChange={e => setNewClient({ ...newClient, investment_amount: Number(e.target.value) })} />
              </div>
              <div className="w-24">
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Limite/dia</label>
                <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="∞" value={newClient.daily_limit} onChange={e => setNewClient({ ...newClient, daily_limit: e.target.value === "" ? "" : Number(e.target.value) })} />
              </div>
              <Button size="sm" onClick={() => {
                if (!newClient.client_id || !showClients) return;
                addClientMut.mutate({
                  campaign_id: showClients,
                  client_id: newClient.client_id,
                  investment_amount: newClient.investment_amount,
                  daily_limit: newClient.daily_limit === "" ? null : newClient.daily_limit,
                });
              }} disabled={!newClient.client_id}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Client list */}
            {campaignClients.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead><tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left px-3 py-2">Cliente</th>
                    <th className="text-right px-3 py-2">Investimento</th>
                    <th className="text-right px-3 py-2">Peso %</th>
                    <th className="text-right px-3 py-2">Limite/dia</th>
                    <th className="text-center px-3 py-2">Status</th>
                    <th className="text-right px-3 py-2">Ações</th>
                  </tr></thead>
                  <tbody>
                    {campaignClients.map((cc: any) => (
                      <tr key={cc.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 text-sm">{cc.clients?.name || "—"}</td>
                        <td className="px-3 py-2 text-sm text-right">R$ {Number(cc.investment_amount).toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <input type="number" min={0} max={100} step={0.1}
                              className={`w-16 h-7 px-2 rounded bg-muted border-0 text-sm text-right focus:outline-none ${cc.weight_override ? "ring-1 ring-primary/50" : ""}`}
                              value={Number(cc.weight_percent).toFixed(1)}
                              onChange={e => handleOverrideWeight(cc.id, parseFloat(e.target.value) || 0)} />
                            <span className="text-xs">%</span>
                            {cc.weight_override && (
                              <button className="text-[10px] text-primary hover:underline" onClick={() => handleResetWeight(cc.id)}>↺</button>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-right">{cc.daily_limit ?? "∞"}</td>
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => togglePauseMut.mutate({ id: cc.id, paused: !cc.paused })}>
                            {cc.paused ? <PauseCircle className="h-4 w-4 text-warning mx-auto" /> : <PlayCircle className="h-4 w-4 text-success mx-auto" />}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => removeClientMut.mutate(cc.id)} className="p-1 rounded hover:bg-destructive/10">
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Weight sum validation */}
            {campaignClients.length > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total dos pesos</span>
                <span className={`font-semibold ${weightValid ? "text-success" : "text-warning"}`}>
                  Σ {totalWeight.toFixed(1)}% {!weightValid && "(deve ser 100%)"}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
