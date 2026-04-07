import { ComingSoon } from "@/components/ComingSoon";
import { BarChart3 } from "lucide-react";

const Performance = () => {
  return (
    <ComingSoon>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Ranking de Performance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Clientes ordenados por criticidade — Motor de Regras</p>
        </div>
      </div>
    </ComingSoon>
  );
};

export default Performance;
