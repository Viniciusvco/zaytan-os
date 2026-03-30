import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Produtos from "./pages/Produtos";
import Contratos from "./pages/Contratos";
import Financeiro from "./pages/Financeiro";
import Comercial from "./pages/Comercial";
import CustomerSuccess from "./pages/CustomerSuccess";
import Performance from "./pages/Performance";
import ZaytanMind from "./pages/ZaytanMind";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
                <Route path="/cs" element={<CustomerSuccess />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/zaytan-mind" element={<ZaytanMind />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
