/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { NotificationProvider } from './lib/notifications/NotificationContext';
import { HomePage } from './pages/HomePage';
import { LatestJobsPage } from './pages/LatestJobsPage';
import { CentralJobsPage } from './pages/CentralJobsPage';
import { StateWisePage } from './pages/StateWisePage';
import { StateDetailPage } from './pages/StateDetailPage';
import { VacancyDetailPage } from './pages/VacancyDetailPage';
import { AdmitCardPage } from './pages/AdmitCardPage';
import { ResultsPage } from './pages/ResultsPage';
import { AnswerKeyPage } from './pages/AnswerKeyPage';
import { UpdatesPage } from './pages/UpdatesPage';
import { UpdateDetailPage } from './pages/UpdateDetailPage';
import { SearchPage } from './pages/SearchPage';
import { NotificationPreferencesPage } from './pages/NotificationPreferencesPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <NotificationProvider>
      <Router>
        <Layout>
          <Routes>
            {/* 1. Home */}
            <Route path="/" element={<HomePage />} />

            {/* 2. Latest Jobs & Categories */}
            <Route path="/jobs" element={<LatestJobsPage />} />
            <Route path="/jobs/central" element={<CentralJobsPage />} />
            <Route path="/all-india-jobs" element={<CentralJobsPage />} />
            <Route path="/jobs/states" element={<StateWisePage />} />
            <Route path="/state-wise-jobs" element={<StateWisePage />} />
            <Route path="/jobs/states/:state" element={<StateDetailPage />} />
            <Route path="/state/:state" element={<StateDetailPage />} />
            <Route path="/exams/:category" element={<CentralJobsPage />} />
            <Route path="/jobs/:id" element={<VacancyDetailPage />} />

            {/* 3. Recruitment Lifecycle Sections */}
            <Route path="/admit-card" element={<AdmitCardPage />} />
            <Route path="/admit-cards" element={<AdmitCardPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/answer-key" element={<AnswerKeyPage />} />
            <Route path="/answer-keys" element={<AnswerKeyPage />} />
            <Route path="/updates" element={<UpdatesPage />} />
            <Route path="/updates/:id" element={<UpdateDetailPage />} />

            {/* 4. Tailored Alerts & User Preferences */}
            <Route path="/notifications" element={<NotificationPreferencesPage />} />
            <Route path="/job-alerts" element={<NotificationPreferencesPage />} />
            <Route path="/preferences" element={<NotificationPreferencesPage />} />

            {/* 5. Search & Discovery */}
            <Route path="/search" element={<SearchPage />} />

            {/* 6. General / Support */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* 7. Fallback 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </Router>
    </NotificationProvider>
  );
}
