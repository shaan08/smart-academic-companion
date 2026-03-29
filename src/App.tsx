import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AiAssistant from "./pages/AiAssistant";
import CareerPlanning from "./pages/CareerPlanning";
import Auth from "./pages/Auth";
import CollaborationHub from "./pages/CollaborationHub";
import CodingRoom from "./pages/CodingRoom";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/ai-assistant" element={<AiAssistant />} />
          <Route path="/career-planning" element={<CareerPlanning />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/collaboration" element={<CollaborationHub />} />
          <Route path="/collaboration/:roomId" element={<CodingRoom />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
