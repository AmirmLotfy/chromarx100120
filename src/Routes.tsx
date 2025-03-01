
import React from 'react';
import { BrowserRouter, Route, Routes as RouterRoutes } from 'react-router-dom';
import HomePage from './pages/Index';
import SettingsPage from '@/pages/SettingsPage';
import UserPage from '@/pages/UserPage';
import AuthPage from '@/pages/AuthPage';
import SubscriptionPage from '@/pages/SubscriptionPage';
import ExportImportPage from '@/pages/ExportImportPage';
import NotFound from './pages/NotFound';
import DataManagementPage from '@/pages/DataManagementPage';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <div className="app">
        <RouterRoutes>
          <Route path="/" element={<HomePage />} />
          <Route path="auth" element={<AuthPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="export-import" element={<ExportImportPage />} />
          <Route path="data-management" element={<DataManagementPage />} />
          <Route path="user" element={<UserPage />} />
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </div>
    </BrowserRouter>
  );
};

export default AppRoutes;
