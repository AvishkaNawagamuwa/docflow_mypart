import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleGuard, RedirectToDashboard } from "@/components/layout/RoleGuard";
import { AIChatbot } from "@/components/chatbot/AIChatbot";
import LoginPage from "./pages/LoginPage";
import StaffDashboard from "./pages/dashboards/StaffDashboard";
import ApproverDashboard from "./pages/dashboards/ApproverDashboard";
import SupervisorDashboard from "./pages/dashboards/SupervisorDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import WorkflowsPage from "./pages/WorkflowsPage";
import WorkflowBuilderPage from "./pages/WorkflowBuilderPage";
import InstancesPage from "./pages/InstancesPage";
import DocumentsPage from "./pages/DocumentsPage";
import DocumentTypesPage from "./pages/DocumentTypesPage";
import RolesUsersPage from "./pages/RolesUsersPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import DashboardTemplatesPage from "./pages/DashboardTemplatesPage";
import DashboardBuilderPage from "./pages/DashboardBuilderPage";
import DashboardPreviewPage from "./pages/DashboardPreviewPage";
import AnalyticsChartsPage from "./pages/AnalyticsChartsPage";
import NotFound from "./pages/NotFound";
import ExternalLoginPage from "./pages/external/ExternalLoginPage";
import ExternalDashboard from "./pages/external/ExternalDashboard";
import ExternalSubmitPage from "./pages/external/ExternalSubmitPage";
import ExternalSubmissionDetail from "./pages/external/ExternalSubmissionDetail";
import UserLoginPage from "./pages/UserLoginPage";
import RoleDashboardPage from "./pages/RoleDashboardPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/userlogin" element={<UserLoginPage />} />
            <Route path="/dashboard/role" element={<RoleDashboardPage />} />
            <Route path="/external/login" element={<ExternalLoginPage />} />

            {/* Redirect root to role dashboard */}
            <Route path="/" element={<RedirectToDashboard />} />

            {/* Role-based dashboards */}
            <Route path="/dashboard/staff" element={<RoleGuard allowedRoles={['staff']}><StaffDashboard /></RoleGuard>} />
            <Route path="/dashboard/approver" element={<RoleGuard allowedRoles={['approver']}><ApproverDashboard /></RoleGuard>} />
            <Route path="/dashboard/supervisor" element={<RoleGuard allowedRoles={['supervisor']}><SupervisorDashboard /></RoleGuard>} />
            <Route path="/dashboard/admin" element={<RoleGuard allowedRoles={['admin']}><AdminDashboard /></RoleGuard>} />

            {/* External Portal */}
            <Route path="/external/dashboard" element={<RoleGuard allowedRoles={['external']}><ExternalDashboard /></RoleGuard>} />
            <Route path="/external/submit" element={<RoleGuard allowedRoles={['external']}><ExternalSubmitPage /></RoleGuard>} />
            <Route path="/external/submissions/:id" element={<RoleGuard allowedRoles={['external']}><ExternalSubmissionDetail /></RoleGuard>} />

            {/* Shared pages */}
            <Route path="/workflows" element={<RoleGuard allowedRoles={['admin', 'supervisor']}><WorkflowsPage /></RoleGuard>} />
            <Route path="/workflows/:id/builder" element={<RoleGuard allowedRoles={['admin']}><WorkflowBuilderPage /></RoleGuard>} />
            <Route path="/instances" element={<RoleGuard allowedRoles={['staff', 'approver', 'supervisor', 'admin']}><InstancesPage /></RoleGuard>} />
            <Route path="/documents" element={<RoleGuard allowedRoles={['staff', 'approver', 'supervisor', 'admin']}><DocumentsPage /></RoleGuard>} />

            {/* Admin only */}
            <Route path="/document-types" element={<RoleGuard allowedRoles={['admin']}><DocumentTypesPage /></RoleGuard>} />
            <Route path="/roles" element={<RoleGuard allowedRoles={['admin']}><RolesUsersPage /></RoleGuard>} />
            <Route path="/notifications" element={<RoleGuard allowedRoles={['admin']}><NotificationsPage /></RoleGuard>} />
            <Route path="/settings" element={<RoleGuard allowedRoles={['admin']}><SettingsPage /></RoleGuard>} />
            <Route path="/dashboard-templates" element={<RoleGuard allowedRoles={['admin']}><DashboardTemplatesPage /></RoleGuard>} />
            <Route path="/analytics-config" element={<RoleGuard allowedRoles={['admin']}><AnalyticsChartsPage /></RoleGuard>} />
            <Route path="/dashboard-builder/:id" element={<RoleGuard allowedRoles={['admin']}><DashboardBuilderPage /></RoleGuard>} />
            <Route path="/dashboard-preview/:id" element={<RoleGuard allowedRoles={['admin']}><DashboardPreviewPage /></RoleGuard>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIChatbot />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
