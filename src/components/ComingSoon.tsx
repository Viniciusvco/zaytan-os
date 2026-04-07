import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";

export function ComingSoon({ children }: { children: React.ReactNode }) {
  const [showPopup, setShowPopup] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const handleClose = () => {
    setShowPopup(false);
    setDismissed(true);
  };

  return (
    <>
      <Dialog open={showPopup} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <Construction className="h-5 w-5 text-warning" />
              Em breve!
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Etapa em Desenvolvimento</p>
          <Button onClick={handleClose} className="mt-2">Entendi</Button>
        </DialogContent>
      </Dialog>

      {dismissed && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm font-medium text-warning flex items-center gap-2">
          <Construction className="h-4 w-4 shrink-0" />
          Em breve! Etapa em Desenvolvimento
        </div>
      )}
      {children}
    </>
  );
}
