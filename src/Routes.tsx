
import { Routes as RouterRoutes, Route } from "react-router-dom";
import AuthPage from "@/pages/AuthPage";
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
import NotFound from "@/pages/NotFound";
import { AuthProvider } from "@/components/auth/AuthProvider";

const Routes = () => {
  return (
    <RouterRoutes>
      {/* Public routes */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<AuthProvider><Index /></AuthProvider>} />
      
      {/* Protected routes */}
      <Route path="/bookmarks" element={<AuthProvider requireAuth><BookmarksPage /></AuthProvider>} />
      <Route path="/chat" element={<AuthProvider requireAuth><ChatPage /></AuthProvider>} />
      <Route path="/summaries" element={<AuthProvider requireAuth><SummariesPage /></AuthProvider>} />
      <Route path="/analytics" element={<AuthProvider requireAuth><AnalyticsPage /></AuthProvider>} />
      <Route path="/timer" element={<AuthProvider requireAuth><TimerPage /></AuthProvider>} />
      <Route path="/tasks" element={<AuthProvider requireAuth><TaskPage /></AuthProvider>} />
      <Route path="/notes" element={<AuthProvider requireAuth><NotesPage /></AuthProvider>} />
      <Route path="/settings" element={<AuthProvider requireAuth><SettingsPage /></AuthProvider>} />
      <Route path="/subscription" element={<AuthProvider requireAuth><SubscriptionPage /></AuthProvider>} />
      <Route path="/plans" element={<AuthProvider requireAuth><PlansPage /></AuthProvider>} />
      <Route path="/suggested-services" element={<AuthProvider requireAuth><SuggestedServicesPage /></AuthProvider>} />
      <Route path="/user" element={<AuthProvider requireAuth><UserPage /></AuthProvider>} />
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};

export default Routes;
