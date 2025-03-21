
import { Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
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
import HelpPage from "@/pages/HelpPage";
import NotificationsPage from "@/pages/NotificationsPage";
import CollectionsPage from "@/pages/CollectionsPage";
import ExportImportPage from "@/pages/ExportImportPage";
import IntegrationsPage from "@/pages/IntegrationsPage";

console.log("Routes being loaded, make sure TimerPage is defined");

const Routes = () => {
  // Add debug logging
  console.log("Rendering Routes component");
  
  return (
    <RouterRoutes>
      <Route path="/" element={<Index />} />
      <Route path="/plans" element={<PlansPage />} />
      <Route path="/suggested-services" element={<SuggestedServicesPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/bookmarks" element={<BookmarksPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/summaries" element={<SummariesPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/timer" element={<TimerPage />} />
      <Route path="/tasks" element={<TaskPage />} />
      <Route path="/notes" element={<NotesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/subscription" element={<SubscriptionPage />} />
      <Route path="/user" element={<UserPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/collections" element={<CollectionsPage />} />
      <Route path="/export-import" element={<ExportImportPage />} />
      <Route path="/integrations" element={<IntegrationsPage />} />
      
      {/* Add a fallback route to handle any incorrect paths */}
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};

export default Routes;
