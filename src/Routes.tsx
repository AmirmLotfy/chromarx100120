import { Routes as RouterRoutes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BookmarksPage from "./pages/BookmarksPage";
import SummariesPage from "./pages/SummariesPage";
import ChatPage from "./pages/ChatPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import TimerPage from "./pages/TimerPage";

const Routes = () => {
  return (
    <RouterRoutes>
      <Route path="/" element={<Index />} />
      <Route path="/bookmarks" element={<BookmarksPage />} />
      <Route path="/summaries" element={<SummariesPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/timer" element={<TimerPage />} />
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};

export default Routes;