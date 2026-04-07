import { useState } from "react";
import { useRole } from "@/contexts/RoleContext";
import { AlertTriangle, MessageSquare, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ClientBanners() {
  const { role, clientPaymentStatus, feedbackPending } = useRole();
  const navigate = useNavigate();
  const [paymentDismissed, setPaymentDismissed] = useState(false);
  const [feedbackDismissed, setFeedbackDismissed] = useState(false);

  if (role !== "cliente") return null;

  return (
    <>
      {clientPaymentStatus === "inadimplente" && !paymentDismissed && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium relative">
          <AlertTriangle className="h-4 w-4" />
          Pendente de Pagamento — Regularize para manter o acesso total.
          <button onClick={() => setPaymentDismissed(true)} className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {feedbackPending && !feedbackDismissed && (
        <div className="bg-warning text-warning-foreground px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium relative">
          <MessageSquare className="h-4 w-4" />
          Pendente envio de Feedback Semanal
          <button
            onClick={() => navigate("/feedbacks")}
            className="ml-2 px-3 py-1 rounded-md bg-background/20 hover:bg-background/30 text-xs font-semibold transition-colors"
          >
            Responder agora
          </button>
          <button onClick={() => setFeedbackDismissed(true)} className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
