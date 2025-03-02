import {
  createBrowserRouter,
  RouterProvider,
  RouteObject,
} from "react-router-dom";
import BookmarksPage from "./pages/BookmarksPage";
import TasksPage from "./pages/TasksPage";
import NotesPage from "./pages/NotesPage";
import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import AuthWrapper from "./components/AuthWrapper";
import SubscriptionPage from "./pages/SubscriptionPage";
import SubscriptionSuccessPage from "./pages/SubscriptionSuccessPage";

const routeConfig: RouteObject[] = [
  {
    path: "/",
    element: (
      <AuthWrapper>
        <HomePage />
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
        <TasksPage />
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
    element: <LoginPage />,
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
