import { ComingSoon } from "@/components/ComingSoon";
import { Rocket } from "lucide-react";

const Onboarding = () => {
  return (
    <ComingSoon>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" /> Onboarding
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure sua conta passo a passo</p>
        </div>
      </div>
    </ComingSoon>
  );
};

export default Onboarding;
