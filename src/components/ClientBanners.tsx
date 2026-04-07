import { useRole } from "@/contexts/RoleContext";
import { AlertTriangle, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ClientBanners() {
  const { role, clientPaymentStatus, feedbackPending } = useRole();
  const navigate = useNavigate();

  if (role !== "cliente") return null;

  return (
    <>
      {clientPaymentStatus === "inadimplente" && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4" />
          Pendente de Pagamento — Regularize para manter o acesso total.
        </div>
      )}
      {feedbackPending && (
        <div className="bg-warning text-warning-foreground px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium">
          <MessageSquare className="h-4 w-4" />
          Pendente envio de Feedback Semanal
          <button
            onClick={() => navigate("/feedbacks")}
            className="ml-2 px-3 py-1 rounded-md bg-background/20 hover:bg-background/30 text-xs font-semibold transition-colors"
          >
            Responder agora
          </button>
        </div>
      )}
    </>
  );
}
