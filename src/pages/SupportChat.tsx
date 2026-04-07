import { useState } from "react";
import { Send, Bot, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
}

const faq: Record<string, string> = {
  "como abrir solicitação": "Para abrir uma solicitação, vá em Demandas no menu lateral e clique em '+ Nova Demanda'. Preencha o título, descrição e prioridade.",
  "como usar o crm": "No CRM você pode acompanhar seus leads. Cada lead passa por etapas: Entrou → Contato → Proposta → Fechado. Clique em um lead para ver detalhes.",
  "como usar o dashboard": "O Dashboard exibe suas métricas principais: Leads Gerados, CPL e Cliques, além de gráficos de evolução semanal.",
  "como enviar feedback": "Acesse Feedbacks no menu lateral. Avalie de 0 a 5 a Qualidade e Quantidade dos Leads, e envie seu comentário.",
  "prazo de entrega": "O prazo padrão de entrega é de 3 dias úteis. Demandas urgentes podem ser sinalizadas com prioridade alta.",
  "horário de atendimento": "Nosso atendimento funciona de segunda a sexta, das 9h às 18h.",
};

function findAnswer(input: string): string | null {
  const lower = input.toLowerCase();
  for (const [key, answer] of Object.entries(faq)) {
    if (lower.includes(key) || key.split(" ").every(w => lower.includes(w))) {
      return answer;
    }
  }
  return null;
}

const SupportChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { id: "0", role: "bot", text: "Olá! 👋 Sou o assistente Zaytan. Como posso ajudar? Posso tirar dúvidas sobre o sistema ou direcionar para abrir uma solicitação." },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);

    const answer = findAnswer(input);
    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "bot",
      text: answer || "Não encontrei uma resposta para isso. Gostaria de abrir uma solicitação para nosso time? Acesse a página de Demandas para enviar seu pedido.",
    };
    setTimeout(() => setMessages(prev => [...prev, botMsg]), 500);
    setInput("");
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" /> Suporte
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Tire dúvidas ou abra uma solicitação</p>
      </div>

      <div className="metric-card flex flex-col h-[500px]">
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.map(m => (
            <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "bot" && (
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                {m.text}
              </div>
              {m.role === "user" && (
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={() => navigate("/demandas")}
            className="h-9 px-3 rounded-lg bg-muted text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
          >
            <ArrowRight className="h-3.5 w-3.5" /> Abrir Solicitação
          </button>
          <input
            className="flex-1 h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Digite sua dúvida..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
          />
          <Button size="sm" onClick={handleSend}><Send className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </div>
  );
};

export default SupportChat;
