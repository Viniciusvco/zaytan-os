import { useState, useRef, useEffect } from "react";
import { Brain, Send, HeadphonesIcon, BarChart3, Lightbulb, Zap, Bot, User } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const shortcuts = [
  { label: "Ajudar com chamado aberto", icon: HeadphonesIcon, prompt: "Tenho um chamado do Escritório Silva sobre 'Leads não chegando no CRM'. Analise o histórico do cliente (contrato ativo de R$4.500/mês, Automação/IA, 6 meses de relacionamento) e sugira uma resposta profissional e solução técnica." },
  { label: "Relatório de performance", icon: BarChart3, prompt: "Gere um relatório de performance da Clínica Bella: 120 leads gerados, 18 vendas, investimento de R$5.600, CPC R$1.47, CPL R$46.67, ROAS 4.2x. Inclua análise e recomendações." },
  { label: "Sugerir otimizações", icon: Lightbulb, prompt: "Com base nos dados de campanhas: Imobiliária Nova Era tem ROAS de 2.1x com CPL de R$137.78, e Construtora Horizonte tem ROAS 1.8x com CPL R$135.71. Sugira otimizações específicas para melhorar o desempenho no nicho imobiliário." },
  { label: "Analisar chamados pendentes", icon: Zap, prompt: "Analise os chamados abertos: 1) Escritório Silva - 'Leads não chegam no CRM' (Crítico), 2) Clínica Bella - 'Sugestão de campanha sazonal' (Saudável). Priorize e sugira ações imediatas." },
];

const initialMessages: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "Olá! Sou o **Zaytan Mind**, seu assistente de IA para suporte e inteligência.\n\nPosso ajudar com:\n- 📋 Sugerir respostas para chamados abertos\n- 📊 Gerar relatórios de performance baseados nos dados de campanhas\n- 💡 Recomendar otimizações para clientes específicos\n- 🔍 Analisar histórico de contratos e produtos\n\nComo posso ajudar?",
    timestamp: new Date(),
  },
];

const ZaytanMind = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const simulateResponse = (userMessage: string) => {
    setIsLoading(true);
    setTimeout(() => {
      const responses: Record<string, string> = {
        chamado: "📋 **Resposta sugerida para o chamado:**\n\nOlá! Identificamos o problema com a integração dos leads no CRM. Trata-se de uma falha no webhook do N8N que perdeu a autenticação.\n\n**Solução técnica:**\n1. Reautenticar o webhook no N8N (endpoint: /api/leads)\n2. Testar o fluxo com um lead de teste\n3. Validar que os campos estão mapeados corretamente\n\n**Status:** Pode ser resolvido em até 2h.\n\n**Histórico do cliente:** Escritório Silva é cliente há 6 meses, MRR R$4.500, contrato de Automação/IA. Prioridade alta por ser cliente premium.",
        performance: "📊 **Relatório de Performance — Clínica Bella**\n\n**Resumo do Período:**\n- 120 leads gerados (+15% vs. mês anterior)\n- 18 vendas convertidas (taxa: 15%)\n- ROAS: 4.2x (excelente)\n\n**Métricas Detalhadas:**\n- CPC: R$ 1.47 (abaixo da média do nicho Saúde)\n- CPL: R$ 46.67 (dentro do esperado)\n- Investimento: R$ 5.600\n\n**Análise:**\n✅ Performance acima da média. O ROAS de 4.2x indica alta eficiência.\n\n**Recomendações:**\n1. Escalar orçamento em 20% mantendo os mesmos criativos\n2. Testar audiência lookalike dos compradores\n3. Criar campanha de remarketing para leads não convertidos",
        otimizacao: "💡 **Otimizações para Nicho Imobiliário**\n\n**Diagnóstico:**\n- Imobiliária Nova Era: ROAS 2.1x / CPL R$ 137.78\n- Construtora Horizonte: ROAS 1.8x / CPL R$ 135.71\n\n**Problemas identificados:**\n1. CPL muito alto — ticket médio do setor exige volume maior\n2. Landing pages podem não estar otimizadas para mobile\n3. Segmentação pode estar muito ampla\n\n**Plano de Ação:**\n1. **Segmentação:** Focar em renda familiar acima de R$ 15k e interesse em imóveis\n2. **Criativos:** Usar vídeos de tours virtuais (CTR 2x maior no setor)\n3. **Landing Page:** Adicionar calculadora de financiamento\n4. **Remarketing:** Implementar fluxo de 7 dias com WhatsApp automático\n\n**Meta:** Reduzir CPL para R$ 80 em 30 dias",
        priorizar: "🔍 **Análise de Chamados Pendentes**\n\n**🔴 Prioridade 1: Escritório Silva**\n- Tipo: Erro Crítico\n- Impacto: Leads perdidos = receita impactada\n- Ação: Corrigir webhook N8N imediatamente (SLA: 4h)\n- Responsável: Equipe técnica\n\n**🟢 Prioridade 2: Clínica Bella**\n- Tipo: Sugestão\n- Impacto: Oportunidade de receita adicional\n- Ação: Agendar call para discutir campanha de Páscoa\n- Prazo: Até sexta-feira\n\n**Recomendação:** Resolver o chamado crítico primeiro. O cliente Silva é premium (R$ 4.500/mês) e leads perdidos geram insatisfação rápida.",
      };

      let responseContent = "Entendi sua pergunta. Analisando os dados do sistema para gerar uma resposta contextualizada.\n\n*Para uma análise completa com dados reais, conecte o Lovable Cloud para habilitar o agente de IA.*";

      const lowerMsg = userMessage.toLowerCase();
      if (lowerMsg.includes("chamado") || lowerMsg.includes("resposta") || lowerMsg.includes("suporte")) {
        responseContent = responses.chamado;
      } else if (lowerMsg.includes("relatório") || lowerMsg.includes("performance") || lowerMsg.includes("report")) {
        responseContent = responses.performance;
      } else if (lowerMsg.includes("otimiz") || lowerMsg.includes("melhor") || lowerMsg.includes("sugest")) {
        responseContent = responses.otimizacao;
      } else if (lowerMsg.includes("prioriz") || lowerMsg.includes("analis") || lowerMsg.includes("pendente")) {
        responseContent = responses.priorizar;
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: responseContent, timestamp: new Date() },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  const sendMessage = (content: string) => {
    if (!content.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content, timestamp: new Date() }]);
    setInput("");
    simulateResponse(content);
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
          <Brain className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Zaytan Mind</h1>
          <p className="text-xs text-muted-foreground">IA de Atendimento & Inteligência · Sócios</p>
        </div>
        <div className="ml-auto">
          <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">🔒 Nível: Sócio</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {shortcuts.map((s) => (
          <button key={s.label} onClick={() => sendMessage(s.prompt)} disabled={isLoading}
            className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left disabled:opacity-50">
            <s.icon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-medium leading-tight">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-border bg-card p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
            {msg.role === "user" && (
              <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-3.5 w-3.5 text-primary animate-pulse" /></div>
            <div className="bg-muted rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          placeholder="Pergunte sobre chamados, performance ou otimizações..."
          disabled={isLoading}
          className="flex-1 h-11 px-4 rounded-xl bg-muted border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" />
        <button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}
          className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ZaytanMind;
