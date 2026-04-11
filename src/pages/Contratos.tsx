import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Megaphone, ListOrdered, Package, ScrollText } from "lucide-react";
import { MonitoringDashboard } from "@/components/motor/MonitoringDashboard";
import { CampaignManager } from "@/components/motor/CampaignManager";
import { LeadQueue } from "@/components/motor/LeadQueue";
import { StockManager } from "@/components/motor/StockManager";
import { AuditLog } from "@/components/motor/AuditLog";

const Contratos = () => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Motor Revisional</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Distribuição automatizada de leads — campanhas, estoque e auditoria
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Campaigns */}
        <div className="lg:col-span-1">
          <CampaignManager
            selectedCampaignId={selectedCampaignId}
            onSelectCampaign={setSelectedCampaignId}
          />
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="monitoramento">
            <TabsList className="mb-4">
              <TabsTrigger value="monitoramento" className="gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" /> Monitoramento
              </TabsTrigger>
              <TabsTrigger value="fila" className="gap-1.5">
                <ListOrdered className="h-3.5 w-3.5" /> Fila de Leads
              </TabsTrigger>
              <TabsTrigger value="estoque" className="gap-1.5">
                <Package className="h-3.5 w-3.5" /> Estoque
              </TabsTrigger>
              <TabsTrigger value="auditoria" className="gap-1.5">
                <ScrollText className="h-3.5 w-3.5" /> Auditoria
              </TabsTrigger>
            </TabsList>

            <TabsContent value="monitoramento">
              <MonitoringDashboard campaignId={selectedCampaignId} />
            </TabsContent>
            <TabsContent value="fila">
              <LeadQueue campaignId={selectedCampaignId} />
            </TabsContent>
            <TabsContent value="estoque">
              <StockManager campaignId={selectedCampaignId} />
            </TabsContent>
            <TabsContent value="auditoria">
              <AuditLog campaignId={selectedCampaignId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Contratos;
