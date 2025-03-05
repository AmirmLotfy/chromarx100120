import { Routes, Route } from "react-router-dom";
import SubscriptionPage from "./pages/SubscriptionPage";
import PayPalConfigPage from "./pages/PayPalConfigPage";
import SubscriptionTermsPage from "./pages/SubscriptionTermsPage";
import SubscriptionHistoryPage from "./pages/SubscriptionHistoryPage";
import PayPalWebhookConfigPage from "./pages/PayPalWebhookConfigPage";

function AppRoutes() {
  return (
    <Routes>
      
      <Route path="/subscription" element={<SubscriptionPage />} />
      <Route path="/paypal-config" element={<PayPalConfigPage />} />
      <Route path="/subscription/terms" element={<SubscriptionTermsPage />} />
      <Route path="/subscription/history" element={<SubscriptionHistoryPage />} />
      <Route path="/paypal-webhook" element={<PayPalWebhookConfigPage />} />
    </Routes>
  );
}

export default AppRoutes;
