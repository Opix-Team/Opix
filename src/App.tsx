import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ApiKeys from "./pages/ApiKeys";
import Authorizations from "./pages/Authorizations";
import Events from "./pages/Events";
import Invites from "./pages/Invites";
import Connect from "./pages/Connect";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="/dashboard" element={<Navigate to="/dashboard/api-keys" replace />} />
            <Route path="/dashboard/api-keys" element={<ProtectedRoute><ApiKeys /></ProtectedRoute>} />
            <Route path="/dashboard/authorizations" element={<ProtectedRoute><Authorizations /></ProtectedRoute>} />
            <Route path="/dashboard/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
            <Route path="/dashboard/invites" element={<ProtectedRoute><Invites /></ProtectedRoute>} />
            {/* Removed the broken /dashboard/api route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
