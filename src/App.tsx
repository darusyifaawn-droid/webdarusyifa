/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import DashboardSiswa from './components/DashboardSiswa';
import DashboardGuru from './components/DashboardGuru';
import DashboardAdmin from './components/DashboardAdmin';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/siswa-dashboard" element={<DashboardSiswa />} />
          <Route path="/guru-dashboard" element={<DashboardGuru />} />
          <Route path="/admin-dashboard" element={<DashboardAdmin />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
