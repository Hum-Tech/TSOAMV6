import React from "react";
import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { offlineService } from "./services/OfflineService";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Dashboard from "./pages/DashboardNew";
import MemberManagement from "./pages/MemberManagement";
import NewMembers from "./pages/NewMembers";

import HR from "./pages/HR";
import FinanceAdvanced from "./pages/FinanceAdvanced";
import Messaging from "./pages/Messaging";
import Appointments from "./pages/Appointments";
import Events from "./pages/Events";
import Settings from "./pages/Settings";
import SystemLogs from "./pages/SystemLogs";
import Users from "./pages/Users";
import WelfareEnhanced from "./pages/WelfareEnhanced";
import Inventory from "./pages/Inventory";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Initialize offline service safely
try {
  offlineService.loadOfflineQueue();
} catch (error) {
  console.warn("Offline service initialization failed:", error);
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/members"
                element={
                  <ProtectedRoute
                    allowedRoles={["Admin", "HR Officer", "User"]}
                  >
                    <MemberManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/new-members"
                element={
                  <ProtectedRoute
                    allowedRoles={["Admin", "HR Officer", "User"]}
                  >
                    <NewMembers />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/hr"
                element={
                  <ProtectedRoute allowedRoles={["Admin", "HR Officer"]}>
                    <HR />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance"
                element={
                  <ProtectedRoute allowedRoles={["Admin", "Finance Officer"]}>
                    <FinanceAdvanced />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messaging"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "Admin",
                      "HR Officer",
                      "Finance Officer",
                      "User",
                    ]}
                  >
                    <Messaging />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/welfare"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "Admin",
                      "HR Officer",
                      "Finance Officer",
                      "User",
                    ]}
                  >
                    <WelfareEnhanced />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute allowedRoles={["Admin"]}>
                    <Inventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute
                    allowedRoles={["Admin", "HR Officer", "Finance Officer"]}
                  >
                    <Appointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "Admin",
                      "HR Officer",
                      "Finance Officer",
                      "User",
                    ]}
                  >
                    <Events />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "Admin",
                      "HR Officer",
                      "Finance Officer",
                      "User",
                    ]}
                  >
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system-logs"
                element={
                  <ProtectedRoute allowedRoles={["Admin", "HR Officer"]}>
                    <SystemLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={["Admin"]}>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "Admin",
                      "HR Officer",
                      "Finance Officer",
                      "User",
                    ]}
                  >
                    <Profile />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

createRoot(document.getElementById("root")!).render(<App />);
