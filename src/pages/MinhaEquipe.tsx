import { ComingSoon } from "@/components/ComingSoon";
import { Users } from "lucide-react";

const MinhaEquipe = () => {
  return (
    <ComingSoon>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Minha Equipe
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Membros da Zaytan alocados para você</p>
        </div>
      </div>
    </ComingSoon>
  );
};

export default MinhaEquipe;
