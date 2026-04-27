import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LaudoFormData {
  clientName: string;
  cpf: string;
  consultorName: string;
  assessoriaName: string;
  assessoriaCnpj: string;
  financeira: string;
  modeloVeiculo: string;
  valorFinanciado: number;
  numMeses: number;
  valorParcela: number;
  parcelasPagas: number;
  parcelasAtrasadas: number;
  numeroProposta: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadName?: string;
  leadPhone?: string;
  leadEmail?: string;
  leadId?: string;
  clientName?: string;
  /** When provided, saves to laudos_avulsos instead of leads */
  avulsoClientId?: string | null;
  onPdfSaved?: () => void;
  existingLaudoData?: LaudoFormData | null;
}

const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const formatCpfOrCnpj = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits.length <= 11 ? formatCpf(digits) : formatCnpj(digits);
};

const defaultData: LaudoFormData = {
  clientName: "",
  cpf: "",
  consultorName: "",
  assessoriaName: "",
  assessoriaCnpj: "",
  financeira: "",
  modeloVeiculo: "",
  valorFinanciado: 0,
  numMeses: 0,
  valorParcela: 0,
  parcelasPagas: 0,
  parcelasAtrasadas: 0,
  numeroProposta: 0,
};

export function LaudoGenerator({ open, onOpenChange, leadName, leadPhone, leadEmail, leadId, clientName, avulsoClientId, onPdfSaved, existingLaudoData }: Props) {
  const [data, setData] = useState<LaudoFormData>({ ...defaultData });
  const [generating, setGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const isAvulso = avulsoClientId !== undefined;

  useEffect(() => {
    if (!open) return;
    // Pré-carrega html2pdf assim que abrir (paraleliza com preenchimento do form)
    import("html2pdf.js").catch(() => {});
    if (existingLaudoData) {
      setData(existingLaudoData);
    } else {
      setData({
        ...defaultData,
        clientName: leadName || "",
        assessoriaName: clientName || "",
      });
    }
  }, [open, existingLaudoData, leadName, clientName]);

  const set = (field: keyof LaudoFormData, value: string | number) =>
    setData(prev => ({ ...prev, [field]: value }));

  // Auto-calculated "Financiamento Corrigido" values
  const mesesRestantes = Math.max(0, data.numMeses - data.parcelasPagas);
  const novoValorParcela = data.valorParcela * 0.70;
  const reducaoMensal = data.valorParcela - novoValorParcela;
  const estornoPrevisto = reducaoMensal * data.parcelasPagas;
  const reducaoFutura = reducaoMensal * mesesRestantes;
  const reducaoTotal = estornoPrevisto + reducaoFutura;

  const now = new Date();
  const dataGeracao = now.toLocaleString("pt-BR");
  const validade = new Date(now.getTime() + 4 * 60 * 60 * 1000).toLocaleString("pt-BR");

  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const exportPDF = async () => {
    if (!printRef.current) return;
    setGenerating(true);
    const t0 = performance.now();
    try {
      // Get next proposal number if not already set
      let proposalNum = data.numeroProposta;
      if (!proposalNum) {
        const { data: seqData, error: seqErr } = await supabase.rpc("nextval_proposal" as any);
        if (seqErr) {
          proposalNum = 18392 + Math.floor(Math.random() * 1000);
        } else {
          proposalNum = Number(seqData);
        }
        setData(prev => ({ ...prev, numeroProposta: proposalNum }));
      }

      const laudoToSave: LaudoFormData = { ...data, numeroProposta: proposalNum };

      const html2pdf = (await import("html2pdf.js")).default;
      const pdfBlob: Blob = await html2pdf()
        .set({
          margin: [10, 12, 10, 12],
          filename: `laudo-${data.clientName || "cliente"}-${now.toISOString().split("T")[0]}.pdf`,
          image: { type: "jpeg", quality: 0.92 },
          // scale 1.5 reduz tempo de renderização ~40% mantendo legibilidade
          html2canvas: { scale: 1.5, useCORS: true, width: 794, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait", compress: true },
        })
        .from(printRef.current)
        .outputPdf("blob");

      console.log(`[Laudo] PDF gerado em ${Math.round(performance.now() - t0)}ms`);

      // 1) Download local IMEDIATO — usuário já tem o arquivo
      const downloadName = `laudo-${data.clientName || "cliente"}-${now.toISOString().split("T")[0]}.pdf`;
      const localUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = localUrl;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(localUrl), 5000);

      // 2) Mostra feedback imediato e fecha o dialog
      toast.success("Laudo gerado! Salvando no histórico...");
      setGenerating(false);
      onPdfSaved?.();

      // 3) Upload + insert em background (não bloqueia UI)
      const filePrefix = leadId ?? avulsoClientId ?? "anon";
      const fileName = `${filePrefix}/${Date.now()}.pdf`;
      (async () => {
        try {
          const { error: uploadError } = await supabase.storage
            .from("laudos")
            .upload(fileName, pdfBlob, { contentType: "application/pdf", upsert: true });

          let pdfUrl: string | null = null;
          if (uploadError) {
            console.error("Upload error", uploadError);
          } else {
            const { data: urlData } = supabase.storage.from("laudos").getPublicUrl(fileName);
            pdfUrl = urlData?.publicUrl || null;
          }

          if (isAvulso) {
            const { data: authData } = await supabase.auth.getUser();
            const { error: insertErr } = await supabase.from("laudos_avulsos").insert({
              client_id: avulsoClientId,
              client_name: laudoToSave.clientName,
              cpf: laudoToSave.cpf || null,
              consultor_name: laudoToSave.consultorName || null,
              assessoria_name: laudoToSave.assessoriaName || null,
              numero_proposta: laudoToSave.numeroProposta || null,
              laudo_data: { ...laudoToSave, pdf_path: fileName } as any,
              pdf_url: pdfUrl,
              created_by: authData?.user?.id ?? null,
            });
            if (insertErr) {
              console.error("Insert laudo error", insertErr);
              toast.error("PDF gerado, mas falhou ao salvar no histórico");
            } else {
              toast.success("Histórico atualizado");
              onPdfSaved?.();
            }
          } else if (leadId) {
            await supabase.from("leads").update({
              laudo_pdf_url: pdfUrl,
              laudo_data: laudoToSave as any,
            } as any).eq("id", leadId);
            onPdfSaved?.();
          }
        } catch (bgErr) {
          console.error("Background save error", bgErr);
          toast.error("PDF baixado, mas falhou ao salvar online");
        }
      })();
    } catch (e) {
      console.error("PDF error", e);
      toast.error("Erro ao gerar PDF");
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> {existingLaudoData ? "Visualizar / Regerar Laudo" : "Gerador de Laudo / Ficha Técnica"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header fields */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Nome do Cliente *</label>
              <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={data.clientName} onChange={e => set("clientName", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">CPF/CNPJ</label>
              <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="000.000.000-00 ou 00.000.000/0000-00" value={data.cpf} onChange={e => set("cpf", formatCpfOrCnpj(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Consultor</label>
              <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.consultorName} onChange={e => set("consultorName", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Nome da Assessoria</label>
              <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.assessoriaName} onChange={e => set("assessoriaName", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">CNPJ da Assessoria</label>
              <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="00.000.000/0000-00" value={data.assessoriaCnpj} onChange={e => set("assessoriaCnpj", formatCnpj(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Financiamento Atual - user fills */}
            <div className="border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-destructive">Financiamento Atual</h3>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Financeira (Instituição)</label>
                <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.financeira} onChange={e => set("financeira", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Modelo do Contrato</label>
                <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.modeloVeiculo} onChange={e => set("modeloVeiculo", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Valor Financiado (R$)</label>
                <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.valorFinanciado || ""} onChange={e => set("valorFinanciado", Number(e.target.value))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Nº de Meses (Total)</label>
                  <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.numMeses || ""} onChange={e => set("numMeses", Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Valor Parcela (R$)</label>
                  <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.valorParcela || ""} onChange={e => set("valorParcela", Number(e.target.value))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Parcelas Pagas</label>
                  <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.parcelasPagas || ""} onChange={e => set("parcelasPagas", Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Parcelas Atrasadas</label>
                  <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={data.parcelasAtrasadas || ""} onChange={e => set("parcelasAtrasadas", Number(e.target.value))} />
                </div>
              </div>
            </div>

            {/* Financiamento Corrigido - auto-calculated, read-only */}
            <div className="border rounded-xl p-4 space-y-3 bg-muted/30">
              <h3 className="text-sm font-bold text-green-600 flex items-center gap-2">
                Financiamento Corrigido
                <span className="text-[10px] font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-green-500/10 text-green-700">
                  atualiza em tempo real
                </span>
              </h3>

              <div className="bg-card rounded-lg p-3 space-y-2 border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nº da Proposta:</span>
                  <span className="font-bold">{data.numeroProposta || "Auto (ao exportar)"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-bold text-green-600">APROVADO</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor Financiado:</span>
                  <span className="font-bold">R$ {fmt(data.valorFinanciado)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Parcela Atual:</span>
                  <span className="font-bold">R$ {fmt(data.valorParcela)}</span>
                </div>
                <div className="flex justify-between text-sm transition-colors">
                  <span className="text-muted-foreground">Novo Valor Parcela <span className="text-[10px]">(-30%)</span>:</span>
                  <span className="font-bold text-green-600">R$ {fmt(novoValorParcela)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Redução Mensal:</span>
                  <span className="font-bold text-green-600">R$ {fmt(reducaoMensal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estorno Previsto <span className="text-[10px]">({data.parcelasPagas || 0} pagas)</span>:</span>
                  <span className="font-bold">R$ {fmt(estornoPrevisto)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Redução Futura <span className="text-[10px]">({mesesRestantes} meses)</span>:</span>
                  <span className="font-bold">R$ {fmt(reducaoFutura)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Meses Restantes:</span>
                  <span className="font-bold">{mesesRestantes}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2 mt-1">
                  <span className="text-sm font-semibold">Economia Total:</span>
                  <span className="font-bold text-green-600 text-xl">R$ {fmt(reducaoTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
            <Button onClick={exportPDF} disabled={generating || !data.clientName}>
              <Download className="h-4 w-4 mr-1" /> {generating ? "Gerando..." : "Exportar PDF"}
            </Button>
          </div>
        </div>

        {/* Hidden PDF content */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={printRef} style={{ width: "770px", maxWidth: "770px", fontFamily: "'Segoe UI', Arial, sans-serif", color: "#1a1a1a", background: "#fff", padding: "30px 35px", boxSizing: "border-box" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #FF6E27", paddingBottom: "12px", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#FF6E27", letterSpacing: "-0.5px" }}>{data.assessoriaName || "Assessoria"}</div>
                {data.assessoriaCnpj && <div style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>CNPJ: {data.assessoriaCnpj}</div>}
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "15px", fontWeight: 700 }}>{data.clientName}</div>
                <div style={{ fontSize: "11px", color: "#666" }}>CPF/CNPJ: {data.cpf || "—"}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: "10px", color: "#666" }}>
                {data.consultorName && <div>Consultor: {data.consultorName}</div>}
              </div>
            </div>

            {/* Title */}
            <div style={{ textAlign: "center", marginBottom: "18px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "2px" }}>Laudo Técnico de Revisão Contratual</div>
              <div style={{ fontSize: "9px", color: "#888", marginTop: "4px" }}>Gerado em: {dataGeracao} | Válido até: {validade}</div>
            </div>

            {/* Two columns */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "18px" }}>
              <div style={{ flex: 1, border: "1px solid #e5e5e5", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ background: "#dc2626", color: "#fff", padding: "8px 14px", fontSize: "12px", fontWeight: 700 }}>FINANCIAMENTO ATUAL</div>
                <div style={{ padding: "12px 14px" }}>
                  {[
                    ["Financeira", data.financeira],
                    ["Modelo do Contrato", data.modeloVeiculo],
                    ["Valor Financiado", `R$ ${fmt(data.valorFinanciado)}`],
                    ["Nº de Meses (Total)", data.numMeses],
                    ["Valor da Parcela", `R$ ${fmt(data.valorParcela)}`],
                    ["Parcelas Pagas", data.parcelasPagas],
                    ["Parcelas Atrasadas", data.parcelasAtrasadas],
                  ].map(([label, val], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 6 ? "1px solid #f0f0f0" : "none", fontSize: "11px" }}>
                      <span style={{ color: "#666" }}>{label}</span>
                      <span style={{ fontWeight: 600 }}>{val || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, border: "1px solid #e5e5e5", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ background: "#16a34a", color: "#fff", padding: "8px 14px", fontSize: "12px", fontWeight: 700 }}>FINANCIAMENTO CORRIGIDO</div>
                <div style={{ padding: "12px 14px" }}>
                  {[
                    ["Nº Proposta", data.numeroProposta || "—"],
                    ["Status", "APROVADO"],
                    ["Novo Valor Parcela", `R$ ${fmt(novoValorParcela)}`],
                    ["Redução Mensal", `R$ ${fmt(reducaoMensal)}`],
                    ["Estorno Previsto", `R$ ${fmt(estornoPrevisto)}`],
                    ["Redução Total", `R$ ${fmt(reducaoTotal)}`],
                  ].map(([label, val], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 5 ? "1px solid #f0f0f0" : "none", fontSize: "11px" }}>
                      <span style={{ color: "#666" }}>{label}</span>
                      <span style={{ fontWeight: 700, color: i >= 2 ? "#16a34a" : "#1a1a1a" }}>{val || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Enquadramento */}
            <div style={{ border: "1px solid #e5e5e5", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#FF6E27" }}>Enquadramento de Irregularidade Possível</div>
              <p style={{ fontSize: "10px", color: "#444", lineHeight: "1.6" }}>
                A presente análise fundamenta-se na <strong>Resolução 3919 do BACEN/CMN</strong> e nos <strong>artigos 39, 45 e 51 do Código de Defesa do Consumidor (CDC)</strong>,
                referente a cobranças abusivas de <strong>Seguro Prestamista</strong>, <strong>Tarifa de Avaliação</strong> e <strong>Taxa de Cadastro</strong>,
                que podem ter sido inseridas de forma irregular no contrato de financiamento do cliente.
              </p>
            </div>

            {/* Footer legal */}
            <div style={{ background: "#f8f8f8", border: "1px solid #e5e5e5", borderRadius: "10px", padding: "14px" }}>
              <p style={{ fontSize: "9px", color: "#666", lineHeight: "1.6", textAlign: "center" }}>
                <strong>Fundamentação Legal:</strong> Artigo 51 da Lei nº 8.078 de 11 de Setembro de 1990 (Código de Defesa do Consumidor).
                "Requisição de diminuição de parcelas e quitação de dívidas sobre juros abusivos."
              </p>
              <p style={{ fontSize: "8px", color: "#999", textAlign: "center", marginTop: "6px" }}>
                Este documento possui validade de 4 horas a partir de sua geração. Após este período, uma nova análise deve ser solicitada.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
