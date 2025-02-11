
import { Routes as RouterRoutes, Route } from "react-router-dom";
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

const Routes = () => {
  return (
    <RouterRoutes>
      <Route path="/" element={<Index />} />
      <Route path="/plans" element={<PlansPage />} />
      <Route path="/suggested-services" element={<SuggestedServicesPage />} />
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
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};

export default Routes;
