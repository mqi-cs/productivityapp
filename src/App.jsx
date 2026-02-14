import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Shell from './components/layout/Shell';
import Home from './pages/Home';
import CalendarView from './pages/CalendarView';
import LibraryView from './pages/LibraryView';
import DailyLogView from './pages/DailyLogView';
import PersonalView from './pages/PersonalView';
import Auth from './pages/Auth';
import { DataProvider } from './context/DataContext';

function AppContent() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<CalendarView />} />
        <Route path="library" element={<LibraryView />} />
        <Route path="daily" element={<DailyLogView />} />
        <Route path="personal" element={<PersonalView />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <DataProvider>
      <Router>
        <AppContent />
      </Router>
    </DataProvider>
  );
}
