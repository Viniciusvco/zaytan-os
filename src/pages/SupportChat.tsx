import { ComingSoon } from "@/components/ComingSoon";
import { Bot } from "lucide-react";

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
      </div>
    </ComingSoon>
  );
};

export default SupportChat;
