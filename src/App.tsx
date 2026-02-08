import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AlgoWatch from "./pages/AlgoWatch";
import KitGenerator from "./pages/KitGenerator";
import KitViewer from "./pages/KitViewer";
import MyKits from "./pages/MyKits";
import Library from "./pages/Library";
import SearchPage from "./pages/SearchPage";
import Report from "./pages/Report";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/algowatch" element={<AlgoWatch />} />
              <Route path="/kit/new" element={<ProtectedRoute><KitGenerator /></ProtectedRoute>} />
              <Route path="/kit/:id" element={<ProtectedRoute><KitViewer /></ProtectedRoute>} />
              <Route path="/me/kits" element={<ProtectedRoute><MyKits /></ProtectedRoute>} />
              <Route path="/library" element={<Library />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
