import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SpaceProvider } from "@/contexts/SpaceContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import AvatarSelect from "./pages/AvatarSelect";
import Dashboard from "./pages/Dashboard";
import Arena from "./pages/Arena";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SpaceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/api/v1/signin" replace />} />
              <Route path="/api/v1/signin" element={<Signin />} />
              <Route path="/api/v1/signup" element={<Signup />} />
              <Route
                path="/api/v1/avatar-select"
                element={
                  <ProtectedRoute>
                    <AvatarSelect />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/api/v1/dashboard"
                element={
                  <ProtectedRoute requireAvatar>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/arena/:spaceId"
                element={
                  <ProtectedRoute requireAvatar>
                    <Arena />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SpaceProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
