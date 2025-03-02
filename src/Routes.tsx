
import {
  createBrowserRouter,
  RouterProvider,
  RouteObject,
} from "react-router-dom";
import BookmarksPage from "./pages/BookmarksPage";
import NotesPage from "./pages/NotesPage";
import SettingsPage from "./pages/SettingsPage";
import ChatPage from "./pages/ChatPage";
import AuthWrapper from "@/components/AuthWrapper";
import SubscriptionPage from "./pages/SubscriptionPage";
import SubscriptionSuccessPage from "./pages/SubscriptionSuccessPage";
import TaskPage from "./pages/TaskPage"; // Corrected import
import UserPage from "./pages/UserPage"; // Using UserPage as HomePage equivalent
import AuthPage from "./pages/AuthPage"; // Using AuthPage as LoginPage equivalent

const routeConfig: RouteObject[] = [
  {
    path: "/",
    element: (
      <AuthWrapper>
        <UserPage />
      </AuthWrapper>
    ),
  },
  {
    path: "/bookmarks",
    element: (
      <AuthWrapper>
        <BookmarksPage />
      </AuthWrapper>
    ),
  },
  {
    path: "/tasks",
    element: (
      <AuthWrapper>
        <TaskPage />
      </AuthWrapper>
    ),
  },
  {
    path: "/notes",
    element: (
      <AuthWrapper>
        <NotesPage />
      </AuthWrapper>
    ),
  },
  {
    path: "/settings",
    element: (
      <AuthWrapper>
        <SettingsPage />
      </AuthWrapper>
    ),
  },
  {
    path: "/chat",
    element: (
      <AuthWrapper>
        <ChatPage />
      </AuthWrapper>
    ),
  },
  {
    path: "/login",
    element: <AuthPage />,
  },
  {
    path: "/subscription",
    element: <SubscriptionPage />,
  },
  {
    path: "/subscription/success",
    element: <SubscriptionSuccessPage />,
  },
];

const router = createBrowserRouter(routeConfig);

const Routes = () => {
  return <RouterProvider router={router} />;
};

export default Routes;
