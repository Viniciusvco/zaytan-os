import { useState, useRef, useEffect } from "react";
import { Brain, Send, TrendingUp, Users, AlertTriangle, Lightbulb, Bot, User } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const shortcuts = [
  { label: "Analisar lucratividade atual", icon: TrendingUp, prompt: "Analise a lucratividade atual da agência Zaytan considerando MRR de R$42.800, custos operacionais de R$11.100, e margem média de 68%. Quais clientes ou nichos devem receber mais atenção?" },
  { label: "Sugerir melhoria no onboarding", icon: Users, prompt: "Com base no fluxo operacional da Zaytan, sugira melhorias para o processo de onboarding de novos clientes. Considere que temos 2 clientes em onboarding e o tempo médio é de 15 dias." },
  { label: "Prever faturamento do próximo mês", icon: Lightbulb, prompt: "Com base no pipeline atual (R$52.800 total, R$35.200 ponderado), MRR de R$42.800, e 7 deals ativos, projete o faturamento para o próximo mês." },
  { label: "Identificar gargalos na produção", icon: AlertTriangle, prompt: "Identifique possíveis gargalos na produção da Zaytan. Temos 12 tickets abertos, 8 em andamento, taxa de conclusão de 63%, e 1 projeto atrasado. Sugira ações corretivas." },
];

const initialMessages: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "Olá! Sou o **Zaytan Mind**, seu agente estratégico de IA. Tenho visão teórica sobre todos os módulos do sistema — Financeiro, CRM, Pipeline e Operacional.\n\nComo posso ajudar na sua tomada de decisão hoje?",
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
        lucratividade: "📊 **Análise de Lucratividade — Zaytan**\n\n**Resumo Geral:**\n- MRR: R$ 42.800 | Custos: R$ 11.100 | **Lucro: R$ 31.700 (74%)**\n\n**Por Nicho:**\n- 🏆 Advocacia: 72% margem (maior contribuição)\n- 💡 E-commerce: 70% margem (oportunidade de escalar)\n- ⚠️ Serviços: 55% margem (revisar precificação)\n\n**Recomendações:**\n1. Dobrar investimento em captação no nicho de Advocacia\n2. Revisar pricing do nicho Serviços — margem abaixo de 60% é sinal de alerta\n3. Criar case de sucesso com TechShop para atrair mais e-commerce",
        onboarding: "🔄 **Análise de Onboarding — Zaytan**\n\n**Status Atual:**\n- 2 clientes em onboarding (Imobiliária Nova Era e Construtora Horizonte)\n- Tempo médio: 15 dias\n\n**Gargalos Identificados:**\n1. Coleta de acessos demora 5+ dias em 60% dos casos\n2. Briefing incompleto gera retrabalho na criação\n\n**Melhorias Sugeridas:**\n1. Criar formulário automático pós-venda via N8N\n2. Implementar checklist obrigatório com deadline de 48h para acessos\n3. Vídeo de boas-vindas personalizado com Loom\n4. Template de briefing padronizado no Notion",
        faturamento: "📈 **Projeção de Faturamento — Próximo Mês**\n\n**Base de Cálculo:**\n- MRR garantido: R$ 42.800\n- Pipeline ponderado: R$ 35.200\n- Probabilidade de novos fechamentos: 65%\n\n**Cenários:**\n- 🟢 Otimista: R$ 65.680 (+53%)\n- 🟡 Realista: R$ 55.400 (+29%)\n- 🔴 Conservador: R$ 47.200 (+10%)\n\n**Fatores de Risco:**\n- Deal de R$ 15.000 (Construtora) em fase final — alto impacto\n- Churn potencial: Restaurante Sabor & Arte (pausado)",
        gargalos: "⚠️ **Gargalos na Produção — Zaytan**\n\n**Indicadores Críticos:**\n- 12 tickets abertos (acima da média de 8)\n- 1 projeto atrasado (Onboarding Imobiliária Nova Era)\n- Taxa de conclusão: 63% (meta: 80%)\n\n**Diagnóstico:**\n1. **Sobrecarga de equipe**: ratio tickets/pessoa acima de 4:1\n2. **Falta de priorização**: tickets sem SLA definido\n3. **Projeto atrasado**: dependência de acessos do cliente\n\n**Plano de Ação:**\n1. Implementar SLA por tipo de ticket (urgent: 24h, normal: 72h)\n2. Escalar freelancer para absorver pico de demanda\n3. Enviar ultimato de acessos para Imobiliária com deadline de 48h\n4. Reunião diária de 15min para destravar bloqueios",
      };

      let responseContent = "Entendi sua pergunta. Com base nos dados do sistema, vou analisar isso para você.\n\n*Para uma análise completa com dados reais, conecte o Lovable Cloud para habilitar o agente de IA.*";

      const lowerMsg = userMessage.toLowerCase();
      if (lowerMsg.includes("lucratividade") || lowerMsg.includes("lucro") || lowerMsg.includes("margem")) {
        responseContent = responses.lucratividade;
      } else if (lowerMsg.includes("onboarding") || lowerMsg.includes("melhoria")) {
        responseContent = responses.onboarding;
      } else if (lowerMsg.includes("faturamento") || lowerMsg.includes("prever") || lowerMsg.includes("projeção")) {
        responseContent = responses.faturamento;
      } else if (lowerMsg.includes("gargalo") || lowerMsg.includes("produção") || lowerMsg.includes("bloqueio")) {
        responseContent = responses.gargalos;
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
    const userMsg: Message = { id: Date.now().toString(), role: "user", content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
          <Brain className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Zaytan Mind</h1>
          <p className="text-xs text-muted-foreground">Agente Estratégico de IA · Acesso exclusivo para sócios</p>
        </div>
        <div className="ml-auto">
          <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">🔒 Nível: Sócio</span>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {shortcuts.map((s) => (
          <button
            key={s.label}
            onClick={() => sendMessage(s.prompt)}
            disabled={isLoading}
            className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left disabled:opacity-50"
          >
            <s.icon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-medium leading-tight">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-auto rounded-xl border border-border bg-card p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
            />
            {msg.role === "user" && (
              <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="h-3.5 w-3.5 text-primary animate-pulse" />
            </div>
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

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          placeholder="Pergunte ao Zaytan Mind..."
          disabled={isLoading}
          className="flex-1 h-11 px-4 rounded-xl bg-muted border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ZaytanMind;
