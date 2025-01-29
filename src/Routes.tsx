import { Routes as RouterRoutes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BookmarksPage from "./pages/BookmarksPage";
import SummariesPage from "./pages/SummariesPage";
import ChatPage from "./pages/ChatPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import TimerPage from "./pages/TimerPage";
import TaskPage from "./pages/TaskPage";
import NotesPage from "./pages/NotesPage";
import SettingsPage from "./pages/SettingsPage";
import PlansPage from "./pages/PlansPage";

const Routes = () => {
  return (
    <RouterRoutes>
      <Route path="/" element={<Index />} />
      <Route path="/bookmarks" element={<BookmarksPage />} />
      <Route path="/summaries" element={<SummariesPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/timer" element={<TimerPage />} />
      <Route path="/tasks" element={<TaskPage />} />
      <Route path="/notes" element={<NotesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/plans" element={<PlansPage />} />
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};

export default Routes;