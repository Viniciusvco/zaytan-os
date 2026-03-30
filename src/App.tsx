import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Pipeline from "./pages/Pipeline";
import Clientes from "./pages/Clientes";
import Projetos from "./pages/Projetos";
import Financeiro from "./pages/Financeiro";
import Estrategia from "./pages/Estrategia";
import Comercial from "./pages/Comercial";
import ZaytanMind from "./pages/ZaytanMind";
import Operacional from "./pages/Operacional";
import CustomerSuccess from "./pages/CustomerSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/projetos" element={<Projetos />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/estrategia" element={<Estrategia />} />
            <Route path="/comercial" element={<Comercial />} />
            <Route path="/zaytan-mind" element={<ZaytanMind />} />
            <Route path="/operacional" element={<Operacional />} />
            <Route path="/cs" element={<CustomerSuccess />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
