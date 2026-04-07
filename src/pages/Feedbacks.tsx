import { ComingSoon } from "@/components/ComingSoon";
import { MessageSquare } from "lucide-react";

const Feedbacks = () => {
  return (
    <ComingSoon>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" /> Feedbacks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Avalie a qualidade e quantidade dos seus leads</p>
        </div>
      </div>
    </ComingSoon>
  );
};

export default Feedbacks;
