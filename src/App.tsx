import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RoleProvider } from "@/contexts/RoleContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Produtos from "./pages/Produtos";
import Contratos from "./pages/Contratos";
import Financeiro from "./pages/Financeiro";
import Comercial from "./pages/Comercial";
import Performance from "./pages/Performance";
import Demandas from "./pages/Demandas";
import CRM from "./pages/CRM";
import Onboarding from "./pages/Onboarding";
import Equipe from "./pages/Equipe";
import Usuarios from "./pages/Usuarios";
import Academy from "./pages/Academy";
import Feedbacks from "./pages/Feedbacks";
// Configuracoes removed
import SupportChat from "./pages/SupportChat";
import MinhaEquipe from "./pages/MinhaEquipe";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RoleProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/welcome" element={<Landing />} />
            <Route path="/*" element={
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/produtos" element={<Produtos />} />
                  <Route path="/contratos" element={<Contratos />} />
                  <Route path="/financeiro" element={<Financeiro />} />
                  <Route path="/comercial" element={<Comercial />} />
                  <Route path="/performance" element={<Performance />} />
                  <Route path="/demandas" element={<Demandas />} />
                  <Route path="/crm" element={<CRM />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/equipe" element={<Equipe />} />
                  <Route path="/usuarios" element={<Usuarios />} />
                  <Route path="/academy" element={<Academy />} />
                  <Route path="/feedbacks" element={<Feedbacks />} />
                  {/* Configuracoes route removed */}
                  <Route path="/suporte" element={<SupportChat />} />
                  <Route path="/minha-equipe" element={<MinhaEquipe />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            } />
          </Routes>
        </BrowserRouter>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
