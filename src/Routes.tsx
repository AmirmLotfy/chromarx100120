
import { Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Index from "@/pages/Index";
import BookmarksPage from "@/pages/BookmarksPage";
import ChatPage from "@/pages/ChatPage";
import SummariesPage from "@/pages/SummariesPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import TimerPage from "@/pages/TimerPage";
import TaskPage from "@/pages/TaskPage";
import NotesPage from "@/pages/NotesPage";
import SettingsPage from "@/pages/SettingsPage";
import PlansPage from "@/pages/PlansPage";
import SubscriptionPage from "@/pages/SubscriptionPage";
import SuggestedServicesPage from "@/pages/SuggestedServicesPage";
import UserPage from "@/pages/UserPage";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import HelpPage from "@/pages/HelpPage";
import NotificationsPage from "@/pages/NotificationsPage";
import CollectionsPage from "@/pages/CollectionsPage";
import ExportImportPage from "@/pages/ExportImportPage";
import IntegrationsPage from "@/pages/IntegrationsPage";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    // Show a minimal loading state while checking auth
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const Routes = () => {
  return (
    <RouterRoutes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/plans" element={<PlansPage />} />
      <Route path="/suggested-services" element={<SuggestedServicesPage />} />
      <Route path="/help" element={<HelpPage />} />
      
      {/* Protected routes */}
      <Route 
        path="/bookmarks" 
        element={
          <ProtectedRoute>
            <BookmarksPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chat" 
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/summaries" 
        element={
          <ProtectedRoute>
            <SummariesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/timer" 
        element={
          <ProtectedRoute>
            <TimerPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tasks" 
        element={
          <ProtectedRoute>
            <TaskPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/notes" 
        element={
          <ProtectedRoute>
            <NotesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/subscription" 
        element={
          <ProtectedRoute>
            <SubscriptionPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/user" 
        element={
          <ProtectedRoute>
            <UserPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/notifications" 
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/collections" 
        element={
          <ProtectedRoute>
            <CollectionsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/export-import" 
        element={
          <ProtectedRoute>
            <ExportImportPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/integrations" 
        element={
          <ProtectedRoute>
            <IntegrationsPage />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};

export default Routes;
