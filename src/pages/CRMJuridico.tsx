import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { Scale, FileText, User, Phone, Mail, ExternalLink, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useKanbanDnD } from "@/hooks/use-kanban-dnd";
import { toast } from "sonner";

type JuridicoStatus = "analise_documentacao" | "protocolo_administrativo" | "ajuizado" | "concluido";

const columns: { key: JuridicoStatus; label: string; color: string }[] = [
  { key: "analise_documentacao", label: "Análise de Documentação", color: "info" },
  { key: "protocolo_administrativo", label: "Protocolo Administrativo", color: "warning" },
  { key: "ajuizado", label: "Ajuizado", color: "chart-3" },
  { key: "concluido", label: "Concluído", color: "success" },
];

const CRMJuridico = () => {
  const { role } = useRole();
  const qc = useQueryClient();
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [clientFilter, setClientFilter] = useState("all");

  const { data: cards = [] } = useQuery({
    queryKey: ["juridico-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("juridico_cards")
        .select("*, leads(name, phone, email, value, seller_tag, laudo_pdf_url, laudo_data, clients(name)), clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: JuridicoStatus }) => {
      const { error } = await supabase.from("juridico_cards").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["juridico-cards"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase.from("juridico_cards").update({ notes }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["juridico-cards"] }); toast.success("Notas atualizadas"); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleDnDMove = useCallback((id: string, newStatus: JuridicoStatus) => {
    const card = cards.find((c: any) => c.id === id);
    if (!card || card.status === newStatus) return;
    updateStatus.mutate({ id, status: newStatus });
  }, [cards]);

  const { draggedId, dragOverCol, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } = useKanbanDnD<JuridicoStatus>(handleDnDMove);

  const filteredCards = cards.filter((c: any) => clientFilter === "all" || c.client_id === clientFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            CRM Jurídico
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhamento pós-venda jurídico</p>
        </div>
        {role === "admin" && (
          <select className="h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="all">Todos os clientes</option>
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {columns.map(col => {
          const count = filteredCards.filter((c: any) => c.status === col.key).length;
          return (
            <div key={col.key} className="metric-card">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{col.label}</p>
            </div>
          );
        })}
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const colCards = filteredCards.filter((c: any) => c.status === col.key);
          return (
            <div
              key={col.key}
              className={`flex-1 min-w-[260px] bg-muted/30 rounded-xl p-3 transition-colors ${dragOverCol === col.key ? "ring-2 ring-primary/50 bg-primary/5" : ""}`}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full bg-${col.color}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider">{col.label}</span>
                </div>
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-medium">{colCards.length}</span>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {colCards.map((card: any) => {
                  const lead = card.leads;
                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedCard(card)}
                      className={`bg-card border border-border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all ${draggedId === card.id ? "opacity-30" : ""}`}
                    >
                      <p className="text-sm font-medium truncate">{lead?.name || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">{lead?.clients?.name || card.clients?.name || "—"}</p>
                      {lead?.seller_tag && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded mt-1 inline-block">{lead.seller_tag}</span>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {lead?.laudo_pdf_url && (
                          <a href={lead.laudo_pdf_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-success flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                            <FileText className="h-3 w-3" /> Laudo
                          </a>
                        )}
                        {card.contrato_url && (
                          <a href={card.contrato_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-info flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                            <FileText className="h-3 w-3" /> Contrato
                          </a>
                        )}
                      </div>
                      {lead?.value && (
                        <p className="text-xs font-semibold text-success mt-1">R$ {Number(lead.value).toLocaleString()}</p>
                      )}
                    </div>
                  );
                })}
                {colCards.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">Nenhum card</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              {selectedCard?.leads?.name || "Detalhes"}
            </DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">Cliente</span><p className="font-medium">{selectedCard.leads?.clients?.name || selectedCard.clients?.name || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Vendedor</span><p className="font-medium">{selectedCard.leads?.seller_tag || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Telefone</span><p>{selectedCard.leads?.phone || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Email</span><p>{selectedCard.leads?.email || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Valor da Venda</span><p className="font-semibold text-success">R$ {Number(selectedCard.leads?.value || 0).toLocaleString()}</p></div>
                <div><span className="text-muted-foreground text-xs">Status</span>
                  <select className="h-8 px-2 rounded bg-muted border-0 text-sm mt-1" value={selectedCard.status}
                    onChange={e => { updateStatus.mutate({ id: selectedCard.id, status: e.target.value as JuridicoStatus }); setSelectedCard({ ...selectedCard, status: e.target.value }); }}>
                    {columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedCard.leads?.laudo_pdf_url && (
                  <a href={selectedCard.leads.laudo_pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs bg-success/10 text-success px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Ver Laudo
                  </a>
                )}
                {selectedCard.contrato_url && (
                  <a href={selectedCard.contrato_url} target="_blank" rel="noopener noreferrer" className="text-xs bg-info/10 text-info px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Ver Contrato
                  </a>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Notas Jurídicas</label>
                <textarea
                  className="w-full h-20 px-3 py-2 rounded-lg bg-muted border-0 text-sm mt-1 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={selectedCard.notes || ""}
                  onChange={e => setSelectedCard({ ...selectedCard, notes: e.target.value })}
                />
                <Button size="sm" className="mt-2" onClick={() => updateNotes.mutate({ id: selectedCard.id, notes: selectedCard.notes || "" })}>
                  Salvar Notas
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRMJuridico;
