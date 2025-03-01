import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import SettingsPage from '@/pages/SettingsPage';
import UserPage from '@/pages/UserPage';
import AuthPage from '@/pages/AuthPage';
import SubscriptionPage from '@/pages/SubscriptionPage';
import ExportImportPage from '@/pages/ExportImportPage';
import NotFound from '@/pages/NotFoundPage';
import DataManagementPage from '@/pages/DataManagementPage';

const Routes = () => {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="auth" element={<AuthPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="export-import" element={<ExportImportPage />} />
          <Route path="data-management" element={<DataManagementPage />} />
          <Route path="user" element={<UserPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default Routes;
