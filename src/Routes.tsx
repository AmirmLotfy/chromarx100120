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
import ProtectedRoute from "./components/auth/ProtectedRoute";

const Routes = () => {
  return (
    <RouterRoutes>
      <Route path="/" element={<Index />} />
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
        path="/plans"
        element={
          <ProtectedRoute>
            <PlansPage />
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
        path="/suggested-services"
        element={
          <ProtectedRoute>
            <SuggestedServicesPage />
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
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};

export default Routes;