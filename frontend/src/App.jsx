import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';

// Import Pages
import Candidates from './pages/Candidates';
import LinkGenerator from './pages/LinkGenerator';
import Templates from './pages/Templates';
import EmailQueue from './pages/EmailQueue';
import Settings from './pages/Settings';
import Organization from './pages/Organization';
import Apply from './pages/Apply';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/apply/:token" element={<Apply />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Candidates />} />
              <Route path="/organization" element={<Organization />} />
              <Route path="/links" element={<LinkGenerator />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/queue" element={<EmailQueue />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
