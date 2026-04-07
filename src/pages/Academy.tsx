import { ComingSoon } from "@/components/ComingSoon";
import { GraduationCap } from "lucide-react";

const Academy = () => {
  return (
    <ComingSoon>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" /> Zaytan Academy
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Trilhas de treinamento e base de conhecimento</p>
        </div>
      </div>
    </ComingSoon>
  );
};

export default Academy;
