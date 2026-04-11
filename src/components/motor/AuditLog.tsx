import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollText } from "lucide-react";

type Props = { campaignId: string | null };

const ruleLabels: Record<string, string> = {
  proporcional: "Proporcional",
  estoque: "Estoque",
  redistribuicao: "Redistribuição",
  manual: "Manual",
};

export function AuditLog({ campaignId }: Props) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["distribution-logs", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase.from("distribution_logs")
        .select("*, clients(name), lead_queue(name, phone, email)")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });

  if (!campaignId) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Selecione uma campanha</div>;
  }

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Nenhum registro de distribuição</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead><tr className="border-b border-border text-xs text-muted-foreground">
          <th className="text-left px-4 py-2">Data/Hora</th>
          <th className="text-left px-4 py-2">Lead</th>
          <th className="text-left px-4 py-2">Cliente Destino</th>
          <th className="text-left px-4 py-2">Regra</th>
          <th className="text-right px-4 py-2">Peso %</th>
          <th className="text-right px-4 py-2">Saldo Acum.</th>
          <th className="text-left px-4 py-2">Status</th>
        </tr></thead>
        <tbody>
          {logs.map((log: any) => (
            <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30">
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString("pt-BR")}</td>
              <td className="px-4 py-2.5">
                <span className="text-sm font-medium">{(log.lead_queue as any)?.name || "—"}</span>
                {(log.lead_queue as any)?.phone && (
                  <span className="text-[10px] text-muted-foreground ml-1">{(log.lead_queue as any).phone}</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-sm">{(log.clients as any)?.name || "—"}</td>
              <td className="px-4 py-2.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {ruleLabels[log.rule_applied] || log.rule_applied}
                </span>
              </td>
              <td className="px-4 py-2.5 text-sm text-right">{Number(log.weight_at_distribution).toFixed(1)}%</td>
              <td className="px-4 py-2.5 text-sm text-right">{Number(log.accumulated_balance_at).toFixed(2)}</td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{log.status_before} → {log.status_after}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
