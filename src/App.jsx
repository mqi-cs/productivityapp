import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Shell from './components/layout/Shell';
import Home from './pages/Home';
import CalendarView from './pages/CalendarView';
import LibraryView from './pages/LibraryView';
import MacroView from './pages/MacroView';
import { DataProvider } from './context/DataContext';

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<CalendarView />} />
        <Route path="library" element={<LibraryView />} />
        <Route path="macro" element={<MacroView />} />
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
