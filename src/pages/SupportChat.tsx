import { ComingSoon } from "@/components/ComingSoon";
import { Bot, Send, MessageCircle, HelpCircle } from "lucide-react";

const mockMessages = [
  { id: 1, from: "bot", text: "Olá! Sou o assistente da Zaytan. Como posso ajudar?" },
  { id: 2, from: "user", text: "Meus leads não estão chegando no CRM" },
  { id: 3, from: "bot", text: "Entendi! Vou verificar a integração do webhook. Enquanto isso, posso abrir uma solicitação para o time técnico?" },
];

const faqItems = [
  "Como acompanho meus resultados?",
  "Como abro uma solicitação?",
  "Quanto tempo leva para minha campanha ir ao ar?",
];

const SupportChat = () => {
  return (
    <ComingSoon>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" /> Suporte
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Tire dúvidas ou abra uma solicitação</p>
        </div>

        {/* FAQ */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" /> Perguntas Frequentes
          </h3>
          <div className="flex flex-wrap gap-2">
            {faqItems.map((q, i) => (
              <div key={i} className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground cursor-default">
                {q}
              </div>
            ))}
          </div>
        </div>

        {/* Chat mockup */}
        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" /> Chat
          </h3>
          <div className="space-y-3 mb-4 max-h-[250px] overflow-y-auto">
            {mockMessages.map(m => (
              <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${
                  m.from === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-9 px-3 rounded-lg bg-muted flex items-center text-sm text-muted-foreground">
              Digite sua mensagem...
            </div>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Send className="h-4 w-4 text-primary" />
            </div>
          </div>
        </div>
      </div>
    </ComingSoon>
  );
};

export default SupportChat;
