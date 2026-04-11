import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, Send, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = { campaignId: string | null };

export function StockManager({ campaignId }: Props) {
  const qc = useQueryClient();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [targetClient, setTargetClient] = useState("");

  const { data: stockLeads = [], isLoading } = useQuery({
    queryKey: ["stock-leads", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase.from("lead_queue")
        .select("*, stock_client:stock_client_id(name)")
        .eq("campaign_id", campaignId)
        .eq("status", "estoque")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });

  const { data: campaignClients = [] } = useQuery({
    queryKey: ["campaign-clients-for-stock", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase.from("campaign_clients")
        .select("client_id, clients(name)")
        .eq("campaign_id", campaignId)
        .eq("paused", false);
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });

  const sendStockMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("campaign-distribute", {
        body: {
          action: "send_stock",
          lead_queue_ids: selectedLeads,
          target_client_id: targetClient,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["stock-leads"] });
      qc.invalidateQueries({ queryKey: ["motor-metrics"] });
      setSelectedLeads([]);
      toast.success(`${data.sent} leads enviados do estoque`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleSelect = (id: string) => {
    setSelectedLeads(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedLeads.length === stockLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(stockLeads.map((l: any) => l.id));
    }
  };

  if (!campaignId) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Selecione uma campanha</div>;
  }

  const now = new Date();
  const nearExpiry = stockLeads.filter((l: any) => {
    if (!l.expires_at) return false;
    const diff = new Date(l.expires_at).getTime() - now.getTime();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  });

  return (
    <div className="space-y-4">
      {nearExpiry.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <span className="text-xs text-warning font-medium">{nearExpiry.length} lead(s) expirando nas próximas 24 horas!</span>
        </div>
      )}

      {selectedLeads.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-xs font-medium">{selectedLeads.length} selecionado(s)</span>
          <select className="h-7 px-2 rounded bg-muted border-0 text-xs" value={targetClient} onChange={e => setTargetClient(e.target.value)}>
            <option value="">Enviar para...</option>
            {campaignClients.map((cc: any) => (
              <option key={cc.client_id} value={cc.client_id}>{(cc.clients as any)?.name}</option>
            ))}
          </select>
          <Button size="sm" variant="default" onClick={() => sendStockMut.mutate()} disabled={!targetClient || sendStockMut.isPending}>
            <Send className="h-3.5 w-3.5 mr-1" /> Enviar
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
      ) : stockLeads.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhum lead em estoque</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-4 py-2 w-8">
                <input type="checkbox" checked={selectedLeads.length === stockLeads.length && stockLeads.length > 0} onChange={selectAll} className="rounded" />
              </th>
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-left px-4 py-2">Telefone</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Entrada</th>
              <th className="text-left px-4 py-2">Expira em</th>
            </tr></thead>
            <tbody>
              {stockLeads.map((l: any) => {
                const expiresIn = l.expires_at ? Math.max(0, Math.ceil((new Date(l.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;
                const isNearExpiry = expiresIn !== null && expiresIn <= 1;
                return (
                  <tr key={l.id} className={`border-b border-border last:border-0 hover:bg-muted/30 ${isNearExpiry ? "bg-warning/5" : ""}`}>
                    <td className="px-4 py-2.5">
                      <input type="checkbox" checked={selectedLeads.includes(l.id)} onChange={() => toggleSelect(l.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium">{l.name}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{l.phone || "—"}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{l.email || "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-2.5">
                      {expiresIn !== null ? (
                        <span className={`text-xs flex items-center gap-1 ${isNearExpiry ? "text-warning font-semibold" : "text-muted-foreground"}`}>
                          {isNearExpiry && <Clock className="h-3 w-3" />}
                          {expiresIn}d
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
